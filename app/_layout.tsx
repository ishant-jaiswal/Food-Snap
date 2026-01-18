import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/hooks/useNotifications";
import { Slot } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay or when app is ready
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating load or waiting for providers
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <SubscriptionProvider>
          <Slot />
        </SubscriptionProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
