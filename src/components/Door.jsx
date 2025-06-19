import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGLTF, Sparkles } from '@react-three/drei';

// 门碰撞体尺寸（根据模型大概尺寸，可视需求调整）
const COLLIDER_SIZE = [1, 2, 0.25];

export function Door({ position = [-25, 0, 360], scale = [1, 1, 1], visible = true }) {
  const { scene } = useGLTF('/models/gate/scene.gltf');
  if (!visible) return null;

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      {/* 碰撞体 */}
      <CuboidCollider args={COLLIDER_SIZE} sensor />
      {/* 模型 */}
      <primitive object={scene} scale={scale} rotation-y={Math.PI / 2} />
      {/* 粒子光效 */}
      <Sparkles
        count={80}
        size={2}
        color={"#ffd700"}
        speed={0.4}
        opacity={0.8}
        scale={[3, 4, 3]}
        position={[0, 2, 0]}
      />
    </RigidBody>
  );
}

useGLTF.preload('/models/gate/scene.gltf'); 