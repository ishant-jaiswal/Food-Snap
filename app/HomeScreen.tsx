import { CircularProgress } from "@/components/CircularProgress";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useTheme } from "@/hooks/useTheme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getUnreadCount, registerForPushNotificationsAsync, setupReminders } from "@/services/notificationService";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TIPS = [
  "Drink water before every meal to stay hydrated.",
  "Protein helps build muscle and keeps you full longer.",
  "Try to eat a rainbow of vegetables every day.",
  "Sleep is just as important as diet and exercise.",
  "Consistency is key. Small steps lead to big results.",
];

export default function HomeScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const today = new Date().toISOString().split("T")[0];
  const { totals, logs } = useFoodLog(today);
  const [water, setWater] = useState(0);
  const [tip, setTip] = useState(TIPS[0]);
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      getUnreadCount().then(setUnreadCount);
    }, [])
  );

  useEffect(() => {
    // Load water
    AsyncStorage.getItem(`water_${today}`).then(val => {
      if (val) setWater(parseInt(val));
    });
    // Random tip
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);

    // Setup Notifications
    registerForPushNotificationsAsync().then(() => setupReminders());
  }, []);

  const addWater = async () => {
    const newVal = water + 1;
    setWater(newVal);
    await AsyncStorage.setItem(`water_${today}`, String(newVal));

    // Gamification Logic: Update Streak if target hit (e.g., 8 glasses)
    // For demo purposes, we'll increment streak on the FIRST glass of the day if not already logged today
    if (user) {
      const pointsToAdd = 10;
      let newStreak = user.waterStreak || 0;
      let lastDate = user.lastWaterDate;

      // Streak Logic: Only once per day
      if (user.lastWaterDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (user.lastWaterDate === yesterdayStr) {
          newStreak = (user.waterStreak || 0) + 1;
        } else {
          newStreak = 1; // Reset or Start new
        }
        lastDate = today;
      }

      await updateUser({
        waterStreak: newStreak,
        lastWaterDate: lastDate,
        points: (user.points || 0) + pointsToAdd
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Good Night";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  // Safe defaults
  const goalCals = user?.calorieTarget || 2000;
  const goalProtein = user?.proteinTarget || 150;
  const goalCarbs = user?.carbTarget || 250;
  const goalFats = user?.fatTarget || 65;

  const recentLogs = logs.slice(0, 3).reverse();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.lg,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => navigation.navigate("Profile")}
              style={[styles.avatar, { backgroundColor: theme.card, overflow: 'hidden' }]}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Feather name="user" size={20} color={Colors.light.primary} />
              )}
            </Pressable>
            <View>
              <ThemedText style={styles.greeting}>{getGreeting()}</ThemedText>
              <ThemedText style={styles.userName}>{user?.fullName || "User"}</ThemedText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Feather name="bell" size={20} color={theme.text} />
              {unreadCount > 0 && <View style={styles.badgeDot} />}
            </Pressable>
            <Pressable
              style={[styles.iconButton, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate("Challenges")}
            >
              <Feather name="award" size={20} color={Colors.light.primary} />
            </Pressable>
            <Pressable
              style={[styles.iconButton, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Feather name="settings" size={20} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.sectionTitle}>Today's Nutrition</ThemedText>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <CircularProgress
                value={totals.calories}
                maxValue={goalCals}
                size={96}
                strokeWidth={6}
                color={Colors.light.orange}
              >
                <ThemedText style={styles.progressValue}>{totals.calories}</ThemedText>
                <ThemedText style={[styles.progressUnit, { color: theme.textSecondary }]}>kcal</ThemedText>
              </CircularProgress>
              <ThemedText style={[styles.nutritionLabel, { color: theme.textSecondary }]}>Calories</ThemedText>
            </View>

            <View style={styles.nutritionItem}>
              <CircularProgress
                value={totals.protein}
                maxValue={goalProtein}
                size={96}
                strokeWidth={6}
                color={Colors.light.primary}
              >
                <ThemedText style={styles.progressValue}>{totals.protein}g</ThemedText>
                <ThemedText style={[styles.progressUnit, { color: theme.textSecondary }]}>protein</ThemedText>
              </CircularProgress>
              <ThemedText style={[styles.nutritionLabel, { color: theme.textSecondary }]}>Protein</ThemedText>
            </View>

            <View style={styles.nutritionItem}>
              <CircularProgress
                value={totals.carbs}
                maxValue={goalCarbs}
                size={96}
                strokeWidth={6}
                color={Colors.light.secondary}
              >
                <ThemedText style={styles.progressValue}>{totals.carbs}g</ThemedText>
                <ThemedText style={[styles.progressUnit, { color: theme.textSecondary }]}>carbs</ThemedText>
              </CircularProgress>
              <ThemedText style={[styles.nutritionLabel, { color: theme.textSecondary }]}>Carbs</ThemedText>
            </View>

            <View style={styles.nutritionItem}>
              <CircularProgress
                value={totals.fats}
                maxValue={goalFats}
                size={96}
                strokeWidth={6}
                color={Colors.light.accent}
              >
                <ThemedText style={styles.progressValue}>{totals.fats}g</ThemedText>
                <ThemedText style={[styles.progressUnit, { color: theme.textSecondary }]}>fats</ThemedText>
              </CircularProgress>
              <ThemedText style={[styles.nutritionLabel, { color: theme.textSecondary }]}>Fats</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.insightCard, { backgroundColor: isDark ? "rgba(255, 193, 7, 0.15)" : "rgba(255, 193, 7, 0.12)" }]}>
          <View style={styles.insightIcon}>
            <Feather name="zap" size={20} color={Colors.light.accent} />
          </View>
          <View style={styles.insightContent}>
            <ThemedText style={styles.insightTitle}>Daily Tip</ThemedText>
            <ThemedText style={[styles.insightText, { color: theme.textSecondary }]}>
              {tip}
            </ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Meals</ThemedText>
          <Pressable onPress={() => navigation.navigate("Main", { screen: "DiaryTab" } as any)}>
            <ThemedText style={[styles.seeAll, { color: Colors.light.primary }]}>See All</ThemedText>
          </Pressable>
        </View>

        {recentLogs.length > 0 ? (
          recentLogs.map((meal) => (
            <View
              key={meal.id}
              style={[
                styles.mealCard,
                { backgroundColor: theme.card }
              ]}
            >
              <View style={[styles.mealImage, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="coffee" size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.mealInfo}>
                <ThemedText style={styles.mealName}>{meal.name}</ThemedText>
                <ThemedText style={[styles.mealTime, { color: theme.textSecondary }]}>
                  {meal.mealType}
                </ThemedText>
              </View>
              <View style={styles.mealCalories}>
                <ThemedText style={styles.calorieValue}>{meal.calories}</ThemedText>
                <ThemedText style={[styles.calorieUnit, { color: theme.textSecondary }]}>kcal</ThemedText>
              </View>
            </View>
          ))
        ) : (
          <ThemedText style={{ color: theme.textSecondary, marginBottom: 20 }}>No meals logged today.</ThemedText>
        )}

        {/* Water Tracker */}
        <View style={[styles.card, { backgroundColor: theme.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View>
            <ThemedText style={styles.sectionTitle}>Water Intake</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>{water} glasses today</ThemedText>
          </View>
          <Pressable
            onPress={addWater}
            style={{
              backgroundColor: Colors.light.blue,
              width: 50,
              height: 50,
              borderRadius: 25,
              alignItems: 'center',
              justifyContent: 'center',
              ...Shadows.soft
            }}
          >
            <Feather name="plus" size={24} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [
              styles.quickActionButton,
              { backgroundColor: Colors.light.primary, opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={() => navigation.navigate("FoodCapture")}
          >
            <Feather name="camera" size={20} color="#FFFFFF" />
            <ThemedText style={styles.quickActionText}>Snap Food</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.quickActionButton,
              { backgroundColor: Colors.light.secondary, opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={() => navigation.navigate("ScanFood")}
          >
            <Feather name="maximize" size={20} color="#FFFFFF" />
            <ThemedText style={styles.quickActionText}>Scan Barcode</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.quickActionButton,
              { backgroundColor: Colors.light.accent, opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={() => navigation.navigate("RecipeGenerator")}
          >
            <Feather name="cpu" size={20} color="#FFFFFF" />
            <ThemedText style={styles.quickActionText}>AI Chef</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.soft,
  },
  greeting: {
    ...Typography.caption,
    opacity: 0.7,
  },
  userName: {
    ...Typography.h4,
  },
  headerRight: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.soft,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.lg,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  nutritionItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  progressValue: {
    ...Typography.bodyMedium,
    fontWeight: "700",
  },
  progressUnit: {
    ...Typography.caption,
  },
  nutritionLabel: {
    ...Typography.smallMedium,
    marginTop: Spacing.sm,
  },
  insightCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: "flex-start",
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 193, 7, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xs,
  },
  insightText: {
    ...Typography.small,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  seeAll: {
    ...Typography.smallMedium,
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  mealImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  mealInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  mealName: {
    ...Typography.bodyMedium,
  },
  mealTime: {
    ...Typography.caption,
    marginTop: 2,
  },
  mealCalories: {
    alignItems: "flex-end",
  },
  calorieValue: {
    ...Typography.h4,
    color: Colors.light.primary,
  },
  calorieUnit: {
    ...Typography.caption,
  },
  quickActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    gap: 4,
    ...Shadows.soft,
  },
  quickActionText: {
    ...Typography.caption,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    borderWidth: 1,
    borderColor: '#FFF',
  }
});
