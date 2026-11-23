// بيانات تجريبية وهمية بالكامل — لا تمثل متاجر أو أشخاصاً حقيقيين.
export type EmirateId = "abu-dhabi" | "dubai" | "sharjah" | "ajman" | "umm-al-quwain" | "ras-al-khaimah" | "fujairah";
export interface Emirate { id: EmirateId; name: string }
export interface Category { id: string; name: string; description: string; icon: string }
export interface Store {
  id: string; name: string; tagline: string; emirate: EmirateId; categoryId: string;
  rating: number; reviews: number; featured: boolean; verified: boolean; monogram: string; isDemo: true;
}
export interface Product { id: string; storeId: string; name: string; price: number; unit: string; isDemo: true }

export const EMIRATES: Emirate[] = [
  { id: "abu-dhabi", name: "أبوظبي" }, { id: "dubai", name: "دبي" }, { id: "sharjah", name: "الشارقة" },
  { id: "ajman", name: "عجمان" }, { id: "umm-al-quwain", name: "أم القيوين" },
  { id: "ras-al-khaimah", name: "رأس الخيمة" }, { id: "fujairah", name: "الفجيرة" },
];

export const CATEGORIES: Category[] = [
  { id: "food", name: "مأكولات منزلية", description: "أطباق وحلويات محضّرة في المنزل", icon: "ChefHat" },
  { id: "bakery", name: "مخبوزات", description: "خبز ومعجنات طازجة", icon: "Croissant" },
  { id: "perfume", name: "عطور وبخور", description: "عود ودخون وخلطات خاصة", icon: "Flame" },
  { id: "crafts", name: "حرف يدوية", description: "سدو وتطريز ومشغولات", icon: "Scissors" },
  { id: "beauty", name: "تجميل منزلي", description: "حناء وعناية شخصية", icon: "Sparkles" },
  { id: "tutoring", name: "دروس خصوصية", description: "تعليم وتدريب منزلي", icon: "GraduationCap" },
  { id: "tailoring", name: "خياطة", description: "عبايات وكنادير وتعديلات", icon: "Shirt" },
  { id: "events", name: "تنسيق مناسبات", description: "ضيافة وتزيين وهدايا", icon: "Gift" },
];

const raw: [string, string, string, EmirateId, string, number, number, boolean][] = [
  ["mattbakh-umm-saeed", "مطبخ أم سعيد (تجريبي)", "مجبوس ولقيمات بنكهة البيت", "dubai", "food", 4.9, 212, true],
  ["oud-al-reem", "عود الريم (تجريبي)", "دخون وخلطات عود يدوية", "abu-dhabi", "perfume", 4.8, 168, true],
  ["khobz-al-fareej", "خبز الفريج (تجريبي)", "خمير ورقاق طازج يومياً", "sharjah", "bakery", 4.7, 95, true],
  ["sadu-house", "بيت السدو (تجريبي)", "مشغولات سدو وتلي معاصرة", "ras-al-khaimah", "crafts", 4.9, 74, true],
  ["henna-noor", "حناء نور (تجريبي)", "نقوش حناء للمناسبات", "ajman", "beauty", 4.6, 133, false],
  ["darsi", "درسي (تجريبي)", "دروس رياضيات وعلوم منزلية", "abu-dhabi", "tutoring", 4.8, 58, true],
  ["abaya-lines", "خطوط العباية (تجريبي)", "تفصيل عبايات حسب الطلب", "dubai", "tailoring", 4.5, 81, false],
  ["farha-events", "فرحة للمناسبات (تجريبي)", "تنسيق ضيافة وهدايا", "fujairah", "events", 4.7, 47, false],
  ["halwa-al-sahel", "حلوى الساحل (تجريبي)", "حلوى عمانية وإماراتية", "umm-al-quwain", "food", 4.6, 39, false],
  ["maamoul-sara", "معمول سارة (تجريبي)", "معمول وكعك بالتمر", "sharjah", "bakery", 4.8, 102, true],
  ["bakhoor-jebel", "بخور الجبل (تجريبي)", "بخور جبلي وعطور زيتية", "fujairah", "perfume", 4.4, 28, false],
  ["talli-art", "فن التلي (تجريبي)", "تطريز تلي على الأقمشة", "ajman", "crafts", 4.7, 36, false],
];

export const STORES: Store[] = raw.map(([id, name, tagline, emirate, categoryId, rating, reviews, featured]) => ({
  id, name, tagline, emirate, categoryId, rating, reviews, featured,
  verified: featured, monogram: name.trim().charAt(0), isDemo: true,
}));

export const PRODUCTS: Product[] = [
  { id: "p-majboos", storeId: "mattbakh-umm-saeed", name: "صينية مجبوس دجاج", price: 120, unit: "صينية", isDemo: true },
  { id: "p-luqaimat", storeId: "mattbakh-umm-saeed", name: "لقيمات بالدبس", price: 35, unit: "علبة", isDemo: true },
  { id: "p-dukhoon", storeId: "oud-al-reem", name: "دخون الريم الخاص", price: 180, unit: "علبة", isDemo: true },
];
