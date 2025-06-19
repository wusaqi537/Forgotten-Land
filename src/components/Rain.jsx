import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

/**
 * 简易雨滴粒子系统。
 * @param {number} count  雨滴粒子数量
 * @param {number} area   分布区域尺寸（正方形边长，单位米）
 * @param {number} speed  下落速度
 */

// -------- Rain shader material (全局定义，仅注册一次) --------
const RainMaterial = shaderMaterial(
  { uTime: 0 },
  /* 顶点着色器 */
  `
    uniform float uTime;

    void main(){
      // Model-View 位置
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      // 固定像素大小（不随距离衰减），可根据需要调节
      gl_PointSize = 12.0;

      // 投影到裁剪空间
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* 片元着色器 */
  `
    // gl_PointCoord 在 (0,0)~(1,1) 内提供点精灵坐标，左下角为 (0,0)
    uniform float uTime;

    void main(){
      // 细长宽度阈值（0~0.5），越小越细
      float halfWidth = 0.12;

      // 横向距离 (0~0.5)
      float dx = abs(gl_PointCoord.x - 0.5);

      // 裁剪出竖直条
      if(dx > halfWidth){
        discard;
      }

      // 从顶部到尾部做线性透明，让尾部更淡
      float alpha = gl_PointCoord.y;

      // 略带蓝白色调
      vec3 color = mix(vec3(0.8, 0.9, 1.0), vec3(0.6, 0.7, 1.0), gl_PointCoord.y);

      gl_FragColor = vec4(color, alpha);
    }
  `
);

extend({ RainMaterial });
// -------- Rain shader material END --------

export function Rain({ count = 1000, area = 300, speed = 15 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * area;      // x
      arr[i * 3 + 1] = Math.random() * 40 + 10;           // y (10 ~ 50)
      arr[i * 3 + 2] = (Math.random() - 0.5) * area;      // z
    }
    return arr;
  }, [count, area]);

  const ref = useRef();
  const groupRef = useRef();
  const { camera } = useThree();

  // 初次挂载后打印几何体信息
  useEffect(() => {
    if (ref.current) {
      console.log('Rain Points:', ref.current);
      console.log(ref.current.geometry.attributes.position.count);
    }
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position;
    for (let i = 0; i < attr.count; i++) {
      // 下落速度
      attr.array[i * 3 + 1] -= delta * speed;
      // 如果掉到地面以下，重置到顶部（y=50）
      if (attr.array[i * 3 + 1] < -5) {
        // 重新随机位置，避免所有雨滴同时重生造成"阵阵"感
        attr.array[i * 3 + 1] = 40 + Math.random() * 20; // 随机高度 40~60
        attr.array[i * 3 + 0] = (Math.random() - 0.5) * area; // 新 X
        attr.array[i * 3 + 2] = (Math.random() - 0.5) * area; // 新 Z
      }
    }
    attr.needsUpdate = true;
    // 让雨云中心跟随相机 XZ，以保证总在视野范围
    if (groupRef.current) {
      groupRef.current.position.set(camera.position.x, 0, camera.position.z);
    }
    // 更新时间 uniform
    if (ref.current && ref.current.material) {
      ref.current.material.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef} frustumCulled={false} renderOrder={20}>
      <points ref={ref} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={positions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>

        {/* 使用自定义雨滴 shader 材质 */}
        <rainMaterial
          attach="material"
          transparent
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* 调试球 */}
      {/* <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="blue" />
      </mesh> */}
    </group>
  );
} 