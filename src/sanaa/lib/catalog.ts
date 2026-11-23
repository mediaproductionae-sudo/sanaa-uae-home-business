import { supabase } from "@/integrations/supabase/client";

export const emirateLabels: Record<string, string> = {
  abu_dhabi: "أبوظبي", dubai: "دبي", sharjah: "الشارقة", ajman: "عجمان",
  umm_al_quwain: "أم القيوين", ras_al_khaimah: "رأس الخيمة", fujairah: "الفجيرة",
};

const numId = (code: string) => Number(String(code).split("-").pop()) || 0;
const leadId = (code: string) => Number(String(code).split("-")[0]) || 0;

/** Published catalog from the database, mapped to the shapes the Sanaa UI already uses. */
export async function fetchCatalog() {
  const [s, p] = await Promise.all([
    supabase.from("stores").select("id,slug,name_ar,description,emirate,area_code,status,license_status,hours,categories(name_ar)"),
    supabase.from("products").select("id,sku,name_ar,description,kind,status,price_minor,inventory_quantity,stores(slug,name_ar,emirate),categories(name_ar)"),
  ]);
  if (s.error) throw s.error;
  if (p.error) throw p.error;
  const stores = (s.data ?? []).map((r: any) => {
    const hours = (r.hours ?? {}) as { open?: string; close?: string };
    return {
      id: numId(r.slug), dbId: r.id, name: r.name_ar, description: r.description,
      emirate: emirateLabels[r.emirate] ?? r.emirate, area: r.area_code,
      category: r.categories?.name_ar ?? "", activity: r.categories?.name_ar ?? "",
      initial: r.name_ar[0], open: hours.open ?? "09:00", close: hours.close ?? "18:00",
      active: r.status === "active",
      license: r.license_status === "demo_approved" ? "معتمد تجريبياً" : r.license_status === "rejected" ? "مرفوض" : ["submitted", "in_review"].includes(r.license_status) ? "قيد المراجعة" : "غير مقدم",
      archived: r.status === "archived" };
  }).filter((x) => x.id > 0 && !x.archived);
  const products = (p.data ?? []).map((r: any) => ({
    id: leadId(r.sku), dbId: r.id, archived: r.status === "archived", storeId: numId(r.stores?.slug ?? ""), name: r.name_ar, store: r.stores?.name_ar ?? "",
    emirate: emirateLabels[r.stores?.emirate] ?? "", category: r.categories?.name_ar ?? "",
    price: Number(r.price_minor) / 100, image: String(r.sku).split("-").slice(1).join("-") || "ceramics",
    description: r.description, kind: r.kind, stock: r.inventory_quantity,
    status: r.status === "published" ? "منشور" : r.status === "paused" ? "موقوف" : "مسودة",
  })).filter((x) => x.id > 0 && x.storeId > 0 && !x.archived);
  return { stores, products };
}

/** Signed-in account → the UI's user shape (display name + buyer/seller). */
export async function fetchAccount(userId: string) {
  const [prof, roles] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const isSeller = (roles.data ?? []).some((r: any) => r.role === "seller");
  const isAdmin = (roles.data ?? []).some((r: any) => r.role === "admin");
  return { name: prof.data?.display_name ?? "مستخدم", role: isSeller ? "seller" : "buyer", isAdmin } as const;
}

const emirateCodes: Record<string, string> = Object.fromEntries(Object.entries(emirateLabels).map(([k, v]) => [v, k]));

/** Numeric UI ids of the stores owned by this signed-in seller. */
export async function fetchOwnedStoreIds(userId: string) {
  const sp = await supabase.from("seller_profiles").select("id").eq("user_id", userId).maybeSingle();
  if (!sp.data) return [] as number[];
  const st = await supabase.from("stores").select("slug").eq("seller_id", sp.data.id).neq("status", "archived");
  return (st.data ?? []).map((r: any) => numId(r.slug)).filter((n) => n > 0);
}

/** Create (dbId empty) or update a seller's store in the database. Returns an Arabic error or "". */
export async function saveStoreRemote(input: { dbId?: string; name: string; description: string; category: string; emirate: string; area: string; open: string; close: string; days: string[]; contact: string }) {
  const cat = await supabase.from("categories").select("id").eq("name_ar", input.category).maybeSingle();
  if (!cat.data) return "التصنيف غير متاح حالياً.";
  const { error } = await supabase.rpc("sanaa_save_store", {
    store_uuid: input.dbId || null, name_ar: input.name, description: input.description, category_uuid: cat.data.id,
    emirate: emirateCodes[input.emirate] ?? "dubai", area_code: input.area,
    hours: { open: input.open, close: input.close, days: input.days },
  } as any);
  if (!error) return "";
  if (/store_limit/.test(error.message)) return "وصلت إلى الحد الأقصى (5 متاجر).";
  if (/seller_required/.test(error.message)) return "هذا الحساب ليس حساب بائع، أو لم يُؤكَّد بريده بعد.";
  if (/invalid_store/.test(error.message)) return "تحقق من اسم المتجر (حرفان على الأقل) والمنطقة والتصنيف.";
  return "تعذّر حفظ المتجر. حاول مرة أخرى.";
}

/** Create (dbId empty) or update a seller's product in the database. Returns an Arabic error or "". */
export async function saveProductRemote(input: { id: number; dbId?: string; storeDbId: string; name: string; description: string; category: string; kind: string; price: number; stock: number; status: string; image?: string }) {
  const cat = await supabase.from("categories").select("id").eq("name_ar", input.category).maybeSingle();
  if (!cat.data) return "التصنيف غير متاح حالياً.";
  const publication = input.status === "منشور" ? "published" : input.status === "موقوف" ? "paused" : "draft";
  const { error } = await supabase.rpc("sanaa_save_product", {
    product_uuid: input.dbId || null, store_uuid: input.storeDbId, category_uuid: cat.data.id,
    sku: `${input.id}-${input.image || "ceramics"}`, name_ar: input.name, description: input.description,
    kind: input.kind, price_minor: Math.round(input.price * 100), stock: input.kind === "service" ? 0 : input.stock, publication,
  } as any);
  if (!error) return "";
  if (/not_owner/.test(error.message)) return "لا يمكنك تعديل منتجات هذا المتجر.";
  if (/invalid_product/.test(error.message)) return "تحقق من اسم المنتج (حرفان على الأقل) والسعر والكمية.";
  return "تعذّر حفظ المنتج. حاول مرة أخرى.";
}

export async function archiveProductRemote(dbId: string) {
  const { error } = await supabase.rpc("sanaa_archive_product", { product_uuid: dbId } as any);
  return error ? "تعذّر حذف المنتج." : "";
}

/** Archive a seller's own store and its products (orders/complaints are kept). */
export async function archiveStoreRemote(dbId: string) {
  const { error } = await supabase.rpc("sanaa_archive_store" as any, { store_uuid: dbId } as any);
  return error ? "تعذّر حذف المتجر. حاول مرة أخرى." : "";
}
