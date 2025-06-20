import { Billboard, Text } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";

const MAX_HP = 120;

export const PlayerInfo = ({ health = MAX_HP, profile = { name: "玩家", color: "#ffffff" } }) => {
  const [prevHealth, setPrevHealth] = useState(health);
  const [isDamaged, setIsDamaged] = useState(false);

  useEffect(() => {
    if (health < prevHealth) {
      setIsDamaged(true);
      setTimeout(() => setIsDamaged(false), 500);
    }
    setPrevHealth(health);
  }, [health]);

  const getHealthColor = () => {
    if (health > 70) return new THREE.Color(0.0, 1.0, 0.2);
    if (health > 30) return new THREE.Color(1.0, 0.7, 0.0);
    return new THREE.Color(1.0, 0.0, 0.0);
  };

  return (
    <Billboard position-y={4}>
      <Text position-y={0.36} fontSize={0.4}>
        {profile.name}
        <meshBasicMaterial color={profile.color} />
      </Text>
      <mesh position-z={-0.1}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      <mesh
        scale-x={health / MAX_HP}
        position-x={-0.5 * (1 - health / MAX_HP)}
        position-z={-0.05}
        scale={isDamaged ? [1.1, 1.1, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[1, 0.25]} />
        <meshBasicMaterial
          color={getHealthColor()}
          transparent
          opacity={isDamaged ? 0.8 : 0.4}
        />
      </mesh>
      <mesh
        scale-x={health / MAX_HP}
        position-x={-0.5 * (1 - health / MAX_HP)}
        scale={isDamaged ? [1.1, 1.1, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color={getHealthColor()} toneMapped={false} />
      </mesh>
      <mesh position-z={0.01}>
        <planeGeometry args={[1.02, 0.22]} />
        <meshBasicMaterial color="white" transparent opacity={0.3} />
      </mesh>
    </Billboard>
  );
}; 