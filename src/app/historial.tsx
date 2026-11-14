import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { PantallaDiario } from "@/components/diario/pantalla-diario";
import { useSesionEnFoco } from "@/hooks/use-sesion-en-foco";
import { borrarToken, obtenerResumenHoy } from "@/lib/api";

/**
 * Pestaña Historial: las comidas registradas, por día.
 * La cámara vive en la pestaña Inicio ("/").
 *
 * Si la sesión cambió (se cerró, venció o entró otro usuario), el historial se
 * reinicia por completo con `key`, y no se muestra nada hasta comprobarlo,
 * para no enseñar datos del usuario anterior.
 */
export default function HistorialScreen() {
  const { clave, listo } = useSesionEnFoco();

  return (
    <View
      style={[styles.raiz, { opacity: listo ? 1 : 0 }]}
      pointerEvents={listo ? "auto" : "none"}
    >
      <HistorialContenido key={clave} />
    </View>
  );
}

function HistorialContenido() {
  const router = useRouter();
  const [metaKcal, setMetaKcal] = useState(2000);

  // Trae la meta de calorías del usuario cada vez que se abre la pestaña
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      obtenerResumenHoy()
        .then((r) => {
          if (activo) setMetaKcal(r.meta_calorias_diaria);
        })
        .catch(() => {});
      return () => {
        activo = false;
      };
    }, []),
  );

  async function cerrarSesion() {
    await borrarToken();
    router.navigate("/"); // Inicio detecta que no hay sesión y muestra el login
  }

  return (
    <PantallaDiario
      metaKcal={metaKcal}
      onAgregar={() => router.navigate("/")}
      onCerrarSesion={cerrarSesion}
      onSesionExpirada={() => router.navigate("/")}
    />
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
});
