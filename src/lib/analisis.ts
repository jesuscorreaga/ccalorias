import { Platform } from "react-native";

import {
  API_URL,
  borrarToken,
  obtenerToken,
  type AnalisisFoto,
} from "@/lib/api";

/** El servidor puede mandar un mensaje propio cuando la foto no tiene comida. */
export type RespuestaAnalisis = AnalisisFoto & { mensaje?: string };

export const MENSAJE_SIN_COMIDA =
  "No detectamos comida en la foto. Intenta de nuevo con más luz y enfocando el plato.";

const MENSAJE_SIN_CONEXION = "No se pudo conectar con el servidor, revisa tu conexión";

// Analizar una foto puede tardar (Gemini), por eso el tiempo máximo es mayor
const TIEMPO_MAXIMO_MS = 45000;

/**
 * Sube la foto y devuelve el análisis.
 * Si el backend está apagado o no responde, lanza un error de conexión claro
 * (antes salía un texto técnico como "Failed to fetch").
 */
export async function analizarFoto(uri: string): Promise<RespuestaAnalisis> {
  const token = await obtenerToken();
  const url = `${API_URL}/analisis/foto`;
  const headers = { Authorization: `Bearer ${token}` };
  const formData = new FormData();
  const controller = new AbortController();
  const temporizador = setTimeout(() => controller.abort(), TIEMPO_MAXIMO_MS);
  let res: Response;

  try {
    if (Platform.OS === "web") {
      const blob = await (await fetch(uri)).blob();
      formData.append("foto", blob, "foto.jpg");
      res = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
      });
    } else {
      // En el celular hay que usar expo/fetch con un File de expo-file-system
      const { File } = await import("expo-file-system");
      const { fetch: expoFetch } = await import("expo/fetch");
      formData.append("foto", new File(uri) as unknown as Blob);
      res = (await expoFetch(url, {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
      })) as unknown as Response;
    }
  } catch {
    throw new Error(MENSAJE_SIN_CONEXION);
  } finally {
    clearTimeout(temporizador);
  }

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    await borrarToken();
    throw new Error("SESION_EXPIRADA");
  }
  if (!res.ok) {
    // Se muestra el mensaje que mande el servidor
    throw new Error(
      typeof data?.detail === "string" ? data.detail : "No se pudo analizar la foto",
    );
  }
  return data;
}
