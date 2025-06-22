import { CameraControls, Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier";
import { useEffect, useRef, useState, useCallback } from "react";
import { NewCharacter } from "./Character";
import * as THREE from "three";
import { useQuest } from "./QuestContext";
import { useMobileControls } from '../contexts/MobileControlsContext';

const MOVEMENT_SPEED = 100;
const FIRE_RATE = 400;
const JUMP_FORCE = 35;   // 跳跃冲量
const JUMP_COOLDOWN = 300;
// jumpLevel from context decides max jumps
const MAX_HP = 120;   // 玩家最大生命值
const SPAWN_POS = { x: 0, y: 0, z: 60 }; // 出生 / 复活坐标

// 键盘控制状态
const keyboardControls = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  fire: false,
};

export const WEAPON_OFFSET = {
  x: -0.2,
  y: 1.4,
  z: 0.8,
};

export const CharacterController = ({
  userPlayer = true,
  onFire = () => {},
  paused = false,
  downgradedPerformance,
  canAttack,
  playerRef,
  ...props
}) => {
  const group = useRef();
  const character = useRef();
  const rigidbody = useRef();
  const [animation, setAnimation] = useState("Idle");
  const lastShoot = useRef(0);
  const { jumpLevel } = useQuest();
  const lastJump = useRef(0);
  const jumpCount = useRef(0);
  const respawnPending = useRef(0);

  const [playerState, setPlayerState] = useState({
    health: MAX_HP,
    dead: false,
    profile: { name: "Player", color: "#ffffff" },
    deaths: 0,
    kills: 0,
  });

  const state = {
    state: playerState,
    setState: (key, value) =>
      setPlayerState((prev) => ({ ...prev, [key]: value })),
  };

  const mobileControls = useMobileControls();

  // 添加键盘事件监听
  useEffect(() => {
    if (!userPlayer) return;

    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keyboardControls.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keyboardControls.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keyboardControls.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keyboardControls.moveRight = true;
          break;
        case 'Space':
          keyboardControls.fire = true;
          break;
        case 'KeyE':
          if (jumpLevel>0) {
            const now = Date.now();
            if (now - lastJump.current > JUMP_COOLDOWN && rigidbody.current && jumpCount.current < jumpLevel) {
              lastJump.current = now;
              rigidbody.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
              setAnimation("Jump");
              jumpCount.current += 1;
              setTimeout(() => setAnimation("Idle"), 600);
            }
          }
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keyboardControls.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keyboardControls.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keyboardControls.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keyboardControls.moveRight = false;
          break;
        case 'Space':
          keyboardControls.fire = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [userPlayer, jumpLevel]);

  // 固定出生点位置（与 Scene.jsx 中 spawn_0 相同）
  useEffect(() => {
    if (rigidbody.current) {
      rigidbody.current.setEnabled(true);
      rigidbody.current.setTranslation(SPAWN_POS, true);
      rigidbody.current.setLinvel({x:0,y:0,z:0}, true);
      rigidbody.current.setAngvel({x:0,y:0,z:0}, true);
    }
  }, []);

  // 提供回血函数，确保引用稳定
  const healPlayer = useCallback((amount = 10) => {
    setPlayerState(prev => ({
      ...prev,
      health: Math.min(prev.health + amount, MAX_HP),
    }));
  }, []);

  useEffect(() => {
    if (state.state.dead) {
      const audio = new Audio("audios/玩家死亡.mp3");
      audio.volume = 0.5;
      audio.play();
    }
  }, [state.state.dead]);

  useEffect(() => {
    if (state.state.health < MAX_HP) {
      const audio = new Audio("audios/玩家受伤.mp3");
      audio.volume = 0.4;
      audio.play();
    }
  }, [state.state.health]);

  useFrame((_, delta) => {
    if (paused) return;
    if (!rigidbody.current) return;

    // CAMERA FOLLOW
    if (controls.current) {
      const cameraDistanceY = window.innerWidth < 1024 ? 10 : 20;
      const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16;
      const playerWorldPos = vec3(rigidbody.current.translation());
      controls.current.setLookAt(
        playerWorldPos.x,
        playerWorldPos.y + (state.state.dead ? 12 : cameraDistanceY),
        playerWorldPos.z + (state.state.dead ? 2 : cameraDistanceZ),
        playerWorldPos.x,
        playerWorldPos.y + 1.5,
        playerWorldPos.z,
        true
      );
    }

    if (state.state.dead) {
      setAnimation("Death");
      return;
    }

    // 处理键盘输入
    if (userPlayer) {
      let moveX = 0;
      let moveZ = 0;

      if (keyboardControls.moveForward) moveZ -= 1;
      if (keyboardControls.moveBackward) moveZ += 1;
      if (keyboardControls.moveLeft) moveX -= 1;
      if (keyboardControls.moveRight) moveX += 1;

      // 处理移动端摇杆输入
      if (mobileControls.joystick.moving && mobileControls.joystick.angle !== null) {
        moveX = Math.sin(mobileControls.joystick.angle);
        moveZ = Math.cos(mobileControls.joystick.angle);
      }

      if (moveX !== 0 || moveZ !== 0) {
        setAnimation("Run");
        const angle = Math.atan2(moveX, moveZ);
        character.current.rotation.y = angle;

        const impulse = {
          x: Math.sin(angle) * MOVEMENT_SPEED * delta,
          y: 0,
          z: Math.cos(angle) * MOVEMENT_SPEED * delta,
        };

        rigidbody.current.applyImpulse(impulse, true);
      } else {
        setAnimation("Idle");
      }

      // 处理跳跃
      if (mobileControls.jump && jumpLevel > 0) {
        const now = Date.now();
        if (now - lastJump.current > JUMP_COOLDOWN && rigidbody.current && jumpCount.current < jumpLevel) {
          lastJump.current = now;
          rigidbody.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
          setAnimation("Jump");
          jumpCount.current += 1;
          setTimeout(() => setAnimation("Idle"), 600);
        }
      }

      // 处理攻击
      if ((keyboardControls.fire || mobileControls.attack) && canAttack) {
        setAnimation(moveX !== 0 || moveZ !== 0 ? "Run_Shoot" : "Idle_Shoot");
        if (Date.now() - lastShoot.current > FIRE_RATE) {
          lastShoot.current = Date.now();
          const newBullet = {
            id: "bullet-" + crypto.randomUUID(),
            position: vec3(rigidbody.current.translation()),
            angle: character.current.rotation.y,
            player: "player",
          };
          onFire(newBullet);
        }
      }
    }

    // 检测是否落地，重置跳跃次数
    if (rigidbody.current) {
      if (respawnPending.current > 0) {
        rigidbody.current.setTranslation(SPAWN_POS, true);
        rigidbody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        respawnPending.current -= 1;
      }
      const vel = rigidbody.current.linvel();
      // 当垂直速度接近 0 时视为落地
      if (Math.abs(vel.y) < 0.01 ) {
        jumpCount.current = 0;
      }
    }
  });

  const controls = useRef();
  const directionalLight = useRef();

  useEffect(() => {
    if (character.current && userPlayer) {
      directionalLight.current.target = character.current;
    }
  }, [character.current]);

  // 根据暂停状态禁用相机交互
  useEffect(() => {
    if (controls.current) {
      controls.current.enabled = !paused;
    }
  }, [paused]);

  // 将 rigidbody 引用暴露给父级
  useEffect(() => {
    if (playerRef) {
      playerRef.current = rigidbody.current;
    }
  }, [playerRef]);

  return (
    <group {...props} ref={group}>
      {userPlayer && <CameraControls ref={controls} />}
      <RigidBody
        ref={rigidbody}
        colliders={false}
        linearDamping={2}    // 线性阻尼
        lockRotations
        type="dynamic"
        userData={{ type: 'player', healPlayer }}
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody.userData?.type === "magic" && state.state.health > 0) {
            const newHealth = state.state.health - other.rigidBody.userData.damage;
            if (newHealth <= 0) {
              state.setState("dead", true);
              state.setState("health", 0);
              rigidbody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
              rigidbody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
              setTimeout(() => {
                rigidbody.current.setTranslation(SPAWN_POS, true);
                rigidbody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
                rigidbody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
                jumpCount.current = 0;
                respawnPending.current = 5;
                state.setState("health", MAX_HP);
                state.setState("dead", false);
                // 立即刷新相机位置，禁用平滑，避免视觉残影
                if (controls.current) {
                  const cameraDistanceY = window.innerWidth < 1024 ? 10 : 20;
                  const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16;
                  controls.current.setLookAt(
                    SPAWN_POS.x,
                    SPAWN_POS.y + cameraDistanceY,
                    SPAWN_POS.z + cameraDistanceZ,
                    SPAWN_POS.x,
                    SPAWN_POS.y + 1.5,
                    SPAWN_POS.z,
                    false
                  );
                }
              }, 2000);
            } else {
              state.setState("health", newHealth);
            }
          }
          // 被幽魂近战攻击
          if (other.rigidBody.userData?.type === "enemy" && state.state.health > 0) {
            const newHealth = state.state.health - 10; // 幽魂近战固定 10 点
            if (newHealth <= 0) {
              state.setState("dead", true);
              state.setState("health", 0);
              rigidbody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
              rigidbody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
              setTimeout(() => {
                rigidbody.current.setTranslation(SPAWN_POS, true);
                rigidbody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
                rigidbody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
                jumpCount.current = 0;
                respawnPending.current = 5;
                state.setState("health", MAX_HP);
                state.setState("dead", false);
                if (controls.current) {
                  const cameraDistanceY = window.innerWidth < 1024 ? 10 : 20;
                  const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16;
                  controls.current.setLookAt(
                    SPAWN_POS.x,
                    SPAWN_POS.y + cameraDistanceY,
                    SPAWN_POS.z + cameraDistanceZ,
                    SPAWN_POS.x,
                    SPAWN_POS.y + 1.5,
                    SPAWN_POS.z,
                    false
                  );
                }
              }, 2000);
            } else {
              state.setState("health", newHealth);
            }
          }
        }}
      >
        <PlayerInfo state={state.state} />
        <group ref={character}>
          <NewCharacter
            color={state.state.profile?.color}
            animation={animation}
            scale={[2, 2, 2]}
          />
        </group>
        {userPlayer && (
          <directionalLight
            ref={directionalLight}
            position={[25, 18, -25]}
            intensity={0.3}
            castShadow={!downgradedPerformance}
            shadow-camera-near={0}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />
        )}
        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>
  );
};

const PlayerInfo = ({ state }) => {
  const health = state.health;
  const name = state.profile.name;
  const [prevHealth, setPrevHealth] = useState(health);
  const [isDamaged, setIsDamaged] = useState(false);

  useEffect(() => {
    if (health < prevHealth) {
      setIsDamaged(true);
      setTimeout(() => setIsDamaged(false), 500);
    }
    setPrevHealth(health);
  }, [health]);

  const getHealthColor = () => {
    if (health > 70) return new THREE.Color(0.0, 1.0, 0.2);
    if (health > 30) return new THREE.Color(1.0, 0.7, 0.0);
    return new THREE.Color(1.0, 0.0, 0.0);
  };

  return (
    <Billboard position-y={4}>
      <Text position-y={0.36} fontSize={0.4}>
        {name}
        <meshBasicMaterial color={state.profile.color} />
      </Text>
      <mesh position-z={-0.1}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      <mesh
        scale-x={health / MAX_HP}
        position-x={-0.5 * (1 - health / MAX_HP)}
        position-z={-0.05}
        scale={isDamaged ? [1.1, 1.1, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[1, 0.25]} />
        <meshBasicMaterial
          color={getHealthColor()}
          transparent
          opacity={isDamaged ? 0.8 : 0.4}
        />
      </mesh>
      <mesh
        scale-x={health / MAX_HP}
        position-x={-0.5 * (1 - health / MAX_HP)}
        scale={isDamaged ? [1.1, 1.1, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color={getHealthColor()} toneMapped={false} />
      </mesh>
      <mesh position-z={0.01}>
        <planeGeometry args={[1.02, 0.22]} />
        <meshBasicMaterial
          color="white"
          transparent
          opacity={0.3}
        />
      </mesh>
    </Billboard>
  );
};
