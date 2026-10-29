import { type ComponentRef, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BotonGrande } from "@/components/ui/boton-grande";
import { useTheme } from "@/hooks/use-theme";
import { login, registrar } from "@/lib/api";

type Props = { onSuccess: () => void };

export function LoginForm({ onSuccess }: Props) {
  const theme = useTheme();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  async function enviar() {
    if (cargando) return;
    setError(null);
    if (!email || !password) {
      setError("Ingresa tu email y contraseña");
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
      const mensaje = e instanceof Error ? e.message : "Algo salió mal";
      setError(mensaje);
      Alert.alert("Error", mensaje);
    } finally {
      setCargando(false);
    }
  }

  const estiloInput = [
    styles.input,
    {
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
      color: theme.text,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.columna}>
        <Text style={[styles.titulo, { color: theme.primary }]}>Ccalorias</Text>

        <TextInput
          style={estiloInput}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextInput
          ref={passwordRef}
          style={estiloInput}
          placeholder="Contraseña"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          autoComplete={modoRegistro ? "new-password" : "current-password"}
          returnKeyType="go"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={enviar}
        />

        {error ? (
          <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
        ) : null}

        <BotonGrande
          titulo={modoRegistro ? "Crear cuenta" : "Entrar"}
          onPress={enviar}
          cargando={cargando}
          style={styles.boton}
        />

        <Pressable
          onPress={() => {
            setModoRegistro(!modoRegistro);
            setError(null);
          }}
        >
          <Text style={[styles.enlace, { color: theme.primary }]}>
            {modoRegistro
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  columna: {
    width: "100%",
    maxWidth: 420,
    gap: 12,
  },
  titulo: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  error: {
    textAlign: "center",
  },
  boton: {
    marginTop: 8,
  },
  enlace: {
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
});
