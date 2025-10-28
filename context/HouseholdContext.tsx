import React, { createContext, useContext, useState } from "react";
import { Household } from "../types/types";

type HouseholdContextType = {
  household: Household;
};

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider = ({ children }: { children: React.ReactNode }) => {
  const [household] = useState<Household>({
    id: "fam-1",
    name: "Familjen Kindberg",
    members: [
      { id: "u1", name: "Mattias" },
      { id: "u2", name: "Partner" },
      { id: "u3", name: "Barn 1" },
      { id: "u4", name: "Barn 2" },
    ],
  });

  return (
    <HouseholdContext.Provider value={{ household }}>
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHousehold must be used inside HouseholdProvider");
  return ctx;
};
