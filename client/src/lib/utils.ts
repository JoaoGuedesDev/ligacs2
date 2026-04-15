import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toSafeNumber(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}
