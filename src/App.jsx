import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import GameBoard from './components/GameBoard';
import DeckBuilder from './components/DeckBuilder';

import Login from './components/Login';
import './App.css';

function App() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('tcg-token');
    const username = localStorage.getItem('tcg-username');
    if (token && username) {
      setCurrentUser(username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tcg-token');
    localStorage.removeItem('tcg-username');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <div className="app-container">
        <header className="header">
          <h1>CONQUEST: BEASTS AND BOUNTIES</h1>
        </header>
        <main className="game-area">
          <Login onLogin={setCurrentUser} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>CONQUEST: BEASTS AND BOUNTIES</h1>
        <nav className="main-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Deck Builder</Link>
          <Link to="/play" className={location.pathname === '/play' ? 'active' : ''}>Play Area</Link>
          
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: 'var(--color-accent-gold)', fontWeight: 'bold' }}>Welcome, {currentUser}</span>
          <button className="settings-btn" onClick={handleLogout}>LOGOUT</button>
        </div>
      </header>
      
      <main className="game-area">
        <Routes>
          <Route path="/" element={<DeckBuilder currentUser={currentUser} />} />
          <Route path="/play" element={<GameBoard currentUser={currentUser} />} />
          
        </Routes>
      </main>
    </div>
  );
}

export default App;

