import { useGLTF, Html } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';

// 可拾取的书籍
export function Book({ position = [0, 0, 80], setPaused = () => {} }) {
  const { scene } = useGLTF('/models/book/scene.gltf');
  const group = useRef();
  const [collected, setCollected] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [canClose, setCanClose] = useState(false);

  // 起伏旋转动画
  useFrame((state, delta) => {
    if (!collected && group.current) {
      group.current.rotation.y += delta * 0.6;
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.5;
    }
  });

  // 拾取后 4 秒才能关闭提示
  useEffect(() => {
    if (collected) {
      const timer = setTimeout(() => setCanClose(true), 4000);
      setTimeout(() => setPaused(true), 400);
      return () => clearTimeout(timer);
    }
  }, [collected]);

  useEffect(()=>{
    if(removed){ setPaused(false);} 
  },[removed]);

  if (collected && !canClose) {
    // 在等待按钮可用期间暂停渲染书本
  }

  return (
    <group position={position}>
      {/* 书模型 & 触发器 */}
      {!collected && !removed && (
        <group ref={group}>
          {/* 绿色点光源让书周围泛光 */}
          <pointLight color={'#00ff80'} intensity={2} distance={10} />

          <RigidBody
            type="fixed"
            colliders="trimesh"
            sensor
            onIntersectionEnter={({ other }) => {
              if (other.rigidBody.userData?.type === 'player') {
                setCollected(true);
              }
            }}
          >
            <primitive object={scene} scale={5} />
          </RigidBody>
        </group>
      )}

      {/* 提示便签 */}
      {collected && !removed && (
        <Html fullscreen>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none',
          }}>
            <div style={{
              background: '#f8f1d5',
              padding: '32px 40px',
              maxWidth: '520px',
              fontSize: '16px',
              lineHeight: '1.7',
              borderRadius: '6px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
              fontFamily: 'QianTuXianMo, "Times New Roman", serif',
              position: 'relative',
            }}>
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                fontFamily: 'QianTuXianMo, "Times New Roman", serif',
              }}>{`当你看到这本书的时候，你并没有走出遗忘之地。

你只是在重复我曾做过的一切。

这泛黄的书本上，记录着发现"出口"的狂喜，和重陷此地的绝望。

每一次，都以为自己是特别的，是那个例外，

每一次，记忆都像流沙，从指缝里逃走，只留下这本残破的指引。

书中说，出口就在某处……

可谁能告诉我，这指引是希望，还是最恶毒的诅咒？

读吧，然后遗忘，

等待下一个"你"，翻开同样的第一页。`}</pre>
              <p style={{ marginTop: '16px', fontStyle: 'italic', textAlign: 'right', fontFamily: 'QianTuXianMo, "Times New Roman", serif' }}>—— 我们，都是被困在循环里的，同一个幽魂。</p>
              {canClose && (
                <button
                  onClick={() => setRemoved(true)}
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    right: '-14px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#333',
                    color: '#fff',
                    border: 'none',
                    fontSize: '20px',
                    lineHeight: '32px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload('/models/book/scene.gltf'); 