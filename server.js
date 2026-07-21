import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

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

app.post('/api/save-cards', (req, res) => {
  try {
    const updatedCards = req.body;
    if (!Array.isArray(updatedCards)) {
      return res.status(400).json({ error: 'Expected an array of cards' });
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

  socket.on('join_queue', () => {
    if (waitingPlayer) {
      // Match found!
      const roomName = `room_${roomCounter++}`;
      socket.join(roomName);
      waitingPlayer.join(roomName);
      
      // Assign roles
      waitingPlayer.emit('match_found', { role: 'player1', room: roomName });
      socket.emit('match_found', { role: 'player2', room: roomName });
      
      console.log(`Matched ${waitingPlayer.id} and ${socket.id} in ${roomName}`);
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      socket.emit('waiting', { message: 'Waiting for opponent...' });
      console.log(`Player ${socket.id} waiting in queue`);
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
