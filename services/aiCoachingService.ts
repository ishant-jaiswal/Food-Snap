import { generateText } from "./gemini";

export const calculateDynamicGoals = async (userStats: any) => {
    try {
        const prompt = `
            You are an expert nutritionist and fitness coach.
            Based on the following user stats, calculate the optimal daily calories and macros (percentages for protein, carbs, fats) for their goal.
            
            User Stats:
            - Age: ${userStats.age || 30}
            - Gender: ${userStats.gender || 'Not specified'}
            - Weight: ${userStats.weight}kg
            - Height: ${userStats.height}cm
            - Activity Level: ${userStats.activityLevel}
            - Goal: ${userStats.goal}
            
            Provide the response in valid JSON format ONLY, without any markdown code blocks.
            JSON Structure:
            {
                "calories": number,
                "protein": number, // percentage (e.g., 30)
                "carbs": number, // percentage (e.g., 40)
                "fats": number, // percentage (e.g., 30)
                "reasoning": "short string explaining why"
            }
        `;

        const response = await generateText(prompt);
        // Clean response if it contains markdown code blocks
        const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedResponse);
    } catch (error) {
        console.error("AI Coach Error:", error);
        // Fallback or re-throw
        throw error;
    }
};
