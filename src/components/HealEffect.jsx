import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, MathUtils, Vector3 } from "three";

const healColor = new Color("#7fff7f");
healColor.multiplyScalar(8);

const AnimatedParticle = ({ scale, target, speed }) => {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current.scale.x > 0) {
      ref.current.scale.x =
        ref.current.scale.y =
        ref.current.scale.z -= speed * delta;
    }
    ref.current.position.lerp(target, speed);
  });
  return <Instance ref={ref} scale={scale} position={[0, 0, 0]} />;
};

export const HealEffect = ({ nb = 80, position, duration = 600, onEnded = () => {} }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: nb }, () => ({
        target: new Vector3(
          MathUtils.randFloatSpread(0.8),
          MathUtils.randFloatSpread(0.8),
          MathUtils.randFloatSpread(0.8)
        ),
        scale: MathUtils.randFloat(0.08, 0.14),
        speed: MathUtils.randFloat(0.15, 0.35),
      })),
    [nb]
  );

  useEffect(() => {
    const t = setTimeout(() => onEnded(), duration);
    return () => clearTimeout(t);
  }, [duration, onEnded]);

  return (
    <group position={[position.x, position.y, position.z]}>
      <Instances limit={nb} range={nb}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial toneMapped={false} color={healColor} />
        {particles.map((p, i) => (
          <AnimatedParticle key={i} {...p} />
        ))}
      </Instances>
    </group>
  );
}; 