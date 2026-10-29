import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, Keyframe } from "react-native-reanimated";

const DURATION = 300;

// Animación de escala del fondo
const keyframe = new Keyframe({
  0: {
    transform: [{ scale: 0 }],
  },
  60: {
    transform: [{ scale: 1.2 }],
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(1.2),
  },
});

// Animación de aparición del logo
const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
  },
  60: {
    transform: [{ scale: 1.2 }],
    opacity: 0,
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(1.2),
  },
});

// Animación del resplandor
const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: "-180deg" }, { scale: 0.8 }],
    opacity: 0,
  },
  [DURATION * 1000]: {
    transform: [{ rotateZ: "0deg" }, { scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(0.7),
  },
  100: {
    transform: [{ rotateZ: "7200deg" }],
  },
});

export function AnimatedSplashOverlay() {
  return null;
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      {/* Resplandor del logo */}
      <Animated.View
        entering={glowKeyframe.duration(60 * 1000 * 4)}
        style={styles.glow}
      >
        <Image
          style={styles.glow}
          source={require("../../assets/images/logo-glow.png")}
          contentFit="contain"
        />
      </Animated.View>

      {/* Fondo animado */}
      <Animated.View
        style={styles.background}
        entering={keyframe.duration(DURATION)}
      >
        <View style={styles.backgroundCircle} />
      </Animated.View>

      {/* Logo principal */}
      <Animated.View
        style={styles.imageContainer}
        entering={logoKeyframe.duration(DURATION)}
      >
        <Image
          style={styles.image}
          source={require("../../assets/images/expo-logo.png")}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 128,
    height: 128,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    width: 201,
    height: 201,
    position: "absolute",
  },
  image: {
    position: "absolute",
    width: 76,
    height: 71,
  },
  background: {
    width: 128,
    height: 128,
    position: "absolute",
  },
  backgroundCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 64,
    backgroundColor: "#4630EB",
  },
});
