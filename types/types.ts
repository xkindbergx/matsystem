export type Ingredient = {
  amount: string;      // "2 st"
  item: string;        // "gul lök"
};

export type Recipe = {
  id: string;
  title: string;
  imageUrl?: string;
  sourceUrl?: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
};

export type MealSlot = {
  breakfast?: string; // recipe id
  lunch?: string;     // recipe id
  dinner?: string;    // recipe id
};

// Ett objekt där nyckeln är dagen ("Monday", "Tuesday", osv)
export type WeeklyMealPlan = {
  [day: string]: MealSlot;
};

export type ShoppingListItem = {
  name: string;
  quantity: string;
  checked: boolean;
};

export type HouseholdMember = {
  id: string;
  name: string;
};

export type Household = {
  id: string;
  name: string;
  members: HouseholdMember[];
};
