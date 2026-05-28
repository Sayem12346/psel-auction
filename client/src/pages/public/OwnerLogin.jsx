import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'https://psel-auction.onrender.com';

export default function OwnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) { setMsg('All fields required!'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/owners/login`, { email, password });
      localStorage.setItem('ownerToken', res.data.token);
      localStorage.setItem('ownerData', JSON.stringify(res.data.owner));
      navigate('/owner/dashboard');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Login failed!');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: "'Rajdhani', sans-serif", color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>

      <nav style={{ background: '#0d0d1a', borderBottom: '1px solid #1e1e3a', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #00CF33, #00CF33)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff', fontFamily: 'Orbitron' }}>P</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: 'Orbitron', lineHeight: 1 }}>PSEL</div>
            <div style={{ color: '#00CF33', fontSize: 9, letterSpacing: 2 }}>ESPORTS AUCTION</div>
          </div>
        </Link>
        <Link to="/" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>Back to Overview</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0a2e)', border: '1px solid #00CF3333', borderRadius: 20, padding: 36, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #00CF33, #00CF33)' }} />
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, marginBottom: 6 }}>OWNER LOGIN</h2>
              <p style={{ color: '#6b7280', fontSize: 13 }}>Login to place bids in the auction</p>
            </div>

            {msg && <div style={{ background: '#00CF3322', border: '1px solid #00CF3344', borderRadius: 8, padding: '10px 16px', color: '#00CF33', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{msg}</div>}

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="owner@email.com" style={{ width: '100%', background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" style={{ width: '100%', background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none' }} />
            </div>

            <button onClick={handleLogin} disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg, #00CF33, #00CF33)', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/live" style={{ color: '#00CF33', fontSize: 12, textDecoration: 'none' }}>Watch Live Auction without login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
