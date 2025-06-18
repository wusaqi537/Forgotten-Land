import { useMemo } from "react";
import GhostFollow from "./EnemyGhost";

// 生成幽魂数量与坐标范围
const GHOST_COUNT = 10;
const Z_MIN = 100;
const Z_MAX = 200;

export const EnemySpawner = ({ playerRef, active }) => {
  // 任务未激活时不生成幽魂
  if (!active) return null;

  // 仅在初次挂载时生成随机坐标，保证每次渲染稳定
  const spawnPositions = useMemo(() => {
    return Array.from({ length: GHOST_COUNT }, () => {
      const z = Z_MIN + Math.random() * (Z_MAX - Z_MIN);
      return [0, 0, z];
    });
  }, []);

  return (
    <>
      {spawnPositions.map((pos, i) => (
        <GhostFollow key={i} playerRef={playerRef} spawnPos={pos} />
      ))}
    </>
  );
};
