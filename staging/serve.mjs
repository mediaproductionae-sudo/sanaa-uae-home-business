import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const base=import.meta.dirname;
try{process.loadEnvFile(path.join(base,'.env.local'))}catch(error){if(error.code!=='ENOENT')throw error}
const standalone=path.join(base,'.next/standalone/staging');
await fs.cp(path.join(base,'public'),path.join(standalone,'public'),{recursive:true});
await fs.mkdir(path.join(standalone,'.next'),{recursive:true});
await fs.cp(path.join(base,'.next/static'),path.join(standalone,'.next/static'),{recursive:true});
const child=spawn(process.execPath,[path.join(standalone,'server.js')],{stdio:'inherit',env:{...process.env,PORT:process.env.PORT||'3100',HOSTNAME:process.env.SANAA_STAGING_HOST||'127.0.0.1'}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??1));
