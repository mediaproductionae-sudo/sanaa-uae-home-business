import type { QueryClient } from '@tanstack/react-query';
import { deliveryQuery } from './queries';
import { row,rows,text } from './schema';
import type { DeliveryRead } from './schema';
export async function loadDelivery(client:QueryClient,view:DeliveryRead['view'],platform:boolean,id:string|undefined,actorId:string) {
 const access=row(await client.ensureQueryData(deliveryQuery({view:'access'},actorId)));
 const member=rows(access['memberships'])[0];
 if(platform?access['platform']!==true:member?.['available']!==true)return;
 await client.ensureQueryData(deliveryQuery({view,page:0,filter:'all',...(id?{id}:{}),...(!platform?{company_id:text(member?.['company_id'])}:{})},actorId));
}
