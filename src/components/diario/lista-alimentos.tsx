import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { AlimentoConMacros } from "@/lib/diario";

/** Lista de alimentos de un registro: nombre, cantidad y calorías de cada uno. */
export function ListaAlimentos({ alimentos }: { alimentos: AlimentoConMacros[] }) {
  return (
    <View style={styles.lista}>
      {alimentos.map((a, i) => (
        <View key={i} style={styles.fila}>
          <View style={styles.texto}>
            <ThemedText style={styles.nombre}>{a.nombre}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {a.cantidad_estimada}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {`${Math.round(a.calorias)} kcal`}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: 10,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  texto: {
    flex: 1,
  },
  nombre: {
    fontWeight: "600",
  },
});
