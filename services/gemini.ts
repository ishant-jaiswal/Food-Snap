
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system/legacy';

// Initialize Gemini
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("⚠️ Gemini API Key is missing! Please check your .env file.");
} else {
    console.log("✅ Gemini API Key found (starts with: " + API_KEY.substring(0, 8) + "...)");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export const generateText = async (prompt: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Text Generation Error:", error);
        throw error;
    }
};

export interface FoodAnalysisResult {
    isFood: boolean;
    name?: string;
    confidence?: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    fiber?: number;
    sugar?: number;
    servingSize?: string;
    insights?: {
        title: string;
        description: string;
        type: 'positive' | 'warning' | 'info';
    }[];
    alternatives?: {
        id: string;
        name: string;
        protein: number;
        calories: number;
        image: string;
    }[];
}

export const analyzeFoodImage = async (uri: string, dietaryPreferences: string[] = []): Promise<FoodAnalysisResult> => {
    try {
        // Read file as Base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const dietContext = dietaryPreferences.length > 0
            ? `The user follows these dietary preferences: ${dietaryPreferences.join(", ")}. Please recommend alternatives that strictly adhere to these diets.`
            : "Recommend healthier high-protein alternatives.";

        const prompt = `
        Analyze this image to detect if it contains food or a drink. 
        
        Strictly output VALID JSON only. No markdown code blocks, no explanation.

        If the image is NOT food (e.g. a person, a chair, a car, a landscape, etc.), return exactly:
        { "isFood": false }

        If the image IS food, return a JSON object with this structure:
        {
            "isFood": true,
            "name": "Name of the dish",
            "confidence": 95,
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "fiber": 0,
            "sugar": 0,
            "servingSize": "e.g. 1 bowl (300g)",
            "insights": [
                {
                    "title": "Short Title",
                    "description": "Insight description",
                    "type": "positive"
                },
                {
                    "title": "Short Title", 
                    "description": "Insight description",
                    "type": "info"
                }
            ],
            "alternatives": [
                {
                    "id": "1",
                    "name": "Alternative Food Name",
                    "protein": 0,
                    "calories": 0,
                    "image": "icon_name_from_feather_icons" 
                }
            ]
        }
        
        Estimate the nutritional values to the best of your ability.
        
        ${dietContext}
        For the "alternatives" array:
        - Provide 3-4 food options that are healthier or higher in protein.
        - If dietary preferences are provided, ENSURE all alternatives fit that diet.
        - For "image", choose a valid icon name from the Feather icon set (e.g., 'activity', 'box', 'coffee', 'disc', 'droplet', 'heart', 'sun', 'star', 'trending-up', 'check-circle') that loosely represents the food.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64,
                    mimeType: "image/jpeg", // Assuming JPEG from Expo Camera
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown if Gemini adds it despite instructions
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
};

// Helper for Gemini (used as fallback or for other tasks)
const analyzeFoodWithGemini = async (uri: string, dietaryPreferences: string[] = []): Promise<FoodAnalysisResult> => {
    // ... (Original Gemini implementation can stay here if desired)
    throw new Error("Gemini fallback not implemented");
};

export const searchFoodByName = async (query: string): Promise<FoodAnalysisResult[]> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Search for food items matching the query: "${query}".
        
        Strictly output VALID JSON only. Return a list of 5-8 matching food items.
        
        JSON Structure:
        [
            {
                "isFood": true,
                "name": "Food Name",
                "confidence": 100,
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "fiber": 0,
                "sugar": 0,
                "servingSize": "e.g. 1 medium (100g)",
                "insights": [] 
            }
        ]
        
        Ensure the nutritional values are as accurate as possible for the serving size.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanJson);
        return Array.isArray(data) ? data : [data];

    } catch (error) {
        console.error("Gemini Search Error:", error);
        return [];
    }
};
export const analyzeFoodAudio = async (uri: string): Promise<FoodAnalysisResult[]> => {
    try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: "base64",
        });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Listen to this audio log of food consumption.
        Extract the food items, approximate quantities, and nutritional info.
        
        Strictly output VALID JSON only. array of objects.
        
        JSON Structure:
        [
            {
                "isFood": true,
                "name": "Food Name",
                "confidence": 100,
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "fiber": 0,
                "sugar": 0,
                "servingSize": "estimated",
                "insights": [] 
            }
        ]
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64,
                    mimeType: "audio/mp4", // expo-av default often m4a/mp4
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanJson);
        return Array.isArray(data) ? data : [data];

    } catch (error) {
        console.error("Gemini Audio Analysis Error:", error);
        return [];
    }
};

export const getFoodSuggestions = async (query: string): Promise<string[]> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Provide 5 popular food search queries or food items that start with or are relevant to: "${query}".
        Keep them short and concise (e.g. "Chicken breast", "Chicken curry", "Chickpeas").
        
        Strictly output VALID JSON only. A simple array of strings.
        Example: ["Apple", "Apple pie", "Applesauce"]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanJson);
        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error("Gemini Suggestion Error:", error);
        return [];
    }
};

export interface RecipeResult {
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    time: string;
    ingredients: string[];
    instructions: string[];
}

export const identifyLeftoversAndSuggestRecipe = async (uri: string, dietaryPreferences: string[] = []): Promise<RecipeResult[]> => {
    try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: "base64",
        });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const dietContext = dietaryPreferences.length > 0
            ? `IMPORTANT: The user follows these dietary preferences: ${dietaryPreferences.join(", ")}. You MUST STRICTLY respect these restrictions (e.g., if Vegetarian, NO meat/fish/egg).`
            : "";

        const prompt = `
        Analyze this image of food ingredients (leftovers, fridge contents, or pantry items).
        Identify the main ingredients available.
        Then, suggest 3 creative, high-protein recipes that can be made using these ingredients.
        ${dietContext}
        
        Strictly output VALID JSON only. Array of objects.
        
        JSON Structure:
        [
            {
                "name": "Recipe Name",
                "description": "Short description",
                "calories": 500,
                "protein": 30,
                "carbs": 40,
                "fats": 15,
                "time": "20 mins",
                "ingredients": ["Ingredient 1", "Ingredient 2"],
                "instructions": ["Step 1", "Step 2"]
            }
        ]
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("Gemini Recipe Error:", error);
        return [];
    }
};



