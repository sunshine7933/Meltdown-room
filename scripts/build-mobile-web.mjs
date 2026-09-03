import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root=process.cwd();
const out=join(root,'www');
const excluded=new Set(['.git','.github','android','ios','node_modules','scripts','www']);
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const item of await readdir(root,{withFileTypes:true})){
  if(excluded.has(item.name))continue;
  if(item.name.endsWith('.md')||item.name==='package.json'||item.name.startsWith('capacitor.config'))continue;
  await cp(join(root,item.name),join(out,item.name),{recursive:true});
}
await cp(join(root,'app-fixed.html'),join(out,'index.html'));
console.log('Mobile web bundle ready in www/');
