import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
export const colors = {
  ink: "#172B24",
  muted: "#738178",
  green: "#22734E",
  lime: "#D5ED96",
  bg: "#F6F7F3",
  line: "#E4E8E0",
  white: "#FFFFFF",
  red: "#BC433F",
};
export function Icon({
  name,
  size = 20,
  color = colors.ink,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <Feather
      name={name as React.ComponentProps<typeof Feather>["name"]}
      size={size}
      color={color}
    />
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  icon?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: danger
            ? colors.red
            : secondary
              ? colors.white
              : colors.green,
          borderColor: secondary ? colors.line : "transparent",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon && (
        <Icon name={icon} size={16} color={secondary ? colors.ink : "white"} />
      )}
      <Text
        style={{
          fontWeight: "600",
          color: secondary ? colors.ink : "white",
          fontSize: 13,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Input({
  label,
  value,
  onChange,
  secure = false,
  placeholder,
  number = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  placeholder?: string;
  number?: boolean;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        placeholder={placeholder}
        placeholderTextColor="#929B94"
        autoCapitalize="none"
        keyboardType={number ? "numeric" : "default"}
        style={styles.input}
      />
    </View>
  );
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: error ? "#FCEDEB" : "#ECF5E5",
        padding: 13,
        borderRadius: 10,
      }}
    >
      <Text style={{ color: error ? colors.red : colors.green, fontSize: 13 }}>
        {text}
      </Text>
    </View>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 50 }}>
      <ActivityIndicator color={colors.green} />
    </View>
  );
}
export function Badge({ text }: { text: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: "#ECF2E8",
        borderRadius: 6,
      }}
    >
      <Text style={{ fontSize: 11, color: colors.green, fontWeight: "600" }}>
        {text}
      </Text>
    </View>
  );
}
export const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: { fontSize: 12, fontWeight: "600", color: colors.ink },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 14,
    backgroundColor: "white",
  },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 22,
  },
  h1: { fontSize: 30, fontWeight: "700", color: colors.ink, letterSpacing: -1 },
  h2: { fontSize: 18, fontWeight: "600", color: colors.ink },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.muted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
});
