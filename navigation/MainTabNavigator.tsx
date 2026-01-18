import { Feather } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DiaryScreen from "@/app/DiaryScreen";
import FoodLogScreen from "@/app/FoodLogScreen";
import HomeScreen from "@/app/HomeScreen";
import ReelsScreen from "@/app/ReelsScreen";

import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export type MainTabParamList = {
  HomeTab: undefined;
  FoodLogTab: undefined;
  ReelsTab: undefined;
  DiaryTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/* -------------------- CAMERA FLOATING BUTTON -------------------- */
function CameraButton() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      onPress={() => navigation.navigate("FoodCapture")}
      style={({ pressed }) => [
        styles.cameraButton,
        {
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Feather name="camera" size={26} color="#FFFFFF" />
    </Pressable>
  );
}

/* -------------------- MAIN TAB NAVIGATOR -------------------- */
export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets(); // ✅ SAFE AREA

  return (
    <View style={styles.root}>
      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.light.primary,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          tabBarStyle: {
            position: "absolute",
            height: 80 + insets.bottom, // ✅ SAFE HEIGHT
            paddingTop: 8,
            paddingBottom: insets.bottom + 12,
            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: Platform.select({
              ios: "transparent",
              android: theme.backgroundRoot,
            }),
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : null,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="FoodLogTab"
          component={FoodLogScreen}
          options={{
            title: "Food Log",
            tabBarIcon: ({ color, size }) => (
              <Feather name="bar-chart-2" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="ReelsTab"
          component={ReelsScreen}
          options={{
            title: "Reels",
            tabBarIcon: ({ color, size }) => (
              <Feather name="play-circle" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="DiaryTab"
          component={DiaryScreen}
          options={{
            title: "Diary",
            tabBarIcon: ({ color, size }) => (
              <Feather name="book" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* ---------------- FLOATING CAMERA BUTTON ---------------- */}
      <View
        style={[
          styles.cameraButtonContainer,
          {
            bottom: insets.bottom + 40, // ✅ PERFECT SPACING
          },
        ]}
      >
        <CameraButton />
      </View>
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  cameraButtonContainer: {
    position: "absolute",
    alignSelf: "center",
  },

  cameraButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
});
