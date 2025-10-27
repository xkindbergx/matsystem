import React, { createContext, useContext, useState } from "react";
import { ShoppingListItem } from "../types/types";

type ShoppingListContextType = {
  items: ShoppingListItem[];
  toggleItem: (name: string) => void;
};

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export const ShoppingListProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<ShoppingListItem[]>([
    { name: "gul lök", quantity: "4 st", checked: false },
    { name: "kycklingfilé", quantity: "600 g", checked: false },
    { name: "grädde", quantity: "2 dl", checked: true },
    { name: "tortillabröd", quantity: "1 pkt", checked: false },
  ]);

  const toggleItem = (name: string) => {
    setItems(prev =>
      prev.map(i =>
        i.name === name ? { ...i, checked: !i.checked } : i
      )
    );
  };

  return (
    <ShoppingListContext.Provider value={{ items, toggleItem }}>
      {children}
    </ShoppingListContext.Provider>
  );
};

export const useShoppingList = () => {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error("useShoppingList must be used inside ShoppingListProvider");
  return ctx;
};
