const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createRoom,
  joinRoom,
  getMyRooms,
  getNote,
  saveNote
} = require('../controllers/noteController');

// All routes are protected
router.post('/rooms', auth, createRoom);
router.post('/rooms/join', auth, joinRoom);
router.get('/rooms', auth, getMyRooms);
router.get('/rooms/:roomId/note', auth, getNote);
router.put('/rooms/:roomId/note', auth, saveNote);

module.exports = router;