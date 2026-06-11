const mongoose = require('mongoose');

const roomMemberSchema = new mongoose.Schema(
  {
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

roomMemberSchema.index({ room_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('RoomMember', roomMemberSchema);
