import { useState, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import { useQuest } from "./QuestContext";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const baseAudio = new Audio("audios/回血.mp3");
baseAudio.load();

const playPickup = () => {
  const snd = baseAudio.cloneNode();
  snd.volume = 0.7;
  snd.play().catch(() => {});
};

export function NoodleBowl({ position = [0, 0, 0] }) {
  const { addNoodle } = useQuest();
  const [collected, setCollected] = useState(false);
  const rigid = useRef();
  const visual = useRef();
  const { scene } = useGLTF("models/bowl/scene.gltf");
  const bowlScene = useMemo(() => clone(scene), [scene]);

  // 起伏旋转动画
  useFrame((state, dt) => {
    if (collected) return;
    const t = state.clock.elapsedTime;
    const yOffset = Math.sin(t * 1.8) * 0.4; // 上下浮动幅度 0.4m

    // 更新碰撞体位置
    if (rigid.current) {
      rigid.current.setNextKinematicTranslation({ x: position[0], y: position[1] + yOffset, z: position[2] });
    }

    if (visual.current) {
      visual.current.rotation.y += dt * 0.6;
    }
  });

  return (
    <RigidBody
      ref={rigid}
      type="kinematicPosition"
      colliders="trimesh"
      sensor={!collected}
      position={position}
      userData={{ type: "noodle" }}
      onIntersectionEnter={({ other }) => {
        if (!collected && other.rigidBody.userData?.type === "player") {
          setCollected(true);
          addNoodle();
          playPickup();
          // 禁用刚体以防止后续物理计算
          rigid.current?.setEnabled(false);
        }
      }}
    >
      <group ref={visual} visible={!collected}>
        {/* 白色发光 */}
        <pointLight color="#ffffff" intensity={2} distance={8} />
        <primitive object={bowlScene} scale={5} />
      </group>
    </RigidBody>
  );
}

useGLTF.preload("models/bowl/scene.gltf"); 