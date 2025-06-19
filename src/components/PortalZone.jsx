import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useRef } from 'react';
import { useQuest } from './QuestContext';

// 传送门感应区
export function PortalZone({ position = [-25, 0, 360], size = [2, 3, 2] }) {
  const { jumpLevel, showMessage } = useQuest();
  const triggered = useRef(false);

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      onIntersectionEnter={({ other }) => {
        if (other.rigidBody.userData?.type !== 'player') return;
        if (!triggered.current) {
          if (jumpLevel < 2) {
            showMessage('再去探索一下吧！', 2000);
          } else {
            showMessage('游戏通关，未完待续...你也可以继续探索这里', 3000);
          }
        }
        triggered.current = true;
      }}
      onIntersectionExit={({ other }) => {
        if (other.rigidBody.userData?.type === 'player') {
          triggered.current = false;
        }
      }}
    >
      <CuboidCollider args={size} sensor />
    </RigidBody>
  );
} 