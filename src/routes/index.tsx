import { createFileRoute } from "@tanstack/react-router";
import Home from "@/sanaa/components/home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "صَنْعه | Sanaa UAE" },
      { name: "description", content: "صَنْعه منصة لاكتشاف المشاريع المنزلية الإماراتية ومنتجاتها، ومتابعة المتاجر والحرف المحلية." },
      { property: "og:title", content: "صَنْعه | Sanaa UAE" },
      { property: "og:description", content: "صَنْعه منصة لاكتشاف المشاريع المنزلية الإماراتية ومنتجاتها، ومتابعة المتاجر والحرف المحلية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
