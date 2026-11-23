import {describe,it,expect,vi} from 'vitest';
vi.mock('./delivery.functions',()=>({readDelivery:vi.fn()}));
import {deliveryQuery} from './queries';
describe('private delivery query isolation',()=>{it('separates cached access and shipment data by verified account identity',()=>{const request={view:'shipments' as const,company_id:'00000000-0000-4000-8000-000000000001'};expect(deliveryQuery(request,'user-a').queryKey).not.toEqual(deliveryQuery(request,'user-b').queryKey);expect(deliveryQuery({view:'access'},'user-a').queryKey).not.toEqual(deliveryQuery({view:'access'},'user-b').queryKey);});});
