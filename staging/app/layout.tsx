import '../../app/globals.css';
import {LanguageProvider} from '../../components/language';
import {serverLanguage} from '../lib/language';
import '../../app/admin.css';
import '../../app/seller.css';
import './staging.css';
import {Header,Footer} from '../components/chrome';
import {config} from '../lib/config';
import {session} from '../lib/supabase';
export const metadata={title:'صَنْعة | Sanaa UAE — Staging 4B',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){const {language}=await serverLanguage();const member=await session();return <html lang={language} dir={language==='ar'?'rtl':'ltr'} suppressHydrationWarning><body><LanguageProvider initialLanguage={language} serverRendered signedIn={!!member}><Header configured={!!config()} signedIn={!!member} seller={member?.roles.includes('seller')||false}/>{children}<Footer/></LanguageProvider></body></html>}
