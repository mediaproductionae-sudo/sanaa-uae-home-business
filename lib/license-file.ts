export type LicenseAttachment={id:string;name:string;size:number;type:string};
export function cleanLicenseAttachment(value:unknown):LicenseAttachment|undefined{
 if(!value||typeof value!=='object')return;const v=value as LicenseAttachment;
 if(typeof v.id!=='string'||!/^license-[a-f0-9]{32}$/.test(v.id)||typeof v.name!=='string'||!v.name||v.name.length>200||!Number.isInteger(v.size)||v.size<=0||v.size>5*1024*1024||!['application/pdf','image/png','image/jpeg','image/webp'].includes(v.type))return;
 return {id:v.id,name:v.name,size:v.size,type:v.type};
}
export async function validLicenseFile(file:File){
 if(!file.size||file.size>5*1024*1024)return false;
 const b=new Uint8Array(await file.slice(0,12).arrayBuffer());const ascii=(start:number,end:number)=>String.fromCharCode(...b.slice(start,end));
 return file.type==='application/pdf'&&ascii(0,5)==='%PDF-'||file.type==='image/png'&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)||file.type==='image/jpeg'&&b[0]===255&&b[1]===216&&b[2]===255||file.type==='image/webp'&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';
}
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('sanaa-private-documents',1);r.onupgradeneeded=()=>r.result.createObjectStore('licenses');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function saveLicenseFile(file:File):Promise<LicenseAttachment>{
 if(!await validLicenseFile(file))throw new Error('INVALID_FILE');
 const id='license-'+Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');const db=await database();
 try{await new Promise<void>((resolve,reject)=>{const t=db.transaction('licenses','readwrite');t.objectStore('licenses').put(file,id);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)})}finally{db.close()}
 return {id,name:file.name.slice(0,200),type:file.type,size:file.size};
}
export async function readLicenseFile(id:string):Promise<Blob>{const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('licenses').objectStore('licenses').get(id);r.onsuccess=()=>r.result instanceof Blob?resolve(r.result):reject(new Error('MISSING_FILE'));r.onerror=()=>reject(r.error)})}finally{db.close()}}
