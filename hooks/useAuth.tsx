// @ts-ignore
import { db, auth as firebaseAuth } from "@/config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
    Auth, createUserWithEmailAndPassword,
    User as FirebaseUser,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

// Cast the imported auth instance to the correct Firebase Auth type
// @ts-ignore
const auth = firebaseAuth as unknown as Auth;


WebBrowser.maybeCompleteAuthSession();

const USER_KEY = "@food_snap_user";

export interface User {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    activityLevel?: string;
    goal?: string;
    dietTypes?: string[];
    proteinTarget?: number;
    calorieTarget?: number;
    carbTarget?: number;
    fatTarget?: number;
    waterTarget?: number;
    followers?: string[];
    following?: string[];
    followersCount?: number;
    followingCount?: number;
    isPrivate?: boolean;
    // Gamification
    points?: number;
    waterStreak?: number;
    lastWaterDate?: string;
    isPro?: boolean;
    totalMealsLogged?: number;
    activeChallenges?: {
        id: string;
        name: string;
        progress: number;
        target: number;
        joinedAt: string;
        type?: 'protein' | 'water' | 'calories' | 'custom';
    }[];
}


interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (fullName: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
    googleLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    login: async () => { },
    signup: async () => { },
    logout: async () => { },
    updateUser: async () => { },
    googleLogin: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        // TODO: REPLACE THESE WITH YOUR ACTUAL CLIENT IDs FROM GOOGLE CLOUD CONSOLE
        clientId: '598758828028-ncvb583f13qmkna4an06hfdtr7rk22du.apps.googleusercontent.com',
        // iosClientId: '598758828028-umudcui4h5ksellhbkhntjh3gjjevhih.apps.googleusercontent.com',
        // androidClientId: '598758828028-a0kg2l6r0s59adepn0guucq96592al7b.apps.googleusercontent.com',
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            try {
                if (firebaseUser) {
                    // Fetch user data from Firestore
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;
                        setUser({ ...userData, id: firebaseUser.uid }); // Ensure ID is set
                        // Also cache internally for offline overlap if needed, but primary is Firestore
                        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
                    } else {
                        // Fallback if doc doesn't exist (e.g. created via other means)
                        const appUser: User = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email || "",
                            fullName: firebaseUser.displayName || "User",
                        };
                        setUser(appUser);
                    }
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    await AsyncStorage.removeItem(USER_KEY);
                }
            } catch (error) {
                console.error("Auth state change error:", error);
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error logging in:", error);
            throw error;
        }
    }, []);

    const signup = useCallback(
        async (fullName: string, email: string, password: string) => {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const uid = userCredential.user.uid;

                // Update display name
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, {
                        displayName: fullName
                    });
                }

                const newUser: User = {
                    id: uid,
                    fullName,
                    email,
                    age: 28, // Default
                    gender: "Male", // Default
                    height: 175, // Default
                    weight: 72, // Default
                    activityLevel: "Moderate", // Default
                    goal: "maintain", // Default
                    dietTypes: [],
                    proteinTarget: 150, // Default
                    calorieTarget: 2000,
                    carbTarget: 250,
                    fatTarget: 65,
                    waterTarget: 8,
                    points: 0,
                    waterStreak: 0,
                    lastWaterDate: "",
                    activeChallenges: []
                };

                // Save to Firestore
                await setDoc(doc(db, "users", uid), newUser);

                // Save local cache
                await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));

                setUser(newUser);
            } catch (error) {
                console.error("Error signing up:", error);
                throw error;
            }
        },
        []
    );

    const googleLogin = useCallback(async () => {
        try {
            const result = await promptAsync();
            if (result?.type === 'success') {
                const { id_token } = result.params;
                const credential = GoogleAuthProvider.credential(id_token);
                const userCredential = await signInWithCredential(auth, credential);

                // Check if user exists in Firestore, if not create them
                const userDocRef = doc(db, "users", userCredential.user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    const newUser: User = {
                        id: userCredential.user.uid,
                        fullName: userCredential.user.displayName || "User",
                        email: userCredential.user.email || "",
                        age: 28, // Default
                        gender: "Male", // Default
                        height: 175, // Default
                        weight: 72, // Default
                        activityLevel: "Moderate", // Default
                        goal: "maintain", // Default
                        dietTypes: [],
                        proteinTarget: 150, // Default
                        calorieTarget: 2000,
                        carbTarget: 250,
                        fatTarget: 65,
                        avatar: userCredential.user.photoURL || undefined,
                        points: 0,
                        waterStreak: 0,
                        lastWaterDate: "",
                        activeChallenges: []
                    };
                    await setDoc(userDocRef, newUser);
                }
            }
        } catch (error) {
            console.error("Google Login Error:", error);
            throw error;
        }
    }, [promptAsync]);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
            await AsyncStorage.removeItem(USER_KEY);
            setIsAuthenticated(false); // Explicitly required sometimes if onAuthStateChanged lags
            setUser(null);
        } catch (error) {
            console.error("Error logging out:", error);
            throw error;
        }
    }, []);

    const updateUser = useCallback(
        async (updates: Partial<User>) => {
            try {
                if (user && auth.currentUser) {
                    const updatedUser = { ...user, ...updates };

                    // Update Firestore
                    const userDocRef = doc(db, "users", user.id);
                    await updateDoc(userDocRef, updates);

                    // Update local state
                    setUser(updatedUser);
                    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

                    // If name is updated, update Firebase Auth profile too
                    if (updates.fullName) {
                        await updateProfile(auth.currentUser, {
                            displayName: updates.fullName
                        });
                    }
                }
            } catch (error) {
                console.error("Error updating user:", error);
                throw error;
            }
        },
        [user]
    );

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                user,
                login,
                signup,
                logout,
                updateUser,
                googleLogin
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
