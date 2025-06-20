import { useMemo, useRef } from "react";
import { useGLTF, Billboard, Text } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useMultiplayer } from "../network/MultiplayerContext";

const SCALE = 1;
const ROT = [0,0,0];
const MAX_HP = 10;

export const RemoteGhost = ({ ghost }) => {
  const { scene } = useGLTF("/models/ghost/scene.gltf");
  const ghostScene = useMemo(() => clone(scene), [scene]);
  const modelRef = useRef();
  
  if (!ghost) {
    return null; // 如果 ghost 数据尚未同步，则不渲染
  }

  const { position = [0,0,0], hp = MAX_HP, rotation } = ghost;

  if(rotation && modelRef.current){
    modelRef.current.quaternion.fromArray(rotation);
  }

  // 非房主看到的幽魂模型，带血条，但没有物理实体
  return (
    <group position={position}>
      <Billboard position={[0, 2, 0]}>
        <mesh position-z={-0.01}>
          <planeGeometry args={[1, 0.12]} />
          <meshBasicMaterial color="black" transparent opacity={0.4} />
        </mesh>
        <mesh scale-x={hp / MAX_HP} position-x={-0.5 * (1 - hp / MAX_HP)}>
          <planeGeometry args={[1, 0.12]} />
          <meshBasicMaterial color="red" toneMapped={false} />
        </mesh>
      </Billboard>
      <group ref={modelRef}>
        <primitive object={ghostScene} scale={SCALE} />
      </group>
    </group>
  );
};

useGLTF.preload("/models/ghost/scene.gltf"); 