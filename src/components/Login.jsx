import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter a username and password.');
      return;
    }

    const endpoint = isRegistering ? '/api/register' : '/api/login';
    
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      localStorage.setItem('tcg-token', data.token);
      localStorage.setItem('tcg-username', data.username);
      onLogin(data.username);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isRegistering ? 'Create Account' : 'Sign In'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Enter username"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password"
            />
          </div>
          
          <button type="submit" className="submit-btn">
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        
        <div className="toggle-mode">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
            {isRegistering ? 'Sign In' : 'Create One'}
          </button>
        </div>
      </div>
    </div>
  );
}
