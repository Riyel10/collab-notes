# ✏️ CollabNotes — Real-Time Collaborative Notes App

A full-stack real-time collaborative note-taking application where multiple users can create rooms, join with a code, and edit notes together live.

🌐 **Live Demo:** [https://collab-notes-production-d080.up.railway.app](https://collab-notes-production-d080.up.railway.app)

---

## 🚀 Features

- 🔐 **JWT Authentication** — Secure signup and login with hashed passwords
- 📋 **Room System** — Create rooms and invite others using a unique room code
- ⚡ **Real-Time Editing** — Multiple users can edit the same note simultaneously using WebSockets
- 💾 **Auto-Save** — Notes are automatically saved to the database after 3 seconds of inactivity
- 👥 **Active Users** — See who is currently in the room in real time
- 📱 **Responsive UI** — Clean dark-themed interface that works on all screen sizes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Real-Time | Socket.io |
| Database | MySQL |
| Authentication | JWT (JSON Web Tokens), bcryptjs |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Deployment | Railway |

---

## 📁 Project Structure

```
collab-notes/
├── server/
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   └── noteRoutes.js      # Room & note endpoints
│   ├── controllers/
│   │   ├── authController.js  # Signup, login, getMe
│   │   └── noteController.js  # Rooms & notes logic
│   └── index.js               # Entry point + Socket.io
├── public/
│   ├── index.html             # Login & Signup page
│   ├── dashboard.html         # Rooms dashboard
│   ├── editor.html            # Collaborative editor
│   ├── style.css
│   └── app.js
├── .env                       # Environment variables (not committed)
└── package.json
```

---

## 🗄️ Database Schema

```sql
users         — id, username, email, password, created_at
rooms         — id, name, code, owner_id, created_at
notes         — id, room_id, content, updated_at
room_members  — id, room_id, user_id, joined_at
```

---

## ⚙️ API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current logged-in user |

### Rooms & Notes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notes/rooms` | Create a new room |
| POST | `/api/notes/rooms/join` | Join a room by code |
| GET | `/api/notes/rooms` | Get all rooms for the user |
| GET | `/api/notes/rooms/:roomId/note` | Get note content |
| PUT | `/api/notes/rooms/:roomId/note` | Save note content |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `join-room` | Client → Server | User joins a room |
| `load-note` | Server → Client | Sends current note to new user |
| `active-users` | Server → Client | Broadcasts list of active users |
| `typing` | Client → Server | User is typing |
| `receive-changes` | Server → Client | Broadcasts changes to others |
| `save-note` | Client → Server | Save note to database |
| `note-saved` | Server → Client | Confirms note was saved |
| `leave-room` | Client → Server | User leaves the room |

---

## 🏃 Running Locally

### Prerequisites
- Node.js v18+
- MySQL 8.0+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/collab-notes.git
cd collab-notes
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file in the root
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=collab_notes
JWT_SECRET=your_super_secret_key
```

### 4. Set up the MySQL database
```sql
CREATE DATABASE collab_notes;
USE collab_notes;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  content LONGTEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE room_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 5. Start the server
```bash
npm start
```

### 6. Open in browser
```
http://localhost:3000
```

---

## 🌐 Deployment

This app is deployed on **Railway** with a managed MySQL database.

- Node.js service auto-deploys on every push to `main`
- MySQL credentials are injected via Railway environment variables
- Live URL: [https://collab-notes-production-d080.up.railway.app](https://collab-notes-production-d080.up.railway.app)

---

## 📸 How To Use

1. **Sign up** for an account at the live URL
2. **Create a room** and give it a name — you'll get a unique room code
3. **Share the room code** with a friend
4. Your friend **joins the room** using the code
5. Start typing — **edits appear live** on both screens ⚡

---

## 📄 License

MIT License — feel free to use this project for learning or as a portfolio piece.
