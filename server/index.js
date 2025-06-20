import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// 房间到玩家表的映射
const rooms = {}; // { roomId: { socketId: state } }

io.on('connection', (socket) => {
  const { room: roomId = 'default' } = socket.handshake.query;
  // 加入房间（Socket.IO 层面的 room）
  socket.join(roomId);
  if (!rooms[roomId]) rooms[roomId] = {};
  console.log(`player ${socket.id} connected to room ${roomId}`);
  // 把当前房间玩家列表发给新客户端
  socket.emit('players', rooms[roomId]);

  socket.on('update', (state) => {
    // 将新状态与旧状态合并
    const fullState = {
      ...(rooms[roomId][socket.id] || {}),
      ...state,
    };
    rooms[roomId][socket.id] = fullState;
    // 向同房间其他玩家广播合并后的完整状态
    socket.to(roomId).emit('player_update', { id: socket.id, state: fullState });
  });

  // 新增：转发 MagicBall 信息给房间内其他玩家
  socket.on('magicBall', (ball) => {
    // 只转发，不存储
    socket.to(roomId).emit('magicBall', ball);
  });

  /**
   * Ghost 同步
   *  - ghost_spawn: { id, position: [x,y,z] }
   *  - ghost_update: { id, position: [x,y,z], hp }
   *  - ghost_dead: ghostId (string)
   */
  socket.on('ghost_spawn', (g) => {
    socket.to(roomId).emit('ghost_spawn', g);
  });

  socket.on('ghost_update', (g) => {
    // 直接转发完整的幽魂状态
    socket.to(roomId).emit('ghost_update', g);
  });

  socket.on('ghost_dead', (id) => {
    socket.to(roomId).emit('ghost_dead', id);
  });

  socket.on('disconnect', () => {
    console.log('player disconnected', socket.id);
    delete rooms[roomId][socket.id];
    socket.to(roomId).emit('player_disconnect', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Socket.IO server running on', PORT)); 