import Link from 'next/link';
export default function NotFound(){return <main id="main" className="wrap inner-page stage-error"><h1>الصفحة أو العنصر غير متاح</h1><p>قد يكون العنصر غير منشور أو لا يملك الحساب صلاحية عرضه.</p><Link href="/products/" className="primary">استكشاف المنتجات</Link></main>}
