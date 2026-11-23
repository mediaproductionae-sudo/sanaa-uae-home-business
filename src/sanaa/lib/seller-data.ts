// @ts-nocheck -- ported verbatim from the Codex project; original typing assumptions differ from this tsconfig.
import type {LocalizedContent} from './i18n/content';
import {getLanguage} from './i18n/store';
import {products as originals,stores as originalStores} from './demo-data';
export type Store=LocalizedContent&{id:number;name:string;description:string;emirate:string;area:string;category:string;activity:string;initial:string;logo:string;cover:string;open:string;close:string;days:string[];contact:string;active:boolean;license:'غير مقدم'|'قيد المراجعة'|'معتمد تجريبياً'|'مرفوض'};
export type CatalogProduct=LocalizedContent&{id:number;storeId:number;name:string;store:string;emirate:string;category:string;price:number;image:string;imageUrl:string;description:string;kind:'product'|'service';stock:number;status:'مسودة'|'منشور'|'موقوف'};
export type Line={productId:number;quantity:number;name?:string;price?:number;storeId?:number};
export const orderStatuses=['جديد','قيد التجهيز','جاهز','مكتمل','ملغى'] as const;
export type OrderStatus=typeof orderStatuses[number];
export type DemoOrder={id:string;items:Line[];status:string;createdAt:string;customerId?:string;customerName?:string;storeStatuses?:Record<string,OrderStatus>};
export type Complaint={id:string;storeId:number;message:string;status:string;replies?:{text:string;at:string}[]};
export type Review={id:string;storeId:number;customerId:string;customer:string;score:number;comment:string;reply:string};
export type Message={id:string;storeId:number;customerId:string;customer:string;text:string;reply:string;read:boolean};
export const sellerSections=[['dashboard','نظرة عامة'],['store','متجري'],['products','المنتجات والخدمات'],['orders','الطلبات'],['customers','العملاء'],['reviews','التقييمات'],['messages','الرسائل'],['complaints','الشكاوى'],['analytics','الإحصائيات'],['notifications','الإشعارات'],['settings','الإعدادات']] as const;
export const seedStores:Store[]=originalStores.map(s=>({...s,description:s.description,area:'منطقة',activity:s.category,logo:'',cover:'',open:'09:00',close:'18:00',days:['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'],contact:'demo@example.test',active:true,license:s.id===1?'معتمد تجريبياً':'غير مقدم'}));
export const seedProducts:CatalogProduct[]=originals.map(p=>({...p,imageUrl:'',kind:'product',stock:p.id===1?4:20,status:'منشور'}));
export function seedOrders():DemoOrder[]{return Array.from({length:8},(_,i)=>({id:`DEMO-SEED-${1001+i}`,items:[{productId:1,storeId:1,name:originals[0].name,price:145,quantity:i%3+1}],status:orderStatuses[i%5],storeStatuses:{'1':orderStatuses[i%5]},createdAt:new Date(Date.now()-(7-i)*86400000).toISOString(),customerId:`CUSTOMER-${i%4+1}`,customerName:`مشتري ${i%4+1}`}))}
export const seedReviews:Review[]=[{id:'REV-1',storeId:1,customerId:'CUSTOMER-1',customer:'مشتري 1',score:5,comment:'قطعة جميلة وتغليف متقن.',reply:''},{id:'REV-2',storeId:1,customerId:'CUSTOMER-2',customer:'مشتري 2',score:4,comment:'تجربة لطيفة، ونقترح المزيد من الألوان.',reply:''},{id:'REV-3',storeId:1,customerId:'CUSTOMER-3',customer:'مشتري 3',score:5,comment:'تفاصيل الحرفة مميزة.',reply:''}];
export const seedComplaints:Complaint[]=[{id:'CASE-SEED-1',storeId:1,message:'اختلاف اللون عن الصورة.',status:'قيد المراجعة',replies:[]},{id:'CASE-SEED-2',storeId:1,message:'بلاغ عن تأخر تجهيز المنتج.',status:'مغلقة',replies:[]}];
export const seedMessages:Message[]=[{id:'MSG-1',storeId:1,customerId:'CUSTOMER-1',customer:'مشتري 1',text:'هل تتوفر هذه القطعة بلون آخر؟',reply:'',read:false},{id:'MSG-2',storeId:1,customerId:'CUSTOMER-2',customer:'مشتري 2',text:'ما مدة تجهيز الطلب؟',reply:'',read:false}];
export const productImage=(p:Pick<CatalogProduct,'image'|'imageUrl'>)=>p.imageUrl||`/images/${p.image||'ceramics'}.jpg`;
export const productHref=(id:number)=>id<=4?`/product/${id}/`:`/product/?id=${id}`;
export const storeHref=(id:number)=>id<=4?`/store/${id}/`:`/store/?id=${id}`;
export const itemStore=(l:Line,catalog:CatalogProduct[])=>l.storeId??catalog.find(p=>p.id===l.productId)?.storeId;
export const itemPrice=(l:Line,catalog:CatalogProduct[])=>l.price??catalog.find(p=>p.id===l.productId)?.price??0;
export const storeOrderStatus=(o:DemoOrder,id:number):OrderStatus=>o.storeStatuses?.[String(id)]??(orderStatuses.includes(o.status as OrderStatus)?o.status as OrderStatus:'قيد التجهيز');
export const money=(n:number)=>new Intl.NumberFormat(getLanguage()==='en'?'en-AE':'ar-AE',{maximumFractionDigits:2}).format(n)+(getLanguage()==='en'?' AED':' د.إ');
