import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  titulo: string;
  onPress: () => void;
  /** 'primario' = morado (acción principal). 'secundario' = gris oscuro. */
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
  cargando?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Botón estilo Duolingo: grande, con borde inferior que simula relieve
 * y que se "hunde" al presionarlo.
 */
export function BotonGrande({
  titulo,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  cargando = false,
  style,
}: Props) {
  const theme = useTheme();
  const inactivo = deshabilitado || cargando;

  const colores = deshabilitado
    ? { fondo: theme.backgroundSelected, borde: theme.border, texto: theme.textSecondary }
    : variante === 'primario'
      ? { fondo: theme.button, borde: theme.buttonShadow, texto: theme.onButton }
      : { fondo: theme.backgroundElement, borde: theme.border, texto: theme.text };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: colores.fondo, borderBottomColor: colores.borde },
        pressed && !inactivo ? styles.presionado : styles.normal,
        style,
      ]}>
      {cargando ? (
        <ActivityIndicator color={colores.texto} />
      ) : (
        <Text style={[styles.texto, { color: colores.texto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // El alto total es el mismo en ambos estados: solo cambia el "relieve".
  normal: {
    borderBottomWidth: 4,
    marginBottom: 3,
  },
  presionado: {
    borderBottomWidth: 1,
    marginTop: 3,
  },
  texto: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
