
import { CircularProgress } from "@/components/CircularProgress";
import { ThemedText } from "@/components/ThemedText";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { analyzeFoodImage, FoodAnalysisResult } from "@/services/gemini";
import { Feather } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/* ---------------- TYPES ---------------- */
type PhotoOutputRouteProp = RouteProp<
  RootStackParamList,
  "PhotoOutput"
>;

/* ---------------- SCREEN ---------------- */
export default function PhotoOutputScreen() {
  const route = useRoute<PhotoOutputRouteProp>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); // Get user for diet preferences
  const [isLogged, setIsLogged] = useState(false);
  const { imageUri } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FoodAnalysisResult | null>(null);

  useEffect(() => {
    if (imageUri) {
      analyzeImage();
    }
  }, [imageUri]);

  const analyzeImage = async () => {
    try {
      setLoading(true);
      // Pass user's diet types to the analysis service
      const result = await analyzeFoodImage(imageUri as string, user?.dietTypes || []);

      if (!result.isFood) {
        Alert.alert(
          "Invalid Photo",
          "The uploaded photo does not appear to be food. Please upload a correct photo.",
          [
            { text: "OK", onPress: () => navigation.goBack() }
          ]
        );
        return;
      }

      setData(result);
    } catch (error) {
      Alert.alert("Error", "Failed to analyze image. Please try again.");
      console.error(error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = () => {
    setIsLogged(true);
    setTimeout(() => navigation.goBack(), 1200);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={{ marginTop: Spacing.md }}>Analyzing Food...</ThemedText>
      </View>
    );
  }

  if (!data) return null;

  // Use dynamic alternatives from data, fallback to empty array if none
  const alternatives = data.alternatives || [];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.backgroundRoot },
      ]}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing["3xl"],
        }}
      >
        {/* ---------------- RESULT CARD ---------------- */}
        <View
          style={[
            styles.resultCard,
            { backgroundColor: theme.card },
          ]}
        >
          <View style={styles.resultHeader}>
            <View
              style={[
                styles.foodImage,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%", borderRadius: BorderRadius.md }}
                  resizeMode="cover"
                />
              ) : (
                <Feather
                  name="image"
                  size={32}
                  color={Colors.light.primary}
                />
              )}
            </View>

            <View style={styles.resultInfo}>
              <ThemedText style={styles.foodName}>
                {data.name}
              </ThemedText>

              <ThemedText
                style={[
                  styles.servingSize,
                  { color: theme.textSecondary },
                ]}
              >
                {data.servingSize}
              </ThemedText>

              <View style={styles.confidenceBadge}>
                <Feather
                  name="check-circle"
                  size={14}
                  color={Colors.light.primary}
                />
                <ThemedText
                  style={[
                    styles.confidenceText,
                    { color: Colors.light.primary },
                  ]}
                >
                  {data.confidence}% confident
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* ---------------- MACROS ---------------- */}
        <View
          style={[
            styles.macrosCard,
            { backgroundColor: theme.card },
          ]}
        >
          <ThemedText style={styles.sectionTitle}>
            Nutrition Facts
          </ThemedText>

          <View style={styles.macrosGrid}>
            <View style={styles.macroItem}>
              <CircularProgress
                value={data.protein || 0}
                maxValue={50}
                size={80}
                strokeWidth={6}
                color={Colors.light.primary}
              >
                <ThemedText style={styles.macroValue}>
                  {data.protein || 0}g
                </ThemedText>
              </CircularProgress>
              <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Protein</ThemedText>
            </View>

            <View style={styles.macroItem}>
              <CircularProgress
                value={data.carbs || 0}
                maxValue={60}
                size={80}
                strokeWidth={6}
                color={Colors.light.secondary}
              >
                <ThemedText style={styles.macroValue}>
                  {data.carbs || 0}g
                </ThemedText>
              </CircularProgress>
              <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Carbs</ThemedText>
            </View>

            <View style={styles.macroItem}>
              <CircularProgress
                value={data.fats || 0}
                maxValue={30}
                size={80}
                strokeWidth={6}
                color={Colors.light.accent}
              >
                <ThemedText style={styles.macroValue}>
                  {data.fats || 0}g
                </ThemedText>
              </CircularProgress>
              <ThemedText style={[styles.macroLabel, { color: theme.textSecondary }]}>Fats</ThemedText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {data.calories}
              </ThemedText>
              <ThemedText
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                Calories
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{data.fiber}g</ThemedText>
              <ThemedText
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                Fiber
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{data.sugar}g</ThemedText>
              <ThemedText
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                Sugar
              </ThemedText>
            </View>
          </View>
        </View>

        {/* ---------------- INSIGHTS ---------------- */}
        <View style={styles.insightsSection}>
          <ThemedText style={styles.sectionTitle}>
            AI Insights
          </ThemedText>

          {data.insights?.map((item, index) => (
            <View
              key={index}
              style={[
                styles.insightCard,
                { backgroundColor: theme.card },
                item.type === "positive" && {
                  borderLeftColor: Colors.light.primary,
                },
                item.type === "info" && {
                  borderLeftColor: Colors.light.secondary,
                },
              ]}
            >
              <View style={styles.insightHeader}>
                <Feather
                  name={item.type === "positive" ? "check-circle" : "info"}
                  size={18}
                  color={item.type === "positive" ? Colors.light.primary : Colors.light.secondary}
                />
                <ThemedText style={styles.insightTitle}>
                  {item.title}
                </ThemedText>
              </View>

              <ThemedText
                style={[
                  styles.insightDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {item.description}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* ---------------- ALTERNATE FOODS ---------------- */}
        {alternatives.length > 0 && (
          <View style={styles.alternateSection}>
            <ThemedText style={styles.sectionTitle}>
              {user?.dietTypes?.length ? `Alternatives (${user.dietTypes[0]})` : "Healthier Alternatives"}
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alternateContainer}>
              {alternatives.map((food) => (
                <View key={food.id || food.name} style={[styles.alternateCard, { backgroundColor: theme.card }]}>
                  <View style={[styles.alternateIcon, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name={(food.image as any) || "activity"} size={24} color={Colors.light.primary} />
                  </View>
                  <ThemedText style={styles.alternateName}>{food.name}</ThemedText>
                  <View style={styles.alternateDetails}>
                    <ThemedText style={[styles.alternateProtein, { color: Colors.light.primary }]}>
                      {food.protein}g Protein
                    </ThemedText>
                    <ThemedText style={[styles.alternateCalories, { color: theme.textSecondary }]}>
                      {food.calories} cal
                    </ThemedText>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ---------------- ACTION BUTTONS ---------------- */}
        <Pressable
          style={[
            styles.logButton,
            isLogged && styles.logButtonSuccess,
          ]}
          onPress={handleLogMeal}
          disabled={isLogged}
        >
          <Feather
            name={isLogged ? "check" : "plus"}
            size={20}
            color="#FFF"
          />
          <ThemedText style={styles.logButtonText}>
            {isLogged
              ? "Logged Successfully!"
              : "Log This Meal"}
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.retakeButton,
            { borderColor: Colors.light.primary },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Feather
            name="camera"
            size={20}
            color={Colors.light.primary}
          />
          <ThemedText
            style={[
              styles.retakeButtonText,
              { color: Colors.light.primary },
            ]}
          >
            Retake Photo
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },

  resultCard: {
    marginTop: 40,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  resultInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  foodName: {
    ...Typography.h4,
    marginBottom: 4,
  },
  servingSize: {
    ...Typography.small,
    marginBottom: Spacing.sm,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  confidenceText: {
    ...Typography.smallMedium,
  },
  macrosCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.lg,
  },
  macrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  macroItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  macroValue: {
    ...Typography.smallMedium,
    fontWeight: "700",
  },
  macroLabel: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  statValue: {
    ...Typography.h4,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
  },
  insightsSection: {
    marginBottom: Spacing.xl,
  },
  insightCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    ...Shadows.soft,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  insightTitle: {
    ...Typography.bodyMedium,
  },
  insightDescription: {
    ...Typography.small,
    lineHeight: 20,
    marginLeft: 26,
  },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  logButtonSuccess: {
    backgroundColor: Colors.light.success,
  },
  logButtonText: {
    ...Typography.button,
    color: "#FFF",
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  retakeButtonText: {
    ...Typography.button,
  },
  alternateSection: {
    marginBottom: Spacing.xl,
  },
  alternateContainer: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  alternateCard: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.soft,
  },
  alternateIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  alternateName: {
    ...Typography.bodyMedium,
    marginBottom: 4,
  },
  alternateDetails: {
    marginTop: Spacing.xs,
  },
  alternateProtein: {
    ...Typography.smallMedium,
    fontWeight: "700",
  },
  alternateCalories: {
    ...Typography.caption,
  },
  insightsList: {
    // Keeping for compatibility if needed, but updated logic uses insightsSection
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm
  },
  insightContent: {
    flex: 1
  }
});
