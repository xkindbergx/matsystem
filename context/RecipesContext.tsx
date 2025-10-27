import React, { createContext, useContext, useState } from "react";
import { Recipe } from "../types/types";

type RecipesContextType = {
  recipes: Recipe[];
  getRecipeById: (id: string) => Recipe | undefined;
  addRecipe: (data: {
    title: string;
    sourceUrl?: string;
    imageUri?: string; // <-- nytt
    ingredients: { amount: string; item: string }[];
    steps: string[];
  }) => void;
};


const RecipesContext = createContext<RecipesContextType | undefined>(undefined);

export const RecipesProvider = ({ children }: { children: React.ReactNode }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: "1",
      title: "Krämig pasta med kyckling",
      imageUrl: "https://via.placeholder.com/400x300.png?text=Kycklingpasta",
      sourceUrl: "https://tiktok.com/somevideo",
      tags: ["snabbt", "barnvänligt"],
      ingredients: [
        { amount: "300 g", item: "kycklingfilé" },
        { amount: "2 dl", item: "grädde" },
        { amount: "1 st", item: "gul lök" },
        { amount: "250 g", item: "pasta" }
      ],
      steps: [
        "Strimla och stek kyckling.",
        "Fräs lök.",
        "Häll på grädde, låt koka ihop.",
        "Blanda med nykokt pasta."
      ]
    },
    {
      id: "2",
      title: "Tacos fredag",
      imageUrl: "https://via.placeholder.com/400x300.png?text=Tacos",
      tags: ["fredag", "favorit"],
      ingredients: [
        { amount: "500 g", item: "nötfärs" },
        { amount: "1 påse", item: "tacokrydda" },
        { amount: "1 st", item: "gurka" },
        { amount: "1 st", item: "tomat" },
        { amount: "1 st", item: "sallad" },
        { amount: "1 st", item: "ost" },
        { amount: "1 pkt", item: "tortillabröd" }
      ],
      steps: [
        "Stek färs med krydda.",
        "Hacka grönsaker.",
        "Duka allt i skålar.",
        "Ät för mycket."
      ]
    }
  ]);

  const getRecipeById = (id: string) => recipes.find(r => r.id === id);

 const addRecipe = (data: {
  title: string;
  sourceUrl?: string;
  imageUri?: string; // <-- nytt
  ingredients: { amount: string; item: string }[];
  steps: string[];
}) => {
  const newRecipe: Recipe = {
    id: Date.now().toString(),
    title: data.title,
    sourceUrl: data.sourceUrl,
    imageUrl: data.imageUri, // <-- nytt
    tags: [],
    ingredients: data.ingredients,
    steps: data.steps,
  };

  setRecipes(prev => [newRecipe, ...prev]);
};

  return (
    <RecipesContext.Provider value={{ recipes, getRecipeById, addRecipe }}>
      {children}
    </RecipesContext.Provider>
  );
};

export const useRecipes = () => {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error("useRecipes must be used inside RecipesProvider");
  return ctx;
};