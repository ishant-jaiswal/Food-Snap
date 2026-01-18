import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { signup, googleLogin } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signup(fullName, email, password);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Please log in.");
      } else if (e.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (e.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Signup failed. " + (e.message || "Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: Spacing.xl }
        ]}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Fresh & Informative</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Smart & Intuitive Food Analysis
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? theme.card : "#FFFFFF" }, Shadows.soft]}>
          <ThemedText style={styles.cardTitle}>Create your account</ThemedText>
          <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Join Fresh & Informative
          </ThemedText>

          {error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? theme.backgroundTertiary : "#FFFFFF", borderColor: theme.border }]}>
              <Feather name="user" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textSecondary}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? theme.backgroundTertiary : "#FFFFFF", borderColor: theme.border }]}>
              <Feather name="mail" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? theme.backgroundTertiary : "#FFFFFF", borderColor: theme.border }]}>
              <Feather name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? theme.backgroundTertiary : "#FFFFFF", borderColor: theme.border }]}>
              <Feather name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.signupButton,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.signupButtonText}>Sign Up</ThemedText>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>Or sign up with</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.socialButtons}>
            <Pressable
              onPress={() => googleLogin()}
              style={[styles.socialButton, { backgroundColor: isDark ? theme.backgroundTertiary : "#E5E5E5", justifyContent: 'center', alignItems: 'center' }]}>
              <AntDesign name="google" size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            </Pressable>
          </View>

          <View style={styles.loginPrompt}>
            <ThemedText style={{ color: theme.textSecondary }}>Already have an account? </ThemedText>
            <Pressable onPress={() => navigation.navigate("Login")}>
              <ThemedText style={[styles.loginLink, { color: Colors.light.secondary }]}>Log In</ThemedText>
            </Pressable>
          </View>
        </View>

        <ThemedText style={[styles.terms, { color: theme.textSecondary }]}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </ThemedText>
      </KeyboardAwareScrollViewCompat>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    ...Typography.h2,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    marginTop: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
  },
  cardTitle: {
    ...Typography.h4,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.small,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.light.error,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.smallMedium,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
  },
  eyeIcon: {
    padding: Spacing.sm,
  },
  signupButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  signupButtonText: {
    ...Typography.button,
    color: "#FFFFFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    ...Typography.small,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  loginLink: {
    ...Typography.bodyMedium,
  },
  terms: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing["2xl"],
  },
});
