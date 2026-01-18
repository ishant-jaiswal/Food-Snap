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

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (e: any) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        setError("Invalid email or password.");
      } else if (e.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError("Login failed. " + (e.message || "Please try again."));
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
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: Colors.light.primary }]}>
            <Feather name="heart" size={32} color="#FFFFFF" />
          </View>
        </View>

        <ThemedText style={styles.title}>Log In to Your Account</ThemedText>

        <View style={[styles.card, { backgroundColor: isDark ? theme.card : "#FFFFFF" }, Shadows.soft]}>
          {error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

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

          <Pressable style={styles.forgotPassword}>
            <ThemedText style={[styles.forgotPasswordText, { color: Colors.light.secondary }]}>
              Forgot Password?
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.loginButtonText}>Log In</ThemedText>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>OR</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              { backgroundColor: isDark ? theme.backgroundTertiary : "#FFFFFF", borderColor: theme.border, opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={() => googleLogin()}
          >
            <View style={styles.googleIcon}>
              <AntDesign name="google" size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            </View>
            <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
          </Pressable>
        </View>

        <View style={styles.signupPrompt}>
          <ThemedText style={{ color: theme.textSecondary }}>Don't have an account? </ThemedText>
          <Pressable onPress={() => navigation.navigate("Signup")}>
            <ThemedText style={[styles.signupLink, { color: Colors.light.primary }]}>Sign Up</ThemedText>
          </Pressable>
        </View>
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
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Typography.h2,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
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
    ...Typography.bodyMedium,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    ...Typography.smallMedium,
  },
  loginButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    ...Typography.button,
    color: "#FFFFFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing["2xl"],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    ...Typography.small,
  },
  googleButton: {
    flexDirection: "row",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
  },
  googleButtonText: {
    ...Typography.bodyMedium,
  },
  signupPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing["2xl"],
  },
  signupLink: {
    ...Typography.bodyMedium,
  },
});
