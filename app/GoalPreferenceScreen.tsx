import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { calculateDynamicGoals } from "@/services/aiCoachingService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface Goal {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

const goals: Goal[] = [
  { id: "lose", title: "Lose Weight", description: "Create a calorie deficit", icon: "trending-down", color: Colors.light.secondary },
  { id: "maintain", title: "Maintain Weight", description: "Balance calories in and out", icon: "minus", color: Colors.light.orange },
  { id: "gain", title: "Build Muscle", description: "Increase protein intake", icon: "trending-up", color: Colors.light.primary },
];

const dietTypes = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "keto", label: "Keto" },
  { id: "paleo", label: "Paleo" },
  { id: "glutenfree", label: "Gluten-Free" },
  { id: "dairyfree", label: "Dairy-Free" },
];

export default function GoalPreferenceScreen() {
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isPro } = useSubscription();
  const router = useRouter();

  const [selectedGoal, setSelectedGoal] = useState(user?.goal || "maintain");
  const [selectedDiets, setSelectedDiets] = useState<string[]>(user?.dietTypes || []);
  const [proteinTarget, setProteinTarget] = useState(user?.proteinTarget || 100);
  const [aiMode, setAiMode] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const BOTTOM_BAR_HEIGHT = Spacing.buttonHeight + Spacing.md * 2;
  const toggleDiet = (dietId: string) => {
    setSelectedDiets(prev =>
      prev.includes(dietId)
        ? prev.filter(d => d !== dietId)
        : [...prev, dietId]
    );
  };

  const handleAiToggle = async () => {
    if (!isPro) {
      router.push("/SubscriptionScreen");
      return;
    }

    if (!aiMode) {
      // Turning ON
      setLoadingAi(true);
      try {
        const result = await calculateDynamicGoals({
          age: user?.age,
          gender: user?.gender,
          weight: user?.weight,
          height: user?.height,
          activityLevel: user?.activityLevel,
          goal: selectedGoal
        });

        if (result && result.protein) {
          // Assuming result.protein is a percentage, convert to grams roughly or direct value if service changes
          // For now, let's map percentage to a rough gram value based on 2000 kcal for simplicity
          // or just take the raw number if the prompt return grams. 
          // The prompt returns percentage. Let's assume 2000kcal * (protein/100) / 4
          const calculatedProtein = Math.round((2000 * (result.protein / 100)) / 4);
          setProteinTarget(calculatedProtein);
          Alert.alert("AI Coach", `Based on your stats, we've set your protein target to ${calculatedProtein}g. Reason: ${result.reasoning}`);
        }
        setAiMode(true);
      } catch (error) {
        Alert.alert("Error", "Failed to calculate AI goals. Please try again.");
      } finally {
        setLoadingAi(false);
      }
    } else {
      setAiMode(false);
    }
  };

  const handleSave = async () => {
    await updateUser({
      goal: selectedGoal,
      dietTypes: selectedDiets,
      proteinTarget,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.lg + 10,
          paddingBottom: BOTTOM_BAR_HEIGHT + insets.bottom,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* AI COACH SECTION */}
        <Pressable
          onPress={handleAiToggle}
          style={[styles.aiCard, { backgroundColor: isDark ? Colors.dark.card : Colors.light.card }]}
        >
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={24} color={Colors.light.primary} />
            <View style={styles.aiText}>
              <ThemedText type="h4">AI Adaptive Coach</ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>{isPro ? "Enabled" : "Upgrade to Pro"}</ThemedText>
            </View>
            {loadingAi ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <View style={[styles.toggle, aiMode && styles.toggleActive]}>
                <View style={[styles.toggleCircle, aiMode && styles.toggleCircleActive]} />
              </View>
            )}
          </View>
        </Pressable>

        <ThemedText style={styles.sectionTitle}>What&apos;s your goal?</ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Select your primary health objective
        </ThemedText>

        <View style={styles.goalsContainer}>
          {goals.map((goal) => (
            <Pressable
              key={goal.id}
              style={[
                styles.goalCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                selectedGoal === goal.id && { borderColor: Colors.light.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedGoal(goal.id)}
            >
              <View style={[styles.goalIcon, { backgroundColor: `${goal.color}20` }]}>
                <Feather name={goal.icon} size={24} color={goal.color} />
              </View>
              <View style={styles.goalInfo}>
                <ThemedText style={styles.goalTitle}>{goal.title}</ThemedText>
                <ThemedText style={[styles.goalDescription, { color: theme.textSecondary }]}>
                  {goal.description}
                </ThemedText>
              </View>
              <View style={[
                styles.radioOuter,
                { borderColor: selectedGoal === goal.id ? Colors.light.primary : theme.border }
              ]}>
                {selectedGoal === goal.id ? (
                  <View style={[styles.radioInner, { backgroundColor: Colors.light.primary }]} />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Dietary Preferences</ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Select any dietary restrictions or preferences
        </ThemedText>

        <View style={styles.dietGrid}>
          {dietTypes.map((diet) => (
            <Pressable
              key={diet.id}
              style={[
                styles.dietChip,
                { backgroundColor: theme.card, borderColor: theme.border },
                selectedDiets.includes(diet.id) && {
                  backgroundColor: `${Colors.light.primary}15`,
                  borderColor: Colors.light.primary,
                }
              ]}
              onPress={() => toggleDiet(diet.id)}
            >
              <View style={[
                styles.checkbox,
                { borderColor: selectedDiets.includes(diet.id) ? Colors.light.primary : theme.border },
                selectedDiets.includes(diet.id) && { backgroundColor: Colors.light.primary }
              ]}>
                {selectedDiets.includes(diet.id) ? (
                  <Feather name="check" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <ThemedText style={[
                styles.dietLabel,
                selectedDiets.includes(diet.id) && { color: Colors.light.primary }
              ]}>
                {diet.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Daily Protein Target</ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Set your daily protein goal in grams
        </ThemedText>

        <View style={[styles.sliderCard, { backgroundColor: theme.card }]}>
          <View style={styles.sliderHeader}>
            <ThemedText style={styles.sliderValue}>{proteinTarget}g</ThemedText>
          </View>
          <View style={styles.sliderContainer}>
            <Pressable
              style={[styles.sliderButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => setProteinTarget(Math.max(50, proteinTarget - 10))}
            >
              <Feather name="minus" size={20} color={theme.text} />
            </Pressable>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${((proteinTarget - 50) / 150) * 100}%`, backgroundColor: Colors.light.primary }
                ]}
              />
            </View>
            <Pressable
              style={[styles.sliderButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => setProteinTarget(Math.min(200, proteinTarget + 10))}
            >
              <Feather name="plus" size={20} color={theme.text} />
            </Pressable>
          </View>
          <View style={styles.sliderLabels}>
            <ThemedText style={[styles.sliderLabel, { color: theme.textSecondary }]}>50g</ThemedText>
            <ThemedText style={[styles.sliderLabel, { color: theme.textSecondary }]}>200g</ThemedText>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>Save Preferences</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.small,
    marginBottom: Spacing.lg,
  },
  goalsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.soft,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  goalInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  goalTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  goalDescription: {
    ...Typography.small,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dietGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  dietChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dietLabel: {
    ...Typography.smallMedium,
  },
  sliderCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  sliderHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sliderValue: {
    ...Typography.h2,
    color: Colors.light.primary,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 4,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing["4xl"],
  },
  sliderLabel: {
    ...Typography.caption,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  saveButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.soft,
  },
  saveButtonText: {
    ...Typography.button,
    color: "#FFFFFF",
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    ...Shadows.soft,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.light.primary,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  toggleCircleActive: {
    transform: [{ translateX: 16 }],
  },
});
