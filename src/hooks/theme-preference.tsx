import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

/**
 * Preferencia de tema del usuario.
 * - 'dark'   -> siempre oscuro (POR DEFECTO)
 * - 'light'  -> siempre claro
 * - 'system' -> sigue el tema del celular
 *
 * La pantalla de Ajustes (fase futura) llamará a setPreferencia().
 */
export type PreferenciaTema = 'dark' | 'light' | 'system';
export type EsquemaTema = 'dark' | 'light';

type ContextoTema = {
  preferencia: PreferenciaTema;
  setPreferencia: (valor: PreferenciaTema) => void;
  scheme: EsquemaTema;
};

const ThemePreferenceContext = createContext<ContextoTema>({
  preferencia: 'dark',
  setPreferencia: () => {},
  scheme: 'dark',
});

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>('dark');
  const sistema = useSystemColorScheme();

  const scheme: EsquemaTema =
    preferencia === 'system' ? (sistema === 'light' ? 'light' : 'dark') : preferencia;

  const valor = useMemo(() => ({ preferencia, setPreferencia, scheme }), [preferencia, scheme]);

  return <ThemePreferenceContext.Provider value={valor}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  return useContext(ThemePreferenceContext);
}

/** Devuelve el esquema YA resuelto: siempre 'dark' o 'light'. */
export function useColorScheme(): EsquemaTema {
  return useThemePreference().scheme;
}
