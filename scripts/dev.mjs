import { spawn } from 'node:child_process';
const args=process.argv.slice(2);
const value=(flag,fallback)=>args.includes(flag)?args[args.indexOf(flag)+1]:fallback;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname',value('--host','127.0.0.1'),'--port',value('--port','3000')],{stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
