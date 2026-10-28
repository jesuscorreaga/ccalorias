import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoginForm } from "@/components/login-form";
import { ResumenDia } from "@/components/resumen-dia";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BotonGrande } from "@/components/ui/boton-grande";
import { BottomTabInset } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  type AnalisisFoto,
  analizarFoto,
  borrarToken,
  obtenerResumenHoy,
  obtenerToken,
  type ResumenDiario,
} from "@/lib/api";

export default function HomeScreen() {
  const theme = useTheme();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisFoto | null>(null);
  const [cargando, setCargando] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [resumen, setResumen] = useState<ResumenDiario | null>(null);

  useEffect(() => {
    obtenerToken().then((token) => setAutenticado(!!token));
  }, []);

  async function cargarResumen() {
    try {
      setResumen(await obtenerResumenHoy());
    } catch (e) {
      if (e instanceof Error && e.message === "SESION_EXPIRADA") {
        setAutenticado(false);
      }
    }
  }

  useEffect(() => {
    if (autenticado) cargarResumen();
  }, [autenticado]);

  function reiniciar() {
    setPhotoUri(null);
    setAnalisis(null);
  }

  async function cerrarSesion() {
    await borrarToken();
    reiniciar();
    setResumen(null);
    setAutenticado(false);
  }

  async function takePicture() {
    if (!cameraRef.current || cargando) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
    if (!photo) return;

    setPhotoUri(photo.uri);
    setCargando(true);
    try {
      setAnalisis(await analizarFoto(photo.uri));
      cargarResumen();
    } catch (e) {
      reiniciar();
      if (e instanceof Error && e.message === "SESION_EXPIRADA") {
        setAutenticado(false);
      } else {
        Alert.alert("Error", e instanceof Error ? e.message : "Algo salió mal");
      }
    } finally {
      setCargando(false);
    }
  }

  const fondo = { backgroundColor: theme.background };

  if (autenticado === null) {
    return (
      <SafeAreaView style={[styles.centrado, fondo]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!autenticado) {
    return <LoginForm onSuccess={() => setAutenticado(true)} />;
  }

  if (!permission) {
    return <SafeAreaView style={[styles.container, fondo]} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.centrado, styles.padding, fondo]}>
        <ThemedText style={styles.centrarTexto}>
          Necesitamos tu cámara para analizar tus platos.
        </ThemedText>
        <BotonGrande
          titulo="Dar permiso de cámara"
          onPress={requestPermission}
        />
      </SafeAreaView>
    );
  }

  if (photoUri) {
    const sinComida =
      analisis && analisis.alimentos.length === 0 && analisis.calorias_totales === 0;

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <Image
            source={{ uri: photoUri }}
            style={styles.preview}
            resizeMode="cover"
          />

          {cargando ? (
            <View style={[styles.centrado, fondo]}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText>Analizando tu plato...</ThemedText>
            </View>
          ) : analisis ? (
            <ScrollView
              style={styles.container}
              contentContainerStyle={styles.resultado}
            >
              <ThemedText type="small" themeColor="textSecondary">
                Estimación aproximada
              </ThemedText>
              <ThemedText type="title" themeColor="accent">
                {analisis.calorias_totales} kcal
              </ThemedText>

              {sinComida ? (
                <ThemedText themeColor="textSecondary">
                  No detectamos comida en la foto. Intenta de nuevo con más luz
                  y enfocando el plato.
                </ThemedText>
              ) : null}

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
                    {a.calorias} kcal
                  </ThemedText>
                </View>
              ))}

              <BotonGrande titulo="Tomar otra foto" onPress={reiniciar} />
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, fondo]}>
      <ResumenDia resumen={resumen} />
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <SafeAreaView
        style={[
          styles.buttonRow,
          { backgroundColor: theme.background, borderTopColor: theme.border },
        ]}
      >
        <BotonGrande
          titulo="Tomar foto"
          onPress={takePicture}
          style={styles.botonFoto}
        />
        <BotonGrande
          titulo="Salir"
          variante="secundario"
          onPress={cerrarSesion}
          style={styles.botonSalir}
        />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  padding: {
    paddingHorizontal: 24,
  },
  centrarTexto: {
    textAlign: "center",
  },
  camera: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  botonFoto: {
    flex: 2,
  },
  botonSalir: {
    flex: 1,
  },
  preview: {
    width: "100%",
    height: 220,
  },
  resultado: {
    padding: 16,
    gap: 12,
    paddingBottom: BottomTabInset + 24,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
