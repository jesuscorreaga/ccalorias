import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { login, registrar } from "@/lib/api";

type Props = { onSuccess: () => void };

export function LoginForm({ onSuccess }: Props) {
  const [modoRegistro, setModoRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    if (!email || !password) {
      Alert.alert("Faltan datos", "Ingresa tu email y contraseña");
      return;
    }
    setCargando(true);
    try {
      if (modoRegistro) {
        await registrar(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      onSuccess();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Algo salió mal");
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Ccalorias</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.boton} onPress={enviar} disabled={cargando}>
        {cargando ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.botonTexto}>
            {modoRegistro ? "Crear cuenta" : "Entrar"}
          </Text>
        )}
      </Pressable>

      <Pressable onPress={() => setModoRegistro(!modoRegistro)}>
        <Text style={styles.enlace}>
          {modoRegistro
            ? "¿Ya tienes cuenta? Inicia sesión"
            : "¿No tienes cuenta? Regístrate"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  boton: {
    backgroundColor: "#2f7de1",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  botonTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  enlace: {
    color: "#2f7de1",
    textAlign: "center",
    marginTop: 8,
  },
});
