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
import { useFrame } from "@react-three/fiber";

export const GameWorld = ({ downgradedPerformance = false }) => {
  const [balls, setballs] = useState([]);
  const [hits, setHits] = useState([]);
  const [paused, setPaused] = useState(false);
  const { active, kills, done, startQuest, noodleActive, noodleCollected, clues } = useQuest();
  const [raining, setRaining] = useState(true);
  const [rainVisible, setRainVisible] = useState(true);
  const rainAudioRef = useRef(null);
  const sunnyAudioRef = useRef(null);

  const playerRef = useRef();
  const noodlePositions = [[-10, 5, 85], [0, 4, 300], [10, 5, 135]];

  const ambientRef = useRef();
  const dirRef = useRef();

  useEffect(() => {
    const rainAudio = new Audio('/audios/下雨音乐.mp3');
    rainAudio.loop = true;
    rainAudio.volume = 0.5;
    rainAudioRef.current = rainAudio;

    const sunnyAudio = new Audio('/audios/晴天背景音.mp3');
    sunnyAudio.loop = true;
    sunnyAudio.volume = 0.5;
    sunnyAudioRef.current = sunnyAudio;

    if (raining) {
      rainAudio.play().catch(() => {});
    } else {
      sunnyAudio.play().catch(() => {});
    }

    return () => {
      rainAudio.pause();
      sunnyAudio.pause();
    };
  }, []);

  useEffect(() => {
    if (!rainAudioRef.current || !sunnyAudioRef.current) return;
    if (raining) {
      sunnyAudioRef.current.pause();
      sunnyAudioRef.current.currentTime = 0;
      rainAudioRef.current.play().catch(() => {});
    } else {
      rainAudioRef.current.pause();
      rainAudioRef.current.currentTime = 0;
      sunnyAudioRef.current.play().catch(() => {});
    }
  }, [raining]);

  useFrame((state, dt) => {
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
  };

  const onHit = (ballId, position) => {
    setballs((prev) => prev.filter((b) => b.id !== ballId));
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
      <EnemySpawner playerRef={playerRef} active={active} raining={raining} />
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
