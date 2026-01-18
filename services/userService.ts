import { arrayRemove, arrayUnion, collection, doc, documentId, getDoc, getDocs, increment, limit, orderBy, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../config/firebase";
export interface UserData {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    photoURL?: string;

    // Physical stats
    height?: number; // cm
    weight?: number; // kg
    age?: number;
    gender?: 'male' | 'female' | 'other';
    activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
    goal?: 'lose_weight' | 'maintain' | 'gain_muscle';

    // Nutrition goals (calculated or manual)
    caloriesTarget?: number;
    carbsTarget?: number;
    fatsTarget?: number;
    waterTarget?: number;

    // Streaks & Points
    waterStreak?: number;
    foodStreak?: number;
    points?: number;

    // Social
    followers?: string[];
    following?: string[];
    followersCount?: number;
    followingCount?: number;

    // Subscription
    isPro?: boolean;

    // Stats
    totalMealsLogged?: number;
}

export const createUserProfile = async (userId: string, data: Partial<UserData>) => {
    try {
        const userRef = doc(db, "users", userId);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
            await setDoc(userRef, {
                id: userId,
                points: 0,
                waterStreak: 0,
                foodStreak: 0,
                followers: [],
                following: [],
                followersCount: 0,
                followingCount: 0,
                isPro: false, // Default to free tier
                totalMealsLogged: 0,
                createdAt: new Date(),
                ...data
            });
        }
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
    try {
        const userRef = doc(db, "users", userId);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as UserData;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};

export const updateUserData = async (userId: string, data: Partial<UserData>) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, data);
    } catch (error) {
        console.error("Error updating user data:", error);
        throw error;
    }
};

// Social Functions

export const followUser = async (currentUserId: string, targetUserId: string) => {
    if (currentUserId === targetUserId) return;
    try {
        const currentUserRef = doc(db, "users", currentUserId);
        const targetUserRef = doc(db, "users", targetUserId);

        await updateDoc(currentUserRef, {
            following: arrayUnion(targetUserId),
            followingCount: increment(1)
        });

        await updateDoc(targetUserRef, {
            followers: arrayUnion(currentUserId),
            followersCount: increment(1)
        });
    } catch (error) {
        console.error("Error following user:", error);
        throw error;
    }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
    try {
        const currentUserRef = doc(db, "users", currentUserId);
        const targetUserRef = doc(db, "users", targetUserId);

        await updateDoc(currentUserRef, {
            following: arrayRemove(targetUserId),
            followingCount: increment(-1)
        });

        await updateDoc(targetUserRef, {
            followers: arrayRemove(currentUserId),
            followersCount: increment(-1)
        });
    } catch (error) {
        console.error("Error unfollowing user:", error);
        throw error;
    }
};

export const isFollowing = (currentUser: UserData, targetUserId: string) => {
    return currentUser?.following?.includes(targetUserId);
};

export const getUsersByIds = async (userIds: string[]): Promise<UserData[]> => {
    if (!userIds || userIds.length === 0) return [];
    try {
        // Firestore 'in' query supports max 10 items.
        // For production, batching is needed. For now, we slice.
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 10) {
            chunks.push(userIds.slice(i, i + 10));
        }

        let allUsers: UserData[] = [];
        for (const chunk of chunks) {
            const q = query(collection(db, "users"), where(documentId(), "in", chunk));
            const snapshot = await getDocs(q);
            const chunkUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
            allUsers = [...allUsers, ...chunkUsers];
        }
        return allUsers;

    } catch (error) {
        console.error("Error fetching users by IDs:", error);
        return [];
    }
};

export const getLeaderboardUsers = async (limitCount = 20): Promise<UserData[]> => {
    try {
        // Order by points desc
        // Note: Requires index in Firestore if mixed with where clauses, but here simple order.
        const q = query(collection(db, "users"), orderBy("points", "desc"), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
    } catch (error) {
        console.error("Error fetching leaderboard:", error);

        // Fallback: try ordering by waterStreak if points index fails/doesn't exist yet
        try {
            const q2 = query(collection(db, "users"), orderBy("waterStreak", "desc"), limit(limitCount));
            const snapshot2 = await getDocs(q2);
            return snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
        } catch (err2) {
            console.error("Fallback leaderboard failed:", err2);
            return [];
        }
    }
};
