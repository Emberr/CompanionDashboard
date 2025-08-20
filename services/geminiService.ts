
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { Recipe, Workout } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A simple alert for demonstration. In a real app, this would be handled more gracefully.
  alert("API_KEY environment variable not set. App will not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const recipeSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The name of the recipe." },
      description: { type: Type.STRING, description: "A brief, enticing description of the dish." },
      prepTime: { type: Type.STRING, description: "Preparation time, e.g., '15 minutes'." },
      cookTime: { type: Type.STRING, description: "Cooking time, e.g., '30 minutes'." },
      ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of ingredients with quantities." },
      instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step cooking instructions." },
      nutritionalInfo: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          fiber: { type: Type.NUMBER },
          sodium: { type: Type.NUMBER },
        },
        required: ["calories", "protein", "carbs", "fat"],
      },
    },
    required: ["name", "description", "prepTime", "cookTime", "ingredients", "instructions", "nutritionalInfo"],
  },
};

const workoutSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative and motivating name for the workout." },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          sets: { type: Type.STRING },
          reps: { type: Type.STRING },
          notes: { type: Type.STRING, description: "Tips for form or intensity." },
        },
        required: ["name", "sets", "reps"],
      },
    },
  },
  required: ["name", "exercises"],
};


const parseJsonResponse = <T,>(text: string, fallback: T): T => {
  try {
    // The Gemini API for JSON mode sometimes wraps the JSON in ```json ... ```
    const cleanText = text.replace(/^```json\s*|```$/g, '').trim();
    return JSON.parse(cleanText) as T;
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    console.error("Raw response text:", text);
    return fallback;
  }
};

export const generateRecipes = async (
  ingredients: string[],
  preferences: string,
  cheatMode: boolean
): Promise<Recipe[]> => {
  const prompt = `
    You are a creative chef and nutritionist.
    Based on the following available ingredients: ${ingredients.join(', ')}.
    The user's preference is: "${preferences}".
    ${cheatMode ? "The user is in 'cheat mode', so feel free to generate more indulgent or alcoholic drink recipes if applicable." : "Generate healthy, goal-oriented meal recipes."}
    Generate 2 distinct recipes.
    Your response MUST be a valid JSON array matching the provided schema.
  `;
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: recipeSchema,
    },
  });
  return parseJsonResponse<Recipe[]>(response.text, []);
};

export const generateWorkout = async (
  location: string,
  equipment: string[],
  focus: string[],
  duration: string,
  intensity: string
): Promise<Workout | null> => {
  const prompt = `
    You are an expert personal trainer. Create a workout plan.
    Location: ${location}.
    Available Equipment: ${equipment.length > 0 ? equipment.join(', ') : 'Bodyweight only'}.
    Focus Body Parts: ${focus.join(', ')}.
    Duration: ${duration} minutes.
    Intensity: ${intensity}.
    Provide a motivating name for the workout and a list of exercises with sets, reps (or time), and brief tips.
    Your response MUST be a valid JSON object matching the provided schema.
  `;
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: workoutSchema,
    },
  });
  return parseJsonResponse<Workout | null>(response.text, null);
};

export const generateDashboardInsights = async (userDataJson: string): Promise<string> => {
    const prompt = `
      As an AI wellness coach, analyze the user's data and provide a few short, actionable insights.
      Keep the tone encouraging and positive. Mention one recent success and one area for improvement or a suggestion.
      Example: "Great job on your consistent workouts! Maybe try adding some more fiber-rich foods like oats or berries to hit your daily fiber goal."
      User data: ${userDataJson}
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch(e) {
        console.error(e);
        return "Could not generate insights at this time."
    }
}
