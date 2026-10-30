import "@/global.css";
import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    primary: "#2563EB",
    accent: "#3C87F7",
    border: "#D1D5DB",
    danger: "#DC2626",
    button: "#2563EB",
    buttonShadow: "#1D4ED8",
    onButton: "#FFFFFF",
    macroProteina: "#3B82F6",
    macroCarbos: "#F59E0B",
    macroGrasas: "#EC4899",
    agua: "#38BDF8",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    primary: "#60A5FA",
    accent: "#60A5FA",
    border: "#3F4147",
    danger: "#F87171",
    button: "#2563EB",
    buttonShadow: "#1D4ED8",
    onButton: "#FFFFFF",
    macroProteina: "#60A5FA",
    macroCarbos: "#FBBF24",
    macroGrasas: "#F472B6",
    agua: "#38BDF8",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

export const MaxContentWidth = 800;
