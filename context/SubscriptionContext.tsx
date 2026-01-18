import { useAuth } from '@/hooks/useAuth';
import { updateUserData } from '@/services/userService';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface SubscriptionContextType {
    isPro: boolean;
    isLoading: boolean;
    upgradeToPro: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    isPro: false,
    isLoading: false,
    upgradeToPro: async () => { },
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setIsPro(!!user.isPro);
            setIsLoading(false);
        } else {
            setIsPro(false);
            setIsLoading(false);
        }
    }, [user]);

    const upgradeToPro = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            // MOCK: In a real app, this would trigger a payment flow (Stripe/RevenueCat)
            // For now, we instantly upgrade the user in Firestore
            await updateUserData(user.id, { isPro: true });
            setIsPro(true);
            Alert.alert("Success", "Welcome to Pro! Enjoy your premium features.");
        } catch (error) {
            console.error("Subscription error:", error);
            Alert.alert("Error", "Failed to process subscription. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SubscriptionContext.Provider value={{ isPro, isLoading, upgradeToPro }}>
            {children}
        </SubscriptionContext.Provider>
    );
};
