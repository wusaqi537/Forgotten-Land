import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Quaternion, Vector3, Vector3 as V3 } from "three";

const OFFSET = 2;
const FRONT  = new V3(0, 0, -1);
const SCALE  = 1;
const ROT    = [0, 0, 0];

export default function GhostFollow({ playerRef }) {
  const { scene, animations } = useGLTF("/models/ghost/scene.gltf");
  const group = useRef();
  const { actions } = useAnimations(animations, group);
  const last = useRef(new V3());
  const [curr, setCurr] = useState("Idle");

  const play = (name) => {
    if (curr === name || !actions[name]) return;
    Object.values(actions).forEach(a => a.stop());
    actions[name].reset().fadeIn(0.2).play();
    setCurr(name);
  };

  useFrame(({ clock }, dt) => {
    if (!playerRef.current) return;

    const t = playerRef.current.translation();
    const r = playerRef.current.rotation();
    const dir = FRONT.clone().applyQuaternion(
      new Quaternion(r.x, r.y, r.z, r.w)
    ).normalize();

    const target = new V3(t.x, 0.5, t.z).addScaledVector(dir, OFFSET);
    group.current.position.lerp(target, 0.1);
    group.current.lookAt(t.x, 0.5, t.z);

    const speed = group.current.position.clone().sub(last.current).length() / dt;
    last.current.copy(group.current.position);

    play(speed > 0.1 ? "Armature|Action_Walk" : "Armature|Action_Idle");
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={SCALE} rotation={ROT} />
    </group>
  );
}

useGLTF.preload("/models/ghost/scene.gltf");
