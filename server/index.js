const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const db = require('./config/db');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Track active users per room
const roomUsers = {};

// JWT auth middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id, username, email }
    next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ ${socket.user.username} connected`);

  // JOIN A ROOM
  socket.on('join-room', async ({ roomId }) => {
    socket.join(roomId);

    // Track user in room
    if (!roomUsers[roomId]) roomUsers[roomId] = {};
    roomUsers[roomId][socket.id] = socket.user.username;

    // Send current note content to the user who just joined
    try {
      const [notes] = await db.query(
        'SELECT content FROM notes WHERE room_id = ?',
        [roomId]
      );
      if (notes.length > 0) {
        socket.emit('load-note', notes[0].content);
      }
    } catch (err) {
      console.error('Error loading note:', err);
    }

    // Notify everyone in the room about active users
    io.to(roomId).emit('active-users', Object.values(roomUsers[roomId]));

    console.log(`📝 ${socket.user.username} joined room ${roomId}`);
  });

  // USER IS TYPING — broadcast to others in the room
  socket.on('typing', ({ roomId, content }) => {
    // Broadcast to everyone in the room EXCEPT the sender
    socket.to(roomId).emit('receive-changes', content);
  });

  // SAVE NOTE — save to database and confirm
  socket.on('save-note', async ({ roomId, content }) => {
    try {
      await db.query(
        'UPDATE notes SET content = ? WHERE room_id = ?',
        [content, roomId]
      );
      // Notify everyone in room that note was saved
      io.to(roomId).emit('note-saved', {
        savedBy: socket.user.username,
        time: new Date().toLocaleTimeString()
      });
    } catch (err) {
      console.error('Error saving note:', err);
    }
  });

  // LEAVE ROOM
  socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId);
    if (roomUsers[roomId]) {
      delete roomUsers[roomId][socket.id];
      io.to(roomId).emit('active-users', Object.values(roomUsers[roomId]));
    }
    console.log(`🚪 ${socket.user.username} left room ${roomId}`);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    // Remove user from all rooms they were in
    for (const roomId in roomUsers) {
      if (roomUsers[roomId][socket.id]) {
        delete roomUsers[roomId][socket.id];
        io.to(roomId).emit('active-users', Object.values(roomUsers[roomId]));
      }
    }
    console.log(`❌ ${socket.user.username} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));