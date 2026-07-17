import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import GameBoard from './components/GameBoard';
import DeckBuilder from './components/DeckBuilder';
import CardEditor from './components/CardEditor';
import './App.css';

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <header className="header">
        <h1>CONQUEST: BEASTS AND BOUNTIES</h1>
        <nav className="main-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Deck Builder</Link>
          <Link to="/play" className={location.pathname === '/play' ? 'active' : ''}>Play Area</Link>
          <Link to="/editor" className={location.pathname === '/editor' ? 'active' : ''}>Card Editor</Link>
          <button className="settings-btn">SETTINGS</button>
        </nav>
      </header>
      
      <main className="game-area">
        <Routes>
          <Route path="/" element={<DeckBuilder />} />
          <Route path="/play" element={<GameBoard />} />
          <Route path="/editor" element={<CardEditor />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
