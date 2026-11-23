// طبقة خدمات مستقلة: تعتمد الآن على بيانات وهمية محلية.
// لاحقاً يمكن استبدال التنفيذ باستدعاءات قاعدة بيانات دون تغيير الواجهات.
import { CATEGORIES, EMIRATES, PRODUCTS, STORES, type Store } from "@/data/mock";
import type { StoreFilters } from "./types";

const delay = <T,>(v: T, ms = 150) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export function filterStores(stores: Store[], f: StoreFilters): Store[] {
  const q = f.q?.trim();
  return stores.filter(
    (s) =>
      (!f.emirate || s.emirate === f.emirate) &&
      (!f.category || s.categoryId === f.category) &&
      (!q || s.name.includes(q) || s.tagline.includes(q)),
  );
}

export const storesService = {
  list: (f: StoreFilters = {}) => delay(filterStores(STORES, f)),
  featured: () => delay(STORES.filter((s) => s.featured)),
  getById: (id: string) => delay(STORES.find((s) => s.id === id) ?? null),
  productsOf: (storeId: string) => delay(PRODUCTS.filter((p) => p.storeId === storeId)),
};

export const catalogService = {
  emirates: () => EMIRATES,
  categories: () => CATEGORIES,
  emirateName: (id: string) => EMIRATES.find((e) => e.id === id)?.name ?? id,
  categoryName: (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? id,
};
