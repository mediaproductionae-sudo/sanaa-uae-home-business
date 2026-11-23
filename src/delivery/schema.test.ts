import { describe,it,expect } from 'vitest';
import { canRespond,deliveryCommandSchema,deliveryReadSchema } from './schema';
describe('delivery access and command validation',()=>{
 it('company admin and operations may respond',()=>{expect(canRespond('company_admin')).toBe(true);expect(canRespond('operations')).toBe(true);});
 it('dispatcher and driver cannot accept or reject',()=>{expect(canRespond('dispatcher')).toBe(false);expect(canRespond('driver')).toBe(false);});
 it('requires true UUID command keys',()=>{expect(deliveryCommandSchema.safeParse({key:'123',action:'assign',data:{},reason:'manual assignment'}).success).toBe(false);});
 it('requires rejection reason of at least three characters',()=>{expect(deliveryCommandSchema.safeParse({key:'00000000-0000-4000-8000-000000000001',action:'reject',data:{},reason:'  '}).success).toBe(false);});
 it('bounds pages and rejects numeric UI ids',()=>{expect(deliveryReadSchema.safeParse({view:'shipment',id:'123'}).success).toBe(false);expect(deliveryReadSchema.safeParse({view:'shipments',page:10001}).success).toBe(false);});
});
