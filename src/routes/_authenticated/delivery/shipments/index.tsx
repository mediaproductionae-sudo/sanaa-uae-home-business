import { createFileRoute } from '@tanstack/react-router';
import { DeliveryPage, DeliveryLoading, DeliveryFailure } from '@/delivery/components';
import { deliveryHead } from '@/delivery/queries';
import { loadDelivery } from '@/delivery/loader';
export const Route = createFileRoute('/_authenticated/delivery/shipments/')({
 head:()=>deliveryHead('Shipment queue / قائمة الشحنات — Partner'),
 loader:({context})=>loadDelivery(context.queryClient,'shipments',false,undefined,context.deliveryActorId),
 pendingComponent:DeliveryLoading, errorComponent:DeliveryFailure,
 component:Page,
});
function Page(){return <DeliveryPage view="shipments" platform={false}/>;}
