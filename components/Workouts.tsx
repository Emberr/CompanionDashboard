import React, { useState } from 'react';
import type { UserData, Workout } from '../types';
import { generateWorkout } from '../services/geminiService';

// --- Reusable UI Components ---
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-surface rounded-xl p-6 shadow-lg ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; className?: string; }> = ({ onClick, children, disabled, className }) => (
    <button onClick={onClick} disabled={disabled} className={`bg-primary text-on-primary px-4 py-2 rounded hover:bg-primary-variant transition-colors font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed ${className}`}>
        {children}
    </button>
);

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
);

// --- Workout Card Component ---
const WorkoutCard: React.FC<{ 
    workout: Workout, 
    onSave?: (workout: Workout) => void,
    onDelete?: (workoutName: string) => void,
}> = ({ workout, onSave, onDelete }) => {
    return (
        <Card>
            <h3 className="text-2xl font-bold text-primary mb-4">{workout.name}</h3>
            <div className="space-y-4">
                {workout.exercises.map((ex, i) => (
                    <div key={i} className="border-b border-gray-700 pb-3 last:border-b-0">
                        <p className="font-semibold text-on-surface">{ex.name}</p>
                        <div className="flex gap-4 text-sm text-on-surface-muted mt-1">
                            <span>Sets: {ex.sets}</span>
                            <span>Reps: {ex.reps}</span>
                        </div>
                        {ex.notes && <p className="text-xs text-on-surface-muted italic mt-2">{ex.notes}</p>}
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
                {onSave && <Button onClick={() => onSave(workout)}>Save Workout</Button>}
                {onDelete && (
                    <button onClick={() => onDelete(workout.name)} className="bg-error text-on-primary p-2 rounded hover:opacity-80 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                )}
            </div>
        </Card>
    )
};

interface WorkoutsProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

const Workouts: React.FC<WorkoutsProps> = ({ userData, setUserData }) => {
  const [location, setLocation] = useState<'home' | 'gym'>('home');
  const [focus, setFocus] = useState<string[]>([]);
  const [duration, setDuration] = useState('45');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [generatedWorkout, setGeneratedWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
  
  const bodyParts = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Full Body'];

  const toggleFocus = (part: string) => {
    setFocus(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]);
  };
  
  const handleGenerate = async () => {
    if (focus.length === 0) {
        setError("Please select at least one body part to focus on.");
        return;
    }
    setIsLoading(true);
    setError('');
    setGeneratedWorkout(null);
    const equipment = location === 'home' ? userData.equipment.filter(e => e.category === 'gym').map(e => e.name) : [];

    try {
        const workout = await generateWorkout(location, equipment, focus, duration, intensity);
        setGeneratedWorkout(workout);
    } catch (err) {
        setError('Failed to generate workout. Please try again.');
        console.error(err);
    }
    setIsLoading(false);
  };
  
  const handleSaveWorkout = (workoutToSave: Workout) => {
      if (userData.savedWorkouts.some(w => w.name === workoutToSave.name)) {
          alert('Workout already saved!');
          return;
      }
      setUserData(prev => ({...prev, savedWorkouts: [...prev.savedWorkouts, workoutToSave]}));
  };

  const handleDeleteWorkout = (workoutName: string) => {
      setUserData(prev => ({
          ...prev,
          savedWorkouts: prev.savedWorkouts.filter(w => w.name !== workoutName)
      }));
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-4xl font-bold">Workouts</h1>
      
      <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-6">
            <button onClick={() => setActiveTab('generate')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'generate' ? 'border-primary text-primary' : 'border-transparent text-on-surface-muted hover:text-on-surface hover:border-gray-500'}`}>Generate Workout</button>
            <button onClick={() => setActiveTab('saved')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-on-surface-muted hover:text-on-surface hover:border-gray-500'}`}>Saved Workouts</button>
          </nav>
      </div>
      
      {activeTab === 'generate' && (
        <>
            <Card>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Location</h3>
                        <div className="flex gap-2">
                           <button onClick={() => setLocation('home')} className={`px-4 py-2 rounded-md text-sm w-full ${location === 'home' ? 'bg-primary text-on-primary' : 'bg-bkg'}`}>Home</button>
                           <button onClick={() => setLocation('gym')} className={`px-4 py-2 rounded-md text-sm w-full ${location === 'gym' ? 'bg-primary text-on-primary' : 'bg-bkg'}`}>Gym</button>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Focus (select one or more)</h3>
                        <div className="flex flex-wrap gap-2">
                            {bodyParts.map(part => (
                                <button key={part} onClick={() => toggleFocus(part)} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${focus.includes(part) ? 'bg-secondary text-on-primary' : 'bg-bkg hover:bg-gray-800'}`}>{part}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="duration" className="block font-semibold mb-2 text-sm">Duration (minutes)</label>
                            <input type="range" id="duration" min="15" max="120" step="5" value={duration} onChange={e => setDuration(e.target.value)} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary" />
                            <div className="text-center mt-1 text-on-surface-muted">{duration} mins</div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 text-sm">Intensity</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setIntensity('light')} className={`px-4 py-2 rounded-md text-sm w-full ${intensity === 'light' ? 'bg-primary text-on-primary' : 'bg-bkg'}`}>Light</button>
                                <button onClick={() => setIntensity('moderate')} className={`px-4 py-2 rounded-md text-sm w-full ${intensity === 'moderate' ? 'bg-primary text-on-primary' : 'bg-bkg'}`}>Moderate</button>
                                <button onClick={() => setIntensity('intense')} className={`px-4 py-2 rounded-md text-sm w-full ${intensity === 'intense' ? 'bg-primary text-on-primary' : 'bg-bkg'}`}>Intense</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <Button onClick={handleGenerate} disabled={isLoading}>{isLoading ? 'Generating...' : 'Generate Workout'}</Button>
                </div>
            </Card>
            {isLoading && <div className="flex justify-center"><Spinner /></div>}
            {error && <p className="text-error text-center">{error}</p>}
            {generatedWorkout && <WorkoutCard workout={generatedWorkout} onSave={handleSaveWorkout} />}
        </>
      )}

      {activeTab === 'saved' && (
          <div className="space-y-6">
               {userData.savedWorkouts.length === 0 ? (
                  <Card><p className="text-center text-on-surface-muted">You haven't saved any workouts yet.</p></Card>
              ) : (
                  userData.savedWorkouts.map((workout, index) => <WorkoutCard key={index} workout={workout} onDelete={handleDeleteWorkout}/>)
              )}
          </div>
      )}

    </div>
  );
};

export default Workouts;