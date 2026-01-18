import { addDoc, collection, deleteDoc, doc, getDocs, increment, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../config/firebase";

export interface FoodLogEntry {
    id?: string;
    userId: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    image_url?: string | null;
    barcode?: string | null;
    timestamp: any;
    dateStr: string; // YYYY-MM-DD
    mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
}

export const logFoodItem = async (
    userId: string,
    foodData: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        image_url?: string | null;
        barcode?: string | null;
        mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
        dateStr?: string; // Optional: allow logging for specific date
    }
) => {
    try {
        const dateStr = foodData.dateStr || new Date().toISOString().split('T')[0];

        await addDoc(collection(db, "food_logs"), {
            userId,
            ...foodData,
            dateStr,
            timestamp: serverTimestamp(),
        });

        // Increment total meals logged
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            totalMealsLogged: increment(1)
        });

        return true;
    } catch (error) {
        console.error("Error logging food:", error);
        throw error;
    }
};

export const deleteFoodItem = async (id: string) => {
    try {
        await deleteDoc(doc(db, "food_logs", id));
        return true;
    } catch (error) {
        console.error("Error deleting food:", error);
        throw error;
    }
};

export const getDailyFoodLog = async (userId: string, dateStr: string) => {
    try {
        const q = query(
            collection(db, "food_logs"),
            where("userId", "==", userId),
            where("dateStr", "==", dateStr),
            orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FoodLogEntry[];
    } catch (error) {
        console.error("Error fetching daily log:", error);
        throw error;
    }
};

export const saveMealTemplate = async (
    userId: string,
    mealData: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        image_url?: string | null;
        items?: any[]; // Optional: list of food items in the meal
    }
) => {
    try {
        await addDoc(collection(db, "meals"), {
            userId,
            ...mealData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error("Error saving meal template:", error);
        throw error;
    }
};

export const getMyMeals = async (userId: string) => {
    try {
        const q = query(
            collection(db, "meals"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching my meals:", error);
        throw error;
    }
};

export const getFoodLogsInRange = async (userId: string, startDate: string, endDate: string) => {
    try {
        const q = query(
            collection(db, "food_logs"),
            where("userId", "==", userId),
            where("dateStr", ">=", startDate),
            where("dateStr", "<=", endDate),
            orderBy("dateStr", "asc") // Ensure index supports this if needed, or sort in memory
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FoodLogEntry[];
    } catch (error) {
        console.error("Error fetching logs range:", error);
        throw error;
    }
};
