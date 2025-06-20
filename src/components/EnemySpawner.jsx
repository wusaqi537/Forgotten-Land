import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import GhostFollow from "./EnemyGhost";
import { useMultiplayer } from "../network/MultiplayerContext";

const MIN_RADIUS = 20;  // 最小距离（米）
const MAX_RADIUS = 30;  // 最大距离
const CHECK_INTERVAL = 1000; // 每隔1秒检查一次

export const EnemySpawner = ({raining}) => {
  const { players, myId, ghosts, spawnGhost, removeGhost, updateGhost } = useMultiplayer();
  const [localGhosts, setLocalGhosts] = useState([]); // 房主端维护的幽魂列表
  const lastCheck = useRef(0);

  // 确定谁是房主 (第一个加入的玩家)
  const isHost = myId && players && Object.keys(players).length > 0 && Object.keys(players).sort()[0] === myId;

  useFrame((state) => {
    // 只有房主执行生成/销毁逻辑
    if (!isHost) return;

    const now = state.clock.elapsedTime * 1000;
    if (now - lastCheck.current < CHECK_INTERVAL) {
      return;
    }
    lastCheck.current = now;

    const playerIds = Object.keys(players);
    const alivePlayerIdSet = new Set(playerIds);
    let currentGhosts = [...localGhosts];

    // 清理那些目标玩家已掉线的幽魂
    const ghostsToClean = currentGhosts.filter(g => !alivePlayerIdSet.has(g.targetId));
    if (ghostsToClean.length > 0) {
      ghostsToClean.forEach(g => removeGhost(g.id));
      currentGhosts = currentGhosts.filter(g => alivePlayerIdSet.has(g.targetId));
    }

    // 如果在下雨，就检查并生成新的幽魂
    if (raining) {
      const newGhosts = [];
      playerIds.forEach(playerId => {
        const ghostsForThisPlayer = currentGhosts.filter(g => g.targetId === playerId);
        const needed = 5 - ghostsForThisPlayer.length;
        if (needed > 0) {
          const playerPos = players[playerId]?.position || [0, 1, 60];
          for (let i = 0; i < needed; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
            const newPos = [playerPos[0] + Math.cos(angle) * r, 1, playerPos[2] + Math.sin(angle) * r];
            const newGhost = {
              id: `${playerId}-${Math.random().toString(36).slice(2)}`,
              spawnPos: newPos,
              targetId: playerId,
            };
            newGhosts.push(newGhost);
            spawnGhost({ id: newGhost.id, position: newPos, hp: 10, targetId: playerId });
          }
        }
      });
      currentGhosts.push(...newGhosts);
    }
    
    // 更新本地状态
    setLocalGhosts(currentGhosts);
  });

  const onGhostDead = (id) => {
    // 只有房主处理死亡
    if(!isHost) return;
    removeGhost(id);
    setLocalGhosts(prev => prev.filter(g => g.id !== id));
  };

  // 渲染所有在线的幽魂 (对所有玩家)
  return (
    <>
      {Object.values(ghosts).map((g) => (
        <GhostFollow
          key={g.id}
          id={g.id}
          isHost={isHost}
          raining={raining}
          onDead={() => onGhostDead(g.id)}
          onUpdate={(data) => updateGhost({ id: g.id, ...data })}
        />
      ))}
    </>
  );
};
