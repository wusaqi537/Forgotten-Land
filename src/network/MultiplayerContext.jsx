import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const MultiplayerContext = createContext(null);

export const useMultiplayer = () => useContext(MultiplayerContext);

/**
 * 该 Provider 负责：
 * 1. 连接 Socket.IO 服务器
 * 2. 维护 players 状态（本地 + 远端）
 * 3. 提供 updateMyState 方法给本地组件上报自身坐标/朝向
 */
export const MultiplayerProvider = ({ children, serverUrl }) => {
  // 根据页面 host 动态生成默认 URL
  if (!serverUrl) {
    const { protocol, hostname } = window.location;
    const defaultPort = 4000;
    serverUrl = `${protocol}//${hostname}:${defaultPort}`;
  }
  const socketRef = useRef(null);
  const [myId, setMyId] = useState(null);
  const [players, setPlayers] = useState({});
  const [myProfile, setMyProfile] = useState(null);
  const [bullets, setBullets] = useState([]); // array of {id, position, angle, player}
  const [ghosts, setGhosts] = useState({}); // {id: {position:[x,y,z], hp}}

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room') || 'default';
    const socket = io(serverUrl, { query: { room: roomId } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setMyId(socket.id);
    });

    // 收到所有玩家状态
    socket.on('players', (serverPlayers) => {
      setPlayers(serverPlayers);
      if(!myProfile){
        const index = Object.keys(serverPlayers).length + 1;
        const randColor = '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
        const profile={ name:`玩家${index}`, color:randColor };
        setMyProfile(profile);
        socket.emit('update', { profile, health:120 });
        setPlayers(prev=>({ ...prev, [socket.id]: { ...(prev[socket.id]||{}), profile, health:120 } }));
      }
    });

    // 单个玩家更新
    socket.on('player_update', ({ id, state }) => {
      setPlayers(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...state } }));
    });

    // 远程魔法球
    socket.on('magicBall', (b) => {
      setBullets(prev => prev.some(x=>x.id===b.id)? prev : [...prev, b]);
    });

    // 幽魂相关
    socket.on('ghost_spawn', (g) => {
      setGhosts(prev => ({ ...prev, [g.id]: g }));
    });

    socket.on('ghost_update', (g) => {
      setGhosts(prev => ({ ...prev, [g.id]: { ...(prev[g.id]||{}), ...g } }));
    });

    socket.on('ghost_dead', (id) => {
      setGhosts(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socket.on('player_disconnect', (id) => {
      setPlayers(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  // 提供给本地玩家上报自己的坐标
  const updateMyState = (state) => {
    if (!socketRef.current) return;
    socketRef.current.emit('update', state);
    setPlayers(prev => ({ ...prev, [socketRef.current.id]: { ...(prev[socketRef.current.id]||{}), ...state } }));
  };

  // 发送子弹
  const sendBullet = (bullet) => {
    if (!socketRef.current) return;
    socketRef.current.emit('magicBall', bullet);
    setBullets(prev => [...prev, bullet]);
  };

  // 本地移除子弹
  const removeBullet = (ballId) => {
    setBullets(prev => prev.filter(b => b.id !== ballId));
  };

  // Ghost helpers: 只有房主调用
  const spawnGhost = (g) => {
    if (!socketRef.current) return;
    socketRef.current.emit('ghost_spawn', g);
    setGhosts(prev => ({ ...prev, [g.id]: g }));
  };

  const updateGhost = (g) => {
    if (!socketRef.current) return;
    // 更新前先合并，确保状态完整
    const fullGhostState = { ...(ghosts[g.id] || {}), ...g };
    socketRef.current.emit('ghost_update', fullGhostState);
    setGhosts(prev => ({ ...prev, [g.id]: fullGhostState }));
  };

  const removeGhost = (ghostId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('ghost_dead', ghostId);
    setGhosts(prev => {
      const next = { ...prev };
      delete next[ghostId];
      return next;
    });
  };

  const value = { myId, players, updateMyState, myProfile, bullets, sendBullet, removeBullet, ghosts, spawnGhost, updateGhost, removeGhost };
  return (
    <MultiplayerContext.Provider value={value}>{children}</MultiplayerContext.Provider>
  );
}; 