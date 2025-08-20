
import React from 'react';
import type { Page } from '../types';

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

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage }) => {
  return (
    <div className="bg-surface p-2 md:p-4 flex flex-col space-y-2">
      <div className="flex items-center space-x-2 p-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full"></div>
        <h1 className="text-xl font-bold hidden md:block text-on-surface">AuraFit AI</h1>
      </div>
      <NavItem label="Dashboard" icon={<HomeIcon />} page="dashboard" currentPage={currentPage} setPage={setPage} />
      <NavItem label="Inventory" icon={<RefrigeratorIcon />} page="inventory" currentPage={currentPage} setPage={setPage} />
      <NavItem label="Recipes" icon={<ChefHatIcon />} page="recipes" currentPage={currentPage} setPage={setPage} />
      <NavItem label="Workouts" icon={<DumbbellIcon />} page="workouts" currentPage={currentPage} setPage={setPage} />
    </div>
  );
};

export default Sidebar;
