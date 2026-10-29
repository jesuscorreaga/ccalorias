import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
} from "react-native";
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
  const router = useRouter();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisFoto | null>(null);
  const [cargando, setCargando] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [resumen, setResumen] = useState<ResumenDiario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const primerFoco = useRef(true);
  const yaPidioPermiso = useRef(false);

  // Cada vez que se abre esta pestaña revisa si hay sesión (por si se cerró o
  // venció desde el diario) y actualiza el resumen del día.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      const esPrimero = primerFoco.current;
      primerFoco.current = false;
      obtenerToken().then((token) => {
        if (!activo) return;
        setAutenticado(!!token);
        if (token && !esPrimero) cargarResumen();
      });
      return () => {
        activo = false;
      };
    }, []),
  );

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

  // Si falta el permiso de cámara, la app lo pide automáticamente (una vez).
  useEffect(() => {
    if (
      autenticado &&
      permission &&
      !permission.granted &&
      permission.canAskAgain &&
      !yaPidioPermiso.current
    ) {
      yaPidioPermiso.current = true;
      requestPermission();
    }
  }, [autenticado, permission, requestPermission]);

  function reiniciar() {
    setPhotoUri(null);
    setAnalisis(null);
  }

  function verDiario() {
    reiniciar();
    router.navigate("/explore");
  }

  async function cerrarSesion() {
    await borrarToken();
    reiniciar();
    setError(null);
    setResumen(null);
    setAutenticado(false);
  }

  async function takePicture() {
    if (!cameraRef.current || cargando) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
    if (!photo) return;

    setError(null);
    setPhotoUri(photo.uri);
    setCargando(true);
    try {
      const resultado = await analizarFoto(photo.uri);
      // Actualiza el resumen antes de mostrar el resultado, así el medidor
      // del día ya incluye esta comida.
      await cargarResumen();
      setAnalisis(resultado);
    } catch (e) {
      reiniciar();
      if (e instanceof Error && e.message === "SESION_EXPIRADA") {
        setAutenticado(false);
      } else {
        const mensaje = e instanceof Error ? e.message : "Algo salió mal";
        setError(mensaje);
        Alert.alert("Error", mensaje);
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
          {permission.canAskAgain
            ? "Necesitamos tu cámara para analizar tus platos."
            : "El permiso de cámara está desactivado. Actívalo en los ajustes para poder analizar tus platos."}
        </ThemedText>
        {permission.canAskAgain ? (
          <BotonGrande
            titulo="Dar permiso de cámara"
            onPress={requestPermission}
          />
        ) : Platform.OS !== "web" ? (
          <BotonGrande
            titulo="Abrir ajustes"
            onPress={() => Linking.openSettings()}
          />
        ) : null}
      </SafeAreaView>
    );
  }

  // Resultados (después de tomar la foto)
  if (photoUri) {
    return (
      <PantallaResultado
        fotoUri={photoUri}
        analisis={analisis}
        cargando={cargando}
        resumen={resumen}
        onNuevaFoto={reiniciar}
        onVerDiario={verDiario}
      />
    );
  }

  // Cámara
  return (
    <SafeAreaView style={[styles.container, fondo]}>
      <ResumenDia resumen={resumen} />
      {error ? (
        <ThemedText themeColor="danger" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
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
  error: {
    textAlign: "center",
    padding: 8,
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
