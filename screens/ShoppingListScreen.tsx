import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useShoppingList } from "../context/ShoppingListContext";

export default function ShoppingListScreen() {
  const { items, toggleItem } = useShoppingList();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Handlingslista</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, item.checked && styles.rowChecked]}
            onPress={() => toggleItem(item.name)}
          >
            <View style={styles.rowLeft}>
              <Text
                style={[
                  styles.itemName,
                  item.checked && styles.itemNameChecked,
                ]}
              >
                {item.name}
              </Text>
              <Text style={styles.qty}>{item.quantity}</Text>
            </View>
            <Text style={styles.status}>
              {item.checked ? "✅" : "⬜"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: "600", marginBottom: 12 },
  row: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowChecked: {
    opacity: 0.5,
  },
  rowLeft: {
    flexDirection: "column",
  },
  itemName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  itemNameChecked: { textDecorationLine: "line-through", color: "#888" },
  qty: { color: "#bbb", fontSize: 14 },
  status: { fontSize: 18 },
});
