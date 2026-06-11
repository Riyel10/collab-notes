const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const createToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// SIGNUP
exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });
    const token = createToken(user);

    res.status(201).json({
      token,
      username: user.username,
      message: 'Account created successfully!',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signup.' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = createToken(user);

    res.status(200).json({
      token,
      username: user.username,
      message: 'Login successful!',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// GET LOGGED IN USER
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email created_at');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};
