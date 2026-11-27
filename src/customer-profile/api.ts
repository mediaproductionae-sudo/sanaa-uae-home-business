import type {SupabaseClient} from '@supabase/supabase-js';
import {supabase} from '@/integrations/supabase/client';
import {customerProfileSchema,type CustomerProfileDraft,type SavedCustomerProfile} from './schema';
export {sendPhoneOtp,verifyPhoneOtp} from '@/account/phone-verification';
const db=supabase as unknown as SupabaseClient;
function check(error:{code?:string;message?:string}|null){
 if(!error)return;
 if(['PGRST202','42P01','42883'].includes(error.code||''))throw new Error('يلزم تفعيل إعدادات حساب المتعامل على الخادم.');
 const message=error.message||'';
 if(/phone_not_verified/.test(message))throw new Error('تحقق من رقم الهاتف قبل حفظ التغييرات.');
 if(/email_not_verified/.test(message))throw new Error('أكّد بريدك الإلكتروني أولاً.');
 if(/customer_required/.test(message))throw new Error('يلزم حساب متعامل نشط للوصول إلى هذه البيانات.');
 if(/invalid_customer_profile/.test(message))throw new Error('راجع معلومات الحساب والعنوان قبل الحفظ.');
 throw new Error('تعذّر تنفيذ العملية. حاول مرة أخرى.');
}
export async function loadCustomerProfile():Promise<SavedCustomerProfile>{const {data,error}=await db.rpc('sanaa_customer_profile_get');check(error);if(!data?.draft)throw new Error('تعذّر تحميل معلومات الحساب.');return data as SavedCustomerProfile;}
export async function saveCustomerProfile(draft:CustomerProfileDraft):Promise<SavedCustomerProfile>{const result=customerProfileSchema.safeParse(draft);if(!result.success)throw new Error('راجع معلومات الحساب والعنوان قبل الحفظ.');const {data,error}=await db.rpc('sanaa_customer_profile_save',{payload:result.data});check(error);if(!data?.draft)throw new Error('تعذّر تأكيد حفظ معلومات الحساب. حدّث الصفحة للتحقق.');return data as SavedCustomerProfile;}
