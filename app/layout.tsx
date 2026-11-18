import {LanguageProvider} from '../components/language';
import type { Metadata } from 'next';
import './globals.css';
import './admin.css';
import './seller.css';
import {DemoProvider} from '../components/demo-state';
import {SiteHeader,SiteFooter} from '../components/site-chrome';
export const metadata: Metadata = { title:'صَنْعة | من بيوت الإمارات، بكل حب',description:'صَنْعة منصة لاكتشاف المشاريع المنزلية الإماراتية ومنتجاتها، ومتابعة المتاجر والحرف المحلية.'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="ar" dir="rtl" suppressHydrationWarning><body><LanguageProvider><DemoProvider><SiteHeader/>{children}<SiteFooter/></DemoProvider></LanguageProvider></body></html>}
