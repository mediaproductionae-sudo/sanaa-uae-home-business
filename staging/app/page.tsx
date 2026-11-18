
import {serverLanguage} from '../lib/language';
import Home from '../components/home';
import {catalog,categories} from '../lib/data';
import {config} from '../lib/config';
import Link from 'next/link';
export default async function Page(){const {t:_t,language}=await serverLanguage();const ready=!!config();const [products,cats]=await Promise.all([catalog(),categories()]);return <>{!ready&&<p className="stage-note wrap">{_t("لم يُربط Supabase بعد؛ لن تظهر بيانات وهمية بدلاً من البيانات الحقيقية. ")}<Link href="/setup/">{_t("متطلبات الربط")}</Link></p>}<Home products={products.products} categories={['الكل',...cats.map(c=>c.name_ar)]}/></>}
