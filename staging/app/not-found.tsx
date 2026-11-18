
import {serverLanguage} from '../lib/language';
import Link from 'next/link';
export default async function NotFound(){const {t:_t,language}=await serverLanguage();return <main id="main" className="wrap inner-page stage-error"><h1>{_t("الصفحة أو العنصر غير متاح")}</h1><p>{_t("قد يكون العنصر غير منشور أو لا يملك الحساب صلاحية عرضه.")}</p><Link href="/products/" className="primary">{_t("استكشاف المنتجات")}</Link></main>}
