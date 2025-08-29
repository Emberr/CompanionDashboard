import React, { useRef, useState } from 'react';
import type { UserData } from '../types';
import { putData as apiPutData, logout as apiLogout } from '../services/api';

const DataMenu: React.FC<{
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onLogout: () => void;
}> = ({ userData, setUserData, onLogout }) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const importRef = useRef<HTMLInputElement>(null);

  const handleSaveNow = () => {
    setSaveStatus('saving');
    try {
      setUserData(prev => ({ ...prev }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
    }
  };

  const handleSyncNow = async () => {
    setSyncStatus('syncing');
    try {
      const ok = await apiPutData<UserData>(userData);
      setSyncStatus(ok ? 'synced' : 'error');
    } catch {
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const handleImportClick = () => importRef.current?.click();

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const imported = JSON.parse(text);
        if (imported && imported.hasOwnProperty('isProfileComplete')) {
          setUserData(imported);
          alert('Data imported successfully!');
        } else {
          alert('Invalid data file.');
        }
      } catch (err) {
        alert('Failed to parse the data file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(userData))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `IgnisHealth-Backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    onLogout();
  };

  return (
    <div className="bg-bkg rounded-lg shadow-lg p-2 space-y-1">
      <button onClick={handleSaveNow} disabled={saveStatus === 'saving'} className="w-full text-left text-sm p-2 rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between">
        <span>Save Now</span>
        {saveStatus === 'saving' && <span className="text-xs text-primary">Saving...</span>}
        {saveStatus === 'saved' && <span className="text-xs text-secondary">✓ Saved</span>}
      </button>
      <button onClick={handleSyncNow} disabled={syncStatus === 'syncing'} className="w-full text-left text-sm p-2 rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between">
        <span>Sync Now</span>
        {syncStatus === 'syncing' && <span className="text-xs text-primary">Syncing...</span>}
        {syncStatus === 'synced' && <span className="text-xs text-secondary">✓ Synced</span>}
        {syncStatus === 'error' && <span className="text-xs text-red-500">! Error</span>}
      </button>
      <button onClick={handleImportClick} className="w-full text-left text-sm p-2 rounded hover:bg-surface">Import Data</button>
      <button onClick={handleExport} className="w-full text-left text-sm p-2 rounded hover:bg-surface">Export Data</button>
      <div className="border-t border-surface mt-1 pt-1" />
      <button onClick={handleLogout} className="w-full text-left text-sm p-2 rounded hover:bg-surface text-red-500">Logout</button>
      <input type="file" accept=".json" ref={importRef} onChange={handleImport} className="hidden" />
    </div>
  );
};

export default DataMenu;

