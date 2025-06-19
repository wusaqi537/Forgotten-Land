import { useMemo, useState, useEffect, useCallback } from "react";
import GhostFollow from "./EnemyGhost";

// 生成幽魂数量与距离范围
const GHOST_COUNT = 10;
const MIN_RADIUS = 20;  // 最小距离（米）
const MAX_RADIUS = 30;  // 最大距离

export const EnemySpawner = ({ playerRef, active }) => {
  const [ghosts, setGhosts] = useState([]);

  // 生成一个新的出生坐标
  const generatePos = useCallback(() => {
    let center = [0, 0, 0];
    if (playerRef?.current) {
      const p = playerRef.current.translation();
      center = [p.x, p.y, p.z];
    }
      const angle = Math.random() * Math.PI * 2;
      const r = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
      const x = center[0] + Math.cos(angle) * r;
      const z = center[2] + Math.sin(angle) * r;
      return [x, 0, z];
  }, [playerRef]);

  // 当任务激活时初始化 5 只
  useEffect(() => {
    if (active) {
      setGhosts((prev) => {
        if (prev.length) return prev; // 已有
        return Array.from({ length: 5 }, () => ({ id: Math.random().toString(36).slice(2), pos: generatePos() }));
      });
    } else {
      setGhosts([]);
    }
  }, [active, generatePos]);

  // 保持数量
  useEffect(() => {
    if (!active) return;
    if (ghosts.length < 5) {
      setGhosts((prev) => {
        const next = [...prev];
        while (next.length < 5) {
          next.push({ id: Math.random().toString(36).slice(2), pos: generatePos() });
        }
        return next;
      });
    }
  }, [ghosts, active, generatePos]);

  const handleDead = (id) => {
    setGhosts((prev) => prev.filter((g) => g.id !== id));
  };

  if (!active) return null;

  return (
    <>
      {ghosts.map((g) => (
        <GhostFollow key={g.id} playerRef={playerRef} spawnPos={g.pos} onDead={() => handleDead(g.id)} />
      ))}
    </>
  );
};
