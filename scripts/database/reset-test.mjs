import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {container} from './psql.mjs';
import {sql} from './psql.mjs';
// Destructive only inside the isolated container documented for this test.
// Never accepts a production DSN, external host, or service credential.
if(!/^sanaa-phase4a-pg(?:-[a-z0-9]+)?$/.test(process.env.SANAA_TEST_PG_CONTAINER||'sanaa-phase4a-pg'))throw new Error('Unexpected test container name');
const info=JSON.parse(execFileSync('docker',['inspect',container],{encoding:'utf8'}))[0];
if(info.Config.Image!=='postgres:17'||info.HostConfig.NetworkMode!=='none'||(info.Mounts||[]).some(m=>m.Type==='bind')||!info.Config.Env.includes('POSTGRES_PASSWORD=local_test_only'))throw new Error('Refusing to reset a non-isolated database');
sql('drop database if exists sanaa_test; create database sanaa_test;',{database:'postgres'});
const bootstrap=fs.readFileSync('supabase/tests/platform-bootstrap.sql','utf8').replace(/create role (anon|authenticated|service_role) ([^;]+);/g,(_,name,flags)=>`do $$ begin if not exists(select 1 from pg_roles where rolname='${name}') then create role ${name} ${flags}; end if; end $$;`);
sql(bootstrap);
for(const file of fs.readdirSync('supabase/migrations').filter(f=>process.env.SANAA_TEST_SCHEMA_PHASE==='4b'||f<'202611170004').sort()){sql(fs.readFileSync('supabase/migrations/'+file,'utf8'));console.log('Applied locally:',file)}
sql(fs.readFileSync('supabase/seed.sql','utf8'));sql(fs.readFileSync('supabase/seed.sql','utf8'));
console.log('Reference seed applied twice successfully; no hosted Supabase connection used.');
