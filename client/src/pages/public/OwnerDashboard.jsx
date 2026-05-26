import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'https://psel-auction.onrender.com';

export default function OwnerDashboard() {
  const [owner, setOwner] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('ownerData');
    if (!stored) { navigate('/owner/login'); return; }
    const data = JSON.parse(stored);
    setOwner(data);
    axios.get(`${API}/api/admin/owners`).then(r => {
      const found = r.data.find(o => o._id === data._id);
      if (found) setOwnerData(found);
    }).catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerData');
    navigate('/owner/login');
  };

  if (!owner) return null;
  const o = ownerData || owner;

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#8b5cf644;border-radius:2px}`}</style>

      <nav style={{ background: '#0d0d1a', borderBottom: '1px solid #1e1e3a', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #8b5cf6, #ef4444)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff', fontFamily: 'Orbitron' }}>P</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: 'Orbitron', lineHeight: 1 }}>PSEL</div>
            <div style={{ color: '#8b5cf6', fontSize: 9, letterSpacing: 2 }}>ESPORTS AUCTION</div>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/live" style={{ background: '#ef444422', border: '1px solid #ef444444', color: '#ef4444', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>LIVE AUCTION</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#8b5cf6', fontWeight: 900 }}>{o.name?.[0]}</span>}
            </div>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{o.name}</span>
          </div>
          <button onClick={logout} style={{ background: '#1e1e3a', border: '1px solid #2e2e4a', color: '#9ca3af', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Profile header */}
        <div style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0a2e)', border: '1px solid #8b5cf633', borderRadius: 20, padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #8b5cf6, #ef4444)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid #8b5cf633', flexShrink: 0 }}>
              {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32, fontWeight: 900, color: '#8b5cf6', fontFamily: 'Orbitron' }}>{o.name?.[0]}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#8b5cf6', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>My Account</div>
              <h2 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{o.name}</h2>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{o.email}</div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ background: '#00ff8822', border: '1px solid #00ff8844', borderRadius: 12, padding: '16px 24px', textAlign: 'center' }}>
                <div style={{ color: '#00ff88', fontSize: 24, fontWeight: 900, fontFamily: 'Orbitron' }}>{o.availableCoins?.toLocaleString()}</div>
                <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Available Coins</div>
              </div>
              <div style={{ background: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: 12, padding: '16px 24px', textAlign: 'center' }}>
                <div style={{ color: '#f59e0b', fontSize: 24, fontWeight: 900, fontFamily: 'Orbitron' }}>{o.reservedCoins?.toLocaleString() || 0}</div>
                <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Reserved</div>
              </div>
              <div style={{ background: '#8b5cf622', border: '1px solid #8b5cf644', borderRadius: 12, padding: '16px 24px', textAlign: 'center' }}>
                <div style={{ color: '#8b5cf6', fontSize: 24, fontWeight: 900, fontFamily: 'Orbitron' }}>{o.totalCoins?.toLocaleString()}</div>
                <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Total Coins</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Team */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e1e3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900 }}>MY TEAM</h3>
            <span style={{ color: '#8b5cf6', fontSize: 13, fontWeight: 600 }}>{o.team?.length || 0} players</span>
          </div>
          {(!o.team || o.team.length === 0) ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ color: '#4b4b6a', fontSize: 14, marginBottom: 8 }}>No players in your team yet</div>
              <Link to="/live" style={{ color: '#8b5cf6', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Go to Live Auction to bid</Link>
            </div>
          ) : (
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {o.team.map((p, i) => (
                <div key={p._id || i} style={{ background: '#1e1e3a44', border: '1px solid #2e2e4a', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18, fontWeight: 900, color: '#8b5cf6' }}>{p.name?.[0] || 'P'}</span>}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{p.name || 'Player'}</div>
                    <div style={{ color: '#6b7280', fontSize: 11 }}>{p.role}</div>
                    <div style={{ color: '#00ff88', fontSize: 12, fontWeight: 700 }}>৳{p.soldPrice?.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Go to live auction */}
        <div style={{ background: 'linear-gradient(135deg, #ef444411, #8b5cf611)', border: '1px solid #ef444433', borderRadius: 16, padding: 24, textAlign: 'center' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, marginBottom: 8 }}>READY TO BID?</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>Join the live auction and bid on players</p>
          <Link to="/live" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', textDecoration: 'none', padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700, letterSpacing: 1, display: 'inline-block' }}>JOIN LIVE AUCTION</Link>
        </div>
      </div>
    </div>
  );
}
