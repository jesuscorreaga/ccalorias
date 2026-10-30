import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  nombre: string;
  /** Gramos consumidos. null = todavía no hay datos de macros. */
  actual: number | null;
  /** Meta en gramos. */
  meta: number;
  color: string;
};

/** Barra horizontal delgada para un macronutriente. */
export function BarraMacro({ nombre, actual, meta, color }: Props) {
  const theme = useTheme();
  const progreso = actual && meta > 0 ? Math.min(actual / meta, 1) : 0;
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progreso,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progreso, anim]);

  const ancho = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={styles.contenedor}>
      <View style={styles.textos}>
        <ThemedText type="small" style={styles.nombre}>
          {nombre}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {`${actual === null ? "—" : Math.round(actual)} / ${meta} g`}
        </ThemedText>
      </View>
      <View style={[styles.pista, { backgroundColor: theme.backgroundSelected }]}>
        <Animated.View style={[styles.relleno, { width: ancho, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 4,
  },
  textos: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nombre: {
    fontWeight: "700",
  },
  pista: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  relleno: {
    height: "100%",
    borderRadius: 3,
  },
});
