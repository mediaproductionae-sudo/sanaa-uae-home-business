import { useLocation, useNavigate, useRouter as useTsRouter } from "@tanstack/react-router";
import { forwardRef, useMemo, type AnchorHTMLAttributes } from "react";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, onClick, ...rest }, ref) {
  const navigate = useNavigate();
  return (
    <a ref={ref} href={href} {...rest} onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || rest.target) return;
      e.preventDefault();
      navigate({ href });
    }} />
  );
});
export default Link;
export function useRouter() {
  const navigate = useNavigate();
  const router = useTsRouter();
  return {
    push: (href: string) => navigate({ href }),
    replace: (href: string) => navigate({ href, replace: true }),
    back: () => router.history.back(),
  };
}
export function usePathname() { return useLocation().pathname; }
export function useSearchParams() {
  const searchStr = useLocation().searchStr;
  return useMemo(() => new URLSearchParams(searchStr), [searchStr]);
}
