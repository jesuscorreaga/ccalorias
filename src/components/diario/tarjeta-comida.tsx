import { StyleSheet, Text, View } from "react-native";

import { ListaAlimentos } from "@/components/diario/lista-alimentos";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import type { GrupoRegistro } from "@/lib/diario";

type Props = {
  emoji: string;
  nombre: string;
  /** Registros de esta comida, el más reciente primero. */
  grupos: GrupoRegistro[];
  kcal: number;
};

/** Tarjeta de una comida del día (Desayuno, Almuerzo...) con su subtotal. */
export function TarjetaComida({ emoji, nombre, grupos, kcal }: Props) {
  const theme = useTheme();
  const vacia = grupos.length === 0;

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.cabecera}>
        <Text style={styles.emoji}>{emoji}</Text>
        <ThemedText style={styles.nombre}>{nombre}</ThemedText>
        <ThemedText themeColor={vacia ? "textSecondary" : "accent"} style={styles.kcal}>
          {`${Math.round(kcal)} kcal`}
        </ThemedText>
      </View>

      {vacia ? (
        <ThemedText type="small" themeColor="textSecondary">
          Sin registros
        </ThemedText>
      ) : (
        grupos.map((g, i) => (
          <View
            key={g.id}
            style={[
              styles.grupo,
              i > 0 && { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 },
            ]}>
            <View style={styles.horaFila}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {g.hora}
              </ThemedText>
              {g.alimentos.length > 1 ? (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {`${Math.round(g.kcal)} kcal`}
                </ThemedText>
              ) : null}
            </View>
            <ListaAlimentos alimentos={g.alimentos} />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emoji: {
    fontSize: 22,
  },
  nombre: {
    flex: 1,
    fontWeight: "700",
    fontSize: 17,
  },
  kcal: {
    fontWeight: "700",
  },
  grupo: {
    gap: 8,
  },
  horaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
