import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { UserData, Page, MealType, MealLogItem } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Workouts from './components/Workouts';
import ProfileSetup from './components/ProfileSetup';

const App: React.FC = () => {
  const [currentPage, setPage] = useState<Page>('dashboard');
  
  const initialUserData: UserData = {
    isProfileComplete: false,
    gender: 'male',
    age: 30,
    height: 180,
    activityLevel: 'moderate',
    goals: {
        weight: 0,
        bodyFat: 0,
        dailyNutrients: { calories: 2000, protein: 150, carbs: 200, fat: 60, fiber: 30, sodium: 2300 }
    },
    weightHistory: [],
    bodyFatHistory: [],
    inventory: [],
    equipment: [],
    savedRecipes: [],
    savedWorkouts: [],
    mealLogs: [],
    supplementsTaken: { date: new Date().toISOString().split('T')[0], takenItemIds: [] }
  };

  const [userData, setUserData] = useLocalStorage<UserData>('aura-fit-ai-data', initialUserData);

  useEffect(() => {
    // One-time migration for users with old data structure
    const needsMigration = userData.inventory.some((item: any) => item.category === 'fridge' || item.category === 'pantry');
    if (needsMigration) {
        console.log("Migrating inventory categories to 'food'...");
        setUserData(prev => ({
            ...prev,
            inventory: prev.inventory.map((item: any) => ({
                ...item,
                category: (item.category === 'fridge' || item.category === 'pantry') ? 'food' : item.category,
            }))
        }));
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileComplete = (initialData: Partial<UserData>) => {
      setUserData(prev => ({
          ...prev,
          ...initialData,
          isProfileComplete: true
      }));
  };
  
  const handleAddFoodToLog = (mealType: MealType, item: MealLogItem) => {
      const today = new Date().toISOString().split('T')[0];
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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userData={userData} setUserData={setUserData} onAddFood={handleAddFoodToLog} />;
      case 'inventory':
        return <Inventory userData={userData} setUserData={setUserData} />;
      case 'recipes':
        return <Recipes userData={userData} setUserData={setUserData} onAddFood={handleAddFoodToLog} />;
      case 'workouts':
        return <Workouts userData={userData} setUserData={setUserData} />;
      default:
        return <Dashboard userData={userData} setUserData={setUserData} onAddFood={handleAddFoodToLog} />;
    }
  };

  if (!userData.isProfileComplete) {
      return <ProfileSetup onComplete={handleProfileComplete} />
  }

  return (
    <div className="flex h-screen w-full bg-bkg text-on-surface">
      <div className="w-16 md:w-64 flex-shrink-0">
        <Sidebar currentPage={currentPage} setPage={setPage} userData={userData} setUserData={setUserData} />
      </div>
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;