import { CircularProgress } from "@/components/CircularProgress";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DiaryScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // Date State
  const [date, setDate] = useState(new Date());

  const dateStr = date.toISOString().split("T")[0];
  const { logsByMeal, totals, loading, removeLog } = useFoodLog(dateStr);

  const handleDateChange = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    setDate(newDate);
  };

  const getDisplayDate = () => {
    const today = new Date().toISOString().split("T")[0];
    if (dateStr === today) return "Today";

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split("T")[0]) return "Tomorrow";

    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleAddFood = (mealType: string) => {
    router.push({
      pathname: "/AddFoodScreen",
      params: { mealType, date: dateStr }
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Item", "Are you sure you want to remove this food?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeLog(id) }
    ]);
  };

  const renderMealSection = (title: string, items: any[], icon: any) => {
    const sectionCals = items.reduce((sum, item) => sum + item.calories, 0);

    return (
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {icon}
            <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          </View>
          <ThemedText style={[styles.sectionCals, { color: theme.textSecondary }]}>{sectionCals} kcal</ThemedText>
        </View>

        {items.length > 0 ? (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.foodItem, pressed && { opacity: 0.7 }]}
              onLongPress={() => handleDelete(item.id)}
            >
              <View style={styles.foodInfo}>
                <ThemedText style={styles.foodName}>{item.name}</ThemedText>
                <ThemedText style={[styles.foodDetail, { color: theme.textSecondary }]}>
                  {item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.fats}g F
                </ThemedText>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={{ padding: Spacing.md, alignItems: 'center' }}>
            <ThemedText style={{ ...Typography.caption, color: theme.textSecondary }}>No food logged yet</ThemedText>
          </View>
        )}

        <Pressable
          style={[styles.addButton, { borderTopColor: theme.border, borderTopWidth: 1 }]}
          onPress={() => handleAddFood(title)}
        >
          <Feather name="plus" size={18} color={Colors.light.primary} />
          <ThemedText style={[styles.addText, { color: Colors.light.primary }]}>ADD {title.toUpperCase()}</ThemedText>
        </Pressable>
      </View>
    );
  };

  // Get goals from user profile or defaults
  const GOAL_CALS = user?.calorieTarget || 2000;
  const GOAL_PROTEIN = user?.proteinTarget || 150;
  const GOAL_CARBS = user?.carbTarget || 250;
  const GOAL_FATS = user?.fatTarget || 65;

  const remaining = GOAL_CALS - totals.calories;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>

      {/* Date Header */}
      <View style={[styles.dateHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => handleDateChange(-1)} style={styles.arrowBtn}>
          <Feather name="chevron-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.dateDisplay}>
          <Feather name="calendar" size={16} color={theme.text} style={{ marginRight: 8 }} />
          <ThemedText style={styles.dateLabel}>{getDisplayDate()}</ThemedText>
        </View>
        <Pressable onPress={() => handleDateChange(1)} style={styles.arrowBtn}>
          <Feather name="chevron-right" size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.md,
          paddingTop: Spacing.md
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <View style={styles.summaryTopRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.summaryTitle}>Calories</ThemedText>
              <ThemedText style={{ ...Typography.caption, color: theme.textSecondary }}>
                Remaining = Goal - Food
              </ThemedText>
            </View>
            <CircularProgress
              value={totals.calories}
              maxValue={GOAL_CALS}
              size={100}
              strokeWidth={8}
              color={remaining < 0 ? Colors.light.error : Colors.light.primary}
            >
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ ...Typography.h3, fontWeight: 'bold', color: remaining < 0 ? Colors.light.error : theme.text }}>
                  {remaining}
                </ThemedText>
                <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>Left</ThemedText>
              </View>
            </CircularProgress>
          </View>

          <View style={[styles.macroRow, { borderTopColor: theme.border }]}>
            <View style={styles.macroItem}>
              <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Protein</ThemedText>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(totals.protein / GOAL_PROTEIN * 100, 100)}%`, backgroundColor: Colors.light.primary }]} />
              </View>
              <ThemedText style={styles.macroValue}>{totals.protein} / {GOAL_PROTEIN}g</ThemedText>
            </View>
            <View style={styles.macroItem}>
              <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Carbs</ThemedText>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(totals.carbs / GOAL_CARBS * 100, 100)}%`, backgroundColor: Colors.light.secondary }]} />
              </View>
              <ThemedText style={styles.macroValue}>{totals.carbs} / {GOAL_CARBS}g</ThemedText>
            </View>
            <View style={styles.macroItem}>
              <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Fat</ThemedText>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(totals.fats / GOAL_FATS * 100, 100)}%`, backgroundColor: Colors.light.accent }]} />
              </View>
              <ThemedText style={styles.macroValue}>{totals.fats} / {GOAL_FATS}g</ThemedText>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={{ gap: Spacing.md }}>
            {renderMealSection("Breakfast", logsByMeal.Breakfast, <Feather name="sun" size={20} color={Colors.light.orange} />)}
            {renderMealSection("Lunch", logsByMeal.Lunch, <Feather name="cloud" size={20} color={Colors.light.primary} />)}
            {renderMealSection("Dinner", logsByMeal.Dinner, <Feather name="moon" size={20} color={Colors.light.secondary} />)}
            {renderMealSection("Snack", logsByMeal.Snack, <Feather name="coffee" size={20} color={Colors.light.accent} />)}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    ...Shadows.soft,
    zIndex: 10,
  },
  arrowBtn: {
    padding: Spacing.sm,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  dateLabel: {
    ...Typography.bodyMedium,
    fontWeight: '600'
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.h3,
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: 12,
  },
  macroItem: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  macroValue: {
    fontSize: 10,
    fontWeight: '500',
  },
  section: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  sectionCals: {
    ...Typography.captionMedium,
    fontWeight: '600',
  },
  foodItem: {
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  foodInfo: {
    gap: 4,
  },
  foodName: {
    ...Typography.body,
    fontWeight: '500',
  },
  foodDetail: {
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: 8,
  },
  addText: {
    ...Typography.captionMedium,
    fontWeight: '700',
    fontSize: 13,
  }
});
