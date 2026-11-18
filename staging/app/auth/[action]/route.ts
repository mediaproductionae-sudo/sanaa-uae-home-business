import {NextResponse,type NextRequest} from 'next/server';
import {requireConfig} from '../../../lib/config';
import {serverClient} from '../../../lib/supabase';
import {recoveryProof,safeNext} from '../../../lib/security';
export async function GET(request:NextRequest,{params}:{params:Promise<{action:string}>}){let origin='';try{const c=requireConfig();origin=c.origin;const {action}=await params,client=await serverClient();let recovery=false;
 if(action==='confirm'){const token=request.nextUrl.searchParams.get('token_hash'),type=request.nextUrl.searchParams.get('type');if(!token||token.length>1000||!['email','recovery'].includes(type||''))throw Error('invalid');const {error}=await client.auth.verifyOtp({token_hash:token,type:type as 'email'|'recovery'});if(error)throw error;recovery=type==='recovery'}
 else if(action==='callback'){const code=request.nextUrl.searchParams.get('code');if(!code||code.length>2000)throw Error('invalid');const {data,error}=await client.auth.exchangeCodeForSession(code);if(error)throw error;
 // Only verifyOtp(type=recovery) may mint recovery proof; code/next never can.
 recovery=false;
 }else throw Error('invalid');
 const {data,error}=await client.auth.getUser();if(error||!data.user?.email_confirmed_at)throw Error('invalid');
 if(!recovery&&data.user.user_metadata?.requested_account_type==='seller'){const enrolled=await client.rpc('sanaa_enroll_seller',{business_name:data.user.user_metadata.display_name||'مقدم خدمة'});if(enrolled.error)throw enrolled.error}
 const dest=recovery?'/update-password/':safeNext(request.nextUrl.searchParams.get('next'),'/profile/');const response=NextResponse.redirect(new URL(dest,c.origin));if(recovery)response.cookies.set('sanaa-recovery',recoveryProof(data.user.id,c.secret),{httpOnly:true,secure:c.secure,sameSite:'lax',path:'/',maxAge:600});response.headers.set('Cache-Control','no-store');return response;
 }catch{const response=origin?NextResponse.redirect(new URL('/login/?auth_error=1',origin)):new NextResponse(null,{status:303,headers:{Location:'/login/?auth_error=1'}});response.headers.set('Cache-Control','no-store');return response}}
