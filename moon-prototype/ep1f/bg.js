/* ep1f/bg.js — shared background painters for Ep1 (Final).
 * Pure code: sky, painterly meadow, living pond. All f(t).
 * Usage: initBG('sky'|'meadow'|'pond') once, then paintBG(t) per frame.
 */
"use strict";
const BG_VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const BG_SKY = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.03 + vec2(17.3,9.1); a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv; p.x *= uRes.x / uRes.y;
  float t = uTime * 0.02; // very slow: the sky breathes, never rushes

  // midnight base gradient
  vec3 col = mix(vec3(0.016,0.024,0.059), vec3(0.082,0.125,0.290), pow(uv.y, 1.25));

  // nebula: domain-warped fbm for organic slow clouds
  vec2 q = vec2(fbm(p*1.6 + vec2(t, 0.0)), fbm(p*1.6 + vec2(5.2,1.3) - t*0.7));
  float neb = fbm(p*1.6 + 2.6*q);
  vec3 nebCol = mix(vec3(0.10,0.075,0.24), vec3(0.21,0.11,0.28), q.y);
  col += nebCol * smoothstep(0.42, 0.88, neb) * 0.38;

  // milky-way band: faint diagonal river of light
  float band = exp(-pow((uv.y - (0.64 - 0.28*uv.x))*3.2, 2.0));
  col += vec3(0.09,0.08,0.15) * band * (0.35 + 0.65*neb);

  // stars: hashed grid, gentle twinkle
  vec2 sp = p * 42.0;
  vec2 cell = floor(sp);
  float h = hash(cell);
  if(h > 0.93){
    vec2 spos = vec2(hash(cell+7.13), hash(cell+3.71)) - 0.5;
    float d = length(fract(sp) - 0.5 - spos*0.55);
    float tw = 0.55 + 0.45*sin(uTime*(0.8+h*1.6) + h*43.0);
    float star = smoothstep(0.09, 0.0, d) * tw;
    star *= smoothstep(0.93, 0.995, h)*1.8 + 0.35;
    col += vec3(1.0,0.97,0.90) * star;
  }

  // vignette: edges melt into warm darkness
  float vig = smoothstep(1.30, 0.40, length(uv-0.5)*1.45);
  col *= mix(0.72, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}`;
const BG_MEADOW = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.03 + vec2(17.3,9.1); a *= 0.5; }
  return v;
}
float fbmw(vec2 p){
  vec2 w = vec2(fbm(p + vec2(1.7, 9.2)), fbm(p + vec2(8.3, 2.8)));
  return fbm(p + 1.6*w);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv; p.x *= uRes.x / uRes.y;
  float t = uTime * 0.02;
  float e = 0.004;

  // ---- sky ----
  vec3 col = mix(vec3(0.016,0.024,0.059), vec3(0.082,0.125,0.290), pow(uv.y, 1.25));
  vec2 q = vec2(fbm(p*1.6 + vec2(t, 0.0)), fbm(p*1.6 + vec2(5.2,1.3) - t*0.7));
  float neb = fbm(p*1.6 + 2.6*q);
  vec3 nebCol = mix(vec3(0.10,0.075,0.24), vec3(0.21,0.11,0.28), q.y);
  col += nebCol * smoothstep(0.42, 0.88, neb) * 0.38;
  float band = exp(-pow((uv.y - (0.64 - 0.28*uv.x))*3.2, 2.0));
  col += vec3(0.09,0.08,0.15) * band * (0.35 + 0.65*neb);
  vec2 sp = p * 42.0;
  vec2 cell = floor(sp);
  float hh = hash(cell);
  if(hh > 0.93){
    vec2 spos = vec2(hash(cell+7.13), hash(cell+3.71)) - 0.5;
    float d = length(fract(sp) - 0.5 - spos*0.55);
    float tw = 0.55 + 0.45*sin(uTime*(0.8+hh*1.6) + hh*43.0);
    float star = smoothstep(0.09, 0.0, d) * tw;
    star *= smoothstep(0.93, 0.995, hh)*1.8 + 0.35;
    col += vec3(1.0,0.97,0.90) * star;
  }

  // ---- hills, far to near: warped silhouettes, textured, hazy ----
  float clust = fbmw(p * vec2(7.0, 14.0) + vec2(t*0.3, 0.0));
  float trees = smoothstep(0.55, 0.78, clust);
  float mist  = smoothstep(0.42, 0.66, fbm(p*vec2(3.0, 8.0) + vec2(-t*0.5, 2.0)));

  float h1 = 0.60 + (fbmw(vec2(p.x*1.8, 3.7)) - 0.5) * 0.17;
  vec3 c1 = vec3(0.285, 0.320, 0.560) * (0.92 + 0.16*clust);
  c1 = mix(c1, vec3(0.45, 0.47, 0.68), mist*0.38);
  col = mix(col, c1, 1.0 - smoothstep(h1 - e, h1 + e, uv.y));

  float h2 = 0.50 + (fbmw(vec2(p.x*2.3, 9.2)) - 0.5) * 0.19;
  vec3 c2 = vec3(0.210, 0.250, 0.490) * (0.90 + 0.20*clust);
  c2 *= 1.0 - trees*0.28;
  c2 = mix(c2, vec3(0.38, 0.40, 0.60), mist*0.28);
  col = mix(col, c2, 1.0 - smoothstep(h2 - e, h2 + e, uv.y));

  float h3 = 0.40 + (fbmw(vec2(p.x*2.9, 15.7)) - 0.5) * 0.21;
  vec3 c3 = vec3(0.155, 0.195, 0.410) * (0.90 + 0.20*clust);
  c3 *= 1.0 - trees*0.34;
  c3 = mix(c3, vec3(0.30, 0.33, 0.53), mist*0.18);
  col = mix(col, c3, 1.0 - smoothstep(h3 - e, h3 + e, uv.y));

  float h4 = 0.285 + (fbmw(vec2(p.x*3.6, 23.1)) - 0.5) * 0.19;
  vec3 c4 = vec3(0.110, 0.150, 0.320) * (0.90 + 0.20*clust);
  c4 *= 1.0 - trees*0.38;
  col = mix(col, c4, 1.0 - smoothstep(h4 - e, h4 + e, uv.y));

  // ---- meadow floor: grass-streak texture, moonlit flecks ----
  float mm = 1.0 - smoothstep(0.135, 0.175, uv.y);
  if(mm > 0.001){
    float streak  = fbm(vec2(p.x*90.0, p.y*7.0));
    float streak2 = fbm(vec2(p.x*45.0 + 31.0, p.y*5.0));
    vec3 gcol = mix(vec3(0.070,0.140,0.165), vec3(0.135,0.260,0.250), streak);
    gcol += vec3(0.09,0.14,0.12) * smoothstep(0.58, 0.80, streak2);
    gcol *= mix(0.60, 1.10, smoothstep(0.0, 0.16, uv.y));
    col = mix(col, gcol, mm);
  }

  float vig = smoothstep(1.30, 0.40, length(uv-0.5)*1.45);
  col *= mix(0.70, 1.0, vig);
  gl_FragColor = vec4(col, 1.0);
}`;
const BG_POND = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.03 + vec2(17.3,9.1); a *= 0.5; }
  return v;
}
vec3 skyRef(vec2 uv){
  vec3 col = mix(vec3(0.016,0.024,0.059), vec3(0.082,0.125,0.290), pow(clamp(uv.y,0.0,1.0), 1.25));
  float band = exp(-pow((uv.y - 0.55)*3.0, 2.0));
  col += vec3(0.09,0.08,0.15) * band;
  return col;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv; p.x *= uRes.x / uRes.y;
  float t = uTime * 0.05;

  // ripple normal: layered sines + drifting fbm micro-ripples
  vec2 rip;
  rip.x = sin(p.x*8.0 + t*1.2)*0.5 + sin(p.x*17.0 - t*0.8 + p.y*6.0)*0.3;
  rip.y = cos(p.y*10.0 - t*1.0)*0.5 + cos((p.x+p.y)*13.0 + t*0.6)*0.3;
  float micro = fbm(p*6.0 + vec2(t*0.3, -t*0.2)) - 0.5;
  vec2 n = vec2(rip.x, rip.y)*0.5 + vec2(micro, -micro)*0.8;

  // reflected sky, distorted by the ripples
  vec2 ruv = vec2(uv.x + n.x*0.035, 1.0 - uv.y*0.85 + n.y*0.02);
  vec3 refle = skyRef(ruv);

  // water body: luminous deep teal, darker toward the viewer
  vec3 deep = mix(vec3(0.030,0.135,0.175), vec3(0.010,0.065,0.115), uv.y);

  // distance reflectivity: far water mirrors the sky
  float fres = pow(1.0 - uv.y, 1.5)*0.7 + 0.3;
  vec3 col = mix(deep, refle, fres*0.62);

  // drifting ripple flecks: sparse bright dashes catching the light
  float fleck = fbm(p*13.0 + vec2(t*0.55, t*0.32));
  fleck = smoothstep(0.60, 0.78, fleck);
  col += vec3(0.55,0.75,0.95) * fleck * 0.22;

  // moon glint: a soft shimmering path of warm light (gentle, irregular)
  float mx = 0.68;
  float dx = uv.x - mx + n.x*0.030;
  float core = exp(-pow(dx*26.0, 2.0));
  float aura = exp(-pow(dx*9.0, 2.0))*0.35;
  float breathe = 0.72 + 0.28*sin(uv.y*22.0 + uTime*1.6 + n.y*8.0);
  float vband = smoothstep(0.05, 0.35, uv.y) * (1.0 - smoothstep(0.72, 0.97, uv.y));
  col += vec3(1.0, 0.82, 0.55) * (core*0.55 + aura) * breathe * vband * 0.62;

  // sparkles, only inside the moon path's aura
  vec2 sp = p * 60.0;
  vec2 cell = floor(sp);
  float h = hash(cell);
  if(h > 0.985){
    vec2 spos = vec2(hash(cell+3.1), hash(cell+7.7)) - 0.5;
    float d = length(fract(sp) - 0.5 - spos*0.5 + n*0.3);
    float tw = 0.5 + 0.5*sin(uTime*3.0 + h*50.0);
    float nearPath = exp(-pow((uv.x - mx)*9.0, 2.0));
    col += vec3(1.0,0.9,0.7) * smoothstep(0.06, 0.0, d) * tw * nearPath * 2.0;
  }

  float vig = smoothstep(1.30, 0.40, length(uv-0.5)*1.45);
  col *= mix(0.70, 1.0, vig);
  gl_FragColor = vec4(col, 1.0);
}`;

let _bg = null;
function initBG(kind) {
  const cv = document.getElementById('gl');
  const gl = cv.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
  function sh(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, BG_VERT));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER,
    kind === 'sky' ? BG_SKY : kind === 'meadow' ? BG_MEADOW : BG_POND));
  gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(pr, 'uRes'), 1280, 720);
  const uTimeLoc = gl.getUniformLocation(pr, 'uTime');
  gl.viewport(0, 0, 1280, 720);
  _bg = { gl, uTimeLoc };
}
function paintBG(t) {
  _bg.gl.uniform1f(_bg.uTimeLoc, t);
  _bg.gl.drawArrays(_bg.gl.TRIANGLES, 0, 3);
}
