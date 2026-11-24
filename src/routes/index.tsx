import { createFileRoute } from "@tanstack/react-router";
import Home from "@/sanaa/components/home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رزقنا | Rezqna UAE" },
      { name: "description", content: "رزقنا منصة لاكتشاف المشاريع المنزلية الإماراتية ومنتجاتها، ومتابعة المتاجر والحرف المحلية." },
      { property: "og:title", content: "رزقنا | Rezqna UAE" },
      { property: "og:description", content: "رزقنا منصة لاكتشاف المشاريع المنزلية الإماراتية ومنتجاتها، ومتابعة المتاجر والحرف المحلية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
