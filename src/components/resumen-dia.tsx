import { Platform, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import type { ResumenDiario } from "@/lib/api";

export function ResumenDia({ resumen }: { resumen: ResumenDiario | null }) {
  const theme = useTheme();

  if (!resumen) return null;

  const meta = resumen.meta_calorias_diaria;
  const progreso =
    meta > 0 ? Math.min(resumen.calorias_consumidas / meta, 1) : 0;
  const excedido = resumen.calorias_restantes < 0;

  return (
    <ThemedView style={styles.contenedor}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        HOY
      </ThemedText>
      <ThemedText>
        <ThemedText
          themeColor={excedido ? "danger" : "accent"}
          style={styles.consumidas}
        >
          {resumen.calorias_consumidas}
        </ThemedText>{" "}
        / {meta} kcal
      </ThemedText>

      <View style={[styles.pista, { backgroundColor: theme.backgroundSelected }]}>
        <View
          style={[
            styles.relleno,
            {
              width: `${progreso * 100}%`,
              backgroundColor: excedido ? theme.danger : theme.accent,
            },
          ]}
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {excedido
          ? `Te pasaste por ${Math.abs(resumen.calorias_restantes)} kcal`
          : `Te quedan ${resumen.calorias_restantes} kcal`}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 16,
    paddingTop: Platform.OS === "web" ? 72 : 16,
    gap: 6,
  },
  consumidas: {
    fontWeight: "800",
  },
  pista: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  relleno: {
    height: "100%",
    borderRadius: 6,
  },
});
