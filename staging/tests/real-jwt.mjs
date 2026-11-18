import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const report='work/phase4b/real-jwt-results.json';fs.mkdirSync('work/phase4b',{recursive:true});
const skip=reason=>{fs.writeFileSync(report,JSON.stringify({status:'not_run',reason,testsPassed:0},null,2));console.log('NOT RUN:',reason);process.exit(0)};
if(process.env.SANAA_RUN_STAGING_AUTH_TESTS!=='true')skip('Requires explicit opt-in and dedicated confirmed accounts on the approved Supabase staging project.');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,ref=process.env.SUPABASE_PROJECT_REF;
if(process.env.SUPABASE_ENVIRONMENT!=='staging'||process.env.SANAA_STAGING_TEST_ACCOUNT_SET!=='dedicated'||!ref||new URL(url).hostname!==ref+'.supabase.co')throw Error('Refusing to run against an unverified staging target/account set');
const required=['CUSTOMER_A','CUSTOMER_B','SELLER_A','SELLER_B'];
if(required.some(n=>!process.env[`SANAA_TEST_${n}_EMAIL`]||!process.env[`SANAA_TEST_${n}_PASSWORD`]))skip('Missing dedicated test account credentials. Supply them through the test runner secret environment, never chat or Git.');
const clients={};let passed=0;
try{for(const name of required){const c=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const result=await c.auth.signInWithPassword({email:process.env[`SANAA_TEST_${name}_EMAIL`],password:process.env[`SANAA_TEST_${name}_PASSWORD`]});assert.ok(!result.error&&result.data.session,'Real Auth sign-in must succeed');const verified=await c.auth.getUser();assert.ok(verified.data.user?.email_confirmed_at&&!verified.error,'Provider must verify the actual issued JWT');clients[name]={c,id:verified.data.user.id};passed++}
const roleAttempt=await clients.CUSTOMER_A.c.from('user_roles').insert({user_id:clients.CUSTOMER_A.id,role:'admin'});assert.ok(roleAttempt.error);passed++;
const otherProfile=await clients.CUSTOMER_B.c.from('profiles').select('id').eq('id',clients.CUSTOMER_A.id);assert.deepEqual(otherProfile.data,[]);passed++;
for(const name of ['SELLER_A','SELLER_B']){const {c}=clients[name],enrolled=await c.rpc('sanaa_enroll_seller',{business_name:'حساب اختبار آلي 4B'});assert.ok(!enrolled.error);const own=await c.from('stores').select('id').eq('seller_id',enrolled.data).ilike('name_ar','اختبار آلي 4B%').limit(1);if(own.data?.[0])clients[name].store=own.data[0].id;else{const category=await c.from('categories').select('id').eq('active',true).limit(1).single();assert.ok(category.data);const result=await c.rpc('sanaa_save_store',{store_uuid:null,name_ar:'اختبار آلي 4B '+name,description:'متجر اختبار staging فقط',category_uuid:category.data.id,emirate:'dubai',area_code:'DXB-TEST',hours:{}});assert.ok(!result.error);clients[name].store=result.data}}
const foreign=await clients.SELLER_B.c.from('stores').select('id').eq('id',clients.SELLER_A.store);assert.deepEqual(foreign.data,[]);passed++;
const commission=await clients.SELLER_A.c.from('seller_commission_rules').update({rate_bps:0}).not('id','is',null);assert.ok(commission.error);passed++;
const directStorage=await clients.SELLER_A.c.storage.from('store-documents').upload(clients.SELLER_A.store+'/raw-test.txt',new Uint8Array([1]),{contentType:'text/plain'});assert.ok(directStorage.error);passed++;
fs.writeFileSync(report,JSON.stringify({status:'passed',testsPassed:passed,scope:'Actual Supabase-issued JWTs: sign-in, provider verification, profile/store RLS isolation and protected writes. Not SMTP/password-recovery UI end-to-end.'},null,2));console.log('PASS',passed,'real JWT/Auth/RLS checks. No tokens or credentials printed.');
}catch{fs.writeFileSync(report,JSON.stringify({status:'failed',testsPassed:passed},null,2));throw Error('Staging Auth/RLS integration failed. Inspect securely; credentials and provider payloads are deliberately not logged.')}finally{await Promise.all(Object.values(clients).map(({c})=>c.auth.signOut({scope:'local'})))}
