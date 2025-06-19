import { Instances, Instance } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import { Color, MathUtils, Vector3 } from "three";

/**
 * 幽魂消散特效：紫色粒子向外扩散并逐渐缩小 / 淡出。
 * @param position {x,y,z} 世界坐标
 * @param duration 持续时间 ms
 * @param nb 粒子数量
 */
export function GhostDissolveEffect({ position, duration = 2000, nb = 160, onEnded = () => {} }) {
  // 每个粒子随机方向 / 速度 / 初始缩放
  const particles = useMemo(
    () =>
      Array.from({ length: nb }, () => ({
        dir: new Vector3(MathUtils.randFloatSpread(1), MathUtils.randFloat(0.3, 1.3), MathUtils.randFloatSpread(1)).normalize(),
        speed: MathUtils.randFloat(3, 6),
        scale: MathUtils.randFloat(0.2, 0.35),
      })),
    [nb]
  );

  // 保存实例引用以便逐帧更新位置 / 缩放
  const refs = useRef([]);
  const materialColor = new Color("#9b7bff").multiplyScalar(6);

  useFrame((_, dt) => {
    refs.current.forEach((inst, i) => {
      if (!inst) return;
      // 位置外扩
      inst.position.addScaledVector(particles[i].dir, particles[i].speed * dt);
      // 缩放减小
      const s = Math.max(inst.scale.x - dt * 0.5, 0);
      inst.scale.setScalar(s);
    });
  });

  // 定时结束
  useEffect(() => {
    const t = setTimeout(onEnded, duration);
    return () => clearTimeout(t);
  }, [duration, onEnded]);

  return (
    <group position={[position.x, position.y, position.z]}>
      <Instances limit={nb} range={nb} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial toneMapped={false} transparent opacity={0.9} color={materialColor} />
        {particles.map((p, i) => (
          <Instance
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            scale={p.scale}
            position={[0, 0, 0]}
          />
        ))}
      </Instances>
    </group>
  );
} 