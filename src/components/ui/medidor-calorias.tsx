import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

// El arco empieza abajo a la izquierda (135°) y da 270° en sentido horario,
// dejando una abertura abajo, como un velocímetro.
const INICIO = 135;
const BARRIDO = 270;

type Props = {
  consumidas: number;
  meta: number;
  /** Ancho del medidor en píxeles. */
  size?: number;
  /** Si es true, muestra "de X kcal" en el centro (para la versión grande). */
  detalle?: boolean;
};

function punto(cx: number, cy: number, r: number, grados: number) {
  const rad = (grados * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arco(cx: number, cy: number, r: number, inicio: number, barrido: number) {
  const a = punto(cx, cy, r, inicio);
  const b = punto(cx, cy, r, inicio + barrido);
  const grande = barrido > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${grande} 1 ${b.x} ${b.y}`;
}

/** Medidor circular tipo velocímetro para las calorías del día. */
export function MedidorCalorias({ consumidas, meta, size = 220, detalle = false }: Props) {
  const theme = useTheme();
  const [t, setT] = useState(0); // 0 -> 1: avance de la animación

  const objetivo = meta > 0 ? Math.min(Math.max(consumidas / meta, 0), 1) : 0;
  const excedido = meta > 0 && consumidas > meta;

  // Cada vez que cambian los datos, el medidor se llena con una animación.
  useEffect(() => {
    const anim = new Animated.Value(0);
    const id = anim.addListener(({ value }) => setT(value));
    Animated.timing(anim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => {
      anim.removeListener(id);
      anim.stopAnimation();
    };
  }, [consumidas, meta]);

  const trazo = Math.max(10, size * 0.075);
  const r = (size - trazo) / 2;
  const c = size / 2;
  const alto = c + r * Math.SQRT1_2 + trazo / 2; // se recorta el espacio vacío de abajo

  const barrido = BARRIDO * objetivo * t;
  const colorProgreso = excedido ? theme.danger : theme.accent;
  const mostradas = Math.round(consumidas * t);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${consumidas} de ${meta} kilocalorías`}
      style={{ width: size, height: alto }}>
      <Svg width={size} height={alto} viewBox={`0 0 ${size} ${alto}`}>
        <Path
          d={arco(c, c, r, INICIO, BARRIDO)}
          stroke={theme.backgroundSelected}
          strokeWidth={trazo}
          strokeLinecap="round"
          fill="none"
        />
        {barrido > 0.5 ? (
          <Path
            d={arco(c, c, r, INICIO, barrido)}
            stroke={colorProgreso}
            strokeWidth={trazo}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
      </Svg>

      <View pointerEvents="none" style={[styles.centro, { top: c - size * 0.16 }]}>
        <Text
          style={[
            styles.numero,
            { fontSize: size * 0.2, color: excedido ? theme.danger : theme.text },
          ]}>
          {mostradas}
        </Text>
        <Text style={{ fontSize: size * 0.065, color: theme.textSecondary }}>
          {detalle ? `de ${meta} kcal` : 'kcal'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  numero: {
    fontWeight: '800',
  },
});
