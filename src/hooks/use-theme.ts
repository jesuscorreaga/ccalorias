import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Devuelve los colores del tema activo (oscuro por defecto). */
export function useTheme() {
  const scheme = useColorScheme();
  return Colors[scheme];
}
