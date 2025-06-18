import { useState, useRef } from "react";
import { Scene } from "./Scene";
import { CharacterController } from "./CharacterController";
import { MagicBall } from "./MagicBall";
import { MagicAttack } from "./MagicAttack";
import { Book } from "./Book";
import { useQuest } from "./QuestContext";
import { EnemySpawner } from "./EnemySpawner";

export const GameWorld = ({ downgradedPerformance = false }) => {
  const [balls, setballs] = useState([]);
  const [hits, setHits] = useState([]);
  const [paused, setPaused] = useState(false);
  const { active, kills, done, startQuest } = useQuest();

  const playerRef = useRef();

  const onFire = (ball) => {
    setballs((prev) => [...prev, ball]);
  };

  const onHit = (ballId, position) => {
    setballs((prev) => prev.filter((b) => b.id !== ballId));
    setHits((prev) => [...prev, { id: ballId, position }]);
  };

  const onHitEnded = (hitId) => {
    setHits((prev) => prev.filter((h) => h.id !== hitId));
  };

  return (
    <>
      <Scene />
      <Book setPaused={setPaused} onClose={startQuest} />
      <EnemySpawner playerRef={playerRef} active={active} />
      <CharacterController
        userPlayer={true}
        onFire={onFire}
        paused={paused}
        downgradedPerformance={downgradedPerformance}
        canAttack={active}
        playerRef={playerRef}
      />
      {balls.map((ball) => (
        <MagicBall
          key={ball.id}
          {...ball}
          onHit={(pos) => onHit(ball.id, pos)}
        />
      ))}
      {hits.map((hit) => (
        <MagicAttack
          key={hit.id}
          {...hit}
          onEnded={() => onHitEnded(hit.id)}
        />
      ))}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} />
    </>
  );
};
