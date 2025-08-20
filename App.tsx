import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { UserData, Page } from './types';
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
  };

  const [userData, setUserData] = useLocalStorage<UserData>('aura-fit-ai-data', initialUserData);

  const handleProfileComplete = (initialData: Partial<UserData>) => {
      setUserData(prev => ({
          ...prev,
          ...initialData,
          isProfileComplete: true
      }));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userData={userData} setUserData={setUserData} />;
      case 'inventory':
        return <Inventory userData={userData} setUserData={setUserData} />;
      case 'recipes':
        return <Recipes userData={userData} setUserData={setUserData} />;
      case 'workouts':
        return <Workouts userData={userData} setUserData={setUserData} />;
      default:
        return <Dashboard userData={userData} setUserData={setUserData} />;
    }
  };

  if (!userData.isProfileComplete) {
      return <ProfileSetup onComplete={handleProfileComplete} />
  }

  return (
    <div className="flex h-screen w-full bg-bkg text-on-surface">
      <div className="w-16 md:w-64 flex-shrink-0">
        <Sidebar currentPage={currentPage} setPage={setPage} />
      </div>
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
