/** Display identity only; database RPCs, domains and session identifiers stay stable. */
export const platformName='رزقنا';
export function platformDisplayName(value:unknown):string {
 if(typeof value!=='string'||!value.trim())return platformName;
 const normalized=value.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
 const legacy=['صنعه','صنعة','sanaa','sanaa uae','صنعه | sanaa uae','صنعة | sanaa uae'];
 return legacy.includes(normalized)?platformName:value;
}
