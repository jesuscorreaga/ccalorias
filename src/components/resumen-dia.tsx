import { Platform, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MedidorCalorias } from "@/components/ui/medidor-calorias";
import type { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { ResumenDiario } from "@/lib/api";

function Fila({
  etiqueta,
  valor,
  color = "text",
}: {
  etiqueta: string;
  valor: string;
  color?: ThemeColor;
}) {
  return (
    <View style={styles.fila}>
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText type="small" themeColor={color} style={styles.valor}>
        {valor}
      </ThemedText>
    </View>
  );
}

/** Resumen del día en el inicio: medidor + consumidas, meta y restantes. */
export function ResumenDia({ resumen }: { resumen: ResumenDiario | null }) {
  const theme = useTheme();

  if (!resumen) return null;

  const meta = resumen.meta_calorias_diaria;
  const consumidas = resumen.calorias_consumidas;
  const restantes = resumen.calorias_restantes;
  const excedido = restantes < 0;
  const porcentaje = meta > 0 ? Math.round((consumidas / meta) * 100) : 0;

  return (
    <ThemedView style={styles.contenedor}>
      <View
        style={[
          styles.tarjeta,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: excedido ? theme.danger : theme.border,
          },
        ]}
      >
        <MedidorCalorias consumidas={consumidas} meta={meta} size={112} />

        <View style={styles.textos}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {`HOY · ${porcentaje}% DE TU META`}
          </ThemedText>
          <Fila etiqueta="Consumidas" valor={`${consumidas} kcal`} />
          <Fila etiqueta="Meta" valor={`${meta} kcal`} />
          <Fila
            etiqueta={excedido ? "Excedido" : "Restantes"}
            valor={`${Math.abs(restantes)} kcal`}
            color={excedido ? "danger" : "accent"}
          />
          {excedido ? (
            <ThemedText type="smallBold" themeColor="danger">
              ⚠️ Te pasaste de tu meta
            </ThemedText>
          ) : null}
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
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  valor: {
    fontWeight: "700",
  },
});
