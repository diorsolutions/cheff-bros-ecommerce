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

// Yangi: Miqdorlarni birligiga qarab formatlash
export const formatQuantity = (value, unit) => {
  if (value === null || value === undefined || isNaN(value)) return '';
  const numValue = parseFloat(value);
  if (unit === 'dona') {
    return Math.round(numValue).toString();
  }
  // Boshqa birliklar uchun 2 o'nlik kasrgacha formatlash
  return numValue.toFixed(2);
};

// Yangi: Narxlarni formatlash
export const formatPrice = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '';
  const numValue = parseFloat(value);
  // toLocaleString bilan 2 o'nlik kasrgacha formatlash
  return numValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Yangi: Xarita havolalarini yaratish uchun yordamchi funksiya
export const getMapLinks = (lat, lng, label = "Manzil") => {
  let yandexLink;
  let googleLink;
  let geoUri = null; // geoUri requires lat/lng

  if (lat && lng) {
    yandexLink = `https://yandex.com/maps/?ll=${lng},${lat}&z=16`;
    googleLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    geoUri = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
  } else if (label) {
    // If no coordinates, use label for search
    const encodedLabel = encodeURIComponent(label);
    yandexLink = `https://yandex.com/maps/?text=${encodedLabel}`;
    googleLink = `https://www.google.com/maps/search/?api=1&query=${encodedLabel}`;
  } else {
    // No coordinates and no label, return empty links
    return { yandexLink: null, googleLink: null, geoUri: null };
  }

  return { yandexLink, googleLink, geoUri };
};