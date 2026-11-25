import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, validateAttachment, type ProfileDraft } from './schema';
// New RPCs are supplied in docs/sql for review by the managed database owner.
// The caller's JWT and the server RPC enforce ownership; no privileged key.
const db=supabase as unknown as SupabaseClient;
export type ProfileRecord={draft:ProfileDraft;email:string;emailConfirmed:boolean;authPhone:string;phoneConfirmed:boolean;registeredAt:string;completedAt:string|null};
export class ProfileError extends Error {}
function fail(error:{code?:string;message?:string}|null){
 if(!error)return;
 const code=error.code||'',message=error.message||'';
 if(['PGRST202','42P01','42883'].includes(code))throw new ProfileError('تحتاج المنصة إلى تفعيل إعدادات الملف الشخصي على الخادم.');
 if(/phone_not_verified/.test(message))throw new ProfileError('تحقق من رقم الهاتف قبل إكمال الملف.');
 if(/email_not_verified/.test(message))throw new ProfileError('أكّد بريدك الإلكتروني أولاً.');
 if(/seller_required|not_active/.test(message))throw new ProfileError('يلزم حساب بائع نشط للوصول إلى هذه البيانات.');
 if(/invalid_profile|invalid_bank|invalid_document/.test(message))throw new ProfileError('راجع الحقول والمرفقات قبل الحفظ.');
 throw new ProfileError('تعذّر تنفيذ العملية. حاول مرة أخرى.');
}
export async function loadProfile():Promise<ProfileRecord>{const {data,error}=await db.rpc('sanaa_seller_personal_get');fail(error);if(!data?.draft)throw new ProfileError('تعذّر تحميل الملف الشخصي.');return data as ProfileRecord;}
export async function saveProfile(draft:ProfileDraft,complete:boolean):Promise<ProfileRecord>{const {data,error}=await db.rpc('sanaa_seller_personal_save',{payload:draft,complete_profile:complete});fail(error);return data as ProfileRecord;}
export async function sendPhoneOtp(phone:string){
 const {error}=await supabase.auth.updateUser({phone:normalizePhone(phone)});
 if(error)throw new ProfileError('تعذّر إرسال رمز التحقق. تحقق من الرقم أو إعداد خدمة الرسائل، ثم حاول لاحقاً.');
}
export async function verifyPhoneOtp(phone:string,token:string){
 const {error}=await supabase.auth.verifyOtp({phone:normalizePhone(phone),token:token.trim(),type:'phone_change'});
 if(error)throw new ProfileError('رمز التحقق غير صحيح أو انتهت صلاحيته.');
}
export async function uploadProfileFile(file:File,kind:'avatar'|'bank'){
 const problem=validateAttachment(file,kind);if(problem)throw new ProfileError(problem);
 const {data,error}=await supabase.auth.getUser();if(error||!data.user)throw new ProfileError('سجّل الدخول أولاً.');
 const ext:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf'};
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const magic=file.type==='application/pdf'?String.fromCharCode(...bytes.slice(0,5))==='%PDF-':file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!magic)throw new ProfileError('نوع الملف غير مدعوم.');
 const path=`${data.user.id}/${kind}/${crypto.randomUUID()}.${ext[file.type]}`;
 const result=await supabase.storage.from('seller-profile-private').upload(path,file,{upsert:false,contentType:file.type});
 if(result.error)throw new ProfileError('تعذّر رفع الملف إلى التخزين الآمن. تحقق من إعدادات الخادم.');
 return path;
}
export async function privateFileUrl(path:string){const {data,error}=await supabase.storage.from('seller-profile-private').createSignedUrl(path,60);if(error||!data?.signedUrl)throw new ProfileError('تعذّر فتح المرفق.');return data.signedUrl;}
