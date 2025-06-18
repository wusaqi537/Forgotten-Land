import { Loader, PerformanceMonitor, SoftShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { Suspense, useState } from "react";
import { GameWorld } from "./components/GameWorld";
import { Taskbar } from "./components/Taskbar";

// -------------------------------
// App 组件是整个 3D 游戏的入口：
// 1. 负责创建 <Canvas>（Three.js 渲染环境）
// 2. 包装加载指示、性能监控、后期特效等全局功能
// 3. 在 <Physics> 中挂载核心场景 <GameWorld>
// -------------------------------

function App() {
  // downgradedPerformance = true 时代表设备性能较差，我们将关掉后期效果等高开销项
  const [downgradedPerformance, setDowngradedPerformance] = useState(false);
  return (
    <>
      {/* 任务栏固定在视口左上角 */}
      <Taskbar />

      {/* Drei 的 Loader：在模型 / 贴图下载过程中显示进度条 */}
      <Loader />

      {/**
       * Canvas = Three.js 渲染器的 React 封装。
       * - shadows     : 开启阴影
       * - camera      : 初始相机位置 / 视野 / 近裁剪面
       * - dpr         : 根据设备像素比自动调整渲染分辨率，避免 4K 过度渲染
       */}
      <Canvas
        shadows
        camera={{ position: [0, 30, 0], fov: 30, near: 2 }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#242424"]} />
        {/* SoftShadows：基于 PCF 的软阴影，实现更自然的边缘 */}
        <SoftShadows size={42} />

        {/**
         * PerformanceMonitor：实时监测帧率
         *   – 若 FPS 低于阈值则触发 onDecline → 降级图形效果
         */}
        <PerformanceMonitor
          onDecline={(fps) => {
            setDowngradedPerformance(true);
          }}
        />

        {/**
         * Suspense 让异步加载的模型在 ready 之前不阻塞渲染。
         * Physics 创建 Rapier 物理世界，内部的子组件可以直接使用 RigidBody / Collider。
         */}
        <Suspense>
          <Physics>
            <GameWorld downgradedPerformance={downgradedPerformance} />
          </Physics>
        </Suspense>
        {!downgradedPerformance && (
          // 性能良好时开启后期：Bloom 泛光效果
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={1} intensity={1.5} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>
    </>
  );
}
export default App;

