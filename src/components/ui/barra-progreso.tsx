import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Número entre 0 y 1 (0 = vacía, 1 = llena). */
  valor: number;
  style?: StyleProp<ViewStyle>;
};

/** Barra de progreso animada, estilo Duolingo (va arriba en el onboarding). */
export function BarraProgreso({ valor, style }: Props) {
  const theme = useTheme();
  const limitado = Math.min(Math.max(valor, 0), 1);
  const [anim] = useState(() => new Animated.Value(limitado));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: limitado,
      duration: 350,
      useNativeDriver: false, // animamos "width", que no soporta driver nativo
    }).start();
  }, [limitado, anim]);

  const ancho = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(limitado * 100) }}
      style={[styles.pista, { backgroundColor: theme.backgroundSelected }, style]}>
      <Animated.View style={[styles.relleno, { width: ancho, backgroundColor: theme.accent }]}>
        <View style={styles.brillo} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pista: {
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: 8,
  },
  brillo: {
    position: 'absolute',
    top: 4,
    left: 8,
    right: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
