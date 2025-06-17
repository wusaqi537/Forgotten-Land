import { extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

// 创建水面着色器材质
const WaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uQuality: 1.0,
    uHighQuality: 0.5,
    uColorNear: new THREE.Color(0.0, 0.6, 0.8),
    uColorFar: new THREE.Color(0.0, 0.3, 0.5),
    uFogNear: 10.0,
    uFogFar: 80.0,
    uFogColor: new THREE.Color(0.1,0.1,0.1),
    alphaScale: 0.4,
  },
  /* 顶点着色器 */
  `
    varying vec2 vUv;
    varying float vFogDepth;
    varying vec3 vWorldPos;
    uniform float uTime;

    void main(){
      vUv = uv;
      float sineOffset = sin(uTime * 1.2) * 0.1;
      vec3 modifiedPosition = position;
      modifiedPosition.z += sineOffset;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition,1.0);

      vec4 mvPosition = modelViewMatrix * vec4(modifiedPosition,1.0);
      vFogDepth = -mvPosition.z;

      // Pass world position to fragment
      vWorldPos = (modelMatrix * vec4(modifiedPosition,1.0)).xyz;
    }
  `,
  /* 片元着色器 */
  `
    varying vec2 vUv;
    varying float vFogDepth;
    varying vec3 vWorldPos;

    uniform float uTime;
    uniform float uQuality;
    uniform float uHighQuality;
    uniform vec3 uColorNear;
    uniform vec3 uColorFar;
    uniform float uFogNear;
    uniform float uFogFar;
    uniform vec3 uFogColor;
    uniform float alphaScale;

    vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
    vec2 mod289(vec2 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
    vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}    
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ; m = m*m ;
      vec3 x = 2.0 * fract(p * vec3(0.024390243902439)) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main(){
      // clip region: keep only |x|<=40 and y<=-4 (world space)
      if(abs(vWorldPos.x) > 40.0 || vWorldPos.y < -70.0 || vWorldPos.y > -3.0 || vWorldPos.z < 100.0 || vWorldPos.z >600.0){ discard; }

      vec3 finalColor = uColorNear;
      vec3 alpha = vec3(0.5);
      if(uQuality > uHighQuality){
        float noiseBase = snoise(vUv * 2000.0 + sin(uTime*0.3));
        noiseBase = noiseBase*0.5+0.5;
        vec3 colorBase = vec3(noiseBase);
        vec3 foam = smoothstep(0.08,0.001,colorBase);
        foam = step(0.5,foam);
        float noiseWaves = snoise(vUv*300.0+sin(uTime*-0.1));
        noiseWaves = noiseWaves*0.5+0.5;
        vec3 colorWaves = vec3(noiseWaves);
        float threshold = 0.6+0.01*sin(uTime*2.0);
        vec3 waveEffect = 1.0-(smoothstep(threshold+0.03,threshold+0.032,colorWaves)+smoothstep(threshold,threshold-0.01,colorWaves));
        waveEffect = step(0.5,waveEffect)-0.8;
        vec3 combinedEffect = waveEffect + (foam*2.0);
        float vignette = length(vUv-0.5)*1.5;
        float h = smoothstep(0.3, 0.9, length(vUv - 0.5) * 1.5);
        h = max(h, 0.3);
        vec3 baseColor = mix(uColorNear, uColorFar, h);
        finalColor = (1.0-combinedEffect)*baseColor + combinedEffect;
        alpha = foam*0.5;
        alpha += min(vignette+0.4,1.0);
      }
      float fogFactor = smoothstep(uFogNear*0.5,uFogFar*0.5,vFogDepth*0.1);
      finalColor = mix(finalColor,uFogColor,min(1.0,fogFactor+0.8));
      gl_FragColor = vec4(finalColor,alpha*alphaScale);
    }
  `
);

// 注册材质组件
extend({ WaterMaterial });

export function Water() {
  const materialRef = useRef();

  // 更新时间变量以实现动画效果
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation-x={-Math.PI * 0.5} position={[0, -6, 0]}>
      <planeGeometry args={[1000, 1000, 100, 100]} />
      <waterMaterial 
        ref={materialRef} 
        transparent
        side={THREE.DoubleSide}
        opacity={0.5}
        uColorNear={new THREE.Color('#7fd9ff')}
        uColorFar={new THREE.Color('#3aa6ff')}
        uFogNear={40}
        uFogFar={120}
        uFogColor={new THREE.Color('#0a1e2e')}
        alphaScale={0.3}
      />
    </mesh>
  );
} 