import { useQuery } from '@tanstack/react-query';
import { useDemo } from '@/sanaa/components/demo-state';
import { useLanguage } from '@/sanaa/components/language';
import { Link } from '@/sanaa/next-shim';
import { deliveryQuery } from './queries';
import { copy } from './copy';
import { row, rows } from './schema';
export function DeliveryNavLinks() {
  const { account } = useDemo(); const { language } = useLanguage();
  const access = useQuery({ ...deliveryQuery({ view: 'access' },account?.id??'guest'), enabled: !!account, refetchInterval: false });
  const data = row(access.data);
  return <>{data['platform'] === true && <Link href="/admin/delivery/companies">{copy('delivery',language)}</Link>}{rows(data['memberships']).length > 0 && <Link href="/delivery/dashboard">{copy('portal',language)}</Link>}</>;
}
