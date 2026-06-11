const crypto = require('crypto');
const Note = require('../models/Note');
const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');

const formatRoom = (room) => ({
  id: room._id.toString(),
  name: room.name,
  code: room.code,
  created_at: room.created_at,
});

const createUniqueRoomCode = async () => {
  let code;
  let existingRoom;

  do {
    code = crypto.randomBytes(3).toString('hex').toUpperCase();
    existingRoom = await Room.findOne({ code });
  } while (existingRoom);

  return code;
};

// CREATE ROOM
exports.createRoom = async (req, res) => {
  const { name } = req.body;
  const owner_id = req.user.id;

  try {
    const code = await createUniqueRoomCode();
    const room = await Room.create({ name, code, owner_id });

    await RoomMember.create({ room_id: room._id, user_id: owner_id });
    await Note.create({ room_id: room._id, content: '' });

    res.status(201).json({
      message: 'Room created!',
      room: formatRoom(room),
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
    const room = await Room.findOne({ code: code?.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const existing = await RoomMember.findOne({ room_id: room._id, user_id });
    if (existing) {
      return res.status(200).json({
        message: 'Already a member.',
        room: formatRoom(room),
      });
    }

    await RoomMember.create({ room_id: room._id, user_id });

    res.status(200).json({
      message: 'Joined room successfully!',
      room: formatRoom(room),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error joining room.' });
  }
};

// GET ALL ROOMS FOR LOGGED IN USER
exports.getMyRooms = async (req, res) => {
  const user_id = req.user.id;

  try {
    const memberships = await RoomMember.find({ user_id }).populate('room_id');
    const rooms = memberships
      .map((membership) => membership.room_id)
      .filter(Boolean)
      .sort((a, b) => b.created_at - a.created_at)
      .map(formatRoom);

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
    const member = await RoomMember.findOne({ room_id: roomId, user_id });
    if (!member) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const note = await Note.findOne({ room_id: roomId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    res.status(200).json({
      id: note._id.toString(),
      room_id: note.room_id.toString(),
      content: note.content,
      created_at: note.created_at,
      updated_at: note.updated_at,
    });
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
    const member = await RoomMember.findOne({ room_id: roomId, user_id });
    if (!member) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Note.findOneAndUpdate(
      { room_id: roomId },
      { content },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Note saved!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving note.' });
  }
};
