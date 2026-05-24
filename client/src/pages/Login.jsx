import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://your-backend-url.onrender.com';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API}/api/owners/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('owner', JSON.stringify(res.data.owner));
      setMsg('Login successful!');
    } catch (err) {
      setMsg('Login failed!');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-xl w-80">
        <h2 className="text-2xl font-bold text-red-500 mb-6 text-center">Owner Login</h2>
        <input className="w-full bg-gray-800 text-white p-3 rounded-lg mb-4" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full bg-gray-800 text-white p-3 rounded-lg mb-4" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleLogin} className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg font-bold">Login</button>
        {msg && <p className="text-center mt-4 text-green-400">{msg}</p>}
      </div>
    </div>
  );
}

export default Login;
