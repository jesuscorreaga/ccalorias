import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { guardarLocal, leerLocal } from "@/lib/almacen";
import { claveFecha } from "@/lib/diario";

const META_VASOS = 8;
const ML_POR_VASO = 250;

/**
 * Mini tracker de agua: toca un vaso para llenar hasta ahí; toca el último
 * vaso lleno para quitarlo. Se guarda en el celular, por día.
 * Usar con key={claveFecha(dia)} para que se reinicie al cambiar de día.
 */
export function TrackerAgua({ fecha }: { fecha: Date }) {
  const theme = useTheme();
  const clave = `agua_${claveFecha(fecha)}`;
  const [vasos, setVasos] = useState(0);

  useEffect(() => {
    let activo = true;
    leerLocal(clave).then((v) => {
      if (activo) setVasos(parseInt(v ?? "0", 10) || 0);
    });
    return () => {
      activo = false;
    };
  }, [clave]);

  function tocar(i: number) {
    const nuevo = vasos === i + 1 ? i : i + 1;
    setVasos(nuevo);
    guardarLocal(clave, String(nuevo));
  }

  const litros = ((vasos * ML_POR_VASO) / 1000).toFixed(2).replace(/\.?0+$/, "").replace(".", ",");

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.cabecera}>
        <Text style={styles.emoji}>💧</Text>
        <ThemedText style={styles.titulo}>Agua</ThemedText>
        <ThemedText themeColor={vasos > 0 ? "text" : "textSecondary"} style={styles.cuenta}>
          {`${litros} L · ${vasos}/${META_VASOS}`}
        </ThemedText>
      </View>

      <View style={styles.vasos}>
        {Array.from({ length: META_VASOS }, (_, i) => {
          const lleno = i < vasos;
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Vaso ${i + 1}`}
              accessibilityState={{ selected: lleno }}
              onPress={() => tocar(i)}
              style={[
                styles.vaso,
                {
                  backgroundColor: lleno ? theme.agua : theme.backgroundSelected,
                  borderColor: lleno ? theme.agua : theme.border,
                },
              ]}
            />
          );
        })}
      </View>
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
  titulo: {
    flex: 1,
    fontWeight: "700",
    fontSize: 17,
  },
  cuenta: {
    fontWeight: "700",
  },
  vasos: {
    flexDirection: "row",
    gap: 6,
  },
  vaso: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
  },
});
