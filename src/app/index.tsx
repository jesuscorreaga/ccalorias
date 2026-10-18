import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
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
import { BottomTabInset } from "@/constants/theme";
import {
  type AnalisisFoto,
  analizarFoto,
  obtenerResumenHoy,
  obtenerToken,
  type ResumenDiario,
} from "@/lib/api";

export default function HomeScreen() {
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

  if (autenticado === null) {
    return (
      <SafeAreaView style={styles.centrado}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!autenticado) {
    return <LoginForm onSuccess={() => setAutenticado(true)} />;
  }

  if (!permission) {
    return <SafeAreaView style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centrado}>
        <Button title="Dar permiso de cámara" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  if (photoUri) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <Image
            source={{ uri: photoUri }}
            style={styles.preview}
            resizeMode="cover"
          />

          {cargando ? (
            <View style={styles.centrado}>
              <ActivityIndicator size="large" />
              <ThemedText>Analizando tu plato...</ThemedText>
            </View>
          ) : analisis ? (
            <ScrollView
              style={styles.container}
              contentContainerStyle={styles.resultado}
            >
              <ThemedText type="small">Estimación aproximada</ThemedText>
              <ThemedText type="title">
                {analisis.calorias_totales} kcal
              </ThemedText>

              {analisis.alimentos.map((a, i) => (
                <View key={i} style={styles.fila}>
                  <View style={styles.filaTexto}>
                    <ThemedText>{a.nombre}</ThemedText>
                    <ThemedText type="small">{a.cantidad_estimada}</ThemedText>
                  </View>
                  <ThemedText>{a.calorias} kcal</ThemedText>
                </View>
              ))}

              <Button title="Tomar otra foto" onPress={reiniciar} />
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ResumenDia resumen={resumen} />
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <SafeAreaView style={styles.buttonRow}>
        <Button title="Tomar foto" onPress={takePicture} />
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
  camera: {
    flex: 1,
  },
  buttonRow: {
    padding: 16,
    backgroundColor: "black",
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
  },
  filaTexto: {
    flex: 1,
  },
});
