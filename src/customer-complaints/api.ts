import type {SupabaseClient} from '@supabase/supabase-js';
import {supabase} from '@/integrations/supabase/client';
import {validateComplaint,type ComplaintInput,type CustomerComplaint} from './schema';
const db=supabase as unknown as SupabaseClient;
export class ComplaintError extends Error{}
function check(error:{code?:string;message?:string}|null,reading=false){
 if(!error)return;
 if(['PGRST202','42P01','42883'].includes(error.code||''))throw new ComplaintError('يلزم تفعيل خدمة الشكاوى على الخادم قبل الإرسال.');
 if(/confirmed_customer_required/.test(error.message||''))throw new ComplaintError('يلزم حساب متعامل نشط وبريد مؤكد لتقديم شكوى.');
 if(/store_unavailable/.test(error.message||''))throw new ComplaintError('المتجر غير متاح لاستقبال شكوى حالياً.');
 if(/rate_limited/.test(error.message||''))throw new ComplaintError('تم إرسال عدة شكاوى خلال وقت قصير. حاول بعد دقيقة.');
 if(/idempotency_mismatch/.test(error.message||''))throw new ComplaintError('تغيّرت بيانات الطلب. حدّث قائمة الشكاوى قبل المحاولة مجدداً.');
 if(/invalid_complaint/.test(error.message||''))throw new ComplaintError('اختر المتجر واكتب وصفاً من 10 إلى 4000 حرف.');
 throw new ComplaintError(reading?'تعذّر تحميل الشكاوى. حاول مرة أخرى.':'تعذّر تأكيد الإرسال. أعد المحاولة بنفس البيانات لتجنب تكرار الشكوى.');
}
export async function loadComplaints():Promise<CustomerComplaint[]>{const {data,error}=await db.rpc('sanaa_customer_complaints_read');check(error,true);if(!Array.isArray(data))throw new ComplaintError('تعذّر تحميل الشكاوى.');return data as CustomerComplaint[];}
export async function submitComplaint(input:ComplaintInput):Promise<CustomerComplaint>{
 const valid=validateComplaint(input);if(!valid.success)throw new ComplaintError('اختر المتجر واكتب وصفاً من 10 إلى 4000 حرف.');
 const {requestId,storeId,body}=valid.data;
 const {data,error}=await db.rpc('sanaa_customer_complaint_submit',{request_id:requestId,store_uuid:storeId,complaint_body:body});check(error);
 if(!data?.id||typeof data.id!=='string')throw new ComplaintError('تعذّر تأكيد الإرسال. أعد المحاولة بنفس البيانات لتجنب تكرار الشكوى.');return data as CustomerComplaint;
}
