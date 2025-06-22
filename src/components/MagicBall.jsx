import { RigidBody, vec3 } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { MeshStandardMaterial } from "three";
import { WEAPON_OFFSET } from "./CharacterController";

const BALL_SPEED = 20;
const HEIGHT_OFFSET = 1; // 高度

const ballMaterial = new MeshStandardMaterial({
  color: "#7fd9ff",
  emissive: "#7fd9ff",
  emissiveIntensity: 2,
  toneMapped: false,
});

// Audio pool
const baseShotAudio = new Audio("audios/发射法球.mp3");
baseShotAudio.load();
const playShotSound = () => {
  const snd = baseShotAudio.cloneNode();
  snd.volume = 0.6;
  snd.play();
};

// 命中标志，防止同一颗子弹触发多次命中事件
const useSingleHit = () => {
  const hitRef = useRef(false);
  return {
    hasHit: () => hitRef.current,
    markHit: () => {
      hitRef.current = true;
    },
  };
};

export const MagicBall = ({ player, angle, position, onHit }) => {
  const rigidbody = useRef();
  const { hasHit, markHit } = useSingleHit();

  useEffect(() => {
    playShotSound();
    const velocity = {
      x: Math.sin(angle) * BALL_SPEED,
      y: 0,
      z: Math.cos(angle) * BALL_SPEED,
    };
    rigidbody.current.setLinvel(velocity, true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (rigidbody.current && rigidbody.current.isEnabled() && !hasHit()) {
        markHit();
        rigidbody.current.setEnabled(false);
        onHit(vec3(rigidbody.current.translation()));
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <group
      position={[
        position.x,
        position.y + HEIGHT_OFFSET,
        position.z,
      ]}
      rotation-y={angle}
    >
      <group
        position-x={WEAPON_OFFSET.x}
        position-y={WEAPON_OFFSET.y}
        position-z={WEAPON_OFFSET.z}
      >
        <RigidBody
          ref={rigidbody}
          gravityScale={0}
          onIntersectionEnter={(e) => {
            if (e.other.rigidBody.userData?.type !== "magic" && !hasHit()) {
              markHit();
              rigidbody.current.setEnabled(false);
              onHit(vec3(rigidbody.current.translation()));
            }
          }}
          sensor
          userData={{
            type: "magic",
            player,
            damage: 10,
          }}
        >
          <mesh material={ballMaterial} castShadow>
            <sphereGeometry args={[0.25, 16, 16]} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  );
}; 