const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
global.window={};
vm.runInThisContext(fs.readFileSync(path.join(root,'src/engine.js'),'utf8'));
class Capture extends window.FaultEngine {
 texture(){return 0;} target(w,h){return {w,h};} program(source){return source;} clear(){}
}
const engine=new Capture({width:1920,height:1080,getContext:()=>({getExtension:()=>true,bindVertexArray(){},createVertexArray(){}})});
const out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'shaders.json'),JSON.stringify(Object.fromEntries(['encode','bend','receiver','decode','finish','present'].map(k=>[k,engine[k]]))));
console.log('Captured six shader programs from src/engine.js');
