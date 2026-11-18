import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {adminSections} from '../../lib/governance';
import Admin from '../../components/admin';
import SellerDashboard from '../../components/seller-dashboard';
import DemoPage from '../../components/demo-page';
import {routeSegments,pageTitles,products,stores} from '../../lib/demo-data';
export const dynamicParams=false;
export function generateStaticParams(){return routeSegments.map(slug=>({slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const path=slug.join('/');const title=pageTitles[path]||(slug[0]==='admin'?adminSections.find(x=>x[0]===slug[1])?.[1]:undefined)||(slug[0]==='product'?products.find(p=>String(p.id)===slug[1])?.name:stores.find(s=>String(s.id)===slug[1])?.name)||'صفحة غير موجودة';return {title:`${title} | صَنْعة`}}
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;if(!routeSegments.some(r=>r.join('/')===slug.join('/')))notFound();return <Suspense fallback={<main id="main" className="wrap inner-page" aria-busy="true">جارٍ تحميل الصفحة…</main>}>{slug[0]==='admin'?<Admin section={slug[1]}/>:slug[0]==='seller'?<SellerDashboard section={slug[1]}/>:<DemoPage route={slug.join('/')}/>}</Suspense>}
