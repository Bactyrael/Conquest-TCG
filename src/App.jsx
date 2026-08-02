import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import GameBoard from './components/GameBoard';
import DeckBuilder from './components/DeckBuilder';
import Settings from './components/Settings';

import Login from './components/Login';
import './App.css';

function App() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

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
          <Link to="/play" className={location.pathname === '/play' ? 'active' : ''}>Find Match</Link>
          
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
          <span style={{ color: 'var(--color-accent-gold)', fontWeight: 'bold' }}>Welcome, {currentUser}</span>
          <div className="account-dropdown-container">
            <button className="settings-btn" onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}>
              ACCOUNT ▾
            </button>
            {isAccountMenuOpen && (
              <div className="account-dropdown-menu">
                <Link to="/settings" className="account-dropdown-item" style={{display: "block", textDecoration: "none"}} onClick={() => setIsAccountMenuOpen(false)}>Settings</Link>
                <button className="account-dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="game-area">
        <Routes>
          <Route path="/" element={<DeckBuilder currentUser={currentUser} />} />
          <Route path="/play" element={<GameBoard currentUser={currentUser} />} />`n          <Route path="/settings" element={<Settings currentUser={currentUser} />} />
          
        </Routes>
      </main>
    </div>
  );
}

export default App;


