import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { QuestProvider } from '../src/components/QuestContext.jsx';
import { MultiplayerProvider } from '../src/network/MultiplayerContext.jsx';

// 在 Playroom 中的每个 iframe 顶层自动包上一层 3D/物理环境，
// 这样用户只需写 <GameWorld /> 等场景组件即可。
export default function FrameComponent({ children }) {
  return (
    <MultiplayerProvider>
    <QuestProvider>
      <Canvas shadows camera={{ position: [0, 30, 0], fov: 30, near: 2 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#242424"]} />
        <Suspense>
          <Physics gravity={[0, -25, 0]}>{children}</Physics>
        </Suspense>
      </Canvas>
    </QuestProvider>
    </MultiplayerProvider>
  );
} 