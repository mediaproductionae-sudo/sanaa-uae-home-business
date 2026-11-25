import { z } from 'zod';
export const emirates = ['abu_dhabi','dubai','sharjah','ajman','umm_al_quwain','ras_al_khaimah','fujairah'] as const;
export const normalizePhone = (value: string) => {
 const digits = value.replace(/[٠-٩]/g, c => String(c.charCodeAt(0)-1632)).replace(/[\s()-]/g,'');
 return /^05\d{8}$/.test(digits) ? '+971'+digits.slice(1) : digits.startsWith('00') ? '+'+digits.slice(2) : digits;
};
export const normalizeIban = (value: string) => value.replace(/\s/g,'').toUpperCase();
export function validIban(value: string) {
 const iban=normalizeIban(value);if(!/^AE\d{21}$/.test(iban))return false;
 let remainder=0;
 for(const ch of iban.slice(4)+iban.slice(0,4))for(const digit of /[A-Z]/.test(ch)?String(ch.charCodeAt(0)-55):ch)remainder=(remainder*10+Number(digit))%97;
 return remainder===1;
}
const text=(max:number)=>z.string().trim().max(max);
export const profileDraftSchema=z.object({
 fullNameAr:text(120),fullNameEn:text(120),phone:text(25).transform(normalizePhone),
 emirate:z.union([z.enum(emirates),z.literal('')]),cityArea:text(160),buildingName:text(120),buildingNumber:text(30),
 preferredLanguage:z.enum(['ar','en']),avatarPath:text(250),bankHolder:text(120),bankName:text(120),iban:text(40).transform(normalizeIban),bankCertificatePath:text(250),vatRegistered:z.boolean(),trn:text(15),
}).strict().superRefine((v,ctx)=>{
 const issue=(path:string,message:string)=>ctx.addIssue({code:'custom',path:[path],message});
 if(v.phone&&!/^\+[1-9]\d{7,14}$/.test(v.phone))issue('phone','أدخل رقم هاتف بصيغة دولية صحيحة.');
 if(v.fullNameAr&&!/[\u0621-\u064A\u066E-\u06D3]/.test(v.fullNameAr))issue('fullNameAr','أدخل الاسم الكامل بالعربية.');
 if(v.fullNameEn&&(!/[A-Za-z]/.test(v.fullNameEn)||/[\u0600-\u06ff]/.test(v.fullNameEn)))issue('fullNameEn','أدخل الاسم الكامل بالإنجليزية.');
 if(v.iban&&!validIban(v.iban))issue('iban','أدخل رقم IBAN إماراتياً صحيحاً.');
 if(v.vatRegistered&&v.trn&&!/^\d{15}$/.test(v.trn))issue('trn','الرقم الضريبي يتكون من 15 رقماً.');
});
export type ProfileDraft=z.infer<typeof profileDraftSchema>;
export const emptyProfile:ProfileDraft={fullNameAr:'',fullNameEn:'',phone:'',emirate:'',cityArea:'',buildingName:'',buildingNumber:'',preferredLanguage:'ar',avatarPath:'',bankHolder:'',bankName:'',iban:'',bankCertificatePath:'',vatRegistered:false,trn:''};
export function validateProfile(value:unknown,complete=false){
 const result=profileDraftSchema.safeParse(value);
 if(!result.success)return {ok:false as const,errors:Object.fromEntries(result.error.issues.map(i=>[i.path[0],i.message]))};
 const errors:Record<string,string>={};
 if(complete){
  for(const key of ['fullNameAr','fullNameEn','phone','emirate','cityArea','buildingName','bankName','iban'] as const)if(result.data[key].length< (['fullNameAr','fullNameEn'].includes(key)?2:1))errors[key]='هذا الحقل إلزامي.';
  if(result.data.vatRegistered&&!/^\d{15}$/.test(result.data.trn))errors['trn']='الرقم الضريبي يتكون من 15 رقماً.';
 }
 return Object.keys(errors).length?{ok:false as const,errors}:{ok:true as const,data:{...result.data,trn:result.data.vatRegistered?result.data.trn:''}};
}
export function validateAttachment(file:Pick<File,'type'|'size'>,kind:'avatar'|'bank'){
 const types=kind==='avatar'?['image/png','image/jpeg','image/webp']:['application/pdf','image/png','image/jpeg'];
 if(!types.includes(file.type))return 'نوع الملف غير مدعوم.';
 if(file.size<1||file.size>5*1024*1024)return 'حجم الملف يجب ألا يتجاوز 5 ميغابايت.';
 return '';
}
