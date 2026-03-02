import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractWeight(desc: string): string | null {
  // Matches (100g), (100 g), 100g, 100ml etc. at end of string or in parens
  const match = desc.match(
    /(?:\(|^|\s)(\d+(?:\.\d+)?)\s*(g|gr|ml|l|kg|buc)(?:\)|$|\s)/i,
  );
  if (!match) return null;
  return `${match[1]}${match[2].toLowerCase()}`;
}

export function parseWeight(weightStr: string): {
  value: string;
  unit: string;
} {
  if (!weightStr) return { value: "", unit: "g" };
  const match = weightStr.match(/(\d+(?:\.\d+)?)\s*(g|gr|ml|l|kg|buc)/i);
  if (match) {
    return { value: match[1], unit: match[2].toLowerCase() };
  }
  return { value: weightStr, unit: "g" };
}
