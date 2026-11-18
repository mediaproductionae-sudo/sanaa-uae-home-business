'use client';
import {useLanguage} from '../../components/language';

export default function ErrorPage({reset}:{reset:()=>void}){const {t:_t,language}=useLanguage();return <main id="main" className="wrap inner-page stage-error"><h1>{_t("تعذّر تحميل بيانات Staging")}</h1><p>{_t("تحقق من إعداد الاتصال والمهاجرات ثم أعد المحاولة. لا تُعرض تفاصيل داخلية أو مفاتيح.")}</p><button className="primary" onClick={reset}>{_t("إعادة المحاولة")}</button><a className="text-button" href="/setup/">{_t("متطلبات الاتصال")}</a></main>}
