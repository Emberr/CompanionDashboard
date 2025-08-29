import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { UserData, Page, MealType, MealLogItem } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Workouts from './components/Workouts';
import ProfileSetup from './components/ProfileSetup';
import Login from './components/Login';
import { getData as apiGetData, putData as apiPutData } from './services/api';

// Utility function to validate and repair userData structure
const validateUserData = (data: any): UserData => {
  const defaultUserData: UserData = {
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

  if (!data || typeof data !== 'object') {
    return defaultUserData;
  }

  // Only fix truly broken data - be more permissive
  const validatedData = {
    ...defaultUserData,
    ...data,
    inventory: Array.isArray(data.inventory) ? data.inventory.filter((item: any) => {
      // Only filter out completely invalid items
      if (!item || typeof item !== 'object') {
        console.log('Filtering out non-object item:', item);
        return false;
      }
      
      // Must have basic required fields
      if (!item.id || !item.name) {
        console.log('Filtering out item missing id/name:', item);
        return false;
      }
      
      // If no category, default to 'food' instead of filtering out
      if (!item.category) {
        console.log('Setting default category for item:', item);
        item.category = 'food';
      }
      
      // Migrate old categories but don't filter
      if (item.category === 'fridge' || item.category === 'pantry') {
        console.log('Migrating category for item:', item);
        item.category = 'food';
      }
      
      // Keep all items - don't filter based on category validity
      if (item.category === 'supplements') {
        console.log('Preserving supplement item:', item);
      }
      
      return true;
    }) : [],
    equipment: Array.isArray(data.equipment) ? data.equipment : [],
    savedRecipes: Array.isArray(data.savedRecipes) ? data.savedRecipes : [],
    savedWorkouts: Array.isArray(data.savedWorkouts) ? data.savedWorkouts : [],
    mealLogs: Array.isArray(data.mealLogs) ? data.mealLogs : [],
    weightHistory: Array.isArray(data.weightHistory) ? data.weightHistory : [],
    bodyFatHistory: Array.isArray(data.bodyFatHistory) ? data.bodyFatHistory : [],
  };

  return validatedData;
};

const App: React.FC = () => {
  const [currentPage, setPage] = useState<Page>('dashboard');
  const [authed, setAuthed] = useState<boolean | null>(null);
  const syncTimer = useRef<number | null>(null);
  
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

  // Validate data on load ONLY - don't run validation on every save
  useEffect(() => {
    const hasInvalidData = !Array.isArray(userData.inventory) || 
                          userData.inventory.some((item: any) => 
                            !item || typeof item !== 'object' || !item.id || !item.name || !item.category
                          );
                          
    if (hasInvalidData) {
      console.log('Repairing userData structure on load only');
      const validatedData = validateUserData(userData);
      setUserData(validatedData);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Try to fetch server data to determine auth and hydrate
  useEffect(() => {
    (async () => {
      try {
        const serverData = await apiGetData<UserData>();
        if (serverData) {
          setUserData(validateUserData(serverData));
        }
        setAuthed(true);
      } catch (e) {
        // 401 or network -> not authed or no API
        setAuthed(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced sync to server when authed
  useEffect(() => {
    if (!authed) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    // @ts-ignore - window typing
    syncTimer.current = window.setTimeout(() => {
      apiPutData<UserData>(userData).catch(() => {});
    }, 800);
    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [userData, authed]);

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

  if (authed === false) {
    return <Login onSuccess={async () => {
      try {
        const serverData = await apiGetData<UserData>();
        if (serverData) setUserData(validateUserData(serverData));
      } catch {}
      setAuthed(true);
    }} />
  }

  if (!userData.isProfileComplete) {
      return <ProfileSetup onComplete={handleProfileComplete} />
  }

  return (
    <div className="flex h-screen w-full bg-bkg text-on-surface">
      <div className="w-16 md:w-64 flex-shrink-0">
        <Sidebar 
          currentPage={currentPage} 
          setPage={setPage} 
          userData={userData} 
          setUserData={setUserData}
          onLogout={() => {
            setAuthed(false);
            setPage('dashboard');
          }} 
        />
      </div>
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
