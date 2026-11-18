import en from './en.json';
import type {Language} from './content';
const dictionary:Record<string,string>=en;
const codes:Record<string,string>={draft:'مسودة',published:'منشور',paused:'موقوف',archived:'مؤرشف',active:'نشط',pending:'قيد المراجعة',suspended:'معلق',rejected:'مرفوض',submitted:'مقدم',in_review:'قيد المراجعة',needs_information:'يحتاج استكمال',demo_approved:'مراجعة مكتملة',expired:'منتهي الصلاحية',customer:'متعامل',seller:'مقدم خدمة',admin:'الإدارة'};
const prefixes:Record<string,string>={'تفاصيل ':'Details: ','حفظ ':'Save ','عرض ':'View ','حذف ':'Delete ','تعديل ':'Edit ','معاينة ':'Preview: ','زيادة كمية ':'Increase quantity: ','تقليل كمية ':'Decrease quantity: ','كمية ':'Quantity: ','حالة الطلب ':'Order status: ','المفضلة: ':'Favorites: ','المتاح: ':'Available: ','طلب جديد: ':'New order: ','مخزون منخفض: ':'Low stock: ','شكوى: ':'Complaint: ','رسالة من ':'Message from '};
export function translate(value:unknown,language:Language):any{
 if(typeof value!=='string')return value;
 const key=value.trim().replace(/\s+/g,' ');
 if(language==='ar')return codes[key]||value;
 const lookup=codes[key]||key;
 if(dictionary[lookup]!==undefined)return value.replace(value.trim(),dictionary[lookup]);
 if(key.startsWith('عرض تفاصيل '))return 'View details: '+(dictionary[key.slice('عرض تفاصيل '.length)]||key.slice('عرض تفاصيل '.length));
 if(key.startsWith('قراءة '))return 'Read: '+translate(key.slice('قراءة '.length),language);
 for(const [ar,english] of Object.entries(prefixes))if(key.startsWith(ar))return english+key.slice(ar.length);
 const label=key.match(/^(.+?):\s*(.+)$/);if(label&&dictionary[label[1]])return dictionary[label[1]]+': '+label[2].replace(/ د\.إ$/,' AED');
 const count=key.match(/^(\d+) (منتج|متجر|طلب|قطعة)$/);if(count)return `${count[1]} ${{منتج:'products',متجر:'stores',طلب:'orders',قطعة:'items'}[count[2]]}`;
 if(key.endsWith(' د.إ'))return key.replace(/ د\.إ$/,' AED');
 return value;
}
