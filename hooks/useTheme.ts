import { Colors } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useTheme() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const isDark = colorScheme === "dark";

  let theme = Colors[colorScheme ?? "light"];

  // Apply Premium Theme overrides if user is Pro
  // We apply this regardless of light/dark mode for branding uniqueness, 
  // or we could tweak specifically for dark mode.
  if (user?.isPro) {
    theme = {
      ...theme,
      ...Colors.premium,
      // Keep text/backgrounds legible by mixing or keeping original if check passes
      // For now, let's just override key brand colors
      primary: Colors.premium.primary,
      secondary: Colors.premium.secondary,
      accent: Colors.premium.accent,
      tabIconSelected: Colors.premium.tabIconSelected,
    };
  }

  return {
    theme,
    isDark,
  };
}
