import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type MomentraThemeContextValue = {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
};

const MomentraThemeContext = createContext<MomentraThemeContextValue | null>(null);

export function MomentraThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const value = useMemo(() => ({ isDark, setIsDark }), [isDark]);

  return (
    <MomentraThemeContext.Provider value={value}>
      {children}
    </MomentraThemeContext.Provider>
  );
}

export function useMomentraTheme() {
  const context = useContext(MomentraThemeContext);

  if (!context) {
    throw new Error("useMomentraTheme must be used within MomentraThemeProvider");
  }

  return context;
}
