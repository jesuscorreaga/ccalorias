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
  );
}

const styles = StyleSheet.create({
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
});
