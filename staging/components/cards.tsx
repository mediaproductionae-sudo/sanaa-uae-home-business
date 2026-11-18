import {contentField} from '../../lib/i18n/content';

import {serverLanguage} from '../lib/language';
import Link from 'next/link';
import {ArrowUpLeft,MapPin} from 'lucide-react';
import type {Product} from '../lib/data';
export async function Products({items}:{items:Product[]}){const {t:_t,language}=await serverLanguage();return items.length?<div className="products">{items.map(p=><article className="product" key={p.id}><div className="product-image"><Link className="image-button" href={`/product/${p.id}/`}><img src={p.imageUrl} alt={_t(p.name)} loading="lazy"/></Link><span className="product-category">{_t(p.category)}</span></div><div className="product-store"><Link href={`/store/${p.storeId}/`}><bdi dir="auto">{p.storeContent?contentField(p.storeContent,'name',language):p.store}</bdi></Link><span><MapPin size={12}/>{_t(p.emirate)}</span></div><Link className="product-title" href={`/product/${p.id}/`}><bdi dir="auto">{contentField(p,'name',language)}</bdi></Link><div className="product-bottom"><span><strong>{_t(p.price.toFixed(2))}</strong>{_t(" د.إ")}</span><Link className="round-arrow" aria-label={_t(`عرض ${contentField(p,'name',language)}`)} href={`/product/${p.id}/`}><ArrowUpLeft size={17}/></Link></div></article>)}</div>:<section className="empty"><h2>{_t("لا توجد منتجات منشورة مطابقة")}</h2><p>{_t("جرّب تغيير البحث أو التصنيف.")}</p></section>}
