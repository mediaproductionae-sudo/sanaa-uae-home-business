import { createFileRoute } from '@tanstack/react-router';
import { DeliveryPage, DeliveryLoading, DeliveryFailure } from '@/delivery/components';
import { deliveryHead } from '@/delivery/queries';
import { loadDelivery } from '@/delivery/loader';
export const Route = createFileRoute('/_authenticated/delivery/dashboard')({
 head:()=>deliveryHead('Delivery partner dashboard / لوحة شريك التوصيل — Partner'),
 loader:({context})=>loadDelivery(context.queryClient,'dashboard',false,undefined,context.deliveryActorId),
 pendingComponent:DeliveryLoading, errorComponent:DeliveryFailure,
 component:Page,
});
function Page(){return <DeliveryPage view="dashboard" platform={false}/>;}
