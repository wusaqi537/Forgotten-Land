import { CameraControls, Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { NewCharacter } from "./Character";
import * as THREE from "three";

const MOVEMENT_SPEED = 120;
const FIRE_RATE = 400;

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
  ...props
}) => {
  const group = useRef();
  const character = useRef();
  const rigidbody = useRef();
  const [animation, setAnimation] = useState("Idle");
  const lastShoot = useRef(0);

  const [playerState, setPlayerState] = useState({
    health: 100,
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

  const joystick = {
    angle: () => null,
    isJoystickPressed: () => false,
    isPressed: () => false,
  };

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
  }, [userPlayer]);

  // 固定出生点位置（与 Scene.jsx 中 spawn_0 相同）
  useEffect(() => {
    if (rigidbody.current) {
      rigidbody.current.setTranslation({ x: 0, y: 0, z: 60 });
    }
  }, []);

  useEffect(() => {
    if (state.state.dead) {
      const audio = new Audio("/audios/玩家死亡.mp3");
      audio.volume = 0.5;
      audio.play();
    }
  }, [state.state.dead]);

  useEffect(() => {
    if (state.state.health < 100) {
      const audio = new Audio("/audios/玩家受伤.mp3");
      audio.volume = 0.4;
      audio.play();
    }
  }, [state.state.health]);

  useFrame((_, delta) => {
    if (paused) return; // 暂停时停止人物更新

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
      } else if (!joystick.isJoystickPressed()) {
        setAnimation("Idle");
      }

      // 处理射击
      if (keyboardControls.fire) {
        setAnimation(moveX !== 0 || moveZ !== 0 ? "Run_Shoot" : "Idle_Shoot");
        if (Date.now() - lastShoot.current > FIRE_RATE) {
          lastShoot.current = Date.now();
          const newBullet = {
            id: "bullet-" + Date.now(),
            position: vec3(rigidbody.current.translation()),
            angle: character.current.rotation.y,
            player: "player",
          };
          onFire(newBullet);
        }
      }
    }

    // 处理触摸输入
    const angle = joystick.angle();
    if (joystick.isJoystickPressed() && angle) {
      setAnimation("Run");
      character.current.rotation.y = angle;

      const impulse = {
        x: Math.sin(angle) * MOVEMENT_SPEED * delta,
        y: 0,
        z: Math.cos(angle) * MOVEMENT_SPEED * delta,
      };

      rigidbody.current.applyImpulse(impulse, true);
    } else if (!keyboardControls.moveForward && !keyboardControls.moveBackward && !keyboardControls.moveLeft && !keyboardControls.moveRight) {
      setAnimation("Idle");
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

  return (
    <group {...props} ref={group}>
      {userPlayer && <CameraControls ref={controls} />}
      <RigidBody
        ref={rigidbody}
        colliders={false}
        linearDamping={5}    // 线性阻尼
        lockRotations
        type="dynamic"
        userData={{ type: 'player' }}
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody.userData?.type === "magic" && state.state.health > 0) {
            const newHealth = state.state.health - other.rigidBody.userData.damage;
            if (newHealth <= 0) {
              state.setState("dead", true);
              state.setState("health", 0);
              rigidbody.current.setEnabled(false);
              setTimeout(() => {
                rigidbody.current.setTranslation({ x: 0, y: 0, z: 60 });
                rigidbody.current.setEnabled(true);
                state.setState("health", 100);
                state.setState("dead", false);
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
        scale-x={health / 100}
        position-x={-0.5 * (1 - health / 100)}
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
        scale-x={health / 100}
        position-x={-0.5 * (1 - health / 100)}
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
