import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  titulo: string;
  descripcion?: string;
  /** Un emoji o texto corto que se muestra a la izquierda. */
  emoji?: string;
  seleccionada: boolean;
  onPress: () => void;
};

/** Tarjeta para elegir una opción (ej. "Bajar de peso"). */
export function TarjetaOpcion({ titulo, descripcion, emoji, seleccionada, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionada }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: seleccionada ? theme.primary + '26' : theme.backgroundElement,
          borderColor: seleccionada ? theme.primary : theme.border,
        },
        pressed ? styles.presionado : styles.normal,
      ]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}

      <View style={styles.textos}>
        <ThemedText type="default" style={styles.titulo}>
          {titulo}
        </ThemedText>
        {descripcion ? (
          <ThemedText type="small" themeColor="textSecondary">
            {descripcion}
          </ThemedText>
        ) : null}
      </View>

      <View
        style={[
          styles.radio,
          {
            borderColor: seleccionada ? theme.accent : theme.border,
            backgroundColor: seleccionada ? theme.accent : 'transparent',
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  normal: {
    borderBottomWidth: 4,
    marginBottom: 2,
  },
  presionado: {
    borderBottomWidth: 2,
    marginTop: 2,
  },
  emoji: {
    fontSize: 28,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontWeight: '700',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
});
