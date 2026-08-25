import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  // Communicates directly through relative endpoint path or dynamic host
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  const handleRegister = async () => {
    try {
      const res = await axios.post(`${backendUrl}/api/register`, { username, password });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${backendUrl}/api/login`, { username, password });
      setMessage(res.data.message);
      setToken(res.data.token);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <div style={{ border: '1px solid #ccc', padding: '30px', borderRadius: '8px', width: '300px' }}>
        <h2>Login / Register</h2>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handleLogin} style={{ padding: '8px 16px', cursor: 'pointer' }}>Login</button>
          <button onClick={handleRegister} style={{ padding: '8px 16px', cursor: 'pointer' }}>Register</button>
        </div>
        {message && <p style={{ marginTop: '15px', color: 'blue' }}>{message}</p>}
        {token && <p style={{ wordBreak: 'break-all', fontSize: '12px' }}><strong>JWT Token:</strong> {token}</p>}
      </div>
    </div>
  );
}

export default App;
