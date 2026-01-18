import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.secondary]}
            style={styles.logoGradient}
          >
            <Feather name="heart" size={64} color="#FFFFFF" />
          </LinearGradient>
        </View>
        
        <ThemedText style={styles.title}>Smart Diet Analyzer</ThemedText>
        <ThemedText style={styles.subtitle}>Your AI-powered diet companion</ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
          onPress={() => navigation.navigate("Signup")}
        >
          <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
        </Pressable>

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    ...Typography.h1,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    opacity: 0.7,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 400,
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  primaryButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    ...Typography.button,
    color: "#FFFFFF",
  },
  secondaryButton: {
    height: Spacing.buttonHeight,
    backgroundColor: "transparent",
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    ...Typography.button,
  },
});
