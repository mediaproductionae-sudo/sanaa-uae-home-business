export const normalizePhone=(value:string)=>{
 const digits=value.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[\s()-]/g,'');
 return /^05\d{8}$/.test(digits)?'+971'+digits.slice(1):digits.startsWith('00')?'+'+digits.slice(2):digits;
};
