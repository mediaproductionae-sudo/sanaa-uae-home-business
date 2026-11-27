import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';
import {UserRound,MapPin,ShieldCheck} from 'lucide-react';
import {useLanguage} from '@/sanaa/components/language';
import {emirateLabels} from '@/sanaa/lib/catalog';
import {normalizePhone} from '@/account/phone-number';
import {customerProfileSchema,emptyCustomerProfile,emirates,type CustomerProfileDraft,type SavedCustomerProfile} from './schema';
import {loadCustomerProfile,saveCustomerProfile,sendPhoneOtp,verifyPhoneOtp} from './api';
import './profile.css';
export function CustomerAccountProfile({accountId,onSaved}:{accountId:string;onSaved:(name:string)=>void}){
 const {t}=useLanguage();const [draft,setDraft]=useState<CustomerProfileDraft>({...emptyCustomerProfile}),[record,setRecord]=useState<SavedCustomerProfile|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[loadError,setLoadError]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 const [otpPhone,setOtpPhone]=useState(''),[otp,setOtp]=useState(''),[cooldown,setCooldown]=useState(0);
 const alive=useRef(true),lock=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const load=async()=>{setLoading(true);setLoadError('');try{const result=await loadCustomerProfile();if(alive.current){setRecord(result);setDraft(result.draft)}}catch(e){if(alive.current)setLoadError((e as Error).message)}finally{if(alive.current)setLoading(false)}};
 useEffect(()=>{setDraft({...emptyCustomerProfile});setRecord(null);void load()},[accountId]);
 useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(n=>Math.max(0,n-1)),1000);return()=>clearTimeout(timer)},[cooldown]);
 const change=<K extends keyof CustomerProfileDraft>(key:K,value:CustomerProfileDraft[K])=>{setDraft(d=>({...d,[key]:value}));setErrors(e=>({...e,[key]:''}));setNotice('');setError('')};
 const run=async(action:()=>Promise<void>)=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');setNotice('');try{await action()}catch(e){if(alive.current)setError((e as Error).message)}finally{lock.current=false;if(alive.current)setBusy(false)}};
 const verified=!!record?.phoneConfirmed&&!!draft.phone&&normalizePhone(record.authPhone)===normalizePhone(draft.phone);
 const field=(key:Exclude<keyof CustomerProfileDraft,'emirate'>,label:string,required:boolean,props:InputHTMLAttributes<HTMLInputElement>={})=><label htmlFor={'customer-'+key}>{t(label)}{required&&<span className="customer-required"> *</span>}<input {...props} id={'customer-'+key} value={draft[key]} required={required} onChange={e=>change(key,e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key]?'customer-'+key+'-error':undefined}/>{errors[key]&&<small id={'customer-'+key+'-error'} role="alert">{t(errors[key])}</small>}</label>;
 const save=()=>run(async()=>{const parsed=customerProfileSchema.safeParse(draft);if(!parsed.success){setErrors(Object.fromEntries(parsed.error.issues.map(i=>[i.path[0],i.path[0]==='emirate'?'هذا الحقل إلزامي.':i.message])));setError('راجع معلومات الحساب والعنوان قبل الحفظ.');return}if(!record?.emailConfirmed)throw new Error('أكّد بريدك الإلكتروني أولاً.');if(!verified)throw new Error('تحقق من رقم الهاتف قبل حفظ التغييرات.');const saved=await saveCustomerProfile(parsed.data);if(alive.current){setDraft(saved.draft);setRecord(saved);setErrors({});setNotice('تم حفظ معلومات الحساب والعنوان.');onSaved(saved.draft.displayName)}});
 return <section className="customer-account" aria-labelledby="customer-account-title">
  <h2 id="customer-account-title"><UserRound size={24} aria-hidden="true"/>{t('حساب متعامل')}</h2>
  {loading&&<p role="status" aria-busy="true">{t('جارٍ تحميل معلومات الحساب…')}</p>}
  {loadError&&<div className="feedback" role="alert"><p>{t(loadError)}</p><button type="button" className="join" disabled={loading} onClick={()=>void load()}>{t('إعادة المحاولة')}</button></div>}
  {error&&<p className="feedback" role="alert">{t(error)}</p>}{notice&&<p className="feedback" role="status">{t(notice)}</p>}
  <form noValidate onSubmit={e=>{e.preventDefault();void save()}}><fieldset className="customer-account-fields" disabled={loading||busy||!!loadError}>
   <fieldset className="customer-account-section"><legend><UserRound size={22} aria-hidden="true"/>{t('معلومات الحساب والتواصل')}</legend><div className="customer-account-grid">
    {field('displayName','اسم العرض',true,{autoComplete:'nickname',minLength:2,maxLength:80})}
    <label>{t('البريد الإلكتروني')}<span className="customer-required"> *</span><input type="email" dir="ltr" value={record?.email||''} readOnly autoComplete="email"/><small className={record?.emailConfirmed?'customer-verified':''}>{t(record?.emailConfirmed?'البريد الإلكتروني مؤكد':'البريد الإلكتروني غير مؤكد')}</small></label>
    <div className="customer-phone">{field('phone','رقم الهاتف المتحرك',true,{type:'tel',autoComplete:'tel',dir:'ltr',maxLength:25,placeholder:'+971 50 123 4567'})}<div className="customer-otp-actions"><span className={verified?'customer-verified':''}><ShieldCheck size={18} aria-hidden="true"/>{t(verified?'رقم الهاتف مؤكد':'رقم الهاتف غير مؤكد')}</span><button className="join" type="button" disabled={verified||cooldown>0} onClick={()=>void run(async()=>{const phone=normalizePhone(draft.phone);if(!/^\+[1-9]\d{7,14}$/.test(phone))throw new Error('أدخل رقم هاتف بصيغة دولية صحيحة.');await sendPhoneOtp(phone);if(alive.current){change('phone',phone);setOtpPhone(phone);setCooldown(60);setNotice('تم إرسال رمز التحقق إلى الهاتف.')}})}>{t(cooldown>0?'يمكن إعادة الإرسال بعد':'إرسال رمز التحقق')}{cooldown>0?' '+cooldown:''}</button></div>
     {otpPhone===normalizePhone(draft.phone)&&!!otpPhone&&!verified&&<div className="customer-phone-code"><label htmlFor="customer-otp">{t('رمز التحقق')}<input id="customer-otp" dir="ltr" inputMode="numeric" autoComplete="one-time-code" value={otp} maxLength={10} onChange={e=>setOtp(e.target.value)}/></label><button type="button" className="join" onClick={()=>void run(async()=>{if(!/^\d{6,10}$/.test(otp))throw new Error('أدخل رمز التحقق المرسل إلى هاتفك.');await verifyPhoneOtp(otpPhone,otp);const fresh=await loadCustomerProfile();if(!fresh.phoneConfirmed||normalizePhone(fresh.authPhone)!==otpPhone)throw new Error('يلزم استكمال التحقق من الهاتف حسب إعدادات الأمان.');if(alive.current){setRecord(fresh);setOtp('');setOtpPhone('');setNotice('تم تأكيد رقم الهاتف.')}})}>{t('تأكيد رقم الهاتف')}</button></div>}
    </div>
   </div></fieldset>
   <fieldset className="customer-account-section"><legend><MapPin size={22} aria-hidden="true"/>{t('عنوان التوصيل')}</legend>
    {record?.legacyAddress&&<p className="customer-legacy-address">{t('العنوان المحفوظ سابقاً:')} <bdi dir="auto">{record.legacyAddress}</bdi></p>}
    <div className="customer-account-grid">
     <label htmlFor="customer-emirate">{t('الإمارة')}<span className="customer-required"> *</span><select id="customer-emirate" required value={draft.emirate} onChange={e=>change('emirate',e.target.value as CustomerProfileDraft['emirate'])} aria-invalid={!!errors['emirate']}><option value="">{t('اختر الإمارة')}</option>{emirates.map(code=><option key={code} value={code}>{t(emirateLabels[code])}</option>)}</select>{errors['emirate']&&<small role="alert">{t(errors['emirate'])}</small>}</label>
     {field('region','المنطقة',true,{autoComplete:'address-level2',maxLength:160})}
     {field('street','اسم الشارع — اختياري',false,{autoComplete:'address-line1',maxLength:160})}
     {field('home','رقم المنزل أو الفيلا أو الشقة',true,{autoComplete:'address-line2',maxLength:80})}
     {field('buildingNumber','رقم البناية — اختياري',false,{maxLength:40})}
    </div>
   </fieldset>
   <div className="customer-account-save"><button className="primary" type="submit">{t(busy?'جارٍ الحفظ…':'حفظ التغييرات')}</button></div>
  </fieldset></form>
 </section>;
}
