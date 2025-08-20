import React, { useState, useRef } from 'react';
import type { UserData, FoodItem, Equipment } from '../types';
import { parseReceipt, getNutrientsForFoodItem } from '../services/geminiService';


// --- Reusable UI Components ---
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-surface rounded-xl p-6 shadow-lg ${className}`}>
    {children}
  </div>
);

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
);

type Category = 'fridge' | 'pantry' | 'supplements' | 'bar';
type ActiveTab = Category | 'gym' | 'utensil';

// --- Receipt Scanner Component ---
const ReceiptScanner: React.FC<{onItemsScanned: (items: {name: string, quantity: string}[]) => void}> = ({ onItemsScanned }) => {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = (e.target?.result as string).split(',')[1];
            if (base64Image) {
                setIsLoading(true);
                try {
                    const items = await parseReceipt(base64Image);
                    onItemsScanned(items);
                } catch (error) {
                    console.error("Receipt parsing failed:", error);
                    alert("Could not read the receipt. Please try another image.");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-secondary text-on-primary px-4 py-2 rounded hover:opacity-80 transition-opacity font-semibold flex items-center gap-2"
            >
                {isLoading ? 'Scanning...' : 'Scan Receipt'}
            </button>
        </>
    );
};

interface InventoryProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

const Inventory: React.FC<InventoryProps> = ({ userData, setUserData }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('fridge');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [scannedItems, setScannedItems] = useState<{name: string, quantity: string}[] | null>(null);

  const handleAddItem = async () => {
    if (!newItemName) return;
    
    if (activeTab === 'gym' || activeTab === 'utensil') {
        const newEquip: Equipment = { id: Date.now().toString(), name: newItemName, category: activeTab };
        setUserData(prev => ({...prev, equipment: [...prev.equipment, newEquip]}));
    } else {
        const newItemId = Date.now().toString();
        const newFood: FoodItem = { id: newItemId, name: newItemName, quantity: newItemQuantity, category: activeTab };
        setUserData(prev => ({...prev, inventory: [...prev.inventory, newFood]}));
        
        // Fetch nutrients in the background
        const nutrients = await getNutrientsForFoodItem(newItemName, newItemQuantity);
        if (nutrients) {
            setUserData(prev => ({
                ...prev,
                inventory: prev.inventory.map(item => item.id === newItemId ? { ...item, nutrients } : item)
            }));
        }
    }
    setNewItemName('');
    setNewItemQuantity('');
  };

  const handleDeleteItem = (id: string) => {
    if (activeTab === 'gym' || activeTab === 'utensil') {
        setUserData(prev => ({...prev, equipment: prev.equipment.filter(item => item.id !== id)}));
    } else {
        setUserData(prev => ({...prev, inventory: prev.inventory.filter(item => item.id !== id)}));
    }
  };

  const handleConfirmScannedItems = () => {
    if (!scannedItems) return;
    const newFoodItems: FoodItem[] = scannedItems.map(item => ({
        id: `${Date.now()}-${item.name}`,
        name: item.name,
        quantity: item.quantity,
        category: 'pantry', // Default to pantry
    }));
    setUserData(prev => ({...prev, inventory: [...prev.inventory, ...newFoodItems]}));
    setScannedItems(null);
  };

  const tabs: ActiveTab[] = ['fridge', 'pantry', 'supplements', 'bar', 'gym', 'utensil'];
  const currentItems: (FoodItem | Equipment)[] = (activeTab === 'gym' || activeTab === 'utensil')
    ? userData.equipment.filter(item => item.category === activeTab)
    : userData.inventory.filter(item => item.category === activeTab);

  return (
    <div className="p-4 md:p-8 space-y-8">
        {scannedItems && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-lg">
                    <h2 className="text-2xl font-bold mb-4">Confirm Scanned Items</h2>
                    <p className="text-sm text-on-surface-muted mb-4">Review the items found on your receipt. Items will be added to your pantry.</p>
                    <ul className="space-y-2 max-h-80 overflow-y-auto mb-6 bg-bkg p-3 rounded-lg">
                        {scannedItems.map((item, index) => <li key={index} className="flex justify-between"><span className="font-medium">{item.name}</span> <span className="text-on-surface-muted">{item.quantity}</span></li>)}
                    </ul>
                    <div className="flex justify-end gap-4">
                        <button onClick={() => setScannedItems(null)} className="bg-surface text-on-surface px-4 py-2 rounded">Cancel</button>
                        <button onClick={handleConfirmScannedItems} className="bg-primary text-on-primary px-4 py-2 rounded">Add Items</button>
                    </div>
                </Card>
            </div>
        )}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Inventory</h1>
        <ReceiptScanner onItemsScanned={setScannedItems} />
      </div>

      <Card>
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
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
                {tab === 'gym' ? 'Gym Equipment' : tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder={`New ${activeTab} item...`}
              className="bg-bkg border border-surface rounded px-3 py-2 w-full flex-grow"
            />
            {!(activeTab === 'gym' || activeTab === 'utensil') && (
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

          <ul className="space-y-3">
            {currentItems.length === 0 ? (
                <p className="text-on-surface-muted text-center py-4">No items yet. Add one above!</p>
            ) : (
                currentItems.map(item => (
                <li key={item.id} className="flex justify-between items-center bg-bkg p-3 rounded-lg">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    {'quantity' in item && <span className="text-sm text-on-surface-muted ml-3">{item.quantity}</span>}
                    {'nutrients' in item && item.nutrients && <p className="text-xs text-secondary mt-1">{item.nutrients.calories.toFixed(0)} kcal, {item.nutrients.protein.toFixed(0)}g P</p>}
                  </div>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-error hover:text-red-400">
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