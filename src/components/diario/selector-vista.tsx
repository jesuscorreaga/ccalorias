import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

type Props<T extends string> = {
  opciones: { id: T; label: string }[];
  valor: T;
  onCambiar: (id: T) => void;
};

/** Selector de dos o más opciones (tipo pestañas pequeñas). */
export function SelectorVista<T extends string>({ opciones, valor, onCambiar }: Props<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.contenedor,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      {opciones.map((o) => {
        const activa = o.id === valor;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            onPress={() => onCambiar(o.id)}
            style={[styles.opcion, activa && { backgroundColor: theme.button }]}>
            <Text
              style={[
                styles.texto,
                { color: activa ? theme.onButton : theme.textSecondary },
              ]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  opcion: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  texto: {
    fontSize: 14,
    fontWeight: "700",
  },
});
