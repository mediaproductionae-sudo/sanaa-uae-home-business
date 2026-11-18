import {translate} from './translate';
import type {Language} from './content';
/** Pure templates for a future delivery service. This module never sends messages. */
export function orderNotification(language:Language,orderId:string,statusLabel:string){return language==='en'?{subject:`Order ${orderId} update`,message:`Your order ${orderId}: ${translate(statusLabel,language)}`}:{subject:`تحديث الطلب ${orderId}`,message:`حالة طلبك ${orderId}: ${translate(statusLabel,language)}`}}
