import { Platform, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type { ResumenDiario } from "@/lib/api";

export function ResumenDia({ resumen }: { resumen: ResumenDiario | null }) {
  if (!resumen) return null;

  const meta = resumen.meta_calorias_diaria;
  const progreso =
    meta > 0 ? Math.min(resumen.calorias_consumidas / meta, 1) : 0;
  const excedido = resumen.calorias_restantes < 0;

  return (
    <ThemedView style={styles.contenedor}>
      <ThemedText type="small">Hoy</ThemedText>
      <ThemedText>
        {resumen.calorias_consumidas} / {meta} kcal
      </ThemedText>

      <View style={styles.pista}>
        <View
          style={[
            styles.relleno,
            {
              width: `${progreso * 100}%`,
              backgroundColor: excedido ? "#d32f2f" : "#2f7de1",
            },
          ]}
        />
      </View>

      <ThemedText type="small">
        {excedido
          ? `Te pasaste por ${Math.abs(resumen.calorias_restantes)} kcal`
          : `Te quedan ${resumen.calorias_restantes} kcal`}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 12,
    paddingTop: Platform.OS === "web" ? 72 : 12,
    gap: 6,
  },
  pista: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  relleno: {
    height: "100%",
    borderRadius: 4,
  },
});
