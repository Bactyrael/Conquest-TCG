import React, { useState, useEffect } from 'react';
import './Settings.css';

export default function Settings({ currentUser }) {
  const [profile, setProfile] = useState({
    email: '',
    is_email_verified: 0,
    avatar_url: '',
    display_name: '',
    bio: '',
    location: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchProfile();
    
    // Check for verification token in URL
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify');
    if (verifyToken) {
      verifyEmail(verifyToken);
    }
  }, []);
  
  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tcg-token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          email: data.email || '',
          is_email_verified: data.is_email_verified || 0,
          avatar_url: data.avatar_url || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          location: data.location || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      const res = await fetch('http://localhost:3001/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tcg-token')}`
        },
        body: JSON.stringify(profile)
      });
      
      if (!res.ok) throw new Error('Failed to update profile');
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setError('New passwords do not match');
    }
    
    try {
      const res = await fetch('http://localhost:3001/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tcg-token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      
      setMessage('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const sendVerificationEmail = async () => {
    setMessage('');
    setError('');
    
    if (!profile.email) {
      return setError('Please save an email address first.');
    }
    
    try {
      const res = await fetch('http://localhost:3001/api/user/send-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tcg-token')}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification email');
      
      setMessage(`Verification email sent! (Preview: ${data.previewUrl})`);
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyEmail = async (token) => {
    try {
      const res = await fetch(`http://localhost:3001/api/user/verify-email/${token}`);
      if (!res.ok) throw new Error('Verification failed or expired.');
      setMessage('Email successfully verified!');
      setProfile(prev => ({ ...prev, is_email_verified: 1 }));
      // Clean up URL
      window.history.replaceState({}, document.title, "/settings");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="settings-container">
      <h2>Account Settings</h2>
      
      {message && <div className="settings-message success">{message}</div>}
      {error && <div className="settings-message error">{error}</div>}
      
      <div className="settings-grid">
        <div className="settings-panel">
          <h3>Profile Information</h3>
          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label>Avatar URL</label>
              <input type="text" name="avatar_url" value={profile.avatar_url} onChange={handleProfileChange} placeholder="https://..." />
            </div>
            
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" name="display_name" value={profile.display_name} onChange={handleProfileChange} />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="email" name="email" value={profile.email} onChange={handleProfileChange} style={{ flex: 1 }} />
                {profile.is_email_verified ? (
                  <span className="badge success">Verified</span>
                ) : (
                  <button type="button" onClick={sendVerificationEmail} className="verify-btn">Verify</button>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input type="text" name="location" value={profile.location} onChange={handleProfileChange} />
            </div>
            
            <div className="form-group">
              <label>Bio</label>
              <textarea name="bio" value={profile.bio} onChange={handleProfileChange} rows="3"></textarea>
            </div>
            
            <button type="submit" className="save-btn">Save Profile</button>
          </form>
        </div>
        
        <div className="settings-panel">
          <h3>Change Password</h3>
          <form onSubmit={updatePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required />
            </div>
            
            <div className="form-group">
              <label>New Password</label>
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required />
            </div>
            
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required />
            </div>
            
            <button type="submit" className="save-btn" style={{ background: '#d32f2f' }}>Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
