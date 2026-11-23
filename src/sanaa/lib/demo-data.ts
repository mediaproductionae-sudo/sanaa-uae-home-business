// @ts-nocheck -- ported verbatim from the Codex project; original typing assumptions differ from this tsconfig.
export const emirates=['جميع الإمارات','أبوظبي','دبي','الشارقة','عجمان','أم القيوين','رأس الخيمة','الفجيرة'];
export const categories=['الكل','مذاقات منزلية','حرف وفنون','عطور وبخور','أزياء وإكسسوارات','البيت والديكور'];
export const products=[
{id:1,storeId:1,name:'خزف يحمل دفء التفاصيل',store:'طين وحكاية',emirate:'الشارقة',category:'حرف وفنون',price:145,image:'ceramics',description:'قطعة خزفية مصنوعة يدوياً بألوان الأرض وتفاصيل مستوحاة من الطبيعة.'},
{id:2,storeId:2,name:'حلاوة اللقاء، بطعم البيت',store:'مخبز دار اللوز',emirate:'دبي',category:'مذاقات منزلية',price:85,image:'bread',description:'تشكيلة مخبوزات منزلية للمشاركة، بنكهات تلائم لقاءات الأهل والأصدقاء.'},
{id:3,storeId:3,name:'رائحة تبقى في الذاكرة',store:'أثر للعطور',emirate:'أبوظبي',category:'عطور وبخور',price:190,image:'perfume',description:'عطر مستوحى من المكونات الشرقية وروائح البخور.'},
{id:4,storeId:4,name:'تفاصيل صغيرة، روح مختلفة',store:'خيط ونخلة',emirate:'عجمان',category:'البيت والديكور',price:120,image:'basket',description:'سلة طبيعية منسوجة يدوياً لتفاصيل البيت.'}
];

export type Product=typeof products[number];
export const stores=products.map(p=>({id:p.storeId,name:p.store,emirate:p.emirate,category:p.category,initial:p.store[0],description:'مشروع منزلي يعرض حرفاً ومنتجات مستوحاة من الثقافة الإماراتية.'}));
export const pageTitles:Record<string,string>={stores:'استكشاف المتاجر',products:'استكشاف المنتجات',categories:'التصنيفات',favorites:'المفضلة',cart:'السلة',login:'تسجيل الدخول',register:'إنشاء حساب',profile:'الملف الشخصي',orders:'الطلبات',complaints:'الشكاوى','seller/dashboard':'لوحة البائع',product:'تفاصيل المنتج',store:'تفاصيل المتجر'};
export const routeSegments=[...Object.keys(pageTitles).map(p=>p.split('/')),...products.map(p=>['product',String(p.id)]),...stores.map(s=>['store',String(s.id)]),...['store','products','orders','customers','reviews','messages','complaints','analytics','notifications','settings'].map(s=>['seller',s])];

export const sellerRoutes=['store','products','orders','customers','reviews','messages','complaints','analytics','notifications','settings'];

routeSegments.push(...['dashboard','stores','applications','licenses','users','products','orders','complaints','safety','categories','reports','audit','settings'].map(x=>['admin',x]));
