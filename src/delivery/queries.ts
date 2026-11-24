import { queryOptions } from '@tanstack/react-query';
import { readDelivery } from './delivery.functions';
import type { DeliveryRead } from './schema';
export const deliveryQuery = (request: DeliveryRead, actorId: string) => queryOptions({
  queryKey: ['delivery', actorId, request], queryFn: () => readDelivery({ data: request }),
  staleTime: 0, refetchInterval: 10000, retry: false,
});
export const deliveryHead = (title: string) => ({ meta: [
  { title: `${title} | Rezqna UAE` },
  { name: 'description', content: `${title} — Rezqna UAE delivery operations / إدارة التوصيل في رزقنا` },
  { property: 'og:title', content: `${title} | Rezqna UAE` },
  { property: 'og:description', content: `${title} — Rezqna UAE delivery operations / إدارة التوصيل في رزقنا` },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
] });
