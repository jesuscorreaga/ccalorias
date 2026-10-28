<<<<<<< HEAD
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
=======
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset } from "@/constants/theme";
import { obtenerRegistrosHoy, type RegistroComida } from "@/lib/api";

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistorialScreen() {
  const [registros, setRegistros] = useState<RegistroComida[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setError(null);
      obtenerRegistrosHoy()
        .then((datos) => {
          if (activo) setRegistros(datos);
        })
        .catch((e) => {
          if (!activo) return;
          if (e instanceof Error && e.message === "SESION_EXPIRADA") {
            setError("Tu sesión venció. Vuelve a Home e inicia sesión.");
          } else {
            setError(e instanceof Error ? e.message : "Algo salió mal");
          }
        });
      return () => {
        activo = false;
      };
    }, []),
  );

  const total =
    registros?.reduce((suma, r) => suma + r.calorias_estimadas, 0) ?? 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.contenido}>
          <ThemedText type="title">Comidas de hoy</ThemedText>

          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

          {!error && registros === null ? (
            <ActivityIndicator size="large" />
          ) : null}

          {registros && registros.length === 0 ? (
            <ThemedText>
              Aún no has registrado comidas hoy. Toma una foto en Home para
              empezar.
            </ThemedText>
          ) : null}

          {registros && registros.length > 0 ? (
            <>
              <ThemedText type="small">
                {registros.length}{" "}
                {registros.length === 1 ? "comida" : "comidas"} · {total} kcal
              </ThemedText>

              {registros.map((r) => (
                <ThemedView
                  key={r.id}
                  type="backgroundElement"
                  style={styles.tarjeta}
                >
                  <View style={styles.filaTexto}>
                    <ThemedText type="small">{hora(r.fecha_hora)}</ThemedText>
                    <ThemedText>
                      {r.alimentos_detectados.map((a) => a.nombre).join(", ")}
                    </ThemedText>
                  </View>
                  <ThemedText>{r.calorias_estimadas} kcal</ThemedText>
                </ThemedView>
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
>>>>>>> origin/main
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
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
=======
  container: {
    flex: 1,
  },
  contenido: {
    padding: 16,
    paddingTop: Platform.OS === "web" ? 72 : 16,
    paddingBottom: BottomTabInset + 24,
    gap: 12,
  },
  tarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  error: {
    color: "#d32f2f",
  },
>>>>>>> origin/main
});
