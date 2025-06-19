import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { createPortal } from 'react-dom';
import { useQuest } from './QuestContext';

export function NPC({ position = [0, 0, 150], scale = [1, 1, 1], playerRef }) {
  const group = useRef();
  const { scene, animations } = useGLTF('/models/character2/scene.gltf');

  // 克隆模型避免骨骼共享
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, group);

  // 播放默认待机动画
  useEffect(() => {
    const idleName = 'HOD_UR_Set02_Idle.001';
    if (actions[idleName]) {
      actions[idleName].reset().fadeIn(0.3).play();
    }
    return () => {
      if (actions[idleName]) actions[idleName].fadeOut(0.2);
    };
  }, [actions]);

  const [inRange, setInRange] = useState(false);
  const [talking, setTalking] = useState(false);
  const [dialogStep, setDialogStep] = useState(0);
  const { showMessage } = useQuest();

  // 距离检测
  useFrame(() => {
    if (!playerRef?.current) return;
    const playerPos = playerRef.current.translation();
    const dx = playerPos.x - position[0];
    const dy = playerPos.y - position[1];
    const dz = playerPos.z - position[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const nextRange = dist < 5; // 5 米内可交互
    if (nextRange !== inRange) setInRange(nextRange);
  });

  // 按键监听
  useEffect(() => {
    const handleKey = (e) => {
      if (!inRange) return;
      if (e.code === 'KeyF') {
        if (talking) {
          setTalking(false);
          if(dialogStep===1){
            showMessage('已收集线索：小鹿',2000);
            setDialogStep(0);
          }
        }else{
          setTalking(true);
          setDialogStep(0);
        }
      }else if(e.code==='KeyH' && talking && dialogStep===0){
        setDialogStep(1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inRange, talking, dialogStep, showMessage]);

  // 根据缩放调整传感器盒子尺寸（按默认 0.4,0.9,0.4 放大）
  const colliderSize = [0.4 * scale[0], 0.9 * scale[1], 0.4 * scale[2]];

  // 对话框挂载
  const dialogRef = useRef(null)
  useEffect(() => {
    if (talking) {
      const el = document.createElement('div')
      el.style.cssText = `
        position:fixed;bottom:40px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,.7);color:#fff;padding:16px 24px;border-radius:6px;
        width:420px;font:18px sans-serif;line-height:1.6;word-break:break-all;
        pointer-events:none;z-index:9500;
      `
      let html="";
      if(dialogStep===0){
        html=`你好，旅行者！这里似乎充满了危险的幽魂。如果你能帮助我清除它们，我将给予你一些指引。<div style='margin-top:12px;font-size:16px;'>(按 H 继续，F 结束)</div>`;
      }else{
        html=`什么，怎么会没有？<div style='margin-top:12px;font-size:16px;text-align:right;'>(按 F 关闭)</div>`;
      }
      el.innerHTML=html;
      document.body.appendChild(el)
      dialogRef.current = el
      return () => document.body.removeChild(el)
    }
  }, [talking, dialogStep, showMessage])

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={colliderSize} />
      <CuboidCollider args={colliderSize} sensor />
      <group scale={scale} ref={group}>
        <primitive object={clone} />
      </group>
      {/* 顶部提示仍用 <Html>，不会触发 R3F 报错 */}
      {inRange && !talking && (
        <Html position={[0, 2.2 * scale[1], 0]} distanceFactor={6}>
          <div style={{background:'rgba(0,0,0,.6)',color:'#fff',padding:'6px 12px',
                       borderRadius:4,whiteSpace:'nowrap',fontSize:20}}>按 F 键交互</div>
        </Html>
      )}
    </RigidBody>
  );
}

useGLTF.preload('/models/character2/scene.gltf'); 