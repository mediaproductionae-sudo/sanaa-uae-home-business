'use client';
import {useEffect,useRef} from 'react';
import {Trash2,X} from 'lucide-react';
import {ContentText,useLanguage} from './language';
import type {Store} from '../lib/seller-data';
export function ConfirmStoreRemoval({store,onCancel,onConfirm}:{store:Store;onCancel:()=>void;onConfirm:()=>void}){
 const {t}=useLanguage(),ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement;ref.current?.showModal();return()=>previous?.focus()},[]);
 return <dialog ref={ref} className="seller-confirm" aria-labelledby="store-removal-title" aria-describedby="store-removal-description" onCancel={onCancel}>
  <button type="button" className="seller-icon close" aria-label={t('إغلاق')} onClick={onCancel}><X size={20}/></button>
  <h2 id="store-removal-title">{t('هل أنت متأكد من عملية حذف المتجر؟')}</h2>
  <p><ContentText item={store}/></p>
  <p id="store-removal-description">{t('سيُزال المتجر وجميع منتجاته من العرض والسلة والمفضلة. ستبقى سجلات الطلبات والشكاوى السابقة محفوظة. لا يمكن التراجع عن الحذف من هذه الشاشة.')}</p>
  <div className="seller-actions"><button type="button" className="seller-danger" onClick={onConfirm}><Trash2 size={18}/>{t('تأكيد حذف المتجر')}</button><button type="button" className="seller-secondary" autoFocus onClick={onCancel}>{t('إلغاء')}</button></div>
 </dialog>
}
