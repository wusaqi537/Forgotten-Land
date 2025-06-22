import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

/**
 * 场景中的红色按钮。
 * 玩家踩到按钮时触发 onToggle 回调。
 */
export function WeatherButton({ position = [0, 0, 300], scale = [1, 1, 1], onToggle = () => {}, cooldown = 5000 }) {
  const { scene } = useGLTF('models/Button/scene.gltf');
  const toggleRef = useRef(onToggle);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    toggleRef.current = onToggle;
  }, [onToggle]);

  // 缩小碰撞盒尺寸，减少误触；args 为半尺寸
  const colliderArgs = [0.6 * scale[0], 0.25 * scale[1], 0.6 * scale[2]];

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      {/* 传感器用于检测玩家进入 */}
      <CuboidCollider
        args={colliderArgs}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody.userData?.type === 'player') {
            const now = Date.now();
            if (now - lastTimeRef.current >= cooldown) {
              lastTimeRef.current = now;
              toggleRef.current();
            }
          }
        }}
      />
      <primitive object={scene} scale={scale} />
    </RigidBody>
  );
}

useGLTF.preload('models/Button/scene.gltf'); 