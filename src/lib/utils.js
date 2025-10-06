import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function generateShortOrderId(uuid) {
  if (!uuid || typeof uuid !== 'string' || uuid.length < 8) {
    return "000000"; // Fallback for invalid UUIDs
  }
  // Take the first 8 hex characters, convert to integer, modulo 1,000,000, and pad to 6 digits
  const hash = parseInt(uuid.substring(0, 8), 16);
  return (hash % 1000000).toString().padStart(6, '0');
}

export function formatUzbekDateTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  
  const uzbekMonths = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];
  const monthName = uzbekMonths[date.getMonth()];
  
  const day = date.getDate().toString(); // Kun raqamidan oldingi nol olib tashlandi
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}, ${day}-${monthName}, soat: ${hours}:${minutes}`;
}