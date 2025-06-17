import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, MathUtils, Vector3 } from "three";

const hitColor = new Color("#7fd9ff");
hitColor.multiplyScalar(12);

const AnimatedSphere = ({ scale, target, speed }) => {
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

export const MagicAttack = ({ nb = 100, position, onEnded }) => {
  const spheres = useMemo(
    () =>
      Array.from({ length: nb }, () => ({
        target: new Vector3(
          MathUtils.randFloat(-0.6, 0.6),
          MathUtils.randFloat(-0.6, 0.6),
          MathUtils.randFloat(-0.6, 0.6)
        ),
        scale: 0.1,
        speed: MathUtils.randFloat(0.1, 0.3),
      })),
    [nb]
  );

  useEffect(() => {
    const t = setTimeout(() => onEnded(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <group position={[position.x, position.y, position.z]}>
      <Instances>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial toneMapped={false} color={hitColor} />
        {spheres.map((b, i) => (
          <AnimatedSphere key={i} {...b} />
        ))}
      </Instances>
    </group>
  );
}; 