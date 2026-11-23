// @ts-nocheck
'use client';
import {ShieldCheck,BadgeCheck,ListChecks,ArrowUpLeft} from 'lucide-react';
import {useLanguage} from '@/sanaa/components/language';

export function TrustStrip({onLearnMore}:{onLearnMore:()=>void}){
 const {t}=useLanguage();
 return <section className="trust trust-strip wrap" id="trust" aria-labelledby="trust-title">
  <div className="trust-item trust-intro">
   <span className="trust-icon" aria-hidden="true"><ShieldCheck size={25} strokeWidth={1.7}/></span>
   <div><h2 id="trust-title">{t('ثقة تبدأ بالوضوح.')}</h2><p>{t('درع الثقة المجتمعية، لتجربة أكثر اطمئناناً.')}</p></div>
  </div>
  <div className="trust-item trust-detail">
   <span className="trust-icon" aria-hidden="true"><BadgeCheck size={25} strokeWidth={1.7}/></span>
   <div><h3>{t('تحقق واضح')}</h3><p>{t('مراجعة معلومات المتجر ومستنداته بوضوح.')}</p></div>
  </div>
  <div className="trust-item trust-detail">
   <span className="trust-icon" aria-hidden="true"><ListChecks size={25} strokeWidth={1.7}/></span>
   <div><h3>{t('تفاصيل واضحة')}</h3><p>{t('تصفح المنتجات وقارن تفاصيلها وأسعارها.')}</p></div>
  </div>
  <button className="text-button trust-learn-more" onClick={onLearnMore}>{t('اعرف المزيد')}<ArrowUpLeft size={18} aria-hidden="true"/></button>
 </section>
}
