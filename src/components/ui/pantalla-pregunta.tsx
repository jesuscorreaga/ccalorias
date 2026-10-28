import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BarraProgreso } from '@/components/ui/barra-progreso';
import { BotonGrande } from '@/components/ui/boton-grande';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Progreso del onboarding, de 0 a 1. Ej: paso 2 de 8 -> 2 / 8 */
  progreso: number;
  titulo: string;
  subtitulo?: string;
  /** El contenido de la pregunta (tarjetas, inputs, etc.) */
  children: ReactNode;
  textoBoton?: string;
  onContinuar: () => void;
  botonDeshabilitado?: boolean;
  cargando?: boolean;
  /** Si se pasa, aparece una flecha para volver a la pregunta anterior. */
  onAtras?: () => void;
  /** Espacio extra abajo (útil si la pantalla vive dentro de las pestañas). */
  insetInferior?: number;
};

/**
 * Plantilla de pantalla de pregunta:
 * barra de progreso arriba, título, contenido y botón "Continuar" fijo abajo.
 */
export function PantallaPregunta({
  progreso,
  titulo,
  subtitulo,
  children,
  textoBoton = 'Continuar',
  onContinuar,
  botonDeshabilitado,
  cargando,
  onAtras,
  insetInferior = 0,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.raiz, { backgroundColor: theme.background }]}>
      <View style={styles.columna}>
        <View style={styles.cabecera}>
          {onAtras ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={12}
              onPress={onAtras}>
              <Text style={[styles.flecha, { color: theme.textSecondary }]}>←</Text>
            </Pressable>
          ) : null}
          <BarraProgreso valor={progreso} style={styles.barra} />
        </View>

        <ScrollView
          style={styles.cuerpo}
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.titulo}>
            {titulo}
          </ThemedText>
          {subtitulo ? <ThemedText themeColor="textSecondary">{subtitulo}</ThemedText> : null}
          <View style={styles.hijos}>{children}</View>
        </ScrollView>

        <View
          style={[
            styles.pie,
            {
              borderTopColor: theme.border,
              paddingBottom: Spacing.three + Math.max(insets.bottom, insetInferior),
            },
          ]}>
          <BotonGrande
            titulo={textoBoton}
            onPress={onContinuar}
            deshabilitado={botonDeshabilitado}
            cargando={cargando}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    alignItems: 'center', // centra la columna en pantallas anchas (web)
  },
  columna: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  flecha: {
    fontSize: 28,
    lineHeight: 28,
  },
  barra: {
    flex: 1,
  },
  cuerpo: {
    flex: 1,
  },
  contenido: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  titulo: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  hijos: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  pie: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
});
