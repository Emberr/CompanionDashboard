import React, { useState } from 'react';
import type { Page, UserData } from '../types';
import DataMenu from './DataMenu';

const IconBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; label: string }>= ({ active, onClick, children, label }) => (
  <button
    aria-label={label}
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 py-2 ${active ? 'text-primary' : 'text-on-surface-muted'}`}
  >
    {children}
  </button>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const FridgeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M5 10h14"/></svg>
);
const ChefIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.3 12.8A6.2 6.2 0 0 0 13 4.2V2h-2v2.2a6.2 6.2 0 0 0-6.3 8.6C4.2 13.7 4 14.8 4 16c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-1.2-.2-2.3-.7-3.2z"/></svg>
);
const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/></svg>
);
const DataIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8.08a2 2 0 0 0-1.67.9l-.81 1.2a2 2 0 0 1-1.69.9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h17z"/></svg>
);

const BottomNav: React.FC<{
  currentPage: Page;
  setPage: (p: Page) => void;
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onLogout: () => void;
}> = ({ currentPage, setPage, userData, setUserData, onLogout }) => {
  const [dataOpen, setDataOpen] = useState(false);

  return (
    <>
      {dataOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDataOpen(false)} />
      )}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-surface flex">
        <IconBtn active={currentPage==='dashboard'} onClick={() => setPage('dashboard')} label="Dashboard"><HomeIcon/></IconBtn>
        <IconBtn active={currentPage==='inventory'} onClick={() => setPage('inventory')} label="Inventory"><FridgeIcon/></IconBtn>
        <IconBtn active={currentPage==='recipes'} onClick={() => setPage('recipes')} label="Recipes"><ChefIcon/></IconBtn>
        <IconBtn active={currentPage==='workouts'} onClick={() => setPage('workouts')} label="Workouts"><DumbbellIcon/></IconBtn>
        <IconBtn active={false} onClick={() => setDataOpen(v=>!v)} label="Data"><DataIcon/></IconBtn>
      </div>
      {dataOpen && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 z-50 px-2">
          <DataMenu userData={userData} setUserData={setUserData} onLogout={() => { setDataOpen(false); onLogout(); }} />
        </div>
      )}
    </>
  );
};

export default BottomNav;

