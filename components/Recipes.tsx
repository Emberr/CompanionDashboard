import React, { useState } from 'react';
import type { UserData, Recipe, MealType, MealLogItem } from '../types';
import { generateRecipes } from '../services/geminiService';

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

// --- Recipe Card Component ---
const RecipeCard: React.FC<{
    recipe: Recipe,
    onSave: (recipe: Recipe) => void,
    onMadeIt: (recipe: Recipe) => void,
    isSaved: boolean
}> = ({ recipe, onSave, onMadeIt, isSaved }) => {
    return (
        <Card>
            <h3 className="text-2xl font-bold text-primary mb-2">{recipe.name}</h3>
            <p className="text-on-surface-muted mb-4">{recipe.description}</p>
            <div className="flex gap-4 text-sm mb-4">
                <span>Prep: <span className="font-semibold">{recipe.prepTime}</span></span>
                <span>Cook: <span className="font-semibold">{recipe.cookTime}</span></span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold mb-2">Ingredients</h4>
                    <ul className="list-disc list-inside text-on-surface-muted space-y-1">
                        {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <ol className="list-decimal list-inside text-on-surface-muted space-y-2">
                         {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                </div>
            </div>
             <div className="mt-4 border-t border-gray-700 pt-4">
                <h4 className="font-semibold mb-2">Nutrition (Estimated)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-on-surface-muted">
                    <p>Calories: {recipe.nutritionalInfo.calories?.toFixed(0)}</p>
                    <p>Protein: {recipe.nutritionalInfo.protein?.toFixed(0)}g</p>
                    <p>Carbs: {recipe.nutritionalInfo.carbs?.toFixed(0)}g</p>
                    <p>Fat: {recipe.nutritionalInfo.fat?.toFixed(0)}g</p>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button onClick={() => onMadeIt(recipe)} className="bg-secondary text-on-primary px-4 py-2 rounded hover:opacity-80 transition-opacity font-semibold">I Made It!</button>
                <Button onClick={() => onSave(recipe)} disabled={isSaved}>{isSaved ? 'Saved' : 'Save Recipe'}</Button>
            </div>
        </Card>
    );
};

const AddToMealModal: React.FC<{
    recipe: Recipe;
    onAdd: (mealType: MealType) => void;
    onClose: () => void;
}> = ({ recipe, onAdd, onClose }) => {
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-2">Log Recipe</h2>
                <p className="text-on-surface-muted mb-4">Add "<span className="font-semibold text-on-surface">{recipe.name}</span>" to which meal?</p>
                <div className="grid grid-cols-2 gap-3">
                    {mealTypes.map(meal => (
                        <button key={meal} onClick={() => onAdd(meal)} className="bg-primary text-on-primary capitalize w-full p-3 rounded-lg hover:bg-primary-variant transition-colors">
                            {meal}
                        </button>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                     <button onClick={onClose} className="bg-surface text-on-surface px-4 py-2 rounded hover:bg-gray-700">Cancel</button>
                </div>
            </Card>
        </div>
    );
};


interface RecipesProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onAddFood: (mealType: MealType, item: MealLogItem) => void;
}

const Recipes: React.FC<RecipesProps> = ({ userData, setUserData, onAddFood }) => {
  const [preferences, setPreferences] = useState('');
  const [useInventory, setUseInventory] = useState(true);
  const [cheatMode, setCheatMode] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
  const [mealLogRecipe, setMealLogRecipe] = useState<Recipe | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setGeneratedRecipes([]);
    const ingredients = useInventory ? userData.inventory.filter(i => i.category === 'food').map(i => i.name) : [];
    try {
      const recipes = await generateRecipes(ingredients, preferences, cheatMode);
      setGeneratedRecipes(recipes);
    } catch (err) {
      setError('Failed to generate recipes. Please try again.');
      console.error(err);
    }
    setIsLoading(false);
  };
  
  const handleSaveRecipe = (recipeToSave: Recipe) => {
      if (userData.savedRecipes.some(r => r.name === recipeToSave.name)) {
          return;
      }
      setUserData(prev => ({...prev, savedRecipes: [...prev.savedRecipes, recipeToSave]}));
  };
  
  const handleLogRecipeAsMeal = (mealType: MealType) => {
      if (!mealLogRecipe) return;
      const mealItem: MealLogItem = {
          id: Date.now().toString(),
          name: mealLogRecipe.name,
          nutrients: mealLogRecipe.nutritionalInfo
      };
      onAddFood(mealType, mealItem);
      setMealLogRecipe(null);
  };

  const isRecipeSaved = (recipeName: string) => userData.savedRecipes.some(r => r.name === recipeName);

  return (
    <div className="p-4 md:p-8 space-y-8">
      {mealLogRecipe && <AddToMealModal recipe={mealLogRecipe} onAdd={handleLogRecipeAsMeal} onClose={() => setMealLogRecipe(null)} />}
      <h1 className="text-4xl font-bold">Recipes</h1>

      <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-6">
            <button onClick={() => setActiveTab('generate')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'generate' ? 'border-primary text-primary' : 'border-transparent text-on-surface-muted hover:text-on-surface hover:border-gray-500'}`}>Generate Recipes</button>
            <button onClick={() => setActiveTab('saved')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-on-surface-muted hover:text-on-surface hover:border-gray-500'}`}>Saved Recipes</button>
          </nav>
      </div>
      
      {activeTab === 'generate' && (
        <>
        <Card>
            <div className="space-y-4">
            <h2 className="text-2xl font-semibold">What are you in the mood for?</h2>
            <textarea
                value={preferences}
                onChange={e => setPreferences(e.target.value)}
                placeholder="e.g., 'a light lunch', 'something spicy', 'a high-protein breakfast shake'"
                className="bg-bkg border border-surface rounded px-3 py-2 w-full min-h-[80px]"
            />
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={useInventory} onChange={() => setUseInventory(!useInventory)} className="h-4 w-4 rounded bg-surface border-gray-600 text-primary focus:ring-primary"/>
                        <span className="ml-2 text-on-surface-muted">Use my inventory</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={cheatMode} onChange={() => setCheatMode(!cheatMode)} className="h-4 w-4 rounded bg-surface border-gray-600 text-primary focus:ring-primary"/>
                        <span className="ml-2 text-on-surface-muted">Cheat Mode 🍸</span>
                    </label>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Recipes'}
                </Button>
            </div>
            </div>
        </Card>
        
        {isLoading && <div className="flex justify-center"><Spinner /></div>}
        {error && <p className="text-error text-center">{error}</p>}
        <div className="space-y-6">
            {generatedRecipes.map((recipe, index) => <RecipeCard key={index} recipe={recipe} onSave={handleSaveRecipe} onMadeIt={setMealLogRecipe} isSaved={isRecipeSaved(recipe.name)} />)}
        </div>
        </>
      )}

      {activeTab === 'saved' && (
          <div className="space-y-6">
              {userData.savedRecipes.length === 0 ? (
                  <Card><p className="text-center text-on-surface-muted">You haven't saved any recipes yet.</p></Card>
              ) : (
                  userData.savedRecipes.map((recipe, index) => <RecipeCard key={index} recipe={recipe} onSave={handleSaveRecipe} onMadeIt={setMealLogRecipe} isSaved={true} />)
              )}
          </div>
      )}

    </div>
  );
};

export default Recipes;