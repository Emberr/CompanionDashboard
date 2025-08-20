
export interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

export interface FoodItem {
  id: string;
  name: string;
  quantity: string;
  category: 'fridge' | 'pantry' | 'supplements' | 'bar';
}

export interface Equipment {
  id: string;
  name: string;
}

export interface Recipe {
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
  nutritionalInfo: Nutrients;
}

export interface WorkoutExercise {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
}

export interface Workout {
  name: string;
  exercises: WorkoutExercise[];
}

export interface MealLogItem {
  name: string;
  nutrients: Nutrients;
}

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: MealLogItem[];
}

export interface BodyMetric {
  value: number;
  date: string; // YYYY-MM-DD
}

export interface UserData {
  isProfileComplete: boolean;
  goals: {
    weight: number;
    bodyFat: number;
    dailyNutrients: Nutrients;
  };
  weightHistory: BodyMetric[];
  bodyFatHistory: BodyMetric[];
  inventory: FoodItem[];
  equipment: Equipment[];
  savedRecipes: Recipe[];
  savedWorkouts: Workout[];
  mealLogs: MealLog[];
}

export type Page = 'dashboard' | 'inventory' | 'recipes' | 'workouts';
