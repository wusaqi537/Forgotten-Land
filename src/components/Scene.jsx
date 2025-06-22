import { useGLTF } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useEffect } from "react";
import { Water } from "./Water";
import * as THREE from "three";

export const Scene = () => {
  const map = useGLTF("models/new_map/scene.gltf");
  
  useEffect(() => {
    map.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, []);

  return (
    <>
      {/* 场景模型和它的碰撞体 */}
      <RigidBody colliders="trimesh" type="fixed">
        <primitive 
          object={map.scene} 
          scale={[0.005, 0.005, 0.005]}
          position={[0, -2, 0]}
        />
      </RigidBody>

      {/* 边界墙 */}
      <RigidBody type="fixed" colliders={false}>
        {/* Z轴方向的墙 (在 z=30 处) */}
        <CuboidCollider 
          args={[50, 20, 0.1]} // [宽度/2, 高度/2, 厚度/2]
          position={[0, 0, 30]} 
        />

        {/* X轴方向的两面墙 */}
        <CuboidCollider 
          args={[0.1, 200, 500]} // [厚度/2, 高度/2, 长度/2]
          position={[-28, 0, 0]} 
        />
        <CuboidCollider 
          args={[0.1, 200, 500]} // [厚度/2, 高度/2, 长度/2]
          position={[40, 0, 0]} 
        />
      </RigidBody>

      {/* 水面 */}
      <Water />

      {/* 出生点 */}
      <group name="spawn_0" position={[0, 0, 60]}>
        <mesh visible={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* --- 1. y = -10 处的 ZX 透明挡板 --- */}
      <RigidBody type="fixed" colliders={false}>
        {/* 长宽足够覆盖整张地图；高度厚一点避免穿透 */}
        <CuboidCollider args={[500 /*X半宽*/, 0.1 /*厚度*/, 500 /*Z半宽*/]} position={[0, -10, 0]} />
      </RigidBody>

      {/* --- 2. z = 2000 处的 XY 透明挡板 --- */}
      <RigidBody type="fixed" colliders={false}>
        {/* 竖直薄板：x 半宽同样给足，y 半高覆盖天空，z 半厚 0.1 */}
        <CuboidCollider args={[500, 500, 10]} position={[0, 0, 400]} />
      </RigidBody>
    </>
  );
};

useGLTF.preload("models/new_map/scene.gltf");
