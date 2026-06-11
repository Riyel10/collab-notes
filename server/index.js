const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const connectDB = require('./config/db');
const Note = require('./models/Note');

const app = express();
const server = http.createServer(app);
const corsOptions = { origin: '*' };
const io = new Server(server, { cors: corsOptions });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

const roomUsers = {};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`${socket.user.username} connected`);

  socket.on('join-room', async ({ roomId }) => {
    socket.join(roomId);

    if (!roomUsers[roomId]) roomUsers[roomId] = {};
    roomUsers[roomId][socket.id] = socket.user.username;

    try {
      const note = await Note.findOne({ room_id: roomId });
      if (note) {
        socket.emit('load-note', note.content);
      }
    } catch (err) {
      console.error('Error loading note:', err);
    }

    io.to(roomId).emit('active-users', Object.values(roomUsers[roomId]));
    console.log(`${socket.user.username} joined room ${roomId}`);
  });

  socket.on('typing', ({ roomId, content }) => {
    socket.to(roomId).emit('receive-changes', content);
  });

  socket.on('save-note', async ({ roomId, content }) => {
    try {
      await Note.findOneAndUpdate(
        { room_id: roomId },
        { content },
        { new: true, upsert: true }
      );

      io.to(roomId).emit('note-saved', {
        savedBy: socket.user.username,
        time: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error('Error saving note:', err);
    }
  });

  socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId);
    if (roomUsers[roomId]) {
      delete roomUsers[roomId][socket.id];
      io.to(roomId).emit('active-users', Object.values(roomUsers[roomId]));
    }
    console.log(`${socket.user.username} left room ${roomId}`);
  });

  socket.on('disconnect', () => {
    for (const roomId in roomUsers) {
      if (roomUsers[roomId][socket.id]) {
        delete roomUsers[roomId][socket.id];
        io.to(roomId).emit('active-users', Object.values(roomUsers[roomId]));
      }
    }
    console.log(`${socket.user.username} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
