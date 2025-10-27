import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";

import HouseholdScreen from "../screens/HouseholdScreen";
import MealPlanScreen from "../screens/MealPlanScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import RecipesScreen from "../screens/RecipesScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";

const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#111" },
          headerTintColor: "#fff",
          tabBarStyle: { backgroundColor: "#111" },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#777",
        }}
      >
        <Tab.Screen name="Meny" component={MealPlanScreen} />
        <Tab.Screen name="Recept" component={RecipesScreen} />
        <Tab.Screen name="Detalj" component={RecipeDetailScreen} />
        <Tab.Screen name="Lista" component={ShoppingListScreen} />
        <Tab.Screen name="Familj" component={HouseholdScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}