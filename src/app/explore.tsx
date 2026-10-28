import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BotonGrande } from '@/components/ui/boton-grande';
import { PantallaPregunta } from '@/components/ui/pantalla-pregunta';
import { TarjetaOpcion } from '@/components/ui/tarjeta-opcion';
import { BottomTabInset } from '@/constants/theme';
import { useThemePreference } from '@/hooks/theme-preference';

/**
 * PANTALLA TEMPORAL: catálogo para ver y probar los componentes base.
 * Más adelante esta pestaña se reemplaza por "Historial".
 */

const TOTAL_PASOS = 8;

const OBJETIVOS = [
  { id: 'bajar', emoji: '🔥', titulo: 'Bajar de peso', descripcion: 'Quiero perder grasa' },
  { id: 'mantener', emoji: '⚖️', titulo: 'Mantener mi peso', descripcion: 'Quiero comer balanceado' },
  { id: 'subir', emoji: '💪', titulo: 'Subir de peso', descripcion: 'Quiero ganar masa muscular' },
];

export default function CatalogoScreen() {
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [paso, setPaso] = useState(2);
  const { preferencia, setPreferencia } = useThemePreference();

  return (
    <PantallaPregunta
      progreso={paso / TOTAL_PASOS}
      titulo="¿Cuál es tu objetivo?"
      subtitulo="Así personalizamos tu meta diaria de calorías."
      onContinuar={() => setPaso((p) => (p >= TOTAL_PASOS ? 1 : p + 1))}
      onAtras={() => setPaso((p) => Math.max(1, p - 1))}
      botonDeshabilitado={!objetivo}
      insetInferior={BottomTabInset}>
      {OBJETIVOS.map((o) => (
        <TarjetaOpcion
          key={o.id}
          emoji={o.emoji}
          titulo={o.titulo}
          descripcion={o.descripcion}
          seleccionada={objetivo === o.id}
          onPress={() => setObjetivo(o.id)}
        />
      ))}

      <View style={styles.bloque}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          PRUEBA DE TEMA (esto irá en Ajustes)
        </ThemedText>
        <View style={styles.fila}>
          <BotonGrande
            titulo="Oscuro"
            variante={preferencia === 'dark' ? 'primario' : 'secundario'}
            onPress={() => setPreferencia('dark')}
            style={styles.mitad}
          />
          <BotonGrande
            titulo="Claro"
            variante={preferencia === 'light' ? 'primario' : 'secundario'}
            onPress={() => setPreferencia('light')}
            style={styles.mitad}
          />
        </View>
      </View>
    </PantallaPregunta>
  );
}

const styles = StyleSheet.create({
  bloque: {
    marginTop: 16,
    gap: 8,
  },
  fila: {
    flexDirection: 'row',
    gap: 12,
  },
  mitad: {
    flex: 1,
  },
});
