import 'server-only';
import {AppError} from './security';
export function config(){const env=process.env;const url=env.NEXT_PUBLIC_SUPABASE_URL,key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,ref=env.SUPABASE_PROJECT_REF,origin=env.APP_ORIGIN,secret=env.RECOVERY_COOKIE_SECRET;
 if(!url||!key||!ref||!origin||!secret||secret.length<32)return null;
 try{const u=new URL(url),o=new URL(origin);const local=env.SUPABASE_ENVIRONMENT==='local'&&env.SUPABASE_ALLOW_LOCAL==='true'&&['localhost','127.0.0.1'].includes(u.hostname);if(!local&&(env.SUPABASE_ENVIRONMENT!=='staging'||u.protocol!=='https:'||u.hostname!==ref+'.supabase.co'))return null;if(o.pathname!=='/'||o.search||o.hash||o.username||o.password||!['http:','https:'].includes(o.protocol)||o.protocol==='http:'&&!['localhost','127.0.0.1'].includes(o.hostname)||/sb_secret_|service_role/.test(key))return null;
 if(key.startsWith('eyJ')){const payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString());if(payload.role!=='anon')return null}
 else if(!key.startsWith('sb_publishable_'))return null;
 return {url:u.origin,key,ref,origin:o.origin,secret,secure:o.protocol==='https:'};}catch{return null}}
export function requireConfig(){const c=config();if(!c)throw new AppError(503,'SETUP_REQUIRED','اتصال Supabase Staging غير مكتمل؛ العمليات الحقيقية غير متاحة بعد.');return c}
