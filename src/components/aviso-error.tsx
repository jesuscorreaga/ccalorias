import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  mensaje: string;
  onCerrar: () => void;
};

/** Aviso de error visible en pantalla (igual en el navegador y en el celular). */
export function AvisoError({ mensaje, onCerrar }: Props) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.aviso,
        { backgroundColor: theme.backgroundElement, borderColor: theme.danger },
      ]}
    >
      <Text style={styles.emoji}>⚠️</Text>
      <ThemedText style={styles.texto}>{mensaje}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
        hitSlop={12}
        onPress={onCerrar}
      >
        <Text style={[styles.cerrar, { color: theme.textSecondary }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 20,
  },
  texto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  cerrar: {
    fontSize: 18,
    fontWeight: "700",
  },
});
