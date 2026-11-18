import {spawnSync} from 'node:child_process';
for(const script of ['scripts/database/reset-test.mjs','staging/tests/database.mjs']){const r=spawnSync(process.execPath,[script],{stdio:'inherit',env:{...process.env,SANAA_TEST_SCHEMA_PHASE:'4b'}});if(r.status!==0)process.exit(r.status||1)}
