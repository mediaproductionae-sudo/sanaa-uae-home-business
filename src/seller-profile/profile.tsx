import { useEffect,useRef,useState,type InputHTMLAttributes } from 'react';
import { UserRound,MapPin,Landmark,ReceiptText,ShieldCheck,Upload,CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/sanaa/components/language';
import { emirateLabels } from '@/sanaa/lib/catalog';
import { emptyProfile,emirates,normalizePhone,validateProfile,type ProfileDraft } from './schema';
import { loadProfile,saveProfile,sendPhoneOtp,verifyPhoneOtp,uploadProfileFile,privateFileUrl,type ProfileRecord } from './api';
import './profile.css';
export function SellerPersonalProfile({accountId}:{accountId:string}){
 const {t,locale}=useLanguage();
 const [draft,setDraft]=useState<ProfileDraft>({...emptyProfile});const [record,setRecord]=useState<ProfileRecord|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[loadError,setLoadError]=useState(''),[notice,setNotice]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 const [otpPhone,setOtpPhone]=useState(''),[otp,setOtp]=useState(''),[cooldown,setCooldown]=useState(0),[avatarUrl,setAvatarUrl]=useState('');
 const alive=useRef(true),operation=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const change=<K extends keyof ProfileDraft>(key:K,value:ProfileDraft[K])=>{setDraft(d=>({...d,[key]:value}));setErrors(e=>({...e,[key]:''}));setNotice('')};
 const load=async()=>{setLoading(true);setLoadError('');try{const result=await loadProfile();if(alive.current){setRecord(result);setDraft(result.draft)}}catch(e){if(alive.current)setLoadError((e as Error).message)}finally{if(alive.current)setLoading(false)}};
 useEffect(()=>{setDraft({...emptyProfile});setRecord(null);void load()},[accountId]); // keyed by the authenticated account; never another user's id in an RPC.
 useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(n=>Math.max(0,n-1)),1000);return()=>clearTimeout(timer)},[cooldown]);
 useEffect(()=>{let live=true;setAvatarUrl('');if(draft.avatarPath)privateFileUrl(draft.avatarPath).then(url=>{if(live)setAvatarUrl(url)}).catch(()=>{});return()=>{live=false}},[draft.avatarPath]);
 const run=async(action:()=>Promise<void>)=>{if(operation.current)return;operation.current=true;setBusy(true);setNotice('');try{await action()}catch(e){if(alive.current)setNotice((e as Error).message)}finally{operation.current=false;if(alive.current)setBusy(false)}};
 const verified=!!record?.phoneConfirmed&&!!draft.phone&&normalizePhone(record.authPhone)===normalizePhone(draft.phone);
 const save=(complete:boolean)=>run(async()=>{
  const validation=validateProfile(draft,complete);if(!validation.ok){setErrors(validation.errors);setNotice('راجع الحقول المطلوبة.');return}
  if(complete&&!record?.emailConfirmed){setNotice('أكّد بريدك الإلكتروني أولاً.');return}
  if(complete&&!verified){setNotice('تحقق من رقم الهاتف قبل إكمال الملف.');return}
  const saved=await saveProfile(validation.data,complete);if(!alive.current)return;setRecord(saved);setDraft(saved.draft);setErrors({});setNotice(complete?'تم حفظ الملف الشخصي وإكماله.':'تم حفظ البيانات في حسابك.');
 });
 const textField=(key:Exclude<keyof ProfileDraft,'vatRegistered'|'emirate'|'preferredLanguage'>,label:string,required=false,props:InputHTMLAttributes<HTMLInputElement>={})=><label htmlFor={`seller-${key}`}>{t(label)}{required&&<span className="profile-required"> *</span>}<input {...props} id={`seller-${key}`} name={key} value={draft[key]} onChange={e=>change(key,e.target.value)} required={required} aria-invalid={!!errors[key]} aria-describedby={errors[key]?`seller-${key}-error`:undefined}/>{errors[key]&&<small id={`seller-${key}-error`} role="alert">{t(errors[key])}</small>}</label>;
 const attachment=(kind:'avatar'|'bank',label:string)=>{const key=kind==='avatar'?'avatarPath':'bankCertificatePath';return <div className="profile-upload"><label htmlFor={`seller-upload-${kind}`}><Upload size={18} aria-hidden="true"/>{t(label)}<input id={`seller-upload-${kind}`} type="file" accept={kind==='avatar'?'image/png,image/jpeg,image/webp':'application/pdf,image/png,image/jpeg'} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void run(async()=>{const path=await uploadProfileFile(file,kind);if(alive.current){change(key,path);setNotice('تم رفع المرفق. احفظ البيانات لربطه بالملف.')}})}}/></label><small>{t(kind==='avatar'?'صورة PNG أو JPEG أو WebP، حتى 5 ميغابايت.':'شهادة PDF أو PNG أو JPEG، حتى 5 ميغابايت.')}</small>{kind==='avatar'&&avatarUrl&&<img className="seller-personal-avatar" src={avatarUrl} alt={t('الصورة الشخصية')}/>}{draft[key]&&<button type="button" className="text-button" onClick={()=>void run(async()=>{const url=await privateFileUrl(draft[key]);const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.click()})}>{t('عرض المرفق المحفوظ')}</button>}</div>};
 return <section className="seller-personal-profile" aria-labelledby="seller-personal-heading">
  <div className="profile-intro"><h2 id="seller-personal-heading"><UserRound size={25} aria-hidden="true"/>{t('المعلومات الشخصية للبائع')}</h2><p>{t('أكمل بياناتك الشخصية وبيانات التواصل والبنك. إكمال الملف لا يعني اعتماد المتجر أو الترخيص.')}</p><span className="profile-status">{t(record?.completedAt?'الملف مكتمل':'الملف غير مكتمل')}</span></div>
  {loading&&<p role="status" aria-busy="true">{t('جارٍ تحميل الملف الشخصي…')}</p>}
  {loadError&&<div className="feedback" role="alert"><p>{t(loadError)}</p><button type="button" className="join" onClick={()=>void load()}>{t('إعادة المحاولة')}</button></div>}
  {notice&&<p className="feedback" role="status" aria-live="polite">{t(notice)}</p>}
  <form noValidate onSubmit={e=>{e.preventDefault();void save(true)}}>
   <fieldset className="profile-fields" disabled={loading||busy||!!loadError}>
    <fieldset className="profile-section"><legend><UserRound size={22} aria-hidden="true"/>{t('البيانات الأساسية')}</legend><div className="profile-grid">
     {textField('fullNameAr','الاسم الكامل بالعربية',true,{autoComplete:'name',dir:'rtl',maxLength:120})}{textField('fullNameEn','الاسم الكامل بالإنجليزية',true,{autoComplete:'name',dir:'ltr',maxLength:120})}
     <label>{t('البريد الإلكتروني')}<input type="email" dir="ltr" value={record?.email||''} readOnly/><small className={record?.emailConfirmed?'verified':''}>{t(record?.emailConfirmed?'البريد الإلكتروني مؤكد':'البريد الإلكتروني غير مؤكد')}</small></label>
     <label>{t('تاريخ التسجيل')}<input readOnly value={record?.registeredAt?new Date(record.registeredAt).toLocaleString(locale,{timeZone:'Asia/Dubai',dateStyle:'medium',timeStyle:'short'}):''}/><small>{t('يحدده النظام تلقائياً بتوقيت الإمارات.')}</small></label>
     <div className="profile-phone">{textField('phone','رقم الهاتف المتحرك',true,{type:'tel',dir:'ltr',autoComplete:'tel',placeholder:'+971 50 123 4567',maxLength:25})}<div className="action-row"><span className={verified?'verified':'profile-pending'}>{verified?<CheckCircle2 size={18} aria-hidden="true"/>:<ShieldCheck size={18} aria-hidden="true"/>}{t(verified?'رقم الهاتف مؤكد':'رقم الهاتف غير مؤكد')}</span><button type="button" className="join" disabled={verified||cooldown>0} onClick={()=>void run(async()=>{const phone=normalizePhone(draft.phone);if(!/^\+[1-9]\d{7,14}$/.test(phone)){setErrors(e=>({...e,phone:'أدخل رقم هاتف بصيغة دولية صحيحة.'}));return}await sendPhoneOtp(phone);change('phone',phone);setOtpPhone(phone);setCooldown(60);setNotice('تم إرسال رمز التحقق إلى الهاتف.')})}>{t(cooldown>0?'يمكن إعادة الإرسال بعد':'إرسال رمز التحقق')}{cooldown>0?` ${cooldown}`:''}</button></div>
      {otpPhone&&otpPhone===normalizePhone(draft.phone)&&!verified&&<div className="profile-otp"><label htmlFor="seller-phone-code">{t('رمز التحقق')}<input id="seller-phone-code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" value={otp} maxLength={10} onChange={e=>setOtp(e.target.value)}/></label><button type="button" className="join" onClick={()=>void run(async()=>{if(!/^\d{6,10}$/.test(otp)){setNotice('أدخل رمز التحقق المرسل إلى هاتفك.');return}await verifyPhoneOtp(otpPhone,otp);const fresh=await loadProfile();if(!fresh.phoneConfirmed||normalizePhone(fresh.authPhone)!==otpPhone)throw new Error('يلزم استكمال التحقق من الهاتف حسب إعدادات الأمان.');if(alive.current){setRecord(fresh);setOtp('');setOtpPhone('');setNotice('تم تأكيد رقم الهاتف.')}})}>{t('تأكيد رقم الهاتف')}</button></div>}
     </div>
     <label htmlFor="seller-language">{t('اللغة المفضلة')}<select id="seller-language" value={draft.preferredLanguage} onChange={e=>change('preferredLanguage',e.target.value as 'ar'|'en')}><option value="ar">العربية</option><option value="en">English</option></select></label>
     {attachment('avatar','الصورة الشخصية — اختياري')}
    </div></fieldset>
    <fieldset className="profile-section"><legend><MapPin size={22} aria-hidden="true"/>{t('العنوان')}</legend><div className="profile-grid">
     <label htmlFor="seller-emirate">{t('الإمارة')}<span className="profile-required"> *</span><select id="seller-emirate" required value={draft.emirate} onChange={e=>change('emirate',e.target.value as ProfileDraft['emirate'])} aria-invalid={!!errors['emirate']}><option value="">{t('اختر الإمارة')}</option>{emirates.map(code=><option value={code} key={code}>{t(emirateLabels[code])}</option>)}</select>{errors['emirate']&&<small role="alert">{t(errors['emirate'])}</small>}</label>
     {textField('cityArea','المدينة والمنطقة',true,{autoComplete:'address-level2',maxLength:160})}{textField('buildingName','اسم البناية',true,{autoComplete:'address-line1',maxLength:120})}{textField('buildingNumber','رقم البناية — اختياري',false,{autoComplete:'address-line2',maxLength:30})}
    </div></fieldset>
    <fieldset className="profile-section"><legend><Landmark size={22} aria-hidden="true"/>{t('البيانات البنكية')}</legend><p>{t('اسم صاحب الحساب البنكي إلزامي قبل صرف المستحقات. إدخال هذه البيانات لا ينفذ أي تحويل مالي.')}</p><div className="profile-grid">
     {textField('bankHolder','اسم صاحب الحساب البنكي',false,{maxLength:120})}{textField('bankName','اسم البنك',true,{maxLength:120})}{textField('iban','رقم IBAN',true,{dir:'ltr',placeholder:'AE…',maxLength:40,autoComplete:'off'})}{attachment('bank','شهادة الحساب البنكي — عند الحاجة')}
    </div></fieldset>
    <fieldset className="profile-section"><legend><ReceiptText size={22} aria-hidden="true"/>{t('ضريبة القيمة المضافة')}</legend><div className="profile-grid"><label htmlFor="seller-vat">{t('التسجيل في ضريبة القيمة المضافة')}<select id="seller-vat" value={draft.vatRegistered?'yes':'no'} onChange={e=>change('vatRegistered',e.target.value==='yes')}><option value="no">{t('لا')}</option><option value="yes">{t('نعم')}</option></select></label>{draft.vatRegistered&&textField('trn','الرقم الضريبي TRN',true,{dir:'ltr',inputMode:'numeric',maxLength:15})}</div></fieldset>
    <p className="profile-privacy">{t('بياناتك البنكية ومرفقاتك خاصة بحسابك ولا تظهر للمتعاملين أو للبائعين الآخرين.')}</p>
    <div className="profile-actions"><button className="primary" type="submit">{t(busy?'جارٍ الحفظ…':'حفظ وإكمال الملف')}</button><button className="join" type="button" onClick={()=>void save(false)}>{t('حفظ البيانات كمسودة')}</button></div>
   </fieldset>
  </form>
 </section>;
}
