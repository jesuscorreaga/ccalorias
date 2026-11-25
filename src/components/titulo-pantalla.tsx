import { Platform, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";

/** Título de una pantalla (debe coincidir con el nombre de su pestaña). */
export function TituloPantalla({ texto }: { texto: string }) {
  return (
    <ThemedText type="subtitle" style={styles.titulo}>
      {texto}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    paddingHorizontal: 16,
    // En la web la barra de pestañas flota arriba y hay que dejarle espacio
    paddingTop: Platform.OS === "web" ? 72 : 8,
  },
});
