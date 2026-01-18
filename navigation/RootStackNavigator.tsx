import CreateReelScreen from "@/app/CreateReelScreen";
import EditProfileScreen from "@/app/EditProfileScreen";
import FoodCaptureScreen from "@/app/FoodCaptureScreen";
import GoalPreferenceScreen from "@/app/GoalPreferenceScreen";
import LoginScreen from "@/app/LoginScreen";
import PhotoOutputScreen from "@/app/PhotoOutputScreen";
import SignupScreen from "@/app/SignupScreen";
import SplashScreen from "@/app/SplashScreen";
import { useAuth } from "@/hooks/useAuth";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect } from "react";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  EditProfile: undefined;
  GoalPreference: undefined;
  FoodCapture: undefined;
  PhotoOutput: { imageUri?: string };
  CreateReel: undefined;
  MyReels: undefined;
  SingleReel: { reelId: string };
  Notifications: undefined;
  PrivacySecurity: undefined;
  ScanFood: undefined;
  UserList: { title: string; userIds: string[] };
  Profile: undefined;
  ManualFoodEntry: {
    mealType: string;
    date: string;
    initialName?: string;
    initialCalories?: string;
    initialProtein?: string;
    initialCarbs?: string;
    initialFats?: string;
  };
  CreateMeal: { mealType: string; date: string };
  RecipeGenerator: undefined;
  Challenges: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      try {
        const parsed = Linking.parse(event.url);
        if (parsed.path && parsed.path.startsWith('reel/')) {
          const parts = parsed.path.split('/');
          if (parts.length >= 2) {
            const reelId = parts[1];
            if (reelId) {
              setTimeout(() => {
                // @ts-ignore
                router.push({ pathname: "SingleReel", params: { reelId } });
              }, 500);
            }
          }
        }
      } catch (e) {
        console.log("Deep link error", e);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerTitle: "Edit Profile" }}
          />
          <Stack.Screen
            name="GoalPreference"
            component={GoalPreferenceScreen}
            options={{ headerTitle: "Goal Preference" }}
          />
          <Stack.Screen
            name="ScanFood"
            component={require("@/app/ScanFoodScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FoodCapture"
            component={FoodCaptureScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PhotoOutput"
            component={PhotoOutputScreen}
            options={{ headerTitle: "Nutrition" }}
          />
          <Stack.Screen
            name="CreateReel"
            component={CreateReelScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyReels"
            component={require("@/app/MyReelsScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SingleReel"
            component={require("@/app/SingleReelScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Notifications"
            component={require("@/app/NotificationsScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PrivacySecurity"
            component={require("@/app/PrivacySecurityScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserList"
            component={require("@/app/UserListScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={require("@/app/ProfileScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManualFoodEntry"
            component={require("@/app/ManualFoodEntryScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateMeal"
            component={require("@/app/CreateMealScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RecipeGenerator"
            component={require("@/app/RecipeGeneratorScreen").default}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Challenges"
            component={require("@/app/ChallengesScreen").default}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
