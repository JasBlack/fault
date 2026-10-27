/* FAULT 0.2 — original experimental composite-signal engine. No vendor DSP code. */
'use strict';
class FaultEngine {
  constructor(canvas) {
    this.canvas=canvas;
    const gl=this.gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});
    if(!gl||!gl.getExtension('EXT_color_buffer_float')) throw Error('FAULT needs WebGL 2 with floating-point rendering. Try current Chrome with graphics acceleration enabled.');
    this.sw=2048; this.sh=576; this.frame=0;
    gl.bindVertexArray(gl.createVertexArray());
    this.inputA=this.texture();this.inputB=this.texture();
    this.raw=this.target(this.sw,this.sh);
    this.bent=[this.target(this.sw,this.sh),this.target(this.sw,this.sh)];
    this.locks=[this.target(1,this.sh),this.target(1,this.sh)];
    this.frames=[this.target(canvas.width,canvas.height),this.target(canvas.width,canvas.height)];
    const pre=`#version 300 es
precision highp float;
in vec2 uv;out vec4 frag;
uniform float time,dt;
const float PI=3.14159265359;
const float SW=2048.;const float SH=576.;const float CYC=377.;
float carrier(vec2 p){return 2.*PI*(p.x*CYC+mod(floor(p.y*SH),2.)*.5);}
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
vec3 yiq(vec3 c){return vec3(dot(c,vec3(.299,.587,.114)),dot(c,vec3(.596,-.274,-.322)),dot(c,vec3(.211,-.523,.312)));}
vec3 rgb(vec3 c){return vec3(c.x+.956*c.y+.621*c.z,c.x-.272*c.y-.647*c.z,c.x-1.106*c.y+1.703*c.z);}
`;
    this.encode=this.program(pre+`
uniform sampler2D a,b;uniform float mixB,mixDrift,sourceGain;
uniform vec2 fitA,fitB;
vec3 picture(sampler2D s,vec2 p,vec2 fit){p=(p-.5)/fit+.5;if(any(lessThan(p,vec2(0)))||any(greaterThan(p,vec2(1))))return vec3(0);return texture(s,p).rgb;}
float encodeSignal(sampler2D s,vec2 p,vec2 fit){
 p.x=fract(p.x);p.y=fract(p.y);
 if(p.x<.048&&p.x>.012)return -.4;
 if(p.x<.12){if(p.x>.065&&p.x<.102)return .17*cos(carrier(p));return 0.;}
 vec3 c=yiq(clamp(picture(s,vec2((p.x-.12)/.88,p.y),fit)*sourceGain,0.,2.));
 return .075+.85*c.x+.45*(c.y*cos(carrier(p))+c.z*sin(carrier(p)));
}
void main(){float first=encodeSignal(a,uv,fitA);vec2 p=uv+vec2(mixDrift*.009*time,.012*sin(time*.23));float other=encodeSignal(b,p,fitB);frag=vec4(mix(first,first*.7+other*.9,mixB),0,0,1);}`);
    this.bend=this.program(pre+`
uniform sampler2D raw,previous;uniform float frequency,resonance,drive,fold,threshold,windowWidth,feedback,delay,secondary,safety;
float signal(float x){return texture(raw,vec2(clamp(x,0.,1.),uv.y)).r;}
void main(){
 float s=signal(uv.x),r=0.,r2=0.,norm=0.;
 float sigma=mix(1.2,6.5,resonance);float freq=frequency*CYC/SW;
 for(int k=-16;k<=16;k++){float n=float(k);float w=exp(-n*n/(2.*sigma*sigma));float v=signal(uv.x+n/SW);r+=v*cos(2.*PI*freq*n)*w;r2+=v*cos(2.*PI*freq*1.51*n)*w;norm+=w;}
 r=r/max(norm,.001);r2=r2/max(norm,.001);
 float gate=smoothstep(threshold-.06,threshold+.06,s)*(1.-smoothstep(threshold+windowWidth-.06,threshold+windowWidth+.06,s));
 float v=s+gate*drive*(r+secondary*r2)*5.;
 v=mix(v,sin(v*PI*1.7)*.7+.25,fold*gate);
 float old=texture(previous,vec2(clamp(uv.x-delay/SW,0.,1.),uv.y)).r;
 v+=feedback*(old-s)*.96;
 v=clamp(v,-3.,3.);
 if(uv.x<.12)v=mix(v,s,safety);
 frag=vec4(v,0,0,1);
}`);
    this.receiver=this.program(pre+`
uniform sampler2D signal,previous;uniform float lock,drift;
void main(){
 float best=-1e6,offset=0.;
 for(int k=-18;k<=18;k++){
  float d=float(k)/SW*2.;float score=0.;
  for(int j=0;j<5;j++){float x=.016+float(j)*.006+d;score-=texture(signal,vec2(clamp(x,0.,1.),uv.y)).r;}
  score+=texture(signal,vec2(clamp(.058+d,0.,1.),uv.y)).r*2.;
  score-=abs(d)*.8;
  if(score>best){best=score;offset=d;}
 }
 float old=texture(previous,uv).r;
 float wandering=sin(time*.8+uv.y*11.)*.009*drift;
 float recovered=mix(old,offset+wandering,1.-exp(-dt*8.));
 frag=vec4(recovered*(1.-lock),0,0,1);
}`);
    this.decode=this.program(pre+`
uniform sampler2D signal,locks,a;uniform vec2 fitA;
uniform float tear,roll,tint,saturation,detail,sourceGain,mixB;
float sampleSignal(vec2 p){return texture(signal,vec2(clamp(p.x,.12,.999),fract(p.y))).r;}
float sourceLuma(vec2 p){p=(p-.5)/fitA+.5;if(any(lessThan(p,vec2(0)))||any(greaterThan(p,vec2(1))))return 0.;return dot(texture(a,p).rgb,vec3(.299,.587,.114))*sourceGain;}
void main(){
 float yf=fract(uv.y+time*roll*.045);
 float y=(floor(yf*SH)+.5)/SH;float shift=texture(locks,vec2(.5,y)).r;
 float wobble=sin(y*23.+time*1.7)*.5+sin(y*91.-time*2.3)*.22;
 vec2 p=vec2(.12+uv.x*.88+shift+tear*.045*wobble,y);
 float lum=0.,ii=0.,qq=0.,norm=0.;
 for(int k=-12;k<=12;k++){
  float n=float(k);vec2 q=p+vec2(n/SW,0);float w=exp(-n*n/28.);float s=sampleSignal(q);float phase=carrier(vec2(q.x,y))+tint;
  lum+=s*w;ii+=s*cos(phase)*w;qq+=s*sin(phase)*w;norm+=w;
 }
 vec3 c=vec3((lum/norm-.075)/.85,ii/norm*2./.45*saturation,qq/norm*2./.45*saturation);
 // Restore only source luminance detail, aligned to the receiver's warped coordinates.
 // This is an artistic HD path; it deliberately exceeds composite bandwidth.
 vec2 sp=vec2((p.x-.12)/.88,yf),dx=vec2(4./SW,0),dy=vec2(0,2./SH);
 float center=sourceLuma(sp);
 float low=(sourceLuma(sp-dx)+sourceLuma(sp+dx)+sourceLuma(sp-dy)+sourceLuma(sp+dy)+4.*center)/8.;
 float high=clamp(center-low,-.3,.3)*detail*(1.-mixB);
 frag=vec4(rgb(c)+high,1);
}`);
    this.decoded=this.target(canvas.width,canvas.height);
    this.finish=this.program(pre+`
uniform sampler2D decoded,previous,a;uniform vec2 fitA;
uniform float frameFeedback,zoom,rotation,scanlines,wet,bypass,contrast;
void main(){
 vec3 c=texture(decoded,uv).rgb;vec2 p=uv-.5;float ang=rotation*.025;
 p=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*p/(1.+zoom*.03)+.5;
 vec3 old=texture(previous,p).rgb;
 c=mix(c,old,frameFeedback);c=(c-.5)*contrast+.5;
 c*=1.-scanlines*.24*(.5+.5*cos(uv.y*SH*2.*PI));
 vec2 orig=(uv-.5)/fitA+.5;vec3 clean=vec3(0);
 if(all(greaterThanEqual(orig,vec2(0)))&&all(lessThanEqual(orig,vec2(1))))clean=texture(a,orig).rgb;
 c=mix(clean,c,wet*(1.-bypass));frag=vec4(clamp(c,0.,1.),1);
}`);
    this.present=this.program(pre+`
uniform sampler2D image;uniform vec2 outputSize;
uniform float sharpness,pixelSize,phosphor,wet,bypass;
vec3 sharpen(vec2 p){
 vec2 stepUV=2./outputSize;vec3 c=texture(image,p).rgb;
 vec3 n=(texture(image,p+vec2(stepUV.x,0)).rgb+texture(image,p-vec2(stepUV.x,0)).rgb+texture(image,p+vec2(0,stepUV.y)).rgb+texture(image,p-vec2(0,stepUV.y)).rgb)*.25;
 return clamp(c+clamp(c-n,vec3(-.18),vec3(.18))*sharpness,0.,1.);
}
void main(){
 float amount=wet*(1.-bypass);vec3 original=texture(image,uv).rgb;
 vec3 crisp=mix(original,sharpen(uv),amount);
 float size=max(pixelSize,3.);vec2 pixel=uv*outputSize;
 vec2 cell=fract(pixel/size);vec2 aa=max(fwidth(pixel/size),vec2(.001));
 // Three individually resolved RGB apertures per cell. No bloom or blur.
 vec3 dist=abs(cell.x-vec3(1./6.,.5,5./6.));
 vec3 lights=(1.-smoothstep(vec3(.12)-aa.x,vec3(.12)+aa.x,dist));
 lights*=1.-smoothstep(.39-aa.y,.39+aa.y,abs(cell.y-.5));
 vec2 center=(floor(pixel/size)+.5)*size/outputSize;
 vec3 phosphorColor=sharpen(center)*(.22+2.4*lights);
 frag=vec4(clamp(mix(crisp,phosphorColor,phosphor*amount),0.,1.),1);
}`);
    this.clear();
  }
  texture(w=1,h=1,float=false){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texImage2D(g.TEXTURE_2D,0,float?g.RGBA16F:g.RGBA,w,h,0,g.RGBA,float?g.HALF_FLOAT:g.UNSIGNED_BYTE,null);return t;}
  target(w,h){const g=this.gl,texture=this.texture(w,h,true),fbo=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,texture,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Floating-point framebuffer unavailable.');return {texture,fbo,w,h};}
  program(fragment){const g=this.gl,p=g.createProgram();for(const [type,src]of [[g.VERTEX_SHADER,`#version 300 es\nprecision highp float;out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0,1);}`],[g.FRAGMENT_SHADER,fragment]]){const s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));g.attachShader(p,s);g.deleteShader(s);}g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));const loc={};for(let i=0;i<g.getProgramParameter(p,g.ACTIVE_UNIFORMS);i++){const n=g.getActiveUniform(p,i).name;loc[n]=g.getUniformLocation(p,n);}return {p,loc};}
  upload(texture,source){const g=this.gl;g.bindTexture(g.TEXTURE_2D,texture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,source);}
  pass(program,target,textures,values){const g=this.gl;g.bindFramebuffer(g.FRAMEBUFFER,target?target.fbo:null);g.viewport(0,0,target?target.w:this.canvas.width,target?target.h:this.canvas.height);g.useProgram(program.p);let unit=0;for(const [name,tex]of Object.entries(textures)){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);if(program.loc[name]!=null)g.uniform1i(program.loc[name],unit);unit++;}for(const [name,v]of Object.entries(values)){const l=program.loc[name];if(l==null)continue;if(Array.isArray(v))g.uniform2fv(l,v);else g.uniform1f(l,v);}g.drawArrays(g.TRIANGLES,0,3);}
  clear(){const g=this.gl;g.clearColor(0,0,0,1);for(const t of [...this.bent,...this.frames,...this.locks]){g.bindFramebuffer(g.FRAMEBUFFER,t.fbo);g.clear(g.COLOR_BUFFER_BIT);}this.frame=0;}
  render(a,b,values,time,dt){
    const fit=s=>{const w=s.videoWidth||s.naturalWidth||s.width,h=s.videoHeight||s.naturalHeight||s.height,ratio=w/h/(16/9);return ratio>1?[1,1/ratio]:[ratio,1];};
    this.upload(this.inputA,a);this.upload(this.inputB,b);
    const v={...values,time,dt,fitA:fit(a),fitB:fit(b),outputSize:[this.canvas.width,this.canvas.height]},i=this.frame%2,j=1-i;
    this.pass(this.encode,this.raw,{a:this.inputA,b:this.inputB},v);
    this.pass(this.bend,this.bent[i],{raw:this.raw.texture,previous:this.bent[j].texture},v);
    this.pass(this.receiver,this.locks[i],{signal:this.bent[i].texture,previous:this.locks[j].texture},v);
    this.pass(this.decode,this.decoded,{signal:this.bent[i].texture,locks:this.locks[i].texture,a:this.inputA},v);
    this.pass(this.finish,this.frames[i],{decoded:this.decoded.texture,previous:this.frames[j].texture,a:this.inputA},v);
    this.pass(this.present,null,{image:this.frames[i].texture},v);this.frame++;
  }
}
window.FaultEngine=FaultEngine;
