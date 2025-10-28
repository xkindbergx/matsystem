import React from "react";
import { HouseholdProvider } from "./context/HouseholdContext";
import { MealPlanProvider } from "./context/MealPlanContext";
import { RecipesProvider } from "./context/RecipesContext";
import { ShoppingListProvider } from "./context/ShoppingListContext";
import Tabs from "./navigation/Tabs";

export default function App() {
  return (
    <HouseholdProvider>
      <RecipesProvider>
        <MealPlanProvider>
          <ShoppingListProvider>
            <Tabs />
          </ShoppingListProvider>
        </MealPlanProvider>
      </RecipesProvider>
    </HouseholdProvider>
  );
}