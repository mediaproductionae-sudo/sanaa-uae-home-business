import { createFileRoute } from '@tanstack/react-router';
import { DeliveryPage, DeliveryLoading, DeliveryFailure } from '@/delivery/components';
import { deliveryHead } from '@/delivery/queries';
import { loadDelivery } from '@/delivery/loader';
export const Route = createFileRoute('/_authenticated/admin/delivery/shipments/$id')({
 head:()=>deliveryHead('Shipment details / تفاصيل الشحنة — Platform'),
 loader:({context,params})=>loadDelivery(context.queryClient,'shipment',true,params.id,context.deliveryActorId),
 pendingComponent:DeliveryLoading, errorComponent:DeliveryFailure,
 component:Page,
});
function Page(){const {id}=Route.useParams();return <DeliveryPage view="shipment" platform={true} id={id}/>;}
