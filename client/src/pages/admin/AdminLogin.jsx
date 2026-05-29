import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://psel-auction.onrender.com';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setMsg('All fields required!'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/admin/login`, { email, password });
      localStorage.setItem('adminToken', res.data.token);
      window.location.href = '/admin/dashboard';
    } catch (err) {
      setMsg(err.response?.data?.error || 'Login failed!');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: 'Rajdhani, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} input:focus{outline:none;border-color:#00CF3344!important}`}</style>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 20, padding: '40px 36px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #00CF33, #00a828)' }} />
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #00CF33, #00a828)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 900, fontSize: 24, color: '#000', fontFamily: 'Orbitron' }}>P</div>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, marginBottom: 6 }}>ADMIN LOGIN</h2>
            <p style={{ color: '#6b7280', fontSize: 13 }}>PSEL Esports Auction Platform</p>
          </div>
          {msg && <div style={{ background: '#ef444422', border: '1px solid #ef444444', borderRadius: 10, padding: '10px 16px', color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{msg}</div>}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: '#9ca3af', fontSize: 11, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@psel.com" style={{ width: '100%', background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, fontFamily: 'Rajdhani' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#9ca3af', fontSize: 11, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, fontFamily: 'Rajdhani' }} />
          </div>
          <button onClick={handleLogin} disabled={loading} style={{ width: '100%', background: loading ? '#1e1e3a' : 'linear-gradient(135deg, #00CF33, #00a828)', color: loading ? '#6b7280' : '#000', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 2, fontFamily: 'Orbitron' }}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="/" style={{ color: '#6b7280', fontSize: 12, textDecoration: 'none' }}>Back to Website</a>
          </div>
        </div>
      </div>
    </div>
  );
}
