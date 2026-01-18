import { deleteFoodItem, FoodLogEntry, getDailyFoodLog } from "@/services/foodService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export function useFoodLog(dateStr: string) {
    const { user } = useAuth();
    const [logs, setLogs] = useState<FoodLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);
        try {
            // 1. Try Cache First
            const cacheKey = `food_logs_${user.id}_${dateStr}`;
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                setLogs(JSON.parse(cached));
                setLoading(false); // Show cached immediately
            }

            // 2. Fetch Fresh from Network
            const data = await getDailyFoodLog(user.id, dateStr);
            setLogs(data);

            // 3. Update Cache
            await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (err) {
            setError("Failed to load food logs");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, dateStr]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const removeLog = useCallback(async (id: string) => {
        try {
            await deleteFoodItem(id);
            // Optimistic update
            setLogs(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error("Failed to delete log", err);
            // Revert or show error could be handled here
        }
    }, []);

    // Helper to group by meal type
    const logsByMeal = {
        Breakfast: logs.filter(l => l.mealType === "Breakfast"),
        Lunch: logs.filter(l => l.mealType === "Lunch"),
        Dinner: logs.filter(l => l.mealType === "Dinner"),
        Snack: logs.filter(l => l.mealType === "Snack"),
    };

    const totals = logs.reduce((acc, curr) => ({
        calories: acc.calories + curr.calories,
        protein: acc.protein + curr.protein,
        carbs: acc.carbs + curr.carbs,
        fats: acc.fats + curr.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return {
        logs,
        logsByMeal,
        totals,
        loading,
        error,
        refreshLogs: fetchLogs,
        removeLog
    };
}
