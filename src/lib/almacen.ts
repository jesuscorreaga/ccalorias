import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Guardado local sencillo (clave -> texto) para datos que viven solo en el
 * celular, como los vasos de agua. Las claves solo pueden tener letras,
 * números, "." "-" y "_".
 */
export async function leerLocal(clave: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") return localStorage.getItem(clave);
    return await SecureStore.getItemAsync(clave);
  } catch {
    return null;
  }
}

export async function guardarLocal(clave: string, valor: string) {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(clave, valor);
      return;
    }
    await SecureStore.setItemAsync(clave, valor);
  } catch {
    // Si falla el guardado, la app sigue funcionando sin persistir
  }
}
