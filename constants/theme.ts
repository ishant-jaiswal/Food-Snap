import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#111811",
    textSecondary: "#757575",
    buttonText: "#FFFFFF",
    tabIconDefault: "#757575",
    tabIconSelected: "#4CAF50",
    link: "#2196F3",
    primary: "#4CAF50",
    secondary: "#2196F3",
    accent: "#FFC107",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F5F5F5",
    backgroundSecondary: "#FAFAFA",
    backgroundTertiary: "#E6E6E6",
    card: "#FFFFFF",
    cardSecondary: "#F5F5F5",
    border: "#dbe6db",
    borderSecondary: "#BDBDBD",
    success: "#4CAF50",
    warning: "#FFC107",
    error: "#F44336",
    orange: "#FF9800",
    blue: "#2196F3",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#BDBDBD",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#4CAF50",
    link: "#2196F3",
    primary: "#4CAF50",
    secondary: "#2196F3",
    accent: "#FFC107",
    backgroundRoot: "#121212",
    backgroundDefault: "#1a1a1a",
    backgroundSecondary: "#0f2310",
    backgroundTertiary: "#1E1E1E",
    card: "#1E1E1E",
    cardSecondary: "#2a2a2a",
    border: "#424242",
    borderSecondary: "#757575",
    success: "#4CAF50",
    warning: "#FFC107",
    error: "#F44336",
    orange: "#FF9800",
    blue: "#2196F3",
  },
  premium: {
    primary: "#D4AF37", // Metallic Gold
    secondary: "#FFD700", // Bright Gold
    accent: "#B8860B", // Dark Goldenrod
    tabIconSelected: "#D4AF37",
    backgroundRoot: "#000000", // Deep Black for maximum contrast
    card: "#1C1C1C",
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 56,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  smallMedium: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  captionMedium: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  button: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.015,
  },
  link: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
};

export const Shadows = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
    display: "system-ui",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
    display: "normal",
  },
  web: {
    sans: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    display: "Montserrat, system-ui, sans-serif",
  },
});
