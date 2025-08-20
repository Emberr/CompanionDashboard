import React, { useState } from 'react';
import type { UserData, FoodItem, Equipment } from '../types';

// --- Reusable UI Components ---
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-surface rounded-xl p-6 shadow-lg ${className}`}>
    {children}
  </div>
);

type Category = 'fridge' | 'pantry' | 'supplements' | 'bar';
type InventoryType = 'food' | 'equipment';

interface InventoryProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

const Inventory: React.FC<InventoryProps> = ({ userData, setUserData }) => {
  const [activeTab, setActiveTab] = useState<Category | 'equipment'>('fridge');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');

  const handleAddItem = () => {
    if (!newItemName) return;
    
    if (activeTab === 'equipment') {
        const newEquip: Equipment = { id: Date.now().toString(), name: newItemName };
        setUserData(prev => ({...prev, equipment: [...prev.equipment, newEquip]}));
    } else {
        const newFood: FoodItem = { id: Date.now().toString(), name: newItemName, quantity: newItemQuantity, category: activeTab };
        setUserData(prev => ({...prev, inventory: [...prev.inventory, newFood]}));
    }
    setNewItemName('');
    setNewItemQuantity('');
  };

  const handleDeleteItem = (id: string, type: InventoryType) => {
    if (type === 'equipment') {
        setUserData(prev => ({...prev, equipment: prev.equipment.filter(item => item.id !== id)}));
    } else {
        setUserData(prev => ({...prev, inventory: prev.inventory.filter(item => item.id !== id)}));
    }
  };

  const tabs: (Category | 'equipment')[] = ['fridge', 'pantry', 'supplements', 'bar', 'equipment'];
  const currentItems: (FoodItem | Equipment)[] = activeTab === 'equipment' 
    ? userData.equipment 
    : userData.inventory.filter(item => item.category === activeTab);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-4xl font-bold">Inventory</h1>

      <Card>
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-muted hover:text-on-surface hover:border-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {/* Add Item Form */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder={`New ${activeTab} item...`}
              className="bg-bkg border border-surface rounded px-3 py-2 w-full flex-grow"
            />
            {activeTab !== 'equipment' && (
              <input
                type="text"
                value={newItemQuantity}
                onChange={e => setNewItemQuantity(e.target.value)}
                placeholder="Quantity (e.g., 500g)"
                className="bg-bkg border border-surface rounded px-3 py-2 sm:w-48"
              />
            )}
            <button
              onClick={handleAddItem}
              className="bg-primary text-on-primary px-4 py-2 rounded hover:bg-primary-variant transition-colors font-semibold"
            >
              Add Item
            </button>
          </div>

          {/* Item List */}
          <ul className="space-y-3">
            {currentItems.length === 0 ? (
                <p className="text-on-surface-muted text-center py-4">No items yet. Add one above!</p>
            ) : (
                currentItems.map(item => (
                <li key={item.id} className="flex justify-between items-center bg-bkg p-3 rounded-lg">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    {'quantity' in item && <span className="text-sm text-on-surface-muted ml-3">{item.quantity}</span>}
                  </div>
                  <button onClick={() => handleDeleteItem(item.id, 'quantity' in item ? 'food' : 'equipment')} className="text-error hover:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </li>
                ))
            )}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default Inventory;