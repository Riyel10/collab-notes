const db = require('../config/db');
const crypto = require('crypto');

// CREATE ROOM
exports.createRoom = async (req, res) => {
  const { name } = req.body;
  const owner_id = req.user.id;

  try {
    // Generate a unique room code (e.g. "AB12CD")
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    const [result] = await db.query(
      'INSERT INTO rooms (name, code, owner_id) VALUES (?, ?, ?)',
      [name, code, owner_id]
    );

    // Add owner as a member automatically
    await db.query(
      'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
      [result.insertId, owner_id]
    );

    // Create an empty note for the room
    await db.query(
      'INSERT INTO notes (room_id, content) VALUES (?, ?)',
      [result.insertId, '']
    );

    res.status(201).json({
      message: 'Room created!',
      room: { id: result.insertId, name, code }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating room.' });
  }
};

// JOIN ROOM BY CODE
exports.joinRoom = async (req, res) => {
  const { code } = req.body;
  const user_id = req.user.id;

  try {
    // Find room by code
    const [rooms] = await db.query('SELECT * FROM rooms WHERE code = ?', [code]);
    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const room = rooms[0];

    // Check if already a member
    const [existing] = await db.query(
      'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?',
      [room.id, user_id]
    );
    if (existing.length > 0) {
      return res.status(200).json({ message: 'Already a member.', room });
    }

    // Add user to room
    await db.query(
      'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
      [room.id, user_id]
    );

    res.status(200).json({ message: 'Joined room successfully!', room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error joining room.' });
  }
};

// GET ALL ROOMS FOR LOGGED IN USER
exports.getMyRooms = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [rooms] = await db.query(
      `SELECT r.id, r.name, r.code, r.created_at
       FROM rooms r
       INNER JOIN room_members rm ON r.id = rm.room_id
       WHERE rm.user_id = ?
       ORDER BY r.created_at DESC`,
      [user_id]
    );

    res.status(200).json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching rooms.' });
  }
};

// GET NOTE BY ROOM ID
exports.getNote = async (req, res) => {
  const { roomId } = req.params;
  const user_id = req.user.id;

  try {
    // Check if user is a member of the room
    const [member] = await db.query(
      'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, user_id]
    );
    if (member.length === 0) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const [notes] = await db.query(
      'SELECT * FROM notes WHERE room_id = ?',
      [roomId]
    );

    res.status(200).json(notes[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching note.' });
  }
};

// SAVE NOTE CONTENT
exports.saveNote = async (req, res) => {
  const { roomId } = req.params;
  const { content } = req.body;
  const user_id = req.user.id;

  try {
    // Check if user is a member
    const [member] = await db.query(
      'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, user_id]
    );
    if (member.length === 0) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await db.query(
      'UPDATE notes SET content = ? WHERE room_id = ?',
      [content, roomId]
    );

    res.status(200).json({ message: 'Note saved!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving note.' });
  }
};