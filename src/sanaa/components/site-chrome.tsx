// @ts-nocheck -- ported verbatim from the Codex project; original typing assumptions differ from this tsconfig.


import {LanguageSwitch} from '@/sanaa/components/language';
import {useLanguage} from '@/sanaa/components/language';

import {useState,useRef} from 'react';
import {usePathname,useRouter} from '@/sanaa/next-shim';
import {Link} from '@/sanaa/next-shim';
import {Heart,ShoppingCart,ArrowUpLeft,Menu,X} from 'lucide-react';
import {useDemo} from '@/sanaa/components/demo-state';
import {DeliveryNavLinks} from '@/delivery/navigation';
export const appLinks=[['/','الرئيسية'],['/stores/','المتاجر'],['/products/','المنتجات'],['/categories/','التصنيفات'],['/favorites/','المفضلة'],['/cart/','السلة'],['/login/','تسجيل الدخول'],['/register/','إنشاء حساب'],['/profile/','الملف الشخصي'],['/orders/','الطلبات'],['/complaints/','الشكاوى'],['/seller/dashboard/','لوحة البائع'],['/admin/dashboard/','الإدارة']];
const memberOnly=['/profile/','/orders/','/complaints/'];
export function linksFor(user:any){return appLinks.filter(([h])=>{if(['/login/','/register/'].includes(h))return !user;if(memberOnly.includes(h))return !!user;if(h==='/seller/dashboard/')return user?.role==='seller';if(h==='/admin/dashboard/')return !!user?.isAdmin;return true})}
export function AppLinks(){
 const {t:_t}=useLanguage();const path=usePathname();const {state,account}=useDemo();
 const currentPath=path.replace(/\/$/,'');const customer=!!account&&state.user?.role==='buyer';
 const sellerProfile=currentPath==='/profile'&&!!account&&state.user?.role==='seller';
 const customerProfile=currentPath==='/profile'&&customer;const customerProducts=currentPath==='/products'&&customer;
 const visiblePaths=sellerProfile?['/','/profile/','/seller/dashboard/']:customerProfile?['/','/profile/','/orders/','/complaints/']:customerProducts?['/','/stores/','/products/','/categories/','/profile/','/orders/','/complaints/']:null;
 const links=linksFor(account?state.user:null).filter(([href])=>!visiblePaths||visiblePaths.includes(href));
 return <nav className="app-links" aria-label={_t("روابط المنصة")}>{links.map(([href,title])=><Link key={href} href={href} aria-current={currentPath===href.replace(/\/$/,'')?'page':undefined}>{_t((customerProfile||customerProducts)&&href==='/complaints/'?'تقديم شكوى':title)}</Link>)}{!sellerProfile&&!customerProfile&&!customerProducts&&<DeliveryNavLinks/>}</nav>
}
function BrandLogo(){return <svg className="brand-logo" viewBox="105 46 668 501" role="img" aria-label="رزقنا | REZQNA UAE"><image href="/images/rezqna-logo.svg" width="877.56" height="592.2"/></svg>}
export function SiteHeader(){const {t:_t,language}=useLanguage();const [menu,setMenu]=useState(false);const menuRef=useRef<HTMLButtonElement>(null);const {state,account}=useDemo();const router=useRouter();const cartCount=state.cart.reduce((total,line)=>total+line.quantity,0);return <> <a className="skip" href="#main">{_t("انتقل إلى المحتوى")}</a>
 <div className="demo"><span className="dot"/>{_t(" من بيوت الإمارات، بكل حب.")}</div>
 <header className="header wrap"><a href="/" className="brand" aria-label={_t("الرئيسية")}><BrandLogo/></a><nav className={menu?'nav open':'nav'} aria-label={_t("القائمة الرئيسية")} id="site-nav" onKeyDown={e=>{if(e.key==='Escape'){setMenu(false);menuRef.current?.focus()}}}><a href="/products/" onClick={()=>setMenu(false)}>{_t("اكتشف رزقنا")}</a><a href="/stores/" onClick={()=>setMenu(false)}>{_t("متاجر من بلادي")}</a><a href="/#stories" onClick={()=>setMenu(false)}>{_t("حكايات رزقنا")}</a><a href="/#trust" onClick={()=>setMenu(false)}>{_t("الثقة والسلامة")}</a><div className="mobile-app-links"><DeliveryNavLinks/>{linksFor(account?state.user:null).slice(3).map(([href,title])=><Link key={href} href={href} onClick={()=>setMenu(false)}>{_t(title)}</Link>)}</div></nav><div className="header-actions"><LanguageSwitch/><div className="header-shopping"><button className={state.favorites.length?'icon-btn header-favorites has-favorites':'icon-btn header-favorites'} aria-label={_t(`المفضلة: ${state.favorites.length}`)} onClick={()=>router.push('/favorites/')}><Heart size={20} fill={state.favorites.length?'currentColor':'#fff'}/><span className="count">{_t(state.favorites.length)}</span></button><Link href="/cart/" className="icon-btn header-cart" aria-label={`${_t("السلة")}: ${cartCount}`}><ShoppingCart size={20} aria-hidden="true"/>{cartCount>0&&<span className="count" aria-hidden="true">{_t(cartCount)}</span>}</Link></div>{state.user?<button className="join" onClick={()=>router.push(state.user.role==='seller'?'/seller/dashboard/':'/profile/')}>{state.user.name} <ArrowUpLeft size={17}/></button>:<button className="join" onClick={()=>router.push('/register/?role=seller')}>{_t("ابدأ حكايتك ")}<ArrowUpLeft size={17}/></button>}<button className="mobile-toggle icon-btn" ref={menuRef} aria-controls="site-nav" aria-label={_t("القائمة")} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div></header>
</>}
export function SiteFooter(){const {t:_t,language}=useLanguage();const [about,setAbout]=useState(false);return <><footer className="wrap footer"><a href="/" className="brand" aria-label={_t("الرئيسية")}><BrandLogo/></a><p>{_t("من بيوت الإمارات، بكل حب.")}</p><span>{_t("© ٢٠٢٦ رزقنا · جميع الحقوق محفوظة")}</span><button className="text-button" onClick={()=>setAbout(true)}>{_t("عن رزقنا ")}<ArrowUpLeft size={16}/></button></footer>{about&&<div className="inline-about wrap" role="status"><p>{_t("رزقنا تجمع المشاريع المنزلية في الإمارات، وتمنح أصحابها مساحة لعرض منتجاتهم ومشاركة حكاياتهم.")}</p><button className="text-button" onClick={()=>setAbout(false)}>{_t("إغلاق ")}<X size={18}/></button></div>}</>}
