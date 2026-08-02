import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve(__dirname, 'src', 'data', 'cardDatabase.json');
const sqliteDbPath = path.resolve(__dirname, 'src', 'data', 'database.sqlite');

// Initialize SQLite database
const db = new sqlite3.Database(sqliteDbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )`, (err) => {
      if (err) console.error('Error creating users table', err.message);
    });
  }
});

const JWT_SECRET = 'super-secret-tcg-key-change-in-production'; // Basic secret for prototype

// --- Authentication Endpoints ---

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Check if user exists
  db.get('SELECT username FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (row) return res.status(400).json({ error: 'Username already exists' });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create user' });
      
      const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ success: true, token, username });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(401).json({ error: 'Invalid username or password' });

    const isValid = bcrypt.compareSync(password, row.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, username: row.username });
  });
});

// --- Existing Endpoints ---


    }
    
    fs.writeFileSync(dbPath, JSON.stringify(updatedCards, null, 2), 'utf8');
    console.log(`Saved ${updatedCards.length} cards to database.`);
    res.json({ success: true, message: 'Cards saved successfully' });
  } catch (error) {
    console.error('Failed to save cards:', error);
    res.status(500).json({ error: 'Failed to save database' });
  }
});

let waitingPlayer = null;
let roomCounter = 1;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_queue', (data) => {
    const playerName = data?.playerName || 'Player';
    socket.playerName = playerName; // Store it on the socket

    if (waitingPlayer) {
      // Match found!
      const roomName = `room_${roomCounter++}`;
      socket.join(roomName);
      waitingPlayer.join(roomName);
      
      // Assign roles
      waitingPlayer.emit('match_found', { role: 'player1', room: roomName, opponentName: socket.playerName });
      socket.emit('match_found', { role: 'player2', room: roomName, opponentName: waitingPlayer.playerName });
      
      console.log(`Matched ${waitingPlayer.id} and ${socket.id} in ${roomName}`);
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      socket.emit('waiting', { message: 'Waiting for opponent...' });
      console.log(`Player ${socket.id} (${playerName}) waiting in queue`);
    }
  });

  socket.on('sync_state', (data) => {
    // Relay state to the other player in the room
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) {
      socket.to(room).emit('sync_state', data);
    }
  });
  
  socket.on('pass_phase', () => {
    // Relay phase pass
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) {
      socket.to(room).emit('pass_phase');
    }
  });

  socket.on('chat_message', (data) => {
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) {
      socket.to(room).emit('chat_message', data);
    }
  });

  socket.on('game_event', (data) => {
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) {
      socket.to(room).emit('game_event', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
    // Inform opponent if in room
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) {
      socket.to(room).emit('opponent_disconnected');
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});

