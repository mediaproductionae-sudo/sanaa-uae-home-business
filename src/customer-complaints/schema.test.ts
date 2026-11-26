import {describe,it,expect} from 'vitest';
import {validateComplaint,complaintRequest} from './schema';
const base={requestId:'11111111-1111-4111-8111-111111111111',storeId:'22222222-2222-4222-8222-222222222222',body:'وصف شكوى كافٍ للاختبار'};
describe('customer complaint validation and retry identity',()=>{
 it('requires UUIDs and a trimmed description between 10 and 4000 characters',()=>{expect(validateComplaint(base).success).toBe(true);for(const body of [' ','123456789','x'.repeat(4001)])expect(validateComplaint({...base,body}).success).toBe(false);expect(validateComplaint({...base,storeId:'1'}).success).toBe(false)});
 it('rejects client-controlled ownership, status or priority',()=>{for(const change of [{customerId:'other'},{status:'closed'},{priority:'high'}])expect(validateComplaint({...base,...change}).success).toBe(false)});
 it('reuses the same request key for retrying the same normalized payload',()=>expect(complaintRequest(base,base.storeId,'  '+base.body+' ')).toEqual(base));
 it('uses a new request key after changing the text or store',()=>{expect(complaintRequest(base,base.storeId,base.body+' changed').requestId).not.toBe(base.requestId);expect(complaintRequest(base,'other',base.body).requestId).not.toBe(base.requestId)});
});
