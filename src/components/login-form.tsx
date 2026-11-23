import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
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
import { login, loginConGoogle, registrar } from "@/lib/api";

WebBrowser.maybeCompleteAuthSession();

type Props = {
  onSuccess: () => void;
};

export function LoginForm({ onSuccess }: Props) {
  const theme = useTheme();

  const [modoRegistro, setModoRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  // Configuración de autenticación con Google
  const [googleRequest, , promptGoogle] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
  });

  // Inicio de sesión tradicional
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

  // Inicio de sesión con Google
  async function iniciarConGoogle() {
    if (cargando || !googleRequest) return;

    setError(null);
    setCargando(true);

    try {
      const resultado = await promptGoogle();

      if (resultado.type !== "success") {
        return;
      }

      const idToken = resultado.params.id_token;

      if (!idToken) {
        throw new Error("Google no devolvió un token de identificación");
      }

      await loginConGoogle(idToken);
      onSuccess();
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : "No se pudo iniciar sesión con Google";

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

        {/* Separador visual */}
        <View style={styles.separador}>
          <View style={[styles.linea, { backgroundColor: theme.border }]} />
          <Text style={{ color: theme.textSecondary }}>O</Text>
          <View style={[styles.linea, { backgroundColor: theme.border }]} />
        </View>

        {/* Botón de Google */}
        <Pressable
          onPress={iniciarConGoogle}
          disabled={!googleRequest || cargando}
          style={[
            styles.googleBoton,
            {
              borderColor: theme.border,
              opacity: !googleRequest || cargando ? 0.5 : 1,
            },
          ]}
        >
          <Text style={[styles.googleTexto, { color: theme.text }]}>
            Continuar con Google
          </Text>
        </Pressable>

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
  separador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  linea: {
    flex: 1,
    height: 1,
  },
  googleBoton: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  googleTexto: {
    fontSize: 16,
    fontWeight: "600",
  },
  enlace: {
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
});
