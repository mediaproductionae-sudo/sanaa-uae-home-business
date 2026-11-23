import { createFileRoute } from '@tanstack/react-router';
import { DeliveryPage, DeliveryLoading, DeliveryFailure } from '@/delivery/components';
import { deliveryHead } from '@/delivery/queries';
import { loadDelivery } from '@/delivery/loader';
export const Route = createFileRoute('/_authenticated/admin/delivery/shipments/')({
 head:()=>deliveryHead('Shipment queue / قائمة الشحنات — Platform'),
 loader:({context})=>loadDelivery(context.queryClient,'shipments',true,undefined,context.deliveryActorId),
 pendingComponent:DeliveryLoading, errorComponent:DeliveryFailure,
 component:Page,
});
function Page(){return <DeliveryPage view="shipments" platform={true}/>;}
