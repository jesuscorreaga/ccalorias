import { Platform, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MedidorCalorias } from "@/components/ui/medidor-calorias";
import { useTheme } from "@/hooks/use-theme";
import type { ResumenDiario } from "@/lib/api";

export function ResumenDia({ resumen }: { resumen: ResumenDiario | null }) {
  const theme = useTheme();

  if (!resumen) return null;

  const meta = resumen.meta_calorias_diaria;
  const restantes = resumen.calorias_restantes;
  const excedido = restantes < 0;

  return (
    <ThemedView style={styles.contenedor}>
      <View
        style={[
          styles.tarjeta,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}
      >
        <MedidorCalorias
          consumidas={resumen.calorias_consumidas}
          meta={meta}
          size={112}
        />
        <View style={styles.textos}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            HOY
          </ThemedText>
          <ThemedText
            type="subtitle"
            themeColor={excedido ? "danger" : "text"}
            style={styles.valor}
          >
            {excedido ? `+${Math.abs(restantes)}` : restantes} kcal
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {excedido ? "por encima de tu meta" : "te quedan"}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Meta: {meta} kcal
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === "web" ? 72 : 12,
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  valor: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
  },
});
