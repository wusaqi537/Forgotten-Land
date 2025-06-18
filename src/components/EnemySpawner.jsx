import GhostFollow from "./EnemyGhost";

export const EnemySpawner = ({ playerRef, active }) => {
  if (!active) return null;
  // 只渲染一只跟随玩家的幽魂
  return <GhostFollow playerRef={playerRef} />;
};
