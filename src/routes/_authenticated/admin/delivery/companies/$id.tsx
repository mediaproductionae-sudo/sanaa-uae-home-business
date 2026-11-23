import { createFileRoute } from '@tanstack/react-router';
import { DeliveryPage, DeliveryLoading, DeliveryFailure } from '@/delivery/components';
import { deliveryHead } from '@/delivery/queries';
import { loadDelivery } from '@/delivery/loader';
export const Route = createFileRoute('/_authenticated/admin/delivery/companies/$id')({
 head:()=>deliveryHead('Delivery company details / تفاصيل شركة التوصيل — Platform'),
 loader:({context,params})=>loadDelivery(context.queryClient,'company',true,params.id,context.deliveryActorId),
 pendingComponent:DeliveryLoading, errorComponent:DeliveryFailure,
 component:Page,
});
function Page(){const {id}=Route.useParams();return <DeliveryPage view="company" platform={true} id={id}/>;}
