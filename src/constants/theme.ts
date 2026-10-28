/**
 * Paleta de Ccalorias.
 * Paleta "Negro + magenta".
 * - El tema OSCURO es el principal (por defecto).
 * - El tema claro existe para que el usuario pueda cambiarlo en Ajustes.
 *
 * Para usar un color en cualquier componente:
 *   const theme = useTheme();
 *   <View style={{ backgroundColor: theme.backgroundElement }} />
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  dark: {
    // Fondos
    background: '#1C1B20', // fondo principal (carbón)
    backgroundElement: '#302831', // tarjetas, paneles, inputs
    backgroundSelected: '#3F3441', // elemento seleccionado / pista de barras
    border: '#463A48',

    // Texto
    text: '#FAF7FA',
    textSecondary: '#B5AAB4',

    // Marca
    primary: '#F05AB5', // magenta: títulos, enlaces, estado activo
    button: '#F05AB5', // botón de acción principal (CTA)
    buttonShadow: '#B03E86', // "borde 3D" inferior del botón
    onButton: '#1C1B20', // texto sobre el botón (oscuro para buen contraste)

    // Acentos
    accent: '#F05AB5', // calorías, progreso
    danger: '#FF6B6B', // alertas / te pasaste de la meta
  },
  light: {
    background: '#FAF7FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F4E6F1',
    border: '#E7D8E4',

    text: '#1C1B20',
    textSecondary: '#6E626D',

    primary: '#D63A9A', // magenta más oscuro para que se lea sobre fondo claro
    button: '#D63A9A',
    buttonShadow: '#A82578',
    onButton: '#FFFFFF',

    accent: '#D63A9A',
    danger: '#D32F2F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
