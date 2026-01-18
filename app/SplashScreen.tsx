import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  ZoomIn
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Animated.View
          entering={ZoomIn.duration(1000).springify()}
          style={styles.logoContainer}
        >
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.secondary]}
            style={styles.logoGradient}
          >
            <Feather name="heart" size={64} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(800).springify()}>
          <ThemedText style={styles.title}>Smart Diet Analyzer</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(800).springify()}>
          <ThemedText style={styles.subtitle}>Your AI-powered diet companion</ThemedText>
        </Animated.View>
      </View>

      <View style={styles.buttonContainer}>
        <Animated.View entering={FadeInDown.delay(800).duration(800).springify()} style={{ width: '100%' }}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={() => navigation.navigate("Signup")}
          >
            <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1000).duration(800).springify()} style={{ width: '100%' }}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={() => navigation.navigate("Login")}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: Colors.light.primary }]}>
              Login
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  content: {
    flex: 0.75,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: Spacing["3xl"],
  },
  logoGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    ...Typography.h1,
    textAlign: "center",
    marginBottom: Spacing.md,
    fontSize: 32,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    opacity: 0.7,
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 400,
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  primaryButton: {
    height: 56,
    width: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    ...Typography.button,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    width: '100%',
    backgroundColor: "transparent",
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    ...Typography.button,
    fontSize: 18,
    fontWeight: '600',
  },
});
