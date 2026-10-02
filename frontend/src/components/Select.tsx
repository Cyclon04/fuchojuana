import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { colors, styles, Icon } from "./ui";
import type { Option } from "../types";
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(!open)}
        style={[styles.input, styles.row, { justifyContent: "space-between" }]}
      >
        <Text style={{ fontSize: 13, color: colors.ink }}>
          {options.find((o) => o.value === value)?.label || "Seleccionar…"}
        </Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={16} />
      </Pressable>
      {open && (
        <ScrollView
          nestedScrollEnabled
          style={{
            maxHeight: 180,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 8,
          }}
        >
          {options.length === 0 ? (
            <Text style={{ padding: 12, color: colors.muted }}>
              No hay opciones disponibles.
            </Text>
          ) : (
            options.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  padding: 12,
                  backgroundColor: value === o.value ? "#EDF4E5" : "white",
                  borderBottomWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <Text style={{ color: colors.ink, fontSize: 13 }}>
                  {o.label}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
