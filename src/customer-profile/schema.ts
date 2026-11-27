import {z} from 'zod';
import {normalizePhone} from '@/account/phone-number';
export const emirates=['abu_dhabi','dubai','sharjah','ajman','umm_al_quwain','ras_al_khaimah','fujairah'] as const;
export const customerProfileSchema=z.object({
 displayName:z.string().trim().min(2,'استخدم حرفين على الأقل').max(80),
 phone:z.string().transform(normalizePhone).refine(x=>/^\+[1-9]\d{7,14}$/.test(x),'أدخل رقم هاتف بصيغة دولية صحيحة.'),
 emirate:z.enum(emirates),region:z.string().trim().min(1,'هذا الحقل إلزامي.').max(160),
 street:z.string().trim().max(160),home:z.string().trim().min(1,'هذا الحقل إلزامي.').max(80),buildingNumber:z.string().trim().max(40),
}).strict();
export type CustomerProfileDraft={displayName:string;phone:string;emirate:''|typeof emirates[number];region:string;street:string;home:string;buildingNumber:string};
export const emptyCustomerProfile:CustomerProfileDraft={displayName:'',phone:'',emirate:'',region:'',street:'',home:'',buildingNumber:''};
export type SavedCustomerProfile={draft:CustomerProfileDraft;email:string;emailConfirmed:boolean;authPhone:string;phoneConfirmed:boolean;legacyAddress:string};
