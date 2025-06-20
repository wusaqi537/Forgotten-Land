export { CharacterController } from './components/CharacterController.jsx';
export { EnemySpawner } from './components/EnemySpawner.jsx';
export { Taskbar } from './components/Taskbar.jsx';
export { GameWorld } from './components/GameWorld.jsx';
export { Scene } from './components/Scene.jsx';

// 仅在开发模式 + 移动端浏览器时加载 vConsole
if (import.meta.env.MODE !== 'production' &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
  import('vconsole').then(({ default: VConsole }) => {
    // 也可传入 { theme: 'dark' }
    // eslint-disable-next-line no-new
    new VConsole();
    console.log('[vConsole] 已注入');
  });
} 