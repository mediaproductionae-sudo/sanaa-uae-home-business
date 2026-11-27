import {supabase} from '@/integrations/supabase/client';
import {normalizePhone} from './phone-number';
export async function sendPhoneOtp(phone:string){
 const {error}=await supabase.auth.updateUser({phone:normalizePhone(phone)});
 if(error)throw new Error('تعذّر إرسال رمز التحقق. تحقق من الرقم أو إعداد خدمة الرسائل، ثم حاول لاحقاً.');
}
export async function verifyPhoneOtp(phone:string,token:string){
 const {error}=await supabase.auth.verifyOtp({phone:normalizePhone(phone),token:token.trim(),type:'phone_change'});
 if(error)throw new Error('رمز التحقق غير صحيح أو انتهت صلاحيته.');
}
