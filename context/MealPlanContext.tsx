import React, { createContext, useCallback, useContext, useState } from "react";
import { WeeklyMealPlan } from "../types/types";

type MealPlanContextType = {
    mealPlan: WeeklyMealPlan;
    setMealForDay: (
        day: keyof WeeklyMealPlan,
        mealType: "breakfast" | "lunch" | "dinner",
        recipeId: string
    ) => void;
};

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined);

const defaultPlan: WeeklyMealPlan = {
    Monday:    { breakfast: "1", lunch: "2", dinner: "1" },
    Tuesday:   { breakfast: "1", lunch: "1", dinner: "2" },
    Wednesday: { breakfast: "",  lunch: "2", dinner: "2" },
    Thursday:  { breakfast: "",  lunch: "",  dinner: ""  },
    Friday:    { breakfast: "",  lunch: "",  dinner: "2" },
    Saturday:  { breakfast: "",  lunch: "",  dinner: ""  },
    Sunday:    { breakfast: "",  lunch: "",  dinner: ""  },
};

export const MealPlanProvider = ({ children }: { children: React.ReactNode }) => {
    const [mealPlan, setMealPlan] = useState<WeeklyMealPlan>(defaultPlan);

    const setMealForDay = useCallback(
        (
            day: keyof WeeklyMealPlan,
            mealType: "breakfast" | "lunch" | "dinner",
            recipeId: string
        ) => {
            setMealPlan(prev => ({
                ...prev,
                [day]: {
                    ...prev[day],
                    [mealType]: recipeId,
                },
            }));
        },
        []
    );

    return (
        <MealPlanContext.Provider value={{ mealPlan, setMealForDay }}>
            {children}
        </MealPlanContext.Provider>
    );
};

export const useMealPlan = () => {
    const ctx = useContext(MealPlanContext);
    if (!ctx) throw new Error("useMealPlan must be used inside MealPlanProvider");
    return ctx;
};