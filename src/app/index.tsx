import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoginForm } from "@/components/login-form";
import { PantallaResultado } from "@/components/pantalla-resultado";
import { ResumenDia } from "@/components/resumen-dia";
import { ThemedText } from "@/components/themed-text";
import { BotonGrande } from "@/components/ui/boton-grande";
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

    // Al tomar la foto se pasa a la pantalla de resultados
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

  // ---- Pantalla 2: resultados (después de tomar la foto) ----
  if (photoUri) {
    return (
      <PantallaResultado
        fotoUri={photoUri}
        analisis={analisis}
        cargando={cargando}
        resumen={resumen}
        onNuevaFoto={reiniciar}
      />
    );
  }

  // ---- Pantalla 1: cámara ----
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
});
