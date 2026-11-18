import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
import {cache} from 'react';
import {redirect} from 'next/navigation';
import type {Database} from './database';
import {config,requireConfig} from './config';
import {AppError} from './security';
export async function serverClient(){const c=requireConfig(),jar=await cookies();return createServerClient<Database>(c.url,c.key,{cookieOptions:{httpOnly:true,secure:c.secure,sameSite:'lax',path:'/'},cookies:{getAll(){return jar.getAll()},setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,{...options,httpOnly:true,secure:c.secure,sameSite:'lax',path:'/'}))}catch{/* Read-only SSR: proxy owns refresh before rendering. */}}}})}
export const session=cache(async()=>{if(!config())return null;const client=await serverClient();const {data,error}=await client.auth.getUser();if(error||!data.user?.email_confirmed_at)return null;const [profile,roles,permissions]=await Promise.all([client.from('profiles').select('*').eq('id',data.user.id).maybeSingle(),client.from('user_roles').select('role').eq('user_id',data.user.id),client.from('admin_permissions').select('permission').eq('user_id',data.user.id)]);if(!profile.data?.active||profile.error||roles.error)return null;return {user:data.user,profile:profile.data,roles:roles.data.map(r=>r.role),permissions:(permissions.data||[]).map(p=>p.permission)}});
export async function requireSession(){requireConfig();const member=await session();if(!member)throw new AppError(401,'UNAUTHENTICATED','سجّل الدخول بحساب مؤكد أولاً.');return member}
export async function pageSession(next='/profile/'){if(!config())redirect('/setup/');const s=await session();if(!s)redirect('/login/?next='+encodeURIComponent(next));return s}
/** Storage-only privileged client. Call after user JWT/RLS ownership checks. */
export function storageGateway(){const c=requireConfig(),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key||key===c.key)throw new AppError(503,'STORAGE_SETUP_REQUIRED','رفع الملفات غير متاح حتى يكتمل إعداد الخادم الآمن.');return createClient<Database>(c.url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}).storage}
