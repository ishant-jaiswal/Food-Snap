export const calculateBMR = (
    weight: number, // kg
    height: number, // cm
    age: number,
    gender: string
): number => {
    // Mifflin-St Jeor Equation
    if (gender === 'Male') {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * age - 161;
    }
};

export const calculateTDEE = (bmr: number, activityLevel: string): number => {
    const multipliers: { [key: string]: number } = {
        'Sedentary': 1.2,
        'Light': 1.375,
        'Moderate': 1.55,
        'Active': 1.725,
        'Very Active': 1.9,
    };
    return Math.round(bmr * (multipliers[activityLevel] || 1.2));
};

export interface MacroResult {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export const calculateMacros = (
    tdee: number,
    weight: number, // kg
    goal: 'lose' | 'maintain' | 'gain'
): MacroResult => {
    let targetCalories = tdee;

    if (goal === 'lose') {
        targetCalories -= 500;
    } else if (goal === 'gain') {
        targetCalories += 500;
    }

    // Ensure not too low
    if (targetCalories < 1200) targetCalories = 1200;

    // Standard high-protein diet for fitness
    // Protein: 2.0g per kg
    // Fats: 0.8g per kg
    // Carbs: Remainder

    const protein = Math.round(weight * 2.0);
    const fats = Math.round(weight * 0.8);

    const proteinCals = protein * 4;
    const fatCals = fats * 9;

    let remainCals = targetCalories - proteinCals - fatCals;

    // Safety check if math goes weird for very low cals
    if (remainCals < 0) {
        remainCals = 0;
        // Adjust calories up to meets minimum macro needs
        targetCalories = proteinCals + fatCals;
    }

    const carbs = Math.round(remainCals / 4);

    return {
        calories: Math.round(targetCalories),
        protein,
        carbs,
        fats
    };
};
