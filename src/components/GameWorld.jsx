import { useState, useRef, useEffect } from "react";
import { Scene } from "./Scene";
import { CharacterController } from "./CharacterController";
import { MagicBall } from "./MagicBall";
import { MagicAttack } from "./MagicAttack";
import { Book } from "./Book";
import { useQuest } from "./QuestContext";
import { EnemySpawner } from "./EnemySpawner";
import { HealthPack } from "./HealthPack";
import { NoodleBowl } from "./NoodleBowl";
import { NPC } from "./NPC";
import { Door } from "./Door";
import { PortalZone } from "./PortalZone";
import { Rain } from "./Rain";
import { WeatherButton } from "./WeatherButton";
import { useFrame, useThree } from "@react-three/fiber";
import { useMultiplayer } from '../network/MultiplayerContext';
import { RemotePlayer } from './RemotePlayer';
import { RemoteGhost } from './RemoteGhost';

export const GameWorld = ({ downgradedPerformance = false, mobileJoystick, mobileFire, mobileJump }) => {
  const { active, kills, done, startQuest, noodleActive, noodleCollected, clues } = useQuest();
  const { myId, players, updateMyState, myProfile, bullets, sendBullet, removeBullet, ghosts } = useMultiplayer();

  const [balls, setballs] = useState([]); // 本地子弹
  const [hits, setHits] = useState([]);
  const [paused, setPaused] = useState(false);
  const [raining, setRaining] = useState(true);
  const [rainVisible, setRainVisible] = useState(true);

  const playerRef = useRef();
  const rotationRef = useRef(0);
  const animRef = useRef('Idle');
  const noodlePositions = [[-10, 5, 85], [0, 4, 300], [10, 5, 135]];

  const ambientRef = useRef();
  const dirRef = useRef();

  const isHost = (() => {
    const ids = Object.keys(players).concat(myId).filter(Boolean);
    ids.sort();
    return myId && ids[0] === myId;
  })();

  const { setFrameloop } = useThree();
  // 强制开启持续渲染循环
  useEffect(() => {
    setFrameloop('always');
  }, [setFrameloop]);

  // 当任务状态变化时，广播给其他人
  useEffect(() => {
    updateMyState({ questActive: active });
  }, [active, updateMyState]);

  useFrame((_, dt) => {
    // 每帧上报本地玩家位置
    if (playerRef.current && myId) {
      const pos = playerRef.current.translation();
      updateMyState({ position: [pos.x, pos.y, pos.z], rotationY: rotationRef.current, animation: animRef.current });
    }
    const targetAmbient = raining ? 0.3 : 0.9;
    if (ambientRef.current) {
      const cur = ambientRef.current.intensity;
      ambientRef.current.intensity = cur + (targetAmbient - cur) * dt * 0.5;
    }
    if (dirRef.current) {
      const targetDir = raining ? 0.5 : 1.2;
      const cur = dirRef.current.intensity;
      dirRef.current.intensity = cur + (targetDir - cur) * dt * 0.5;
    }

    if (!raining && rainVisible && ambientRef.current && ambientRef.current.intensity > 0.8) {
      setRainVisible(false);
    }
  });

  const toggleWeather = () => {
    if (raining) {
      setRaining(false);
    } else {
      setRainVisible(true);
      setRaining(true);
    }
  };

  const onFire = (ball) => {
    setballs((prev) => [...prev, ball]);
    sendBullet(ball);
  };

  const onHit = (ballId, position) => {
    setballs((prev) => prev.filter((b) => b.id !== ballId));
    removeBullet(ballId);
    setHits((prev) => [...prev, { id: `hit-${ballId}`, position }]);
  };

  const onHitEnded = (hitId) => {
    setHits((prev) => prev.filter((h) => h.id !== hitId));
  };

  return (
    <>
      {rainVisible && <Rain count={1500} area={40} speed={10} />}
      <Scene />
      <Book setPaused={setPaused} onClose={startQuest} />
      {isHost && <EnemySpawner />}
      <HealthPack />
      {noodleActive && noodleCollected < 3 && noodlePositions.map((pos, i) => (
        <NoodleBowl key={i} position={pos} />
      ))}
      <CharacterController
        userPlayer={true}
        onFire={onFire}
        paused={paused}
        downgradedPerformance={downgradedPerformance}
        canAttack={active}
        playerRef={playerRef}
        onRotationChange={(a)=>{rotationRef.current=a;}}
        onAnimationChange={(anim)=>{animRef.current=anim;}}
        initialProfile={myProfile}
        onStateChange={(partial)=>{ updateMyState(partial); }}
        myId={myId}
        joystick={mobileJoystick}
        mobileFire={mobileFire && active}
        mobileJump={mobileJump}
      />
      {/* 远程玩家 */}
      {Object.entries(players).map(([id, s]) => (
        id === myId ? null : (
          <RemotePlayer key={id} id={id} position={s.position} rotationY={s.rotationY||0} animation={s.animation||'Idle'} health={s.health||120} profile={s.profile||{name:`玩家`,color:'#00ffff'}} />
        )
      ))}
      {/* 远程幽魂（非房主渲染） */}
      {!isHost && Object.values(ghosts).map((g) => (
        <RemoteGhost key={g.id} ghost={g} />
      ))}
      {[...balls, ...bullets.filter(b=>b.player!==myId)].map((ball) => (
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
      <ambientLight ref={ambientRef} intensity={0.3} />
      <directionalLight ref={dirRef} position={[3, 5, 2]} intensity={0.5} />
      <WeatherButton position={[-17.6, 5, 308]} scale={[1.5,1.5,1.5]} onToggle={toggleWeather} />
      {/* 任务 NPC */}
      <NPC playerRef={playerRef} position={[0,-2.1, 250]} scale={[2, 2, 2]} />
      {/* 出生点后方的门，收集到线索后出现 */}
      <Door visible={clues.includes('红色按钮')} />
      {/* 传送门感应区 */}
      <PortalZone />
    </>
  );
};
