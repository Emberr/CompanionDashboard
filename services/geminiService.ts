import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { Recipe, Workout, Nutrients, MealLogItem } from '../types';

// Read Vite-baked env var (must be direct access so Vite replaces at build-time)
const API_KEY: string | undefined = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Lazily create the client to avoid crashing on app load without a key
const getAi = () => {
  if (!API_KEY) return null;
  return new GoogleGenAI({ apiKey: API_KEY });
};

const nutrientsSchema = {
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
};

const receiptItemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the grocery item." },
        quantity: { type: Type.STRING, description: "The quantity of the item, if specified on the receipt (e.g., '1kg', '2 units'). Otherwise, default to '1'." },
    },
    required: ["name", "quantity"],
};

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
      nutritionalInfo: nutrientsSchema,
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
  cheatMode: boolean,
  utensils: string[] = []
): Promise<Recipe[]> => {
  const prompt = `
    You are a creative chef and nutritionist.
    Based on the following available ingredients: ${ingredients.join(', ')}.
    The user's preference is: "${preferences}".
    Available utensils/tools: ${utensils.length > 0 ? utensils.join(', ') : ' '}.
    Prefer recipes that can be prepared using the listed utensils; avoid requiring tools not provided.
    ${cheatMode ? "The user is in 'cheat mode', so feel free to generate more indulgent or alcoholic drink recipes if applicable." : "Generate healthy, goal-oriented meal recipes."}
    Generate 2 distinct recipes.
    Your response MUST be a valid JSON array matching the provided schema.
  `;
  const client = getAi();
  if (!client) {
    console.warn("VITE_GEMINI_API_KEY not set; returning empty recipes.");
    return [];
  }
  const response: GenerateContentResponse = await client.models.generateContent({
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
  const client = getAi();
  if (!client) {
    console.warn("VITE_GEMINI_API_KEY not set; returning null workout.");
    return null;
  }
  const response: GenerateContentResponse = await client.models.generateContent({
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
        const client = getAi();
        if (!client) {
            console.warn("VITE_GEMINI_API_KEY not set; returning fallback insight message.");
            return "Gemini API key not set. Add VITE_GEMINI_API_KEY and rebuild.";
        }
        const response: GenerateContentResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch(e) {
        console.error(e);
        return "Could not generate insights at this time."
    }
}

export const getNutrientsForMeal = async (mealDescription: string): Promise<MealLogItem | null> => {
    const prompt = `
      You are a nutritional database.
      Estimate the nutritional information (calories, protein, carbs, fat, fiber, sodium) for the following meal: "${mealDescription}".
      Your response MUST be a valid JSON object with a 'name' (a short, descriptive name for the meal) and a 'nutrients' object matching the schema.
    `;
    const client = getAi();
    if (!client) {
        console.warn("VITE_GEMINI_API_KEY not set; returning null meal nutrients.");
        return null;
    }
    const response: GenerateContentResponse = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    nutrients: nutrientsSchema,
                },
                required: ["name", "nutrients"],
            },
        },
    });
    return parseJsonResponse<MealLogItem | null>(response.text, null);
};


export const getNutrientsForFoodItem = async (itemName: string, quantity: string): Promise<Nutrients | null> => {
    const prompt = `
      You are a nutritional database.
      Estimate the nutritional information (calories, protein, carbs, fat, fiber, sodium) for the following food item: "${quantity} of ${itemName}".
      Your response MUST be a valid JSON object matching the schema.
    `;
    const client = getAi();
    if (!client) {
        console.warn("VITE_GEMINI_API_KEY not set; returning null nutrients.");
        return null;
    }
    const response: GenerateContentResponse = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: nutrientsSchema,
        },
    });
    return parseJsonResponse<Nutrients | null>(response.text, null);
};

export const parseReceipt = async (base64Image: string): Promise<{name: string, quantity: string}[]> => {
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };
    const textPart = {
        text: "You are an expert receipt OCR system. Extract the food items from this grocery receipt. Ignore taxes, totals, and non-food items. Provide the output as a JSON array of objects, where each object has 'name' and 'quantity' keys. Infer quantity if possible, otherwise default to '1 unit'."
    };
    const client = getAi();
    if (!client) {
        console.warn("VITE_GEMINI_API_KEY not set; returning empty parsed items.");
        return [];
    }
    const response: GenerateContentResponse = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: receiptItemSchema,
            },
        },
    });
    return parseJsonResponse<{name: string, quantity: string}[]>(response.text, []);
};

// Parse a natural-language description (e.g., from voice) into inventory items
export const parseItemsFromText = async (text: string): Promise<{ name: string, quantity: string }[]> => {
    const prompt = `
You are an expert grocery inventory parser.
From the following user description, extract grocery items to add to an inventory.
Return ONLY a JSON array of objects with keys 'name' and 'quantity'.
If quantity is not specified, default to '1 unit'.

User description:
"""
${text}
"""
`;

    const client = getAi();
    if (!client) {
        console.warn("VITE_GEMINI_API_KEY not set; returning empty parsed items.");
        return [];
    }
    const response: GenerateContentResponse = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: receiptItemSchema,
            },
        },
    });

    return parseJsonResponse<{ name: string, quantity: string }[]>(response.text, []);
};

// New function: Aggregate nutritional estimation for receipt items
// This function takes an array of receipt items (with name and quantity) and returns an array of objects with name, quantity, and estimated nutrients.
export const getMacrosForReceiptItems = async (items: { name: string, quantity: string }[]): Promise<{ name: string, quantity: string, nutrients: Nutrients }[]> => {
    // Construct prompt with list of items
    const prompt = `
You are a nutritional database. For the following list of grocery items extracted from a receipt:
${JSON.stringify(items)}

Provide a JSON array where each object corresponds to an item, and includes:
- name: a short descriptive name for the item
- quantity: same as provided
- nutrients: an object with estimated nutritional information (calories, protein, carbs, fat, fiber, sodium)

Your response MUST be a valid JSON array matching the provided schema.
`;

    // Define aggregated schema for the response
    const aggregatedResultSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.STRING },
                nutrients: {
                    type: Type.OBJECT,
                    properties: {
                        calories: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                        carbs: { type: Type.NUMBER },
                        fat: { type: Type.NUMBER },
                        fiber: { type: Type.NUMBER },
                        sodium: { type: Type.NUMBER }
                    },
                    required: ["calories", "protein", "carbs", "fat"]
                }
            },
            required: ["name", "quantity", "nutrients"]
        }
    };

    const client = getAi();
    if (!client) {
        console.warn("VITE_GEMINI_API_KEY not set; returning empty macros for items.");
        return [];
    }
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: aggregatedResultSchema
        }
    });

    return parseJsonResponse(response.text, []);
};
