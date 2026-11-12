/* FAULT — original experimental composite-signal engine. No vendor DSP code. */
'use strict';
class FaultEngine {
  constructor(canvas) {
    this.canvas=canvas;
    const gl=this.gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});
    if(!gl||!gl.getExtension('EXT_color_buffer_float')) throw Error('FAULT needs WebGL 2 with floating-point rendering. Try current Chrome with graphics acceleration enabled.');
    this.sw=2048; this.sh=576; this.frame=0;
    gl.bindVertexArray(gl.createVertexArray());
    this.inputA=this.texture();this.inputB=this.texture();this.maskTex=this.texture();this.maskActive=0;
    this.raw=this.target(this.sw,this.sh);
    this.bent=[this.target(this.sw,this.sh),this.target(this.sw,this.sh)];
    this.locks=[this.target(1,this.sh),this.target(1,this.sh)];
    this.frames=[this.target(canvas.width,canvas.height),this.target(canvas.width,canvas.height)];
    const pre=`#version 300 es
precision highp float;
in vec2 uv;out vec4 frag;
uniform float time,dt;
const float PI=3.14159265359;
uniform float carrierScale,weave;
const float SW=2048.;const float SH=576.;const float CYC=377.;
float carrier(vec2 p){return 2.*PI*(p.x*CYC+mod(floor(p.y*SH),2.)*.5);}
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
float noise1(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(hash(i),hash(i+1.),f);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float n=i.x+i.y*57.;return mix(mix(hash(n),hash(n+1.),f.x),mix(hash(n+57.),hash(n+58.),f.x),f.y);}
// Carrier texture: a coarser copy of the carrier pattern that shows in the brightness. Its line phase alternates
// (a checkerboard) or, with weave, wanders. A regular weave is a fixed zigzag. With disorder the phase takes an
// uneven walk down the screen instead (straight runs, then leaning one way or the other for a while), jumps at the
// occasional seam, and drifts differently across the width so the columns fan and bend, as a free-running
// oscillator does.
uniform float disorder;
float texturePhase(vec2 p){float line=floor(p.y*SH),zig=abs(fract(line/8.)-.5)*2.;
 float regular=zig*.85+.4*sin(line*.043+time*.25)+.15*sin(line*.31-time*.4);
 float l=floor(line/2.)*2.;
 // Chevrons whose arm length and lean keep changing, on top of a slow drift.
 float arm=l/19.+1.5*noise1(l*.021+time*.03)+.45*noise1(l*.07+5.1);
 float lean=.12+.62*noise1(l*.015+13.+time*.02);
 float walk=lean*(abs(fract(arm)-.5)*2.-.5)+.7*(noise1(l*.009+time*.03+2.)-.5);
 float seam=.5*floor(2.2*noise1(l*.012+time*.015+41.));
 float fan=1.2*(noise2(vec2(p.x*2.2,l*.005)+time*.012)-.5)+.3*(noise2(vec2(p.x*6.,l*.014)+3.7)-.5);
 return 2.*PI*(p.x*CYC/max(carrierScale,1.)+mix(mod(line,2.)*.5,mix(regular,walk+seam+fan,disorder),weave));}
// How strongly the texture shows at a point: with disorder it comes and goes in patches.
float texturePatch(vec2 p){return mix(1.,.15+1.25*smoothstep(.22,.62,noise2(vec2(p.x*2.2,floor(p.y*SH)*.009)+time*.012+11.)),disorder*.85);}
// Selection: where the effect applies. A key taken from the source picture (a brightness band or a colour) and/or
// a painted mask, both in picture space. With neither in use the whole picture is selected.
uniform float keyMode,keyLow,keyHigh,keySoft,keyR,keyG,keyB,keyTol,maskPaint,maskInvert;
float selection(sampler2D src,sampler2D paint,vec2 fit,vec2 p){
 if(keyMode<.5&&maskPaint<.5)return 1.;
 float sel=0.,s=max(keySoft,.002);
 if(keyMode>.5){vec2 o=(p-.5)/fit+.5;vec3 c=vec3(0);if(all(greaterThanEqual(o,vec2(0)))&&all(lessThanEqual(o,vec2(1))))c=texture(src,o).rgb;
  if(keyMode<1.5){float y=dot(c,vec3(.299,.587,.114));sel=smoothstep(keyLow-s,keyLow,y)*(1.-smoothstep(keyHigh,keyHigh+s,y));}
  else sel=1.-smoothstep(keyTol,keyTol+s,distance(c,vec3(keyR,keyG,keyB))/1.732);}
 if(maskPaint>.5)sel=max(sel,texture(paint,clamp(p,0.,1.)).r);
 return mix(sel,1.-sel,maskInvert);
}
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
uniform sampler2D raw,previous;uniform float frequency,resonance,drive,fold,threshold,windowWidth,feedback,delay,secondary,safety,relief,reliefGain,droop,flatten;
float signalAt(float x,float y){return texture(raw,vec2(clamp(x,0.,1.),clamp(y,0.,1.))).r;}
float signal(float x){return signalAt(x,uv.y);}
// Luma estimate: two samples half a carrier cycle apart cancel the colour carrier.
float lumaAt(float x,float y){float h=.5/CYC;return .5*(signalAt(max(x,.121),y)+signalAt(max(x-h,.121),y));}
// Relief: the picture through a coupling capacitor that is too small, then amplified until it clips.
// Slow brightness sags toward grey while each edge jumps and droops back along the line, so shapes get a
// bright bevel on the side the beam arrives from and a shadow behind them. A little of the same against the
// lines above lights the top edges too, as an enhancer's vertical detail circuit does.
float embossed(float x,float s){
 float tau=mix(4.,150.,droop*droop),low=0.,norm=0.;
 for(int k=1;k<=36;k++){float t=float(k)/36.,d=tau*4.*t*t,w=exp(-d/tau)*t;low+=lumaAt(x-d/SW,uv.y)*w;norm+=w;}
 float y=lumaAt(x,uv.y),above=.5*(lumaAt(x-1.5/SW,uv.y+2./SH)+lumaAt(x-1.5/SW,uv.y+5./SH));
 // Short differentiator: turns every outline into a bright ridge beside a dark one.
 float bevel=y-(lumaAt(x-3./SW,uv.y)+lumaAt(x-6./SW,uv.y)+lumaAt(x-10./SW,uv.y))/3.;
 float edge=.45*(y-low/norm)+1.1*bevel+.4*(y-above);
 float v=mix(y,.5,relief*flatten)+edge*reliefGain*relief;
 return clamp(v,.02,1.02)+(s-y);
}
void main(){
 float s=signal(uv.x),r=0.,r2=0.,norm=0.;
 float sigma=mix(1.2,6.5,resonance);float freq=frequency*377./SW;
 for(int k=-16;k<=16;k++){float n=float(k);float w=exp(-n*n/(2.*sigma*sigma));float v=signal(uv.x+n/SW);r+=v*cos(2.*PI*freq*n)*w;r2+=v*cos(2.*PI*freq*1.51*n)*w;norm+=w;}
 if(relief>0.&&uv.x>.12)s=embossed(uv.x,s);
 r=r/max(norm,.001);r2=r2/max(norm,.001);
 float gate=smoothstep(threshold-.06,threshold+.06,s)*(1.-smoothstep(threshold+windowWidth-.06,threshold+windowWidth+.06,s));
 float v=s+gate*drive*(r+secondary*r2)*5.;
 v=mix(v,sin(v*PI*1.7)*.7+.25,fold*gate);
 float old=texture(previous,vec2(clamp(uv.x-delay/SW,0.,1.),uv.y)).r;
 v+=feedback*(old-signal(uv.x))*.96;
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
 float mean=0.,hc=.5/CYC;for(int j=0;j<48;j++){float x=.125+(float(j)+.5)*.018;mean+=texture(signal,vec2(x,uv.y)).r+texture(signal,vec2(x+hc,uv.y)).r;}
 frag=vec4(recovered*(1.-lock),mean/96.,0,1);
}`);
    this.decode=this.program(pre+`
uniform sampler2D signal,locks,a;uniform vec2 fitA;
uniform float tear,roll,tint,saturation,detail,sourceGain,mixB,leak,smear,streak,relief,comb;
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
 lum/=norm;float cn=norm;
 // Comb filter: fine brightness detail lands on the colour carrier and decodes as false colour. The carrier flips
 // phase on the next line while the detail does not, so averaging the two lines cancels it and keeps real colour.
 if(comb>0.){float i2=0.,q2=0.;for(int k=-12;k<=12;k++){float n=float(k);vec2 q=vec2(p.x+n/SW,y+1./SH);float w=exp(-n*n/28.),s=sampleSignal(q),phase=carrier(q)+tint;i2+=s*cos(phase)*w;q2+=s*sin(phase)*w;}
  ii=mix(ii,.5*(ii+i2),comb);qq=mix(qq,.5*(qq+q2),comb);}
 // Chroma smear: a slow colour channel that keeps trailing to the right of what caused it.
 if(smear>0.)for(int k=1;k<=16;k++){
  float n=-12.-float(k)*3.;vec2 q=p+vec2(n/SW,0);float w=exp(-float(k)/(1.5+7.*smear))*smear*3.;float s=sampleSignal(q);float phase=carrier(vec2(q.x,y))+tint;
  ii+=s*cos(phase)*w;qq+=s*sin(phase)*w;cn+=w;
 }
 // Carrier texture: the receiver stops separating colour from brightness, so the carrier shows as a dot pattern
 // whose phase is pushed around by the picture itself.
 // The pattern is pushed around by the picture (brighter areas shift its phase) and is stronger where it is bright.
 if(leak>0.){float wave=cos(texturePhase(p)+weave*(7.-2.5*disorder)*lum);
  // Disorder also hardens the wave toward the on/off dots of a clipped carrier.
  wave=mix(wave,clamp(wave*2.4,-1.,1.),disorder);lum+=leak*(.03+.13*clamp(lum,0.,1.))*wave*texturePatch(p);}
 // Line streaks: with no black-level clamp, a line carrying more signal sits darker across its whole width.
 lum-=streak*(texture(locks,vec2(.5,y)).g-.5)*.9;
 vec3 c=vec3((lum-.075)/.85,ii/cn*2./.45*saturation,qq/cn*2./.45*saturation);
 // Restore only source luminance detail, aligned to the receiver's warped coordinates.
 // This is an artistic HD path; it deliberately exceeds composite bandwidth.
 vec2 sp=vec2((p.x-.12)/.88,yf),dx=vec2(4./SW,0),dy=vec2(0,2./SH);
 float center=sourceLuma(sp);
 float low=(sourceLuma(sp-dx)+sourceLuma(sp+dx)+sourceLuma(sp-dy)+sourceLuma(sp+dy)+4.*center)/8.;
 float high=clamp(center-low,-.3,.3)*detail*(1.-mixB);
 // With relief on, everything outside the picture would float up to grey. Keep the surround black, as on a tube.
 vec2 box=smoothstep(vec2(0),vec2(3./SW,2./SH),sp/1.)*smoothstep(vec2(0),vec2(3./SW,2./SH),1.-sp);
 vec2 fitted=(sp-.5)/fitA+.5;vec2 pb=step(vec2(0),fitted)*step(fitted,vec2(1));
 frag=vec4((rgb(c)+high)*mix(1.,box.x*box.y*pb.x*pb.y,min(relief*3.,1.)),1);
}`);
    this.decoded=this.target(canvas.width,canvas.height);
    this.finish=this.program(pre+`
uniform sampler2D decoded,previous,a,paint;uniform vec2 fitA;
uniform float frameFeedback,zoom,rotation,scanlines,wet,bypass,contrast;
void main(){
 vec3 c=texture(decoded,uv).rgb;vec2 p=uv-.5;float ang=rotation*.025;
 p=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*p/(1.+zoom*.03)+.5;
 vec3 old=texture(previous,p).rgb;
 c=mix(c,old,frameFeedback);c=(c-.5)*contrast+.5;
 c*=1.-scanlines*.24*(.5+.5*cos(uv.y*SH*2.*PI));
 vec2 orig=(uv-.5)/fitA+.5;vec3 clean=vec3(0);
 if(all(greaterThanEqual(orig,vec2(0)))&&all(lessThanEqual(orig,vec2(1))))clean=texture(a,orig).rgb;
 c=mix(clean,c,wet*(1.-bypass)*selection(a,paint,fitA,uv));frag=vec4(clamp(c,0.,1.),1);
}`);
    this.present=this.program(pre+`
uniform sampler2D image,a,paint;uniform vec2 outputSize,fitA;
uniform float sharpness,pixelSize,phosphor,wet,bypass,curve,bloom,grille,vignette,cool,shape;
uniform float crt,mask,beam,lines,focus,halation,cylinder,vivid,glass,mono,picture,black;
// ---- Cathode-ray tube model. Everything here works in linear light, the way the tube does. ----
// The gun's light output rises as roughly the 2.4th power of the signal voltage.
// The set's contrast ("picture") and brightness knobs act on the voltage first: turned up, darks fall below
// cut-off and go fully black while whites overdrive the guns.
vec3 emission(vec3 v){v=(v-black)*picture/(1.-black);return pow(clamp(v,0.,1.35),vec3(2.4));}
// One scanline's drive at a point. The video amplifier has limited bandwidth, so the beam cannot change
// instantly along the line: lower focus spreads it sideways.
vec3 drive(vec2 p){float w=(1.-focus)*2.6/outputSize.x;
 return emission((texture(image,p-vec2(w,0)).rgb+2.*texture(image,p).rgb+texture(image,p+vec2(w,0)).rgb)*.25);}
// The raster: each scanline is a sweep of a roughly Gaussian electron spot. The spot grows with beam current,
// so bright lines swell and merge while dim lines stay thin with dark gaps between them.
vec3 raster(vec2 p){
 float y=p.y*lines-.5,first=floor(y);vec3 sum=vec3(0);
 for(int k=0;k<2;k++){float line=first+float(k),d=y-line;vec3 e=drive(vec2(p.x,(line+.5)/lines));
  vec3 spot=mix(vec3(.21),vec3(.47),sqrt(e));sum+=e*exp(-d*d/(2.*spot*spot))/(spot*2.5066);}
 return mix(drive(p),sum,beam);
}
// The mask in front of the phosphor decides which colour each spot of the screen can emit.
vec3 maskAt(vec2 px){
 if(mask<.5)return vec3(1);
 vec2 q=px/max(pixelSize,3.);
 if(mask>2.5){ // dot triads (shadow mask): rows of round phosphor dots, every other row shifted
  q.y/=.577;q.x+=mod(floor(q.y),2.)*.5;float i=mod(floor(q.x*3.),3.);
  float d=length(vec2(fract(q.x*3.)-.5,(fract(q.y)-.5)*.9)),a=1.-smoothstep(.30,.5,d);
  return a*vec3(float(i<.5),float(abs(i-1.)<.5),float(i>1.5))*1.35;}
 float i=mod(floor(q.x*3.),3.),a=1.-smoothstep(.27,.5,abs(fract(q.x*3.)-.5));
 if(mask>1.5){ // slot mask: stripes broken into short slots, staggered between neighbouring triads
  float v=fract(q.y/1.6+mod(floor(q.x),2.)*.5);a*=smoothstep(0.,.1,v)*smoothstep(1.,.9,v)*1.12;}
 return a*vec3(float(i<.5),float(abs(i-1.)<.5),float(i>1.5)); // else aperture grille: unbroken stripes
}
// Averaged over the output pixel, so a fine mask stays even instead of shimmering.
vec3 maskArea(vec2 px){vec3 m=vec3(0);for(int i=0;i<4;i++)for(int j=0;j<2;j++)m+=maskAt(px+vec2((float(i)+.5)/4.-.5,(float(j)+.5)/2.-.5));return m/8.;}
vec3 cathode(vec2 g,vec2 tube,vec2 tuv,vec2 pixel){
 vec3 light=raster(tuv);
 // Mask: transmits about a third of the beam, so the set drives the guns harder to make up for it.
 vec3 lit=light*maskArea(pixel)*3.5;
 light=mix(light,lit,phosphor);
 // Halation and bloom: light scatters inside the thick faceplate glass and comes back as a soft halo.
 vec3 near=vec3(0),far=vec3(0);
 for(int k=0;k<20;k++){float a=float(k)*2.39996,r=(3.+float(k)*float(k)*.19)/outputSize.y;
  vec3 t=emission(texture(image,tuv+vec2(cos(a)*r*outputSize.y/outputSize.x,sin(a)*r)).rgb);if(k<9)near+=t;far+=t;}
 light+=near/9.*bloom*.07+far/20.*halation*.04;
 // Phosphor colour: saturated primaries, and the white point the set was aligned to (studio 6500K to consumer 9300K).
 float y=dot(light,vec3(.2126,.7152,.0722));
 light=mix(vec3(y),light,1.+.3*vivid);
 // SMPTE-C (P22) phosphor primaries shown on an sRGB screen, at the studio white point (D65) or the D93 white
 // (x .283, y .298) that Japanese consumer sets were aligned to. Matrices computed from the published coordinates.
 light=mix(mat3(.9395,.0178,-.0016,.0502,.9658,-.0044,.0103,.0164,1.0060)*light,mat3(.7749,.0147,-.0013,.0508,.9774,-.0044,.0137,.0219,1.3408)*light/1.15,cool);
 // Aperture-grille tubes steady their wires with one or two fine damper wires, which cast faint horizontal shadows.
 if(mask>.5&&mask<1.5&&cylinder>.5){float w=1.2/outputSize.y;light*=1.-.16*(smoothstep(w,0.,abs(tuv.y-.3333))+smoothstep(w,0.,abs(tuv.y-.6667)));}
 light=mix(light,y*vec3(.84,.97,1.12),mono);
 // Glass: the unlit screen is grey, not black, and reflects a little of the room.
 light+=glass*(vec3(.006,.0065,.008)+.012*smoothstep(1.2,-.6,g.x+g.y*1.3)*vec3(.9,.95,1.));
 light*=1.-vignette*.6*pow(clamp(dot(g,g)*.5,0.,1.),1.6);
 // Shoulder that keeps hue: phosphor saturates gradually, it does not clip one channel at a time.
 float m=max(light.r,max(light.g,light.b));if(m>.75)light*=(.75+.25*(1.-exp(-(m-.75)/.25)))/m;
 return pow(max(light,0.),vec3(1./2.2));
}
vec3 sharpen(vec2 p){
 vec2 stepUV=2./outputSize;vec3 c=texture(image,p).rgb;
 vec3 n=(texture(image,p+vec2(stepUV.x,0)).rgb+texture(image,p-vec2(stepUV.x,0)).rgb+texture(image,p+vec2(0,stepUV.y)).rgb+texture(image,p-vec2(0,stepUV.y)).rgb)*.25;
 return clamp(c+clamp(c-n,vec3(-.18),vec3(.18))*sharpness,0.,1.);
}
void main(){
 float amount=wet*(1.-bypass),whole=amount;
 // Tube glass: the picture bulges, so its edges bow and the corners fall off the screen.
 vec2 g=uv*2.-1.;g.x*=mix(1.,4./3.,shape);float k=curve*amount*.11;
 // Spherical glass bows every edge. A cylindrical tube (Trinitron) curves left to right only.
 vec2 tube=mix(g*(1.+k*g.yx*g.yx),vec2(g.x*(1.+k*.45*g.x*g.x),g.y*(1.+k*.3*g.x*g.x)),cylinder)*(1.+curve*amount*.035);
 vec2 tuv=tube*.5+.5;vec2 edge=1.-smoothstep(vec2(1.)-8./outputSize,vec2(1.),abs(tube));float inside=curve*amount>0.||shape>0.?edge.x*edge.y:1.;
 amount*=selection(a,paint,fitA,tuv);
 vec3 original=texture(image,tuv).rgb;
 vec3 crisp=mix(original,sharpen(tuv),amount);
 float size=max(pixelSize,3.);vec2 pixel=uv*outputSize;
 vec2 cell=fract(pixel/size);vec2 aa=max(fwidth(pixel/size),vec2(.001));
 // Three individually resolved RGB apertures per cell. No bloom or blur.
 vec3 dist=abs(cell.x-vec3(1./6.,.5,5./6.));
 vec3 lights=(1.-smoothstep(vec3(.12)-aa.x,vec3(.12)+aa.x,dist));
 // Stripe mask: unbroken vertical phosphor stripes (aperture grille) instead of separate cells.
 lights*=mix(1.-smoothstep(.39-aa.y,.39+aa.y,abs(cell.y-.5)),1.,grille);
 vec2 center=mix((floor(pixel/size)+.5)*size/outputSize,vec2((floor(pixel.x/size)+.5)*size/outputSize.x,uv.y),grille);
 center=(center-uv)*2.*vec2(mix(1.,4./3.,shape),1.)+tube;center=center*.5+.5;
 vec3 phosphorColor=sharpen(center)*(.22+2.4*lights);
 // Stripe mask only: a stripe that would clip is dimmed as a whole, so bright colours keep their hue.
 phosphorColor/=mix(1.,max(1.,max(phosphorColor.r,max(phosphorColor.g,phosphorColor.b))),grille);
 vec3 c=mix(crisp,phosphorColor,phosphor*amount);
 // Glow: bright areas spill light into the glass around them.
 if(bloom>0.){vec3 halo=vec3(0);for(int k=0;k<18;k++){float a=float(k)*2.39996,r=(4.+sqrt(float(k)+.5)*7.)/outputSize.y;vec3 t=texture(image,tuv+vec2(cos(a)*r*outputSize.y/outputSize.x,sin(a)*r)).rgb;halo+=t*t;}
  halo/=18.;c=mix(c,max(c,sqrt(halo)),bloom*amount*.3)+halo*bloom*amount*.22;}
 c=mix(c,c*vec3(.74,.97,1.08)+vec3(0.,.01,.03),cool*amount);
 c*=1.-vignette*amount*.6*pow(clamp(dot(g,g)*.5,0.,1.),1.6);
 if(crt>.5){ // rounded corners of the tube face
  vec2 r=abs(tube)-vec2(1.-.05);float corner=1.-smoothstep(.05-.006,.05,length(max(r,0.)));
  c=mix(original,cathode(g,tube,tuv,pixel),amount);inside=mix(1.,corner,whole*min(curve*8.,1.));}
 frag=vec4(clamp(c*inside,0.,1.),1);
}`);
    this.clear();
  }
  texture(w=1,h=1,float=false){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texImage2D(g.TEXTURE_2D,0,float?g.RGBA16F:g.RGBA,w,h,0,g.RGBA,float?g.HALF_FLOAT:g.UNSIGNED_BYTE,null);return t;}
  target(w,h){const g=this.gl,texture=this.texture(w,h,true),fbo=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,texture,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Floating-point framebuffer unavailable.');return {texture,fbo,w,h};}
  program(fragment){const g=this.gl,p=g.createProgram();for(const [type,src]of [[g.VERTEX_SHADER,`#version 300 es\nprecision highp float;out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0,1);}`],[g.FRAGMENT_SHADER,fragment]]){const s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));g.attachShader(p,s);g.deleteShader(s);}g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));const loc={};for(let i=0;i<g.getProgramParameter(p,g.ACTIVE_UNIFORMS);i++){const n=g.getActiveUniform(p,i).name;loc[n]=g.getUniformLocation(p,n);}return {p,loc};}
  setMask(canvas){if(canvas)this.upload(this.maskTex,canvas);this.maskActive=canvas?1:0;}
  upload(texture,source){const g=this.gl;g.bindTexture(g.TEXTURE_2D,texture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,source);}
  pass(program,target,textures,values){const g=this.gl;g.bindFramebuffer(g.FRAMEBUFFER,target?target.fbo:null);g.viewport(0,0,target?target.w:this.canvas.width,target?target.h:this.canvas.height);g.useProgram(program.p);let unit=0;for(const [name,tex]of Object.entries(textures)){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);if(program.loc[name]!=null)g.uniform1i(program.loc[name],unit);unit++;}for(const [name,v]of Object.entries(values)){const l=program.loc[name];if(l==null)continue;if(Array.isArray(v))g.uniform2fv(l,v);else g.uniform1f(l,v);}g.drawArrays(g.TRIANGLES,0,3);}
  clear(){const g=this.gl;g.clearColor(0,0,0,1);for(const t of [...this.bent,...this.frames,...this.locks]){g.bindFramebuffer(g.FRAMEBUFFER,t.fbo);g.clear(g.COLOR_BUFFER_BIT);}this.frame=0;}
  render(a,b,values,time,dt){
    const aspect=16/9+(4/3-16/9)*(values.shape||0),fit=s=>{const w=s.videoWidth||s.naturalWidth||s.width,h=s.videoHeight||s.naturalHeight||s.height,ratio=w/h/aspect;return ratio>1?[1,1/ratio]:[ratio,1];};
    this.upload(this.inputA,a);this.upload(this.inputB,b);
    const v={...values,maskPaint:this.maskActive,time,dt,fitA:fit(a),fitB:fit(b),outputSize:[this.canvas.width,this.canvas.height]},i=this.frame%2,j=1-i;
    this.pass(this.encode,this.raw,{a:this.inputA,b:this.inputB},v);
    this.pass(this.bend,this.bent[i],{raw:this.raw.texture,previous:this.bent[j].texture},v);
    this.pass(this.receiver,this.locks[i],{signal:this.bent[i].texture,previous:this.locks[j].texture},v);
    this.pass(this.decode,this.decoded,{signal:this.bent[i].texture,locks:this.locks[i].texture,a:this.inputA},v);
    this.pass(this.finish,this.frames[i],{decoded:this.decoded.texture,previous:this.frames[j].texture,a:this.inputA,paint:this.maskTex},v);
    this.pass(this.present,null,{image:this.frames[i].texture,a:this.inputA,paint:this.maskTex},v);this.frame++;
  }
}
window.FaultEngine=FaultEngine;
