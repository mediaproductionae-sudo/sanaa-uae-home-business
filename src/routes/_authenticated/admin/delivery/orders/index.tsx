import { createFileRoute } from '@tanstack/react-router';
import { DeliveryPage, DeliveryLoading, DeliveryFailure } from '@/delivery/components';
import { deliveryHead } from '@/delivery/queries';
import { loadDelivery } from '@/delivery/loader';
export const Route = createFileRoute('/_authenticated/admin/delivery/orders/')({
 head:()=>deliveryHead('Eligible delivery orders / طلبات قابلة للشحن — Platform'),
 loader:({context})=>loadDelivery(context.queryClient,'orders',true,undefined,context.deliveryActorId),
 pendingComponent:DeliveryLoading, errorComponent:DeliveryFailure,
 component:Page,
});
function Page(){return <DeliveryPage view="orders" platform={true}/>;}
