import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Billboard } from "@react-three/drei";
import { Quaternion, Vector3, Vector3 as V3 } from "three";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useQuest } from "./QuestContext";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useMultiplayer } from "../network/MultiplayerContext";

const WALK_SPEED = 2;          // 行走速度 m/s
const ATTACK_RANGE = 2;        // 攻击距离 m
const SCALE = 1;           // 模型缩放
const ROT = [0, 0, 0];
const MAX_HP = 10;

export default function GhostFollow({ id, isHost, raining, onDead, onUpdate }) {
  const { addKill } = useQuest();
  const { scene, animations } = useGLTF("/models/ghost/scene.gltf");
  const ghostScene = useMemo(() => clone(scene), [scene]);
  const rigid = useRef();
  const model = useRef();
  const { actions } = useAnimations(animations, model);
  const [curr, setCurr] = useState("Idle");
  const [dead, setDead] = useState(false);
  const [vanishing, setVanishing] = useState(false);
  const vanishPosRef = useRef(new V3());
  const { players, ghosts } = useMultiplayer();
  const [hp, setHp] = useState(MAX_HP);
  const lastSync = useRef(0);

  const ghostState = ghosts[id];
  const targetId = ghostState?.targetId;

  // 播放动画并做去重
  const play = (name) => {
    if (curr === name || !actions[name] || dead) return;
    setCurr(name); // 先更新状态
    // 淡入淡出效果
    Object.values(actions).forEach(a=>a.fadeOut(0.2));
    actions[name].reset().fadeIn(0.2).play();
  };

  // 监听天气变化，如果天晴了则开始自我销毁
  useEffect(() => {
    if(isHost && !raining && !vanishing){
      startVanish();
    }
  }, [raining, isHost, vanishing]);

  // 挂载后，确保在物理引擎中有初始位置
  useEffect(() => {
    if (rigid.current && ghostState?.position) {
      rigid.current.setTranslation({ x: ghostState.position[0], y: ghostState.position[1], z: ghostState.position[2] }, true);
    }
  }, [rigid.current, ghostState?.id]);

  const startVanish = () => {
    if (vanishing) return;
    setVanishing(true);
    // 只有房主上报状态
    if (isHost && rigid.current) {
        onUpdate({ vanishing: true });
        const t = rigid.current.translation();
        vanishPosRef.current.set(t.x, t.y, t.z);
        rigid.current.setEnabled(false);
    }
    setTimeout(() => {
      setDead(true);
      if (isHost) onDead();
    }, 2200);
  };

  // 只有房主处理受伤逻辑
  const handleHit = (damage = 10) => {
    if(!isHost) return;
    const nextHp = hp - damage;
    setHp(nextHp);
    if (nextHp <= 0) {
      addKill();
      startVanish();
    } else {
      onUpdate({ hp: nextHp });
    }
  };

  useFrame((_, dt) => {
    if (dead || !rigid.current || vanishing) return;

    // 房主负责 AI 和状态同步
    if (isHost) {
      rigid.current.wakeUp();
      const targetPlayer = players[targetId];

      if (!targetPlayer || !targetPlayer.position) {
        play("Armature|Action_Idle");
      } else {
        const p = new V3(...targetPlayer.position);
        const g = rigid.current.translation();
        const dist = Math.hypot(p.x - g.x, p.z - g.z);

        model.current?.lookAt(p.x, g.y, p.z);

        if (dist > ATTACK_RANGE) {
          const dir = new V3(p.x - g.x, 0, p.z - g.z).normalize();
          const nextPos = new V3(g.x + dir.x * WALK_SPEED * dt, g.y, g.z + dir.z * WALK_SPEED * dt);
          rigid.current.setNextKinematicTranslation(nextPos);
          play("Armature|Action_Walk");
        } else {
          play("Armature|Action_Atack");
        }
      }

      if (performance.now() - lastSync.current > 100) {
        lastSync.current = performance.now();
        const t = rigid.current.translation();
        onUpdate({
          position: [t.x, t.y, t.z],
          rotation: model.current.quaternion.toArray(),
          animation: curr,
          hp,
        });
      }
    } else { // 其他客户端负责接收状态并应用
      if (ghostState) {
        if(ghostState.vanishing && !vanishing) startVanish();
        if (ghostState.position) {
          rigid.current.setTranslation({ x: ghostState.position[0], y: ghostState.position[1], z: ghostState.position[2] }, true);
        }
        if (ghostState.rotation) {
          model.current.quaternion.slerp(new Quaternion().fromArray(ghostState.rotation), 0.2);
        }
        if (ghostState.animation) play(ghostState.animation);
        if (ghostState.hp !== undefined && ghostState.hp !== hp) setHp(ghostState.hp);
      }
    }
  });

  if (dead) return null;

  return (
    <group>
      <RigidBody
        ref={rigid}
        type="kinematicPosition"
        colliders={false}
        userData={{ type: "enemy" }}
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody.userData?.type === "magic") {
            const dmg = other.rigidBody.userData?.damage ?? 10;
            handleHit(dmg);
          }
        }}
      >
        {!vanishing && (
          <>
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

            <group ref={model}>
              <primitive object={ghostScene} scale={SCALE} rotation={ROT} />
            </group>
          </>
        )}
        <CapsuleCollider sensor args={[0.4, 0.6]} position={[0, 1, 0]} />
      </RigidBody>
    </group>
  );
}

useGLTF.preload("/models/ghost/scene.gltf");
