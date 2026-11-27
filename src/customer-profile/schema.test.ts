import {describe,it,expect} from 'vitest';
import {customerProfileSchema} from './schema';
const valid={displayName:'حساب الاختبار',phone:'0501234567',emirate:'dubai',region:'جميرا',street:'',home:'12',buildingNumber:''};
describe('customer account requirements',()=>{
 it('accepts the agreed fields with both optional address fields empty',()=>expect(customerProfileSchema.safeParse(valid).success).toBe(true));
 it('requires display name, valid phone, emirate, region and home',()=>{for(const key of ['displayName','phone','emirate','region','home'])expect(customerProfileSchema.safeParse({...valid,[key]:''}).success).toBe(false)});
 it('normalizes the phone without changing the address content',()=>{const r=customerProfileSchema.parse({...valid,phone:'٠٥٠ ١٢٣ ٤٥٦٧',region:' جميرا '});expect(r.phone).toBe('+971501234567');expect(r.region).toBe('جميرا')});
 it('rejects identity, email, address-id and verification claims from the client',()=>{for(const extra of [{userId:'other'},{email:'other@example.invalid'},{addressId:'other'},{phoneConfirmed:true}])expect(customerProfileSchema.safeParse({...valid,...extra}).success).toBe(false)});
 it('enforces field lengths and allows normal address text',()=>{expect(customerProfileSchema.safeParse({...valid,street:'x'.repeat(161)}).success).toBe(false);expect(customerProfileSchema.safeParse({...valid,buildingNumber:'B-12',home:'شقة 12'}).success).toBe(true)});
});
