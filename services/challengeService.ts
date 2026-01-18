import { addDoc, arrayUnion, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../config/firebase";

export interface Challenge {
    id: string;
    name: string;
    description: string;
    type: 'steps' | 'calories' | 'water' | 'workouts';
    target: number;
    duration: number; // days
    creatorId: string;
    isPrivate: boolean;
    participants: string[];
    startDate: any;
    createdAt: any;
}

export const createChallenge = async (challengeData: Partial<Challenge>) => {
    try {
        const docRef = await addDoc(collection(db, "challenges"), {
            ...challengeData,
            participants: [challengeData.creatorId], // Creator joins automatically
            createdAt: serverTimestamp(),
            startDate: serverTimestamp(), // Starts immediately for now
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating challenge:", error);
        throw error;
    }
};

export const getPublicChallenges = async () => {
    try {
        const q = query(collection(db, "challenges"), where("isPrivate", "==", false));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
    } catch (error) {
        console.error("Error fetching public challenges:", error);
        return [];
    }
};

export const getMyChallenges = async (userId: string) => {
    try {
        // Firestore doesn't support array-contains for objects, but participants is array of strings (userIds)
        const q = query(collection(db, "challenges"), where("participants", "array-contains", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
    } catch (error) {
        console.error("Error fetching my challenges:", error);
        return [];
    }
};

export const joinChallenge = async (challengeId: string, userId: string) => {
    try {
        const challengeRef = doc(db, "challenges", challengeId);
        await updateDoc(challengeRef, {
            participants: arrayUnion(userId)
        });
    } catch (error) {
        console.error("Error joining challenge:", error);
        throw error;
    }
};
