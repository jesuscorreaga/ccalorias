import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Button, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <SafeAreaView style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Button title="Dar permiso de cámara" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo?.uri ?? null);
    }
  }

  if (photoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <Button title="Tomar otra foto" onPress={() => setPhotoUri(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
  camera: {
    flex: 1,
  },
  buttonRow: {
    padding: 16,
    backgroundColor: "black",
  },
  preview: {
    flex: 1,
  },
});
