import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useHousehold } from "../context/HouseholdContext";

export default function HouseholdScreen() {
  const { household } = useHousehold();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{household.name}</Text>
      <Text style={styles.sub}>Medlemmar</Text>
      {household.members.map(m => (
        <Text key={m.id} style={styles.member}>
          • {m.name}
        </Text>
      ))}
      <Text style={styles.note}>
        (Här kommer vi senare lägga till inlogg / dela hushållet / roller.)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: "600", marginBottom: 12 },
  sub: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  member: { fontSize: 16, marginBottom: 4 },
  note: { fontSize: 13, color: "#666", marginTop: 20 },
});
