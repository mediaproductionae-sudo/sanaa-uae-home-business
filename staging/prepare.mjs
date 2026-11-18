import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
await fs.mkdir(path.join(root,'staging/public'),{recursive:true});
for(const name of ['images','fonts'])await fs.cp(path.join(root,'public',name),path.join(root,'staging/public',name),{recursive:true});
console.log('Prepared existing brand assets for the separate Node entry; no demo data copied.');
