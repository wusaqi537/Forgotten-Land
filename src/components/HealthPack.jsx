import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import { HealEffect } from "./HealEffect";

// -------- 音效池 --------
const baseHealAudio = new Audio("/audios/回血.mp3");
baseHealAudio.load();
const playHealSound = () => {
  const snd = baseHealAudio.cloneNode();
  snd.volume = 0.6;
  snd.play().catch(() => {});
};

export function HealthPack({ position = [13, 3, 82], heal = 10 }) {
  const [collected, setCollected] = useState(false);
  const [effect, setEffect] = useState(false);
  const rigid = useRef();
  const { scene } = useGLTF("/models/BloodBag/scene.gltf");
  const visual = useRef();
  const basePos = position;

  // 旋转动画
  useFrame((state, dt) => {
    if (!collected && rigid.current) {
      const t = state.clock.elapsedTime;
      const yOffset = Math.sin(t * 2) * 0.5; // 上下浮动 0.5m
      rigid.current.setNextKinematicTranslation({ x: basePos[0], y: basePos[1] + yOffset, z: basePos[2] });
      if (visual.current) {
        visual.current.rotation.y += dt;
      }
    }
  });

  if (collected) {
    // 渲染粒子特效后消失
    return effect ? (
      <HealEffect position={{ x: basePos[0], y: basePos[1], z: basePos[2] }} />
    ) : null;
  }

  return (
    <RigidBody
      ref={rigid}
      type="kinematicPosition"
      colliders="trimesh"
      sensor
      userData={{ type: "healthpack", heal }}
      position={position}
      onIntersectionEnter={({ other }) => {
        if (!collected && other.rigidBody.userData?.healPlayer) {
          other.rigidBody.userData.healPlayer(heal);
          playHealSound();
          setCollected(true);
          setEffect(true);
          setTimeout(() => setEffect(false), 600);
        }
      }}
    >
      <group ref={visual}>
        {/* 发光点光源 */}
        <pointLight color={'#ff4040'} intensity={2} distance={6} />
        {/* 血包 3D 模型 */}
        <primitive object={scene} scale={0.3} />
      </group>
    </RigidBody>
  );
}

// 预加载血包模型
useGLTF.preload("/models/BloodBag/scene.gltf"); 