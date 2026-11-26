import {useEffect,useRef,useState} from 'react';
import {useLanguage} from '@/sanaa/components/language';
import {contentField,type LocalizedContent} from '@/sanaa/lib/i18n/content';
import {loadComplaints,submitComplaint} from './api';
import {complaintRequest,validateComplaint,type ComplaintInput,type CustomerComplaint} from './schema';
import './complaints.css';
type Store=LocalizedContent&{id:number;dbId?:string;active:boolean};
const states:Record<string,string>={new:'جديدة',reviewing:'قيد المراجعة',in_review:'قيد المراجعة',processing:'قيد المعالجة',needs_information:'تحتاج استكمال',resolved:'تمت المعالجة',closed:'مغلقة',rejected:'مرفوضة',escalated:'مصعّدة'};
export function CustomerComplaints({accountId,stores,initialStore}:{accountId:string;stores:Store[];initialStore?:string}){
 const {t,language,locale}=useLanguage();const [selected,setSelected]=useState(''),[body,setBody]=useState(''),[items,setItems]=useState<CustomerComplaint[]>([]);
 const [loading,setLoading]=useState(true),[loadError,setLoadError]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const pending=useRef<ComplaintInput|null>(null),lock=useRef(false),alive=useRef(true),storeEdited=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 useEffect(()=>{setItems([]);setBody('');setSelected('');storeEdited.current=false;pending.current=null;void refresh()},[accountId]);
 useEffect(()=>{if(storeEdited.current||!initialStore||!stores.length)return;const found=stores.find(s=>s.active&&s.dbId&&(String(s.id)===initialStore||s.dbId===initialStore));if(found){setSelected(found.dbId!)}},[stores,initialStore]);
 const refresh=async()=>{setLoading(true);setLoadError('');try{const records=await loadComplaints();if(alive.current)setItems(records)}catch(e){if(alive.current)setLoadError((e as Error).message)}finally{if(alive.current)setLoading(false)}};
 const options=stores.filter(s=>s.active&&s.dbId);
 const send=async()=>{
  if(lock.current||loading||loadError)return;
  const request=complaintRequest(pending.current,selected,body);const validated=validateComplaint(request);
  if(!validated.success||!options.some(s=>s.dbId===selected)){setError('اختر المتجر واكتب وصفاً من 10 إلى 4000 حرف.');setNotice('');return}
  pending.current=request;lock.current=true;setBusy(true);setError('');setNotice('');
  try{const saved=await submitComplaint(validated.data);if(alive.current){setItems(all=>[saved,...all.filter(c=>c.id!==saved.id)].slice(0,100));setBody('');pending.current=null;setNotice(saved.id)}}catch(e){if(alive.current)setError((e as Error).message)}finally{lock.current=false;if(alive.current)setBusy(false)}
 };
 return <section className="customer-complaints">
  <section className="demo-panel form-panel"><h2>{t('تقديم شكوى')}</h2>
   {loading&&<p role="status" aria-busy="true">{t('جارٍ تحميل الشكاوى…')}</p>}
   {loadError&&<div className="feedback" role="alert"><p>{t(loadError)}</p><button className="join" type="button" disabled={loading} onClick={()=>void refresh()}>{t('إعادة المحاولة')}</button></div>}
   {error&&<p className="feedback" role="alert">{t(error)}</p>}{notice&&<p className="feedback" role="status">{t('تم إرسال الشكوى بنجاح. رقم المتابعة:')} <bdi dir="ltr">{notice}</bdi></p>}
   <form noValidate onSubmit={e=>{e.preventDefault();void send()}}><fieldset disabled={busy||loading||!!loadError}>
    <label htmlFor="complaint-store">{t('المتجر')}<select id="complaint-store" required value={selected} onChange={e=>{storeEdited.current=true;setSelected(e.target.value);setError('');setNotice('')}}><option value="">{t('اختر المتجر')}</option>{options.map(s=><option value={s.dbId} key={s.dbId}>{contentField(s,'name',language)}</option>)}</select></label>
    {!loading&&!options.length&&<p role="status">{t('لا توجد متاجر متاحة حالياً.')}</p>}
    <label htmlFor="complaint-body">{t('نص الشكوى')}<textarea id="complaint-body" dir="auto" required minLength={10} maxLength={4000} rows={6} value={body} onChange={e=>{setBody(e.target.value);setError('');setNotice('')}}/></label>
    <small>{t('من 10 إلى 4000 حرف.')}</small><button className="primary" type="submit" disabled={!options.length}>{t(busy?'جارٍ إرسال الشكوى…':'إرسال الشكوى')}</button>
   </fieldset></form>
  </section>
  <div className="complaint-list-heading"><h2>{t('شكاوي')}</h2><button className="text-button" type="button" disabled={loading||busy} onClick={()=>void refresh()}>{t('تحديث الشكاوى')}</button></div>
  {!loading&&!loadError&&!items.length&&<p>{t('لم تقدم أي شكوى بعد.')}</p>}
  {!loadError&&items.map(c=><article className="demo-panel" key={c.id}><h3><bdi dir="auto">{c.storeName}</bdi></h3><p>{t('رقم الشكوى:')} <bdi dir="ltr">{c.id}</bdi></p><p className="complaint-body" dir="auto">{c.body}</p><p>{t(states[c.status]||c.status)}</p><time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString(locale,{timeZone:'Asia/Dubai',dateStyle:'medium',timeStyle:'short'})}</time>{c.replies.map(r=><div className="complaint-reply" key={r.id}><strong>{t('رد على الشكوى')}</strong><p dir="auto">{r.note}</p></div>)}</article>)}
 </section>;
}
