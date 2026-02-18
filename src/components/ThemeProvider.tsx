"use client";

import { useEffect } from "react";

const themeKey = "commandhub.theme";

type Theme = {
  background: string;
  text: string;
  buttonBg: string;
  buttonText: string;
  border: string;
  accent: string;
};

const defaultTheme: Theme = {
  background: "#ffffff",
  text: "#0b0b0b",
  buttonBg: "#0b0b0b",
  buttonText: "#ffffff",
  border: "rgba(0,0,0,0.12)",
  accent: "#00f5ff",
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.style.setProperty("--app-bg", theme.background);
  root.style.setProperty("--app-text", theme.text);
  root.style.setProperty("--app-button-bg", theme.buttonBg);
  root.style.setProperty("--app-button-text", theme.buttonText);
  root.style.setProperty("--app-border", theme.border);
  root.style.setProperty("--app-accent", theme.accent);
};

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const stored = window.localStorage.getItem(themeKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<Theme>;
        applyTheme({ ...defaultTheme, ...parsed });
        return;
      } catch {
        // fall through
      }
    }
    applyTheme(defaultTheme);
  }, []);

  useEffect(() => {
    const handleTheme = () => {
      const stored = window.localStorage.getItem(themeKey);
      if (!stored) {
        applyTheme(defaultTheme);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Partial<Theme>;
        applyTheme({ ...defaultTheme, ...parsed });
      } catch {
        applyTheme(defaultTheme);
      }
    };
    window.addEventListener("commandhub-theme", handleTheme);
    window.addEventListener("storage", handleTheme);
    return () => {
      window.removeEventListener("commandhub-theme", handleTheme);
      window.removeEventListener("storage", handleTheme);
    };
  }, []);

  return <>{children}</>;
}
