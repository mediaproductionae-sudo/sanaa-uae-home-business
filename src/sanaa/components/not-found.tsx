// @ts-nocheck -- ported verbatim from the Codex project; original typing assumptions differ from this tsconfig.

import {useLanguage} from '@/sanaa/components/language';
import {Link} from '@/sanaa/next-shim';
export default function NotFound(){const {t:_t,language}=useLanguage();return <main id="main" className="wrap inner-page"><div className="empty"><h1>{_t("الصفحة غير موجودة")}</h1><p>{_t("قد يكون معرّف المنتج أو المتجر غير صحيح. يمكنك متابعة التصفح من الاختيارات .")}</p><div className="action-row"><Link className="primary" href="/products/">{_t("استكشاف المنتجات")}</Link><Link className="join" href="/stores/">{_t("استكشاف المتاجر")}</Link><Link className="text-button" href="/">{_t("العودة للرئيسية")}</Link></div></div></main>}
