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
import nodemailer from 'nodemailer';

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

const sqliteDbPath = path.resolve(__dirname, 'src', 'data', 'database.sqlite');

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
      
      // Add new columns (ignore errors if they already exist)
      const cols = [
        'email TEXT',
        'is_email_verified BOOLEAN DEFAULT 0',
        'avatar_url TEXT',
        'display_name TEXT',
        'bio TEXT',
        'location TEXT'
      ];
      cols.forEach(col => {
        db.run(`ALTER TABLE users ADD COLUMN ${col}`, () => {});

      db.run(`CREATE TABLE IF NOT EXISTS decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        deck_name TEXT NOT NULL,
        cards TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, deck_name)
      )`, (err) => {
        if (err) console.error('Error creating decks table', err.message);
      });
      });
    });
  }
});

const JWT_SECRET = 'super-secret-tcg-key-change-in-production';

// Nodemailer Ethereal Setup
let transporter;
nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed to create a testing account. ' + err.message);
    return;
  }
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
  console.log('Nodemailer configured with Ethereal Email');
});


// --- Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};



// --- Static File Serving (Production) ---
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// --- Authentication Endpoints ---

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

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


app.get('/api/cards', (req, res) => {
  const dbPath = path.resolve(__dirname, 'src/data/cardDatabase.json');
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (err) {
    console.error('Error reading card DB:', err);
    res.status(500).json({ error: 'Failed to read card database' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(401).json({ error: 'Invalid username or password' });

    const isValid = bcrypt.compareSync(password, row.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, username: row.username });
  });
});


// --- Settings / Profile Endpoints ---

app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get('SELECT username, email, is_email_verified, avatar_url, display_name, bio, location FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

app.put('/api/user/profile', authenticateToken, (req, res) => {
  const { email, avatar_url, display_name, bio, location } = req.body;
  
  db.run(
    'UPDATE users SET email = ?, avatar_url = ?, display_name = ?, bio = ?, location = ? WHERE id = ?',
    [email, avatar_url, display_name, bio, location, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update profile' });
      res.json({ success: true });
    }
  );
});

app.post('/api/user/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Database error' });
    
    if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }
    
    const hash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update password' });
      res.json({ success: true });
    });
  });
});

app.post('/api/user/send-verification', authenticateToken, (req, res) => {
  db.get('SELECT email FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Database error' });
    if (!row.email) return res.status(400).json({ error: 'No email address on file' });
    
    if (!transporter) return res.status(500).json({ error: 'Email service not configured yet' });
    
    const verifyToken = jwt.sign({ id: req.user.id, action: 'verify_email' }, JWT_SECRET, { expiresIn: '1h' });
    const verifyUrl = `http://localhost:5173/settings?verify=${verifyToken}`;
    
    let message = {
      from: 'Conquest TCG <noreply@conquest-tcg.test>',
      to: row.email,
      subject: 'Verify Your Email Address',
      text: `Please click the following link to verify your email: ${verifyUrl}`,
      html: `<p>Please click the link below to verify your email:</p><p><a href="${verifyUrl}">Verify Email</a></p>`
    };
    
    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.error('Error sending email', err);
        return res.status(500).json({ error: 'Failed to send email' });
      }
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      res.json({ success: true, previewUrl: nodemailer.getTestMessageUrl(info) });
    });
  });
});

app.get('/api/user/verify-email/:token', (req, res) => {
  const token = req.params.token;
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.action !== 'verify_email') {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    db.run('UPDATE users SET is_email_verified = 1 WHERE id = ?', [decoded.id], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true });
    });
  });
});



// --- Deck Endpoints ---

app.get('/api/decks', authenticateToken, (req, res) => {
  db.all('SELECT deck_name, cards FROM decks WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const decks = {};
    rows.forEach(row => {
      try {
        decks[row.deck_name] = JSON.parse(row.cards);
      } catch (e) {
        console.error('Failed to parse deck cards');
      }
    });
    res.json(decks);
  });
});

app.post('/api/decks', authenticateToken, (req, res) => {
  const { deck_name, cards } = req.body;
  if (!deck_name || !cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Invalid deck data' });
  }

  // Check limit (100 decks max)
  db.get('SELECT COUNT(*) as count FROM decks WHERE user_id = ?', [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    // Check if updating an existing deck vs inserting new
    db.get('SELECT id FROM decks WHERE user_id = ? AND deck_name = ?', [req.user.id, deck_name], (err, existing) => {
      if (!existing && row.count >= 100) {
        return res.status(400).json({ error: 'Maximum limit of 100 decks reached. Please delete a deck first.' });
      }
      
      const cardsJson = JSON.stringify(cards);
      if (existing) {
        db.run('UPDATE decks SET cards = ? WHERE id = ?', [cardsJson, existing.id], (err) => {
          if (err) return res.status(500).json({ error: 'Failed to update deck' });
          res.json({ success: true });
        });
      } else {
        db.run('INSERT INTO decks (user_id, deck_name, cards) VALUES (?, ?, ?)', [req.user.id, deck_name, cardsJson], (err) => {
          if (err) return res.status(500).json({ error: 'Failed to save new deck' });
          res.json({ success: true });
        });
      }
    });
  });
});

app.delete('/api/decks/:name', authenticateToken, (req, res) => {
  const deckName = req.params.name;
  db.run('DELETE FROM decks WHERE user_id = ? AND deck_name = ?', [req.user.id, deckName], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

// --- Matchmaking / Socket Endpoints ---

let waitingPlayer = null;
let roomCounter = 1;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_queue', (data) => {
    const playerName = data?.playerName || 'Player';
    socket.playerName = playerName; 

    if (waitingPlayer) {
      const roomName = `room_${roomCounter++}`;
      socket.join(roomName);
      waitingPlayer.join(roomName);
      
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
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) socket.to(room).emit('sync_state', data);
  });
  
  socket.on('pass_phase', () => {
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) socket.to(room).emit('pass_phase');
  });

  socket.on('chat_message', (data) => {
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) socket.to(room).emit('chat_message', data);
  });

  socket.on('game_event', (data) => {
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) socket.to(room).emit('game_event', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room) socket.to(room).emit('opponent_disconnected');
  });
});


// --- React Router Fallback ---
app.use((req, res) => {
  res.sendFile('index.html', { root: distPath });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});
