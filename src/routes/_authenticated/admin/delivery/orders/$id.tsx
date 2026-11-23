import { createFileRoute } from '@tanstack/react-router';
import { DeliveryPage, DeliveryLoading, DeliveryFailure } from '@/delivery/components';
import { deliveryHead } from '@/delivery/queries';
import { loadDelivery } from '@/delivery/loader';
export const Route = createFileRoute('/_authenticated/admin/delivery/orders/$id')({
 head:()=>deliveryHead('Shipping order preparation / تجهيز طلب الشحن — Platform'),
 loader:({context,params})=>loadDelivery(context.queryClient,'order',true,params.id,context.deliveryActorId),
 pendingComponent:DeliveryLoading, errorComponent:DeliveryFailure,
 component:Page,
});
function Page(){const {id}=Route.useParams();return <DeliveryPage view="order" platform={true} id={id}/>;}
