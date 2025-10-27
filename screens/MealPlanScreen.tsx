import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMealPlan } from "../context/MealPlanContext";
import { useRecipes } from "../context/RecipesContext";

const daysOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const labelMap: Record<string,string> = {
  Monday: "Måndag",
  Tuesday: "Tisdag",
  Wednesday: "Onsdag",
  Thursday: "Torsdag",
  Friday: "Fredag",
  Saturday: "Lördag",
  Sunday: "Söndag",
};

export default function MealPlanScreen() {
  const { mealPlan } = useMealPlan();
  const { getRecipeById } = useRecipes();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Veckomeny</Text>
      {daysOrder.map(day => {
        const slot = mealPlan[day] || {};
        const breakfast = slot.breakfast && getRecipeById(slot.breakfast)?.title;
        const lunch = slot.lunch && getRecipeById(slot.lunch)?.title;
        const dinner = slot.dinner && getRecipeById(slot.dinner)?.title;

        return (
          <View key={day} style={styles.dayBlock}>
            <Text style={styles.dayLabel}>{labelMap[day]}</Text>
            <Text style={styles.mealText}>Frukost: {breakfast || "-"}</Text>
            <Text style={styles.mealText}>Lunch: {lunch || "-"}</Text>
            <Text style={styles.mealText}>Middag: {dinner || "-"}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: "600", marginBottom: 12 },
  dayBlock: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dayLabel: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 6 },
  mealText: { color: "#ccc", marginBottom: 2 },
});
