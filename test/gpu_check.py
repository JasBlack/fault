"""Headless EGL/GLES3 shader pipeline validation. Uses system Mesa, ctypes, Pillow.
Shader JSON is captured from the actual JS engine by the accompanying command.
This validates DSP rendering, not browser APIs or macOS packaging.
"""
import ctypes as C
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUTPUT=Path(__file__).resolve().parents[1] / 'test-results'
OUTPUT.mkdir(exist_ok=True)
E=C.CDLL('libEGL.so.1')
E.eglGetProcAddress.restype=C.c_void_p
def fn(name,result,args):
    return C.CFUNCTYPE(result,*args)(E.eglGetProcAddress(name.encode()))
I=C.c_int; U=C.c_uint; F=C.c_float; P=C.c_void_p
display=fn('eglGetPlatformDisplayEXT',P,[U,P,C.POINTER(I)])(0x31DD,None,None)
major=I();minor=I()
assert fn('eglInitialize',U,[P,C.POINTER(I),C.POINTER(I)])(display,C.byref(major),C.byref(minor))
assert fn('eglBindAPI',U,[U])(0x30A0)
attrs=(I*13)(0x3033,1,0x3040,0x40,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038)
config=P();count=I()
assert fn('eglChooseConfig',U,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)])(display,attrs,C.byref(config),1,C.byref(count)) and count.value
surface=fn('eglCreatePbufferSurface',P,[P,P,C.POINTER(I)])(display,config,(I*5)(0x3057,1920,0x3056,1080,0x3038))
context=fn('eglCreateContext',P,[P,P,P,C.POINTER(I)])(display,config,None,(I*3)(0x3098,3,0x3038))
assert fn('eglMakeCurrent',U,[P,P,P,P])(display,surface,surface,context)
createShader=fn('glCreateShader',U,[U]);shaderSource=fn('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),P]);compileShader=fn('glCompileShader',None,[U]);getShader=fn('glGetShaderiv',None,[U,U,C.POINTER(I)])
createProgram=fn('glCreateProgram',U,[]);attach=fn('glAttachShader',None,[U,U]);link=fn('glLinkProgram',None,[U]);getProgram=fn('glGetProgramiv',None,[U,U,C.POINTER(I)])
use=fn('glUseProgram',None,[U]);getLoc=fn('glGetUniformLocation',I,[U,C.c_char_p]);u1=fn('glUniform1f',None,[I,F]);ui=fn('glUniform1i',None,[I,I]);u2=fn('glUniform2f',None,[I,F,F])
genTex=fn('glGenTextures',None,[I,C.POINTER(U)]);bindTex=fn('glBindTexture',None,[U,U]);texImage=fn('glTexImage2D',None,[U,I,I,I,I,I,U,U,P]);texParam=fn('glTexParameteri',None,[U,U,I]);activeTex=fn('glActiveTexture',None,[U])
genFbo=fn('glGenFramebuffers',None,[I,C.POINTER(U)]);bindFbo=fn('glBindFramebuffer',None,[U,U]);attachTex=fn('glFramebufferTexture2D',None,[U,U,U,U,I]);checkFbo=fn('glCheckFramebufferStatus',U,[U]);viewport=fn('glViewport',None,[I,I,I,I]);draw=fn('glDrawArrays',None,[U,I,I]);read=fn('glReadPixels',None,[I,I,I,I,U,U,P]);clearColor=fn('glClearColor',None,[F,F,F,F]);clear=fn('glClear',None,[U]);error=fn('glGetError',U,[])
vertex='#version 300 es\nprecision highp float;out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0,1);}'
def shader(src,typ):
    s=createShader(typ);text=C.c_char_p(src.encode());shaderSource(s,1,C.byref(text),None);compileShader(s);ok=I();getShader(s,0x8B81,C.byref(ok))
    if not ok.value:
        log=C.create_string_buffer(8192);fn('glGetShaderInfoLog',None,[U,I,P,P])(s,8192,None,log);raise RuntimeError(log.value.decode())
    return s
programs={}
for name,src in json.loads((OUTPUT / 'shaders.json').read_text()).items():
    p=createProgram();attach(p,shader(vertex,0x8B31));attach(p,shader(src,0x8B30));link(p);ok=I();getProgram(p,0x8B82,C.byref(ok));assert ok.value,name;programs[name]=p
print('PASS: all six shaders compile and link in GLES3')
def texture(w,h,data=None):
    t=U();genTex(1,C.byref(t));bindTex(0x0DE1,t);texParam(0x0DE1,0x2801,0x2601);texParam(0x0DE1,0x2800,0x2601);texParam(0x0DE1,0x2802,0x812F);texParam(0x0DE1,0x2803,0x812F)
    texImage(0x0DE1,0,0x881A if data is None else 0x1908,w,h,0,0x1908,0x140B if data is None else 0x1401,data)
    return t.value
def target(w,h):
    t=texture(w,h);f=U();genFbo(1,C.byref(f));bindFbo(0x8D40,f);attachTex(0x8D40,0x8CE0,0x0DE1,t,0);assert checkFbo(0x8D40)==0x8CD5;clearColor(0,0,0,1);clear(0x4000);return t,f.value,w,h
raw=target(2048,576);bent=[target(2048,576),target(2048,576)];locks=[target(1,576),target(1,576)];decoded=target(1920,1080);frames=[target(1920,1080),target(1920,1080)]
im=Image.new('RGBA',(640,360),'#11121b');d=ImageDraw.Draw(im)
for i,color in enumerate(['#fff','#ff0','#0ff','#0f0','#f0f','#f00','#00f']):d.rectangle((i*92,0,i*92+92,90),fill=color)
for r in range(140,20,-8):d.ellipse((320-r,230-r/1.5,320+r,230+r/1.5),outline=(240-r,255,140,255),width=2)
d.ellipse((140,110,280,250),fill='#ddd5cb');d.rectangle((430,140,1080,270),fill='#64daba');d.text((20,320),'FAULT / SIGNAL ENGINE TEST',fill='white')
im.save(OUTPUT / 'test-source.png');data=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM).tobytes();a=texture(640,360,data);b=texture(640,360,data)
base=dict(time=1,dt=1/30,fitA=[1,1],fitB=[1,1],mixB=0,mixDrift=.6,sourceGain=1,frequency=1.02,resonance=.66,drive=2.8,fold=.3,threshold=-.1,windowWidth=1.5,feedback=.15,delay=7,secondary=.25,safety=1,lock=1,drift=.3,tear=.12,roll=0,tint=0,saturation=1.2,frameFeedback=0,zoom=.3,rotation=.2,scanlines=.16,wet=1,bypass=0,contrast=1,detail=.8,sharpness=.65,pixelSize=6,phosphor=.25,outputSize=[1920,1080])
def render(name,out,textures,values):
    p=programs[name];use(p);bindFbo(0x8D40,out[1] if out else 0);viewport(0,0,out[2] if out else 1920,out[3] if out else 1080)
    for unit,(n,t) in enumerate(textures.items()):activeTex(0x84C0+unit);bindTex(0x0DE1,t);ui(getLoc(p,n.encode()),unit)
    for n,v in values.items():
        loc=getLoc(p,n.encode())
        if isinstance(v,list):u2(loc,*v)
        else:u1(loc,v)
    draw(4,0,3);assert error()==0,name
patches={'hot':{},'fold':dict(drive=8.6,fold=.85,frequency=1.12,resonance=.87,secondary=.65,tint=1.7,saturation=2.3),'sync':dict(lock=0,safety=0,mixB=.35,drift=2.1,tear=.7),'clean':dict(bypass=1,phosphor=1,sharpness=2),'fine_rgb':dict(pixelSize=6,phosphor=1),'coarse_rgb':dict(pixelSize=18,phosphor=1),'no_mask':dict(phosphor=0)}
for name,overrides in patches.items():
    v=base|overrides
    for f in range(3):
        i=f%2;j=1-i
        render('encode',raw,dict(a=a,b=b),v);render('bend',bent[i],dict(raw=raw[0],previous=bent[j][0]),v);render('receiver',locks[i],dict(signal=bent[i][0],previous=locks[j][0]),v);render('decode',decoded,dict(signal=bent[i][0],locks=locks[i][0],a=a),v);render('finish',frames[i],dict(decoded=decoded[0],previous=frames[j][0],a=a),v);render('present',None,dict(image=frames[i][0]),v)
    pixels=(C.c_ubyte*(1920*1080*4))();read(0,0,1920,1080,0x1908,0x1401,pixels);out=Image.frombytes('RGBA',(1920,1080),bytes(pixels)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert('RGB');out.save(OUTPUT / ('gpu-'+name+'.png'));extrema=out.getextrema();assert all(hi-lo>40 for lo,hi in extrema),(name,extrema);print('PASS:',name,'output has dynamic range',extrema)
print('All GPU checks passed. Browser UI, media APIs and macOS are not exercised by this test.')

from PIL import ImageChops, ImageStat
clean=Image.open(OUTPUT / 'gpu-clean.png')
expected=im.convert('RGB').resize((1920,1080),Image.Resampling.BILINEAR)
err=ImageStat.Stat(ImageChops.difference(clean,expected)).mean
assert max(err)<1.5,err
print('PASS: clean bypass matches input despite full phosphor/sharpness:',err)
fine=Image.open(OUTPUT / 'gpu-fine_rgb.png');coarse=Image.open(OUTPUT / 'gpu-coarse_rgb.png')
assert sum(ImageStat.Stat(ImageChops.difference(fine,coarse)).mean)>20
print('PASS: changing RGB size creates distinct cell patterns')
