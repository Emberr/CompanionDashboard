
import React, { useState, useEffect, useMemo } from 'react';
import type { UserData, Nutrients, BodyMetric } from '../types';
import { generateDashboardInsights } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- Reusable UI Components ---
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-surface rounded-xl p-6 shadow-lg ${className}`}>
    {children}
  </div>
);

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
);

// --- Progress Circle Component ---
const ProgressCircle: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
}> = ({ progress, size, strokeWidth, color, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          stroke="#333"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <span className="absolute text-lg font-bold">{`${Math.round(progress)}%`}</span>
      <span className="mt-2 text-sm text-on-surface-muted">{label}</span>
    </div>
  );
};

// --- Dashboard Component ---
interface DashboardProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

const Dashboard: React.FC<DashboardProps> = ({ userData, setUserData }) => {
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [weightInput, setWeightInput] = useState<string>('');
  const [bodyFatInput, setBodyFatInput] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  const dailyTotals = useMemo<Nutrients>(() => {
    const todaysLogs = userData.mealLogs.filter(log => log.date === today);
    return todaysLogs.reduce((totals, log) => {
      log.items.forEach(item => {
        totals.calories += item.nutrients.calories || 0;
        totals.protein += item.nutrients.protein || 0;
        totals.carbs += item.nutrients.carbs || 0;
        totals.fat += item.nutrients.fat || 0;
        totals.fiber += item.nutrients.fiber || 0;
        totals.sodium += item.nutrients.sodium || 0;
      });
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });
  }, [userData.mealLogs, today]);

  const getProgress = (current: number, goal: number) => (goal > 0 ? (current / goal) * 100 : 0);

  const calProgress = getProgress(dailyTotals.calories, userData.goals.dailyNutrients.calories);
  const proProgress = getProgress(dailyTotals.protein, userData.goals.dailyNutrients.protein);
  const carbProgress = getProgress(dailyTotals.carbs, userData.goals.dailyNutrients.carbs);
  const fatProgress = getProgress(dailyTotals.fat, userData.goals.dailyNutrients.fat);
  
  const fetchInsights = async () => {
    setLoadingInsights(true);
    const dataToSend = {
        goals: userData.goals,
        currentWeight: userData.weightHistory.slice(-1)[0]?.value,
        dailyTotals: dailyTotals
    };
    const result = await generateDashboardInsights(JSON.stringify(dataToSend));
    setInsights(result);
    setLoadingInsights(false);
  };
  
  useEffect(() => {
      fetchInsights();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddMetric = (type: 'weight' | 'bodyFat') => {
      const value = type === 'weight' ? parseFloat(weightInput) : parseFloat(bodyFatInput);
      if (isNaN(value) || value <= 0) return;

      const newMetric: BodyMetric = { value, date: today };
      setUserData(prev => {
          const historyKey = type === 'weight' ? 'weightHistory' : 'bodyFatHistory';
          // Avoid duplicate entries for the same day
          const filteredHistory = prev[historyKey].filter(m => m.date !== today);
          return {
              ...prev,
              [historyKey]: [...filteredHistory, newMetric].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          };
      });
      if (type === 'weight') setWeightInput('');
      else setBodyFatInput('');
  };

  const latestWeight = userData.weightHistory[userData.weightHistory.length - 1]?.value || 0;
  const latestBodyFat = userData.bodyFatHistory[userData.bodyFatHistory.length - 1]?.value || 0;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      
      {/* Daily Progress */}
      <Card>
        <h2 className="text-2xl font-semibold mb-4">Today's Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <ProgressCircle progress={calProgress} size={120} strokeWidth={10} color="#bb86fc" label="Calories" />
          <ProgressCircle progress={proProgress} size={120} strokeWidth={10} color="#03dac6" label="Protein" />
          <ProgressCircle progress={carbProgress} size={120} strokeWidth={10} color="#cf6679" label="Carbs" />
          <ProgressCircle progress={fatProgress} size={120} strokeWidth={10} color="#f2a600" label="Fats" />
        </div>
        <div className="mt-6 text-sm text-center text-on-surface-muted">
            <p>Calories: {dailyTotals.calories.toFixed(0)} / {userData.goals.dailyNutrients.calories}</p>
            <p>Protein: {dailyTotals.protein.toFixed(0)}g / {userData.goals.dailyNutrients.protein}g</p>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Insights */}
        <Card className="lg:col-span-1">
          <h2 className="text-2xl font-semibold mb-4">AI Insights</h2>
          {loadingInsights ? <Spinner /> : <p className="text-on-surface-muted whitespace-pre-wrap">{insights}</p>}
           <button onClick={fetchInsights} className="mt-4 text-sm text-primary hover:underline" disabled={loadingInsights}>Refresh Insights</button>
        </Card>
        
        {/* Current Stats & Goals */}
        <Card className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Stats & Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-2">Current Stats</h3>
                    <p>Weight: <span className="font-bold text-secondary">{latestWeight} kg</span></p>
                    <p>Body Fat: <span className="font-bold text-secondary">{latestBodyFat} %</span></p>
                    <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                             <input type="number" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="New weight (kg)" className="bg-bkg border border-surface rounded px-2 py-1 w-full"/>
                             <button onClick={() => handleAddMetric('weight')} className="bg-primary text-on-primary px-3 rounded hover:bg-primary-variant transition-colors text-sm">Log</button>
                        </div>
                         <div className="flex gap-2">
                             <input type="number" value={bodyFatInput} onChange={e => setBodyFatInput(e.target.value)} placeholder="New body fat %" className="bg-bkg border border-surface rounded px-2 py-1 w-full"/>
                             <button onClick={() => handleAddMetric('bodyFat')} className="bg-primary text-on-primary px-3 rounded hover:bg-primary-variant transition-colors text-sm">Log</button>
                        </div>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Your Goals</h3>
                    <p>Weight Goal: <span className="font-bold text-primary">{userData.goals.weight} kg</span></p>
                    <p>Body Fat Goal: <span className="font-bold text-primary">{userData.goals.bodyFat} %</span></p>
                 </div>
            </div>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <h2 className="text-2xl font-semibold mb-4">Progress Over Time</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={userData.weightHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" stroke="#a0a0a0" />
              <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fill: '#03dac6' }} stroke="#03dac6" />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Body Fat (%)', angle: -90, position: 'insideRight', fill: '#bb86fc' }} stroke="#bb86fc" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="value" name="Weight (kg)" stroke="#03dac6" fill="#03dac6" fillOpacity={0.3} />
              <Area yAxisId="right" type="monotone" data={userData.bodyFatHistory} dataKey="value" name="Body Fat (%)" stroke="#bb86fc" fill="#bb86fc" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

    </div>
  );
};

export default Dashboard;
