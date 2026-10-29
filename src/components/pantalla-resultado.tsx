import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BotonGrande } from "@/components/ui/boton-grande";
import { MedidorCalorias } from "@/components/ui/medidor-calorias";
import { BottomTabInset } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { AnalisisFoto, ResumenDiario } from "@/lib/api";

type Props = {
  fotoUri: string;
  analisis: AnalisisFoto | null;
  cargando: boolean;
  resumen: ResumenDiario | null;
  onNuevaFoto: () => void;
  /** Si se pasa, aparece el botón "Ver mi diario". */
  onVerDiario?: () => void;
};

/**
 * Pantalla de resultados: aparece después de tomar la foto.
 * Muestra la foto, las calorías de la comida, el medidor del día y los alimentos.
 */
export function PantallaResultado({
  fotoUri,
  analisis,
  cargando,
  resumen,
  onNuevaFoto,
  onVerDiario,
}: Props) {
  const theme = useTheme();

  const sinComida =
    !!analisis &&
    (analisis.contiene_comida === false ||
      (analisis.alimentos.length === 0 && analisis.calorias_totales === 0));

  const restantes = resumen?.calorias_restantes ?? 0;
  const excedido = restantes < 0;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.raiz, { backgroundColor: theme.background }]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
      >
        <View style={styles.columna}>
          <View style={styles.fotoWrap}>
            <Image source={{ uri: fotoUri }} style={styles.foto} resizeMode="cover" />
            {cargando ? (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.overlayTexto}>Analizando tu plato...</Text>
              </View>
            ) : null}
          </View>

          {!cargando && analisis ? (
            <>
              <View style={styles.bloque}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  ESTA COMIDA
                </ThemedText>
                <ThemedText type="title" themeColor="accent">
                  {Math.round(analisis.calorias_totales)} kcal
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Estimación aproximada
                </ThemedText>
              </View>

              {sinComida ? (
                <ThemedText themeColor="textSecondary">
                  No detectamos comida en la foto. Intenta de nuevo con más luz
                  y enfocando el plato.
                </ThemedText>
              ) : null}

              {resumen ? (
                <View
                  style={[
                    styles.tarjeta,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    TU DÍA
                  </ThemedText>
                  <MedidorCalorias
                    consumidas={resumen.calorias_consumidas}
                    meta={resumen.meta_calorias_diaria}
                    size={240}
                    detalle
                  />
                  <ThemedText
                    themeColor={excedido ? "danger" : "textSecondary"}
                    style={styles.centrado}
                  >
                    {excedido
                      ? `Te pasaste por ${Math.abs(restantes)} kcal`
                      : `Te quedan ${restantes} kcal`}
                  </ThemedText>
                </View>
              ) : null}

              {analisis.alimentos.length > 0 ? (
                <View style={styles.lista}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    LO QUE DETECTAMOS
                  </ThemedText>
                  {analisis.alimentos.map((a, i) => (
                    <View
                      key={i}
                      style={[
                        styles.fila,
                        {
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.filaTexto}>
                        <ThemedText style={styles.negrita}>{a.nombre}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {a.cantidad_estimada}
                        </ThemedText>
                      </View>
                      <ThemedText themeColor="accent" style={styles.negrita}>
                        {Math.round(a.calorias)} kcal
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}

              <BotonGrande titulo="Tomar otra foto" onPress={onNuevaFoto} />
              {onVerDiario ? (
                <BotonGrande
                  titulo="Ver mi diario"
                  variante="secundario"
                  onPress={onVerDiario}
                />
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    alignItems: "center",
    paddingTop: Platform.OS === "web" ? 72 : 12,
    paddingHorizontal: 16,
    paddingBottom: BottomTabInset + 24,
  },
  columna: {
    width: "100%",
    maxWidth: 560,
    gap: 16,
  },
  fotoWrap: {
    borderRadius: 24,
    overflow: "hidden",
  },
  foto: {
    width: "100%",
    height: 200,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(28,27,32,0.75)",
  },
  overlayTexto: {
    color: "#FAF7FA",
    fontSize: 16,
    fontWeight: "600",
  },
  bloque: {
    gap: 2,
  },
  tarjeta: {
    alignItems: "center",
    gap: 8,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  centrado: {
    textAlign: "center",
  },
  lista: {
    gap: 10,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  filaTexto: {
    flex: 1,
  },
  negrita: {
    fontWeight: "700",
  },
});
