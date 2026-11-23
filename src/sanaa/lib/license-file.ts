// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
export type LicenseAttachment = { id: string; name: string; size: number; type: string; path: string };
const TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const EXT = { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
export async function validLicenseFile(file: File) {
  if (!file.size || file.size > 5 * 1024 * 1024 || !TYPES.includes(file.type)) return false;
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e));
  return (file.type === "application/pdf" && ascii(0, 5) === "%PDF-") ||
    (file.type === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)) ||
    (file.type === "image/jpeg" && b[0] === 255 && b[1] === 216 && b[2] === 255) ||
    (file.type === "image/webp" && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP");
}
/** Latest trade-license document for a store (owner or reviewer only, via RLS). */
export async function fetchLicense(storeDbId: string): Promise<LicenseAttachment | undefined> {
  const { data, error } = await supabase.from("store_documents").select("id,object_path,file_name,mime_type,size_bytes")
    .eq("store_id", storeDbId).eq("document_type", "trade_license").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, path: data.object_path, name: data.file_name || "license", type: data.mime_type || "", size: data.size_bytes || 0 } : undefined;
}
/** Upload to the private bucket, then register the document against the store and its owner. */
export async function uploadLicense(storeDbId: string, file: File): Promise<LicenseAttachment> {
  if (!(await validLicenseFile(file))) throw new Error("INVALID_FILE");
  const path = `${storeDbId}/license-${crypto.randomUUID()}.${EXT[file.type]}`;
  const up = await supabase.storage.from("store-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw up.error;
  const name = file.name.slice(0, 200);
  const reg = await supabase.rpc("sanaa_attach_license", { store_uuid: storeDbId, object_path: path, file_name: name, mime_type: file.type, size_bytes: file.size });
  if (reg.error) { await supabase.storage.from("store-documents").remove([path]); throw reg.error; }
  return { id: reg.data, path, name, type: file.type, size: file.size };
}
/** Short-lived (60s) signed download link. */
export async function licenseDownloadUrl(a: LicenseAttachment) {
  const { data, error } = await supabase.storage.from("store-documents").createSignedUrl(a.path, 60, { download: a.name });
  if (error) throw error;
  return data.signedUrl;
}
export async function removeLicense(a: LicenseAttachment) {
  const { data, error } = await supabase.rpc("sanaa_remove_license", { document_uuid: a.id });
  if (error) throw error;
  await supabase.storage.from("store-documents").remove([data || a.path]);
}
