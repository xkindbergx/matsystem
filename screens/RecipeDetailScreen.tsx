import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRecipes } from "../context/RecipesContext";

export default function RecipeDetailScreen() {
  const { getRecipeById } = useRecipes();
  const recipe = getRecipeById("1"); // tillfälligt hårdkodat

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Recept hittades inte</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{recipe.title}</Text>

      <Text style={styles.subHeader}>Ingredienser</Text>
      {recipe.ingredients.map((ing, idx) => (
        <Text key={idx} style={styles.textLine}>
          • {ing.amount} {ing.item}
        </Text>
      ))}

      <Text style={styles.subHeader}>Steg</Text>
      {recipe.steps.map((step, idx) => (
        <Text key={idx} style={styles.textLine}>
          {idx + 1}. {step}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: "600", marginBottom: 16 },
  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  textLine: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },
});
