import React, { useState } from 'react';
import { getBackendUrl } from '../utils/api';
import './Login.css';

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter a username and password.');
      return;
    }

    if (isRegistering && password !== verifyPassword) {
      setError('Passwords do not match.');
      return;
    }

    const endpoint = isRegistering ? '/api/register' : '/api/login';
    
    try {
      const response = await fetch(`${getBackendUrl()}${endpoint}`, {
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
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password"
            />
          </div>
          
          {isRegistering && (
            <div className="form-group">
              <label>Verify Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                value={verifyPassword} 
                onChange={(e) => setVerifyPassword(e.target.value)} 
                placeholder="Re-enter password"
              />
            </div>
          )}

          <div className="form-group checkbox-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, color: '#aaa', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={showPassword} 
                onChange={(e) => setShowPassword(e.target.checked)} 
                style={{ width: 'auto', padding: 0 }}
              />
              Show Password
            </label>
          </div>
          
          <button type="submit" className="submit-btn">
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        
        <div className="toggle-mode">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button type="button" onClick={() => { 
            setIsRegistering(!isRegistering); 
            setError(''); 
            setVerifyPassword('');
          }}>
            {isRegistering ? 'Sign In' : 'Create One'}
          </button>
        </div>
      </div>
    </div>
  );
}
