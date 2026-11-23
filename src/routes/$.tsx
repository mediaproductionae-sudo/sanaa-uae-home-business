import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/sanaa/components/admin";
import SellerDashboard from "@/sanaa/components/seller-dashboard";
import DemoPage from "@/sanaa/components/demo-page";
import NotFound from "@/sanaa/components/not-found";
import { useLanguage } from "@/sanaa/components/language";
import { useDemo } from "@/sanaa/components/demo-state";
import { adminSections } from "@/sanaa/lib/governance";
import { routeSegments, pageTitles, products, stores } from "@/sanaa/lib/demo-data";

const clean = (s?: string) => (s ?? "").replace(/^\/+|\/+$/g, "");
function titleFor(path: string) {
  const slug = path.split("/") as [string, string];
  return (
    pageTitles[path] ||
    (slug[0] === "admin" ? adminSections.find((x) => x[0] === slug[1])?.[1] : undefined) ||
    (slug[0] === "product" ? products.find((p) => String(p.id) === slug[1])?.name : slug[0] === "store" ? stores.find((s) => String(s.id) === slug[1])?.name : undefined) ||
    "صفحة غير موجودة"
  );
}

export const Route = createFileRoute("/$")({
  head: ({ params }) => {
    const t = `${titleFor(clean(params._splat))} | صَنْعه`;
    const d = "صَنْعه منصة لاكتشاف المشاريع المنزلية الإماراتية ومنتجاتها، ومتابعة المتاجر والحرف المحلية.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: SlugPage,
});

function SlugPage() {
  const { _splat } = Route.useParams();
  const path = clean(_splat);
  const slug = path.split("/") as [string, string];
  const known = routeSegments.some((r) => r.join("/") === path) || (slug.length === 2 && ["product", "store"].includes(slug[0]) && /^\d+$/.test(slug[1]));
  const { state, account, ready } = useDemo() as any;
  const { t } = useLanguage();
  if (!known) return <NotFound />;
  if (slug[0] === "admin" || slug[0] === "seller") {
    const ok = account && (slug[0] === "admin" ? state.user?.isAdmin : state.user?.role === "seller");
    if (!ok) return <main id="main" className="wrap inner-page"><h1>{t("هذه الصفحة غير متاحة")}</h1><p>{t(ready && account ? "حسابك لا يملك صلاحية الدخول إلى هذه الصفحة." : "سجّل الدخول بحساب مخوّل للوصول إلى هذه الصفحة.")}</p><a className="text-button" href="/login/">{t("تسجيل الدخول")}</a></main>;
  }
  if (slug[0] === "admin") return <Admin section={slug[1]} />;
  if (slug[0] === "seller") return <SellerDashboard section={slug[1]} />;
  return <DemoPage key={path} route={path} />;
}
