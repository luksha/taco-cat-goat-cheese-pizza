import { useEffect, useState } from "react";

export type Language = "en" | "sr";

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "sr", label: "Serbian" },
];

export type CardKey = "Taco" | "Cat" | "Goat" | "Cheese" | "Pizza";

export const CARD_KEYS: CardKey[] = ["Taco", "Cat", "Goat", "Cheese", "Pizza"];

export const CARD_LABELS: Record<Language, Record<CardKey, string>> = {
  en: {
    Taco: "Taco",
    Cat: "Cat",
    Goat: "Goat",
    Cheese: "Cheese",
    Pizza: "Pizza",
  },
  sr: {
    Taco: "Tako",
    Cat: "Cica",
    Goat: "Koza",
    Cheese: "Sir",
    Pizza: "Pica",
  },
};

const STORAGE_KEY = "flip-chant-language";
const DEFAULT_LANGUAGE: Language = "en";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "sr") return stored;
  return DEFAULT_LANGUAGE;
}

export function setStoredLanguage(language: Language) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, language);
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage());

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  return { language, setLanguage };
}
