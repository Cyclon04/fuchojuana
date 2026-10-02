import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/Auth";
import { configs } from "../config";
import { colors, Icon, styles, Notice } from "./ui";
export function Shell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions(),
    wide = width > 950;
  const { user, signOut } = useAuth();
  const nav =
    useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const route = useRoute();
  const [error, setError] = useState("");
  const links = [
    { key: "Dashboard", label: "Resumen", icon: "grid" },
    ...Object.entries(configs)
      .filter(([key]) => key !== "users" || user?.role === "ADMIN")
      .map(([key, c]) => ({ key, label: c.title, icon: c.icon })),
  ];
  const items = links.map((l) => (
    <Pressable
      accessibilityRole="button"
      key={l.key}
      onPress={() => nav.navigate(l.key)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 13,
        borderRadius: 8,
        backgroundColor: route.name === l.key ? "#E9F1DF" : "transparent",
      }}
    >
      <Icon
        name={l.icon}
        size={18}
        color={route.name === l.key ? colors.green : colors.muted}
      />
      <Text
        style={{
          fontSize: 13,
          fontWeight: route.name === l.key ? "700" : "500",
          color: route.name === l.key ? colors.green : colors.muted,
        }}
      >
        {l.label}
      </Text>
    </Pressable>
  ));
  return (
    <View
      style={{
        flex: 1,
        flexDirection: wide ? "row" : "column",
        backgroundColor: colors.bg,
      }}
    >
      {wide && (
        <View
          style={{
            width: 230,
            backgroundColor: "white",
            borderRightWidth: 1,
            borderColor: colors.line,
            padding: 24,
            gap: 26,
          }}
        >
          <View style={[styles.row, { paddingVertical: 10 }]}>
            <View
              style={{
                backgroundColor: colors.green,
                borderRadius: 10,
                padding: 9,
              }}
            >
              <Icon name="hexagon" color="white" size={21} />
            </View>
            <Text
              style={{
                fontSize: 21,
                fontWeight: "800",
                letterSpacing: -1,
                color: colors.ink,
              }}
            >
              fuchojuana<Text style={{ color: colors.green }}>.</Text>
            </Text>
          </View>
          <Text style={styles.eyebrow}>TU CENTRO DE JUEGO</Text>
          <View style={{ gap: 5 }}>{items}</View>
          <View style={{ flex: 1 }} />
          <View
            style={{
              padding: 15,
              backgroundColor: colors.bg,
              borderRadius: 10,
              gap: 9,
            }}
          >
            <Icon name="map-pin" color={colors.green} />
            <Text
              style={{ fontSize: 12, fontWeight: "600", color: colors.ink }}
            >
              Hecho para la frontera.
            </Text>
            <Text style={{ fontSize: 11, lineHeight: 17, color: colors.muted }}>
              El fútbol de Tijuana, mejor organizado.
            </Text>
          </View>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: wide ? 38 : 20,
            height: 76,
            backgroundColor: "white",
            borderBottomWidth: 1,
            borderColor: colors.line,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {wide ? "Fuchojuana / " : "⚽ "}
            {route.name === "Dashboard"
              ? "Resumen"
              : configs[route.name as keyof typeof configs]?.title || "Detalle"}
          </Text>
          <View style={styles.row}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.lime,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "700", color: colors.green }}>
                {user?.name.slice(0, 1)}
              </Text>
            </View>
            <View>
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: colors.ink }}
              >
                {user?.name}
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted }}>
                {
                  {
                    ADMIN: "Administrador",
                    COACH: "Entrenador",
                    PLAYER: "Jugador",
                  }[user?.role || "PLAYER"]
                }
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Cerrar sesión"
              onPress={() => signOut().catch((e) => setError(e.message))}
            >
              <Icon name="log-out" size={17} />
            </Pressable>
          </View>
        </View>
        {!wide && (
          <ScrollView
            horizontal
            style={{ maxHeight: 58, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 6, gap: 4 }}
          >
            {items}
          </ScrollView>
        )}
        <ScrollView
          contentContainerStyle={{
            padding: wide ? 36 : 18,
            gap: 24,
            paddingBottom: 50,
            maxWidth: 1600,
            width: "100%",
            alignSelf: "center",
          }}
        >
          {error && <Notice text={error} error />}
          {children}
          <Text style={{ fontSize: 10, color: colors.muted, marginTop: 20 }}>
            FUCHOJUANA / TIJUANA, BAJA CALIFORNIA / {new Date().getFullYear()}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
