import type {Language} from './content';
let language:Language='ar';
const listeners=new Set<()=>void>();
export const languageKey='sanaa-ui-language';
export function getLanguage(){return language}
export function subscribeLanguage(listener:()=>void){listeners.add(listener);return ()=>{listeners.delete(listener)}}
export function chooseLanguage(value:Language){language=value;if(typeof window!=='undefined'){try{localStorage.setItem(languageKey,value)}catch{}document.cookie=`sanaa-language=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;document.documentElement.lang=value;document.documentElement.dir=value==='ar'?'rtl':'ltr'}listeners.forEach(fn=>fn())}
