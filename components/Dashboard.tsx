import React, { useState, useEffect, useMemo } from 'react';
import type { UserData, Nutrients, BodyMetric, MealType, MealLogItem, MealLog } from '../types';
import { generateDashboardInsights, getNutrientsForMeal } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Reusable UI Components ---
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-surface rounded-xl p-6 shadow-lg ${className}`}>
    {children}
  </div>
);

const Spinner: React.FC<{ size?: string }> = ({ size = 'h-8 w-8' }) => (
    <div className={`animate-spin rounded-full ${size} border-b-2 border-primary`}></div>
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
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
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
      </div>
      <span className="mt-2 text-sm text-on-surface-muted">{label}</span>
    </div>
  );
};

// --- Meal Logger Component ---
const MealLogger: React.FC<{ 
    mealLog: MealLog | undefined, 
    onAddFood: (mealType: MealType, item: MealLogItem) => void 
}> = ({ mealLog, onAddFood }) => {
    const [activeMeal, setActiveMeal] = useState<MealType>('breakfast');
    const [foodInput, setFoodInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddFood = async () => {
        if (!foodInput.trim()) return;
        setIsLoading(true);
        const result = await getNutrientsForMeal(foodInput);
        if (result) {
            onAddFood(activeMeal, { ...result, id: Date.now().toString() });
        } else {
            alert("Could not estimate nutrients for this item. Please try again.");
        }
        setFoodInput('');
        setIsLoading(false);
    };

    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const currentMealItems = mealLog ? mealLog[activeMeal] : [];

    return (
        <Card>
            <h2 className="text-2xl font-semibold mb-4">My Day</h2>
            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-4">
                    {mealTypes.map(meal => (
                        <button key={meal} onClick={() => setActiveMeal(meal)} className={`capitalize whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeMeal === meal ? 'border-primary text-primary' : 'border-transparent text-on-surface-muted hover:text-on-surface'}`}>
                            {meal}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-4">
                <div className="flex gap-2">
                    <input type="text" value={foodInput} onChange={e => setFoodInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFood()} placeholder="e.g., '2 eggs and a slice of toast'" className="bg-bkg border border-surface rounded px-3 py-2 w-full"/>
                    <button onClick={handleAddFood} disabled={isLoading} className="bg-primary text-on-primary px-4 rounded hover:bg-primary-variant transition-colors text-sm font-semibold w-28 flex items-center justify-center">
                        {isLoading ? <Spinner size="h-5 w-5"/> : 'Log Food'}
                    </button>
                </div>
                <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                    {currentMealItems.map(item => (
                        <li key={item.id} className="text-sm bg-bkg p-2 rounded flex justify-between">
                           <span>{item.name}</span>
                           <span className="text-on-surface-muted">{item.nutrients.calories.toFixed(0)} kcal</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
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

  const todaysLog = userData.mealLogs.find(log => log.date === today);

  const dailyTotals = useMemo<Nutrients>(() => {
    if (!todaysLog) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 };
    
    const allItems = [...todaysLog.breakfast, ...todaysLog.lunch, ...todaysLog.dinner, ...todaysLog.snack];
    return allItems.reduce((totals, item) => {
        totals.calories += item.nutrients.calories || 0;
        totals.protein += item.nutrients.protein || 0;
        totals.carbs += item.nutrients.carbs || 0;
        totals.fat += item.nutrients.fat || 0;
        totals.fiber += item.nutrients.fiber || 0;
        totals.sodium += item.nutrients.sodium || 0;
        return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });
  }, [todaysLog]);

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
  
  const handleAddMetric = (type: 'weight' | 'bodyFat') => {
      const value = type === 'weight' ? parseFloat(weightInput) : parseFloat(bodyFatInput);
      if (isNaN(value) || value <= 0) return;

      const newMetric: BodyMetric = { value, date: today };
      setUserData(prev => {
          const historyKey = type === 'weight' ? 'weightHistory' : 'bodyFatHistory';
          const filteredHistory = prev[historyKey].filter(m => m.date !== today);
          return {
              ...prev,
              [historyKey]: [...filteredHistory, newMetric].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          };
      });
      if (type === 'weight') setWeightInput('');
      else setBodyFatInput('');
  };

  const handleAddFoodToLog = (mealType: MealType, item: MealLogItem) => {
      setUserData(prev => {
          const logs = [...prev.mealLogs];
          let todaysLogIndex = logs.findIndex(log => log.date === today);
          if (todaysLogIndex === -1) {
              logs.push({ id: Date.now().toString(), date: today, breakfast: [], lunch: [], dinner: [], snack: [] });
              todaysLogIndex = logs.length - 1;
          }
          const updatedLog = { ...logs[todaysLogIndex] };
          updatedLog[mealType] = [...updatedLog[mealType], item];
          logs[todaysLogIndex] = updatedLog;
          return { ...prev, mealLogs: logs };
      });
  };

  const latestWeight = userData.weightHistory[userData.weightHistory.length - 1]?.value || 0;
  const latestBodyFat = userData.bodyFatHistory[userData.bodyFatHistory.length - 1]?.value || 0;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MealLogger mealLog={todaysLog} onAddFood={handleAddFoodToLog} />
        <Card>
            <h2 className="text-2xl font-semibold mb-4">Today's Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <ProgressCircle progress={calProgress} size={100} strokeWidth={8} color="#bb86fc" label="Calories" />
            <ProgressCircle progress={proProgress} size={100} strokeWidth={8} color="#03dac6" label="Protein" />
            <ProgressCircle progress={carbProgress} size={100} strokeWidth={8} color="#cf6679" label="Carbs" />
            <ProgressCircle progress={fatProgress} size={100} strokeWidth={8} color="#f2a600" label="Fats" />
            </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <h2 className="text-2xl font-semibold mb-4">AI Insights</h2>
          {loadingInsights ? <Spinner /> : <p className="text-on-surface-muted whitespace-pre-wrap">{insights || "Click 'Refresh' to get new insights!"}</p>}
           <button onClick={fetchInsights} className="mt-4 text-sm text-primary hover:underline" disabled={loadingInsights}>Refresh Insights</button>
        </Card>
        
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

      <Card>
        <h2 className="text-2xl font-semibold mb-4">Progress Over Time</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={userData.weightHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" stroke="#a0a0a0" />
              <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fill: '#03dac6' }} stroke="#03dac6" />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Body Fat (%)', angle: -90, a: 'insideRight', fill: '#bb86fc' }} stroke="#bb86fc" />
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
