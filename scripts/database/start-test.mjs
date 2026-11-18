import {spawnSync} from 'node:child_process';
import {container} from './psql.mjs';
if(!/^sanaa-phase4a-pg(?:-[a-z0-9]+)?$/.test(container))throw new Error('Unexpected test container name');
const found=spawnSync('docker',['inspect',container],{encoding:'utf8'});
if(found.status!==0){const r=spawnSync('docker',['run','--detach','--name',container,'--network','none','--label','io.sanaa.scope=phase4a-test','--env','POSTGRES_PASSWORD=local_test_only','postgres:17'],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr)}
for(let attempt=0;attempt<40;attempt++){if(spawnSync('docker',['exec',container,'pg_isready','-U','postgres'],{stdio:'ignore'}).status===0){console.log('Isolated PostgreSQL test container ready (no network or host ports).');process.exit(0)}await new Promise(r=>setTimeout(r,500))}
throw new Error('Test PostgreSQL did not become ready');
