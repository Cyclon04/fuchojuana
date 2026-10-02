import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "../context/Auth";
import { Button, Input, Notice, colors, styles, Icon } from "../components/ui";
export function AuthScreen() {
  const { width } = useWindowDimensions(),
    { signIn } = useAuth();
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await signIn(
        email.trim().toLowerCase(),
        password,
        register ? name : undefined,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.bg }}>
      {width > 850 && (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.green,
            padding: 64,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "800", color: "white" }}>
            fuchojuana.
          </Text>
          <View style={{ gap: 25 }}>
            <Text
              style={{ color: colors.lime, letterSpacing: 3, fontSize: 11 }}
            >
              DE LA FRONTERA A LA CANCHA
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: 60,
                fontWeight: "700",
                letterSpacing: -3,
                lineHeight: 65,
              }}
            >
              Nuestro fútbol.{"\n"}Nuestra ciudad.
            </Text>
            <Text
              style={{
                color: "#DAE8D8",
                fontSize: 17,
                lineHeight: 27,
                maxWidth: 380,
              }}
            >
              El punto de encuentro de clubes, equipos y jugadores de Tijuana.
            </Text>
            <View
              style={{
                height: 110,
                borderWidth: 1,
                borderColor: "#5C9976",
                borderRadius: 4,
                marginTop: 25,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  height: 75,
                  width: 75,
                  borderWidth: 1,
                  borderRadius: 40,
                  borderColor: "#5C9976",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  height: "100%",
                  width: 1,
                  backgroundColor: "#5C9976",
                }}
              />
            </View>
          </View>
          <Text style={{ color: "#CDDFC6", fontSize: 11 }}>
            TIJUANA, B.C. · EL JUEGO EMPIEZA AQUÍ
          </Text>
        </View>
      )}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: width > 850 ? 70 : 28,
        }}
      >
        <View
          style={{ maxWidth: 410, width: "100%", alignSelf: "center", gap: 22 }}
        >
          <Icon name="hexagon" size={34} color={colors.green} />
          <Text style={styles.eyebrow}>BIENVENIDO A FUCHOJUANA</Text>
          <View style={{ gap: 8 }}>
            <Text style={styles.h1}>
              {register ? "Tu lugar en la cancha." : "De vuelta al juego."}
            </Text>
            <Text style={styles.muted}>
              {register
                ? "Crea tu cuenta de jugador para comenzar."
                : "Inicia sesión para gestionar tu comunidad futbolera."}
            </Text>
          </View>
          {error && <Notice text={error} error />}
          {register && (
            <Input label="Nombre completo" value={name} onChange={setName} />
          )}
          <Input
            label="Correo electrónico"
            value={email}
            onChange={setEmail}
            placeholder="tu@correo.com"
          />
          <Input
            label="Contraseña"
            value={password}
            onChange={setPassword}
            secure
            placeholder="Mínimo 10 caracteres"
          />
          <Button
            title={
              busy
                ? "Conectando…"
                : register
                  ? "Crear cuenta"
                  : "Entrar a Fuchojuana"
            }
            onPress={submit}
            disabled={
              busy ||
              !email ||
              password.length < 10 ||
              (register && name.length < 2)
            }
            icon="arrow-right"
          />
          <Pressable
            onPress={() => {
              setRegister(!register);
              setError("");
            }}
          >
            <Text
              style={{ textAlign: "center", fontSize: 13, color: colors.green }}
            >
              {register
                ? "¿Ya tienes cuenta? Inicia sesión"
                : "¿Primera vez aquí? Crea tu cuenta"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
