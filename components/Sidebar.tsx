import React from 'react';
import type { Page, UserData } from '../types';
import DataMenu from './DataMenu';

interface IconProps {
  className?: string;
}

const HomeIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const RefrigeratorIcon = ({ className = 'w-6 h-6' }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        <path d="M5 10h14" /><path d="M8 6v-2" /><path d="M16 6v-2" />
    </svg>
);

const ChefHatIcon = ({ className = 'w-6 h-6' }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19.3 12.8A6.2 6.2 0 0 0 13 4.2V2h-2v2.2a6.2 6.2 0 0 0-6.3 8.6C4.2 13.7 4 14.8 4 16c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-1.2-.2-2.3-.7-3.2z" />
        <path d="M4 20h16" />
    </svg>
);

const DumbbellIcon = ({ className = 'w-6 h-6' }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.4 14.4 9.6 9.6" /><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
        <path d="m21.5 21.5-1.4-1.4" /><path d="m15.8 15.8-1.4-1.4" />
        <path d="M5.343 2.515a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829L6.364 9.803a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829z" />
        <path d="m2.5 2.5 1.4 1.4" /><path d="m8.2 8.2 1.4 1.4" />
    </svg>
);

const DataIcon = ({ className = 'w-6 h-6' }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8.08a2 2 0 0 0-1.67.9l-.81 1.2a2 2 0 0 1-1.69.9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h17z" /><circle cx="12" cy="12" r="3" />
    </svg>
);


const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  page: Page;
  currentPage: Page;
  setPage: (page: Page) => void;
}> = ({ label, icon, page, currentPage, setPage }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => setPage(page)}
      className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ${
        isActive
          ? 'bg-primary text-on-primary font-semibold'
          : 'text-on-surface-muted hover:bg-surface hover:text-on-surface'
      }`}
    >
      {icon}
      <span className="hidden md:block">{label}</span>
    </button>
  );
};

// Small DataMenu trigger for desktop sidebar
const DataTrigger: React.FC<{ userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData>>; onLogout: () => void; }>
  = ({ userData, setUserData, onLogout }) => {
    const [open, setOpen] = React.useState(false);
    return (
      <div className="relative">
        {open && (
          <div className="absolute bottom-full left-0 w-full p-2" onClick={(e) => e.stopPropagation()}>
            <DataMenu userData={userData} setUserData={setUserData} onLogout={onLogout} />
          </div>
        )}
        <button onClick={() => setOpen(o=>!o)} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 text-on-surface-muted hover:bg-surface hover:text-on-surface`}>
          <DataIcon />
          <span className="hidden md:block">Data</span>
        </button>
      </div>
    );
};

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, userData, setUserData, onLogout }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysLog = userData.mealLogs.find(log => log.date === today);

  const dailyTotals = todaysLog
    ? [...todaysLog.breakfast, ...todaysLog.lunch, ...todaysLog.dinner, ...todaysLog.snack].reduce(
        (totals, item) => {
          totals.calories += item.nutrients.calories || 0;
          totals.protein += item.nutrients.protein || 0;
          totals.carbs += item.nutrients.carbs || 0;
          totals.fat += item.nutrients.fat || 0;
          totals.fiber += item.nutrients.fiber || 0;
          return totals;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
      )
    : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 };

  const goals = userData.goals.dailyNutrients;
  const calRatio = goals.calories ? dailyTotals.calories / goals.calories : 0;
  const fatRatio = goals.fat ? dailyTotals.fat / goals.fat : 0;
  const fiberRatio = goals.fiber ? dailyTotals.fiber / goals.fiber : 0;
  const proRatio = goals.protein ? dailyTotals.protein / goals.protein : 0;
  const carbRatio = goals.carbs ? dailyTotals.carbs / goals.carbs : 0;

  let gradient = 'linear-gradient(to bottom right, var(--color-primary), var(--color-secondary))';
  if (calRatio > 1.1 || fatRatio > 1.1) {
    gradient = 'linear-gradient(to bottom right, #f44336, #ffeb3b)';
  } else if (
    fiberRatio >= 0.8 &&
    calRatio <= 1 &&
    fatRatio <= 1 &&
    proRatio >= 0.8 &&
    carbRatio >= 0.8
  ) {
    gradient = 'linear-gradient(to bottom right, #4caf50, #2196f3)';
  }

  return (
    <div className="bg-surface p-2 md:p-4 h-full flex flex-col">
      <div className="flex items-center space-x-2 p-3 mb-4">
        <div className="w-8 h-8 rounded-full" style={{ background: gradient }}></div>
        <h1 className="text-xl font-bold hidden md:block text-on-surface">IgnisHealth</h1>
      </div>
      <nav className="flex-grow space-y-2">
        <NavItem label="Dashboard" icon={<HomeIcon />} page="dashboard" currentPage={currentPage} setPage={setPage} />
        <NavItem label="Inventory" icon={<RefrigeratorIcon />} page="inventory" currentPage={currentPage} setPage={setPage} />
        <NavItem label="Recipes" icon={<ChefHatIcon />} page="recipes" currentPage={currentPage} setPage={setPage} />
        <NavItem label="Workouts" icon={<DumbbellIcon />} page="workouts" currentPage={currentPage} setPage={setPage} />
      </nav>
      <div className="mt-auto">
         <DataTrigger userData={userData} setUserData={setUserData} onLogout={onLogout} />
      </div>
    </div>
  );
};

export default Sidebar;
