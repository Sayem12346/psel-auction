import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = 'https://psel-auction.onrender.com';

export default function HomePage() {
  const [stats, setStats] = useState({ totalPlayers: 0, soldPlayers: 0, totalOwners: 0 });
  const [players, setPlayers] = useState([]);
  const [owners, setOwners] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/admin/stats`).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${API}/api/admin/players`).then(r => setPlayers(r.data)).catch(() => {});
    axios.get(`${API}/api/admin/owners`).then(r => setOwners(r.data)).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#8b5cf644;border-radius:2px}`}</style>

      {/* Navbar */}
      <nav style={{ background: '#0d0d1a', borderBottom: '1px solid #1e1e3a', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #8b5cf6, #ef4444)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff', fontFamily: 'Orbitron' }}>P</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: 'Orbitron', lineHeight: 1 }}>PSEL</div>
            <div style={{ color: '#8b5cf6', fontSize: 9, letterSpacing: 2 }}>ESPORTS AUCTION</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[['/', 'Overview'], ['/live', 'Live Auction'], ['/players', 'Players'], ['/teams', 'Teams']].map(([path, label]) => (
            <Link key={path} to={path} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 8, letterSpacing: 1 }}>{label}</Link>
          ))}
          <Link to="/owner/login" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', textDecoration: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>OWNER LOGIN</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '60px 24px', textAlign: 'center', background: 'linear-gradient(180deg, #0d0d1a 0%, #080812 100%)', borderBottom: '1px solid #1e1e3a', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, #8b5cf611 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ color: '#8b5cf6', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>Welcome to</div>
          <h1 style={{ fontSize: 'clamp(36px, 8vw, 72px)', fontWeight: 900, fontFamily: 'Orbitron', lineHeight: 1, marginBottom: 16 }}>
            <span style={{ color: '#fff' }}>PSEL </span>
            <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AUCTION</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>eSports Live Player Auction Platform</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/live" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', textDecoration: 'none', padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>WATCH LIVE AUCTION</Link>
            <Link to="/players" style={{ background: '#1e1e3a', color: '#fff', textDecoration: 'none', padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700, letterSpacing: 1, border: '1px solid #2e2e4a' }}>VIEW PLAYERS</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Total Players', value: stats.totalPlayers, color: '#8b5cf6' },
            { label: 'Sold Players', value: stats.soldPlayers, color: '#00ff88' },
            { label: 'Unsold Players', value: stats.totalPlayers - stats.soldPlayers, color: '#ef4444' },
            { label: 'Total Owners', value: stats.totalOwners, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0a2e)', border: `1px solid ${s.color}33`, borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ color: s.color, fontSize: 36, fontWeight: 900, fontFamily: 'Orbitron' }}>{s.value}</div>
              <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent sold players */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e1e3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'Orbitron' }}>RECENT SOLD PLAYERS</h3>
            <Link to="/players" style={{ color: '#8b5cf6', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>View All</Link>
          </div>
          {players.filter(p => p.status === 'sold').slice(0, 5).map((p, i) => (
            <div key={p._id} style={{ padding: '14px 24px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: p.playerImage ? 'transparent' : '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#8b5cf6', fontWeight: 900, fontSize: 16 }}>{p.name[0]}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>{p.role} · {p.group}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#00ff88', fontWeight: 700, fontFamily: 'Orbitron', fontSize: 14 }}>৳{p.soldPrice?.toLocaleString()}</div>
                <div style={{ color: '#6b7280', fontSize: 11 }}>{p.soldTo}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Owners leaderboard */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e1e3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'Orbitron' }}>OWNERS</h3>
            <Link to="/teams" style={{ color: '#8b5cf6', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>View Teams</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, background: '#1e1e3a' }}>
            {owners.map((o, i) => (
              <div key={o._id} style={{ background: '#0d0d1a', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#6b7280', fontSize: 12, width: 24, flexShrink: 0 }}>#{i + 1}</span>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#8b5cf6', fontWeight: 900 }}>{o.name[0]}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                  <div style={{ color: '#00ff88', fontSize: 11 }}>{o.availableCoins?.toLocaleString()} coins</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
