import {spawnSync} from 'node:child_process';
export const container=process.env.SANAA_TEST_PG_CONTAINER||'sanaa-phase4a-pg';
export function sql(input,{database='sanaa_test',fail=true}={}){
 const r=spawnSync('docker',['exec','-i',container,'psql','-X','-q','-v','ON_ERROR_STOP=1','-A','-t','-U','postgres','-d',database],{input,encoding:'utf8',maxBuffer:8*1024*1024});
 if(r.error)throw r.error;
 if(fail&&r.status!==0)throw new Error(r.stderr||r.stdout||'PostgreSQL command failed');
 return {status:r.status,output:r.stdout.trim(),error:r.stderr};
}
