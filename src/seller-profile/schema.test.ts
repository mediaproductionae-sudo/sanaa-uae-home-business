import {describe,it,expect} from 'vitest';
import {emptyProfile,normalizePhone,validIban,validateProfile,validateAttachment} from './schema';
const filled={...emptyProfile,fullNameAr:'أحمد سالم',fullNameEn:'Ahmed Salem',phone:'+971501234567',emirate:'dubai',cityArea:'دبي - جميرا',buildingName:'بناية الاختبار',bankName:'Example Bank',iban:'AE070331234567890123456'};
describe('seller personal data validation',()=>{
 it('accepts complete personal fields without payout holder or optional uploads',()=>expect(validateProfile(filled,true).ok).toBe(true));
 it('allows a draft but prevents completing missing mandatory fields',()=>{expect(validateProfile(emptyProfile).ok).toBe(true);expect(validateProfile(emptyProfile,true).ok).toBe(false)});
 it('normalizes local UAE, Arabic digit and international phone forms',()=>{expect(normalizePhone('٠٥٠ ١٢٣ ٤٥٦٧')).toBe('+971501234567');expect(normalizePhone('00971501234567')).toBe('+971501234567')});
 it('checks IBAN checksum, length and country, rather than just its shape',()=>{expect(validIban(filled.iban)).toBe(true);for(const x of ['AE080331234567890123456','AE07','GB82WEST12345698765432'])expect(validIban(x)).toBe(false)});
 it('normalizes bank formatting without duplicating records',()=>{const r=validateProfile({...filled,iban:'ae07 0331 2345 6789 0123 456'},true);expect(r.ok&&r.data.iban).toBe(filled.iban)});
 it('requires TRN only for registered sellers and clears obsolete TRN on save',()=>{expect(validateProfile({...filled,vatRegistered:true},true).ok).toBe(false);expect(validateProfile({...filled,vatRegistered:true,trn:'100123456789012'},true).ok).toBe(true);const r=validateProfile({...filled,trn:'stale'},true);expect(r.ok&&r.data.trn).toBe('')});
 it('does not accept a forged user id, confirmation status or signup date',()=>{for(const x of [{userId:'other'},{phoneConfirmed:true},{registeredAt:'2020'}])expect(validateProfile({...filled,...x}).ok).toBe(false)});
 it('requires the two names in their respective languages',()=>{expect(validateProfile({...filled,fullNameAr:'Ahmed'},true).ok).toBe(false);expect(validateProfile({...filled,fullNameEn:'أحمد'},true).ok).toBe(false)});
 it('rejects unsafe file types, empty files and oversize uploads',()=>{expect(validateAttachment({type:'image/svg+xml',size:40},'avatar')).toBeTruthy();expect(validateAttachment({type:'application/pdf',size:40},'avatar')).toBeTruthy();expect(validateAttachment({type:'application/pdf',size:40},'bank')).toBe('');expect(validateAttachment({type:'image/png',size:0},'avatar')).toBeTruthy();expect(validateAttachment({type:'image/png',size:5242881},'avatar')).toBeTruthy()});
});
