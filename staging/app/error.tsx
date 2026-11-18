'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="wrap inner-page stage-error"><h1>تعذّر تحميل بيانات Staging</h1><p>تحقق من إعداد الاتصال والمهاجرات ثم أعد المحاولة. لا تُعرض تفاصيل داخلية أو مفاتيح.</p><button className="primary" onClick={reset}>إعادة المحاولة</button><a className="text-button" href="/setup/">متطلبات الاتصال</a></main>}
