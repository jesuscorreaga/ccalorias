import { StyleSheet, Text, View } from "react-native";

import { ListaAlimentos } from "@/components/diario/lista-alimentos";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { COMIDAS, type GrupoRegistro } from "@/lib/diario";

/** Una comida registrada (una foto): hora, alimentos y total de calorías. */
export function TarjetaRegistro({ grupo }: { grupo: GrupoRegistro }) {
  const theme = useTheme();
  const comida = COMIDAS.find((c) => c.id === grupo.comida);

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.cabecera}>
        <Text style={styles.emoji}>{comida?.emoji}</Text>
        <View style={styles.titulos}>
          <ThemedText style={styles.hora}>{grupo.hora}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {comida?.nombre}
          </ThemedText>
        </View>
        <ThemedText themeColor="accent" style={styles.kcal}>
          {`${Math.round(grupo.kcal)} kcal`}
        </ThemedText>
      </View>
      <ListaAlimentos alimentos={grupo.alimentos} />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emoji: {
    fontSize: 22,
  },
  titulos: {
    flex: 1,
  },
  hora: {
    fontWeight: "700",
    fontSize: 17,
  },
  kcal: {
    fontWeight: "700",
  },
});
