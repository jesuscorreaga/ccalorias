import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BarraMacro } from "@/components/diario/barra-macro";
import { SelectorVista } from "@/components/diario/selector-vista";
import { TarjetaComida } from "@/components/diario/tarjeta-comida";
import { TarjetaRegistro } from "@/components/diario/tarjeta-registro";
import { TrackerAgua } from "@/components/diario/tracker-agua";
import { ThemedText } from "@/components/themed-text";
import { BotonGrande } from "@/components/ui/boton-grande";
import { MedidorCalorias } from "@/components/ui/medidor-calorias";
import { BottomTabInset } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { RegistroComida } from "@/lib/api";
import {
  COMIDAS,
  agruparPorComida,
  claveFecha,
  etiquetaDia,
  fechaCorta,
  gruposDeRegistros,
  inicioDelDia,
  kcalDe,
  metasMacros,
  mismoDia,
  obtenerRegistrosDia,
  sumarDias,
  totales,
} from "@/lib/diario";

type Props = {
  /** Meta diaria de calorías del usuario. */
  metaKcal: number;
  /** Abre la cámara para registrar una comida. */
  onAgregar: () => void;
  onCerrarSesion: () => void;
  onSesionExpirada: () => void;
};

type VistaLista = "comidas" | "recientes";

/**
 * Historial de comidas del día.
 * Barra superior con avatar y fecha, resumen del día (medidor + macros),
 * la lista de comidas (por tipo de comida o de la más reciente a la más
 * antigua), tracker de agua y botón para agregar comida.
 */
export function PantallaDiario({
  metaKcal,
  onAgregar,
  onCerrarSesion,
  onSesionExpirada,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [dia, setDia] = useState(() => inicioDelDia(new Date()));
  const [registros, setRegistros] = useState<RegistroComida[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);
  const [menu, setMenu] = useState(false);
  const [vistaLista, setVistaLista] = useState<VistaLista>("comidas");

  const hoy = inicioDelDia(new Date());
  const esHoy = mismoDia(dia, hoy);

  const primeraVez = useRef(true);
  const refrescoSilencioso = useRef(false);
  const ultimoDia = useRef("");

  // Al volver a esta pestaña (por ejemplo, después de tomar una foto):
  // vuelve a hoy y recarga los datos sin mostrar el spinner.
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      refrescoSilencioso.current = true;
      setDia((d) => {
        const h = inicioDelDia(new Date());
        return mismoDia(d, h) ? d : h;
      });
      setReintento((n) => n + 1);
    }, []),
  );

  useEffect(() => {
    let activo = true;
    const mismoDiaQueAntes = ultimoDia.current === claveFecha(dia);
    if (!(refrescoSilencioso.current && mismoDiaQueAntes)) setCargando(true);
    refrescoSilencioso.current = false;
    ultimoDia.current = claveFecha(dia);
    setError(null);
    obtenerRegistrosDia(dia)
      .then((datos) => {
        if (!activo) return;
        setRegistros(datos);
        setCargando(false);
      })
      .catch((e) => {
        if (!activo) return;
        if (e instanceof Error && e.message === "SESION_EXPIRADA") {
          onSesionExpirada();
          return;
        }
        setError(e instanceof Error ? e.message : "Algo salió mal");
        setCargando(false);
      });
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dia, reintento]);

  const grupos = useMemo(() => gruposDeRegistros(registros ?? []), [registros]);
  const porComida = useMemo(() => agruparPorComida(grupos), [grupos]);
  const total = useMemo(() => totales(grupos), [grupos]);
  const metas = metasMacros(metaKcal);
  const restantes = metaKcal - total.kcal;
  const excedido = restantes < 0;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.raiz, { backgroundColor: theme.background }]}>
      <View style={styles.columna}>
        <ScrollView contentContainerStyle={styles.contenido}>
          {/* ---------- Barra superior: avatar + fecha con flechas ---------- */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Menú de perfil"
              onPress={() => setMenu((m) => !m)}
              style={[
                styles.avatar,
                { backgroundColor: theme.backgroundElement, borderColor: theme.primary },
              ]}>
              <Text style={styles.avatarEmoji}>🙂</Text>
            </Pressable>

            <View style={styles.fecha}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Día anterior"
                hitSlop={12}
                onPress={() => setDia((d) => sumarDias(d, -1))}>
                <Text style={[styles.flecha, { color: theme.text }]}>‹</Text>
              </Pressable>

              <View style={styles.fechaTextos}>
                <ThemedText style={styles.fechaTitulo}>{etiquetaDia(dia, hoy)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {fechaCorta(dia)}
                </ThemedText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Día siguiente"
                disabled={esHoy}
                hitSlop={12}
                onPress={() => setDia((d) => sumarDias(d, 1))}>
                <Text
                  style={[
                    styles.flecha,
                    { color: theme.text, opacity: esHoy ? 0.25 : 1 },
                  ]}>
                  ›
                </Text>
              </Pressable>
            </View>

            <View style={styles.espaciador} />
          </View>

          {menu ? (
            <View
              style={[
                styles.menu,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <BotonGrande
                titulo="Cerrar sesión"
                variante="secundario"
                onPress={onCerrarSesion}
              />
            </View>
          ) : null}

          {/* ---------- Contenido ---------- */}
          {error ? (
            <View
              style={[
                styles.mensaje,
                { backgroundColor: theme.backgroundElement, borderColor: theme.danger },
              ]}>
              <Text style={styles.mensajeEmoji}>⚠️</Text>
              <ThemedText style={styles.mensajeTitulo}>No pudimos cargar tu diario</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.textoCentrado}>
                {error}
              </ThemedText>
              <BotonGrande
                titulo="Reintentar"
                variante="secundario"
                onPress={() => setReintento((n) => n + 1)}
                style={styles.botonMensaje}
              />
            </View>
          ) : cargando ? (
            <View style={styles.centrado}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <>
              {/* Resumen del día */}
              <View
                style={[
                  styles.tarjetaResumen,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  RESUMEN DEL DÍA
                </ThemedText>

                <MedidorCalorias consumidas={total.kcal} meta={metaKcal} size={220} detalle />

                <ThemedText
                  themeColor={excedido ? "danger" : "textSecondary"}
                  style={styles.textoCentrado}>
                  {excedido
                    ? `Te pasaste por ${Math.abs(Math.round(restantes))} kcal`
                    : `Te quedan ${Math.round(restantes)} kcal`}
                </ThemedText>

                <View style={styles.macros}>
                  <BarraMacro
                    nombre="Proteína"
                    actual={total.hayMacros ? total.proteina : null}
                    meta={metas.proteina}
                    color={theme.macroProteina}
                  />
                  <BarraMacro
                    nombre="Carbohidratos"
                    actual={total.hayMacros ? total.carbos : null}
                    meta={metas.carbos}
                    color={theme.macroCarbos}
                  />
                  <BarraMacro
                    nombre="Grasas"
                    actual={total.hayMacros ? total.grasas : null}
                    meta={metas.grasas}
                    color={theme.macroGrasas}
                  />
                  {!total.hayMacros && total.kcal > 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Los macros estarán disponibles pronto.
                    </ThemedText>
                  ) : null}
                </View>
              </View>

              {/* Lista de comidas */}
              {grupos.length === 0 ? (
                <View
                  style={[
                    styles.mensaje,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}>
                  <Text style={styles.mensajeEmoji}>🍽️</Text>
                  <ThemedText style={styles.mensajeTitulo}>
                    {esHoy
                      ? "Aún no has registrado comidas hoy"
                      : "No registraste comidas este día"}
                  </ThemedText>
                  {esHoy ? (
                    <ThemedText themeColor="textSecondary" style={styles.textoCentrado}>
                      Toma una foto de tu plato y aparecerá aquí.
                    </ThemedText>
                  ) : null}
                </View>
              ) : (
                <>
                  <SelectorVista<VistaLista>
                    opciones={[
                      { id: "comidas", label: "Por comida" },
                      { id: "recientes", label: "Más recientes" },
                    ]}
                    valor={vistaLista}
                    onCambiar={setVistaLista}
                  />

                  {vistaLista === "comidas"
                    ? COMIDAS.map((c) => (
                        <TarjetaComida
                          key={c.id}
                          emoji={c.emoji}
                          nombre={c.nombre}
                          grupos={porComida[c.id]}
                          kcal={kcalDe(porComida[c.id])}
                        />
                      ))
                    : grupos.map((g) => <TarjetaRegistro key={g.id} grupo={g} />)}
                </>
              )}

              {/* Agua */}
              <TrackerAgua key={claveFecha(dia)} fecha={dia} />
            </>
          )}
        </ScrollView>

        {/* ---------- Botón fijo abajo ---------- */}
        <View
          style={[
            styles.pie,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.border,
              paddingBottom: 16 + Math.max(insets.bottom, BottomTabInset),
            },
          ]}>
          {esHoy ? (
            <BotonGrande titulo="📷  Agregar comida" onPress={onAgregar} />
          ) : (
            <BotonGrande
              titulo="Volver a hoy"
              variante="secundario"
              onPress={() => setDia(inicioDelDia(new Date()))}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    alignItems: "center",
  },
  columna: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
  },
  contenido: {
    padding: 16,
    paddingTop: Platform.OS === "web" ? 72 : 8,
    paddingBottom: 24,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 22,
  },
  espaciador: {
    width: 44,
  },
  fecha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  fechaTextos: {
    alignItems: "center",
    minWidth: 84,
  },
  fechaTitulo: {
    fontWeight: "800",
    fontSize: 18,
    lineHeight: 22,
  },
  flecha: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "300",
  },
  menu: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  centrado: {
    alignItems: "center",
    paddingVertical: 48,
  },
  textoCentrado: {
    textAlign: "center",
  },
  mensaje: {
    alignItems: "center",
    gap: 8,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  mensajeEmoji: {
    fontSize: 32,
  },
  mensajeTitulo: {
    fontWeight: "700",
    fontSize: 17,
    textAlign: "center",
  },
  botonMensaje: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  tarjetaResumen: {
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
  },
  macros: {
    alignSelf: "stretch",
    gap: 12,
    marginTop: 8,
  },
  pie: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});