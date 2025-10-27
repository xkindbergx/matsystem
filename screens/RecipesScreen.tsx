import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRecipes } from "../context/RecipesContext";

export default function RecipesScreen() {
  const { recipes, addRecipe } = useRecipes();

  // Form-state
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");

  // Bild-state
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  async function handlePickImage() {
    // Be om rättighet om vi inte redan har
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permResult.status !== "granted") {
      // Om denied: vi gör inget hårt, vi kan lägga en enkel fallback
      alert("Du måste ge åtkomst till bilder för att kunna lägga till en bild.");
      return;
    }

    // Öppna bildgalleriet
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  }

  function handleAdd() {
    if (!title.trim()) {
      return;
    }

    // Ingredients som rad-separerad text
    const parsedIngredients = ingredientsText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const firstSpace = line.indexOf(" ");
        if (firstSpace === -1) {
          return { amount: "", item: line };
        }
        return {
          amount: line.slice(0, firstSpace),
          item: line.slice(firstSpace + 1),
        };
      });

    const parsedSteps = stepsText
      .split("\n")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    addRecipe({
      title,
      sourceUrl,
      imageUri, // här skickar vi med bilden
      ingredients: parsedIngredients,
      steps: parsedSteps,
    });

    // Töm formuläret
    setTitle("");
    setSourceUrl("");
    setIngredientsText("");
    setStepsText("");
    setImageUri(undefined);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Recept</Text>

        {/* FORM-KORT */}
        <View style={styles.formCard}>
          <Text style={styles.formHeader}>Lägg till nytt recept</Text>

          <Text style={styles.label}>Titel *</Text>
          <TextInput
            style={styles.input}
            placeholder="T.ex. Smash tacos"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Länk (TikTok / URL)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor="#666"
            value={sourceUrl}
            onChangeText={setSourceUrl}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Ingredienser (en rad per grej)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder={"500 g nötfärs\n1 påse tacokrydda\n1 pkt tortillabröd"}
            placeholderTextColor="#666"
            value={ingredientsText}
            onChangeText={setIngredientsText}
            multiline
          />

          <Text style={styles.label}>Steg (en rad per steg)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder={"Pressa färs på tortillan\nStek med ost\nToppa med sallad"}
            placeholderTextColor="#666"
            value={stepsText}
            onChangeText={setStepsText}
            multiline
          />

          {/* Bildval */}
          <Text style={styles.label}>Bild</Text>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.noImageBox}>
              <Text style={styles.noImageText}>Ingen bild vald</Text>
            </View>
          )}

          <TouchableOpacity style={styles.pickButton} onPress={handlePickImage}>
            <Text style={styles.pickButtonText}>Välj bild från mobilen</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Spara recept</Text>
          </TouchableOpacity>
        </View>

        {/* SPARADE RECEPT */}
        <Text style={styles.subHeader}>Sparade recept</Text>

        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>
                    {item.title.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}

              <Text style={styles.title}>{item.title}</Text>

              {item.sourceUrl ? (
                <Text style={styles.linkText}>{item.sourceUrl}</Text>
              ) : null}

              <Text style={styles.tags}>
                {item.tags && item.tags.length > 0
                  ? item.tags.join(" · ")
                  : "–"}
              </Text>
            </View>
          )}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#000" },
  header: { fontSize: 24, fontWeight: "600", color: "#fff", marginBottom: 12 },

  formCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  formHeader: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  label: {
    color: "#bbb",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 12,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },

  previewImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  noImageBox: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: { color: "#555", fontSize: 14 },

  pickButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#555",
  },
  pickButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },

  addButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  addButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },

  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeholderImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#555",
    fontSize: 48,
    fontWeight: "700",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600" },
  linkText: { color: "#4da6ff", fontSize: 13, marginTop: 4 },
  tags: { color: "#999", fontSize: 14, marginTop: 4 },
});