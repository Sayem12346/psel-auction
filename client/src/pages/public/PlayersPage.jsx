import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import axios from 'axios';

const API = 'https://psel-auction.onrender.com';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get(`${API}/api/admin/players`).then(r => setPlayers(r.data)).catch(() => {});
  }, []);

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.role?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#00CF3344;border-radius:2px}`}</style>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>PLAYERS</h1>
          <p style={{ color: '#6b7280', fontSize: 13 }}>All players in the auction</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: players.length, color: '#00CF33' },
            { label: 'Sold', value: players.filter(p => p.status === 'sold').length, color: '#00ff88' },
            { label: 'Unsold', value: players.filter(p => p.status === 'unsold').length, color: '#00CF33' },
            { label: 'Available', value: players.filter(p => p.status === 'available').length, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0d0d1a', border: `1px solid ${s.color}33`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <div style={{ color: s.color, fontSize: 28, fontWeight: 900, fontFamily: 'Orbitron' }}>{s.value}</div>
              <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..." style={{ flex: 1, minWidth: 200, background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 10, padding: '10px 16px', color: '#fff', fontSize: 13, outline: 'none' }} />
          {['all', 'available', 'sold', 'unsold'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#00CF33' : '#0d0d1a', border: `1px solid ${filter === f ? '#00CF33' : '#1e1e3a'}`, color: '#fff', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', letterSpacing: 1 }}>{f}</button>
          ))}
        </div>

        {/* Players grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {filtered.map((p, i) => (
            <div key={p._id} style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0a2e)', border: `1px solid ${p.status === 'sold' ? '#00ff8833' : p.status === 'unsold' ? '#00CF3333' : '#00CF3333'}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: 3, background: p.status === 'sold' ? '#00ff88' : p.status === 'unsold' ? '#00CF33' : '#00CF33' }} />
              <div style={{ padding: 16 }}>
                <div style={{ width: 70, height: 70, borderRadius: 12, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', overflow: 'hidden', border: `2px solid ${p.status === 'sold' ? '#00ff8833' : '#00CF3333'}` }}>
                  {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 26, fontWeight: 900, color: '#00CF3388' }}>{p.name[0]}</span>}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ background: '#00CF3322', border: '1px solid #00CF3344', padding: '2px 8px', borderRadius: 4, fontSize: 10, color: '#00CF33', fontWeight: 700 }}>{p.role}</span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 8 }}>{p.group}</div>
                  {p.status === 'sold' ? (
                    <div>
                      <div style={{ color: '#00ff88', fontWeight: 700, fontSize: 13, fontFamily: 'Orbitron' }}>৳{p.soldPrice?.toLocaleString()}</div>
                      <div style={{ color: '#6b7280', fontSize: 10, marginTop: 2 }}>Sold to {p.soldTo}</div>
                    </div>
                  ) : p.status === 'unsold' ? (
                    <div style={{ background: '#00CF3322', border: '1px solid #00CF3344', borderRadius: 6, padding: '4px', color: '#00CF33', fontSize: 11, fontWeight: 700 }}>No Bids</div>
                  ) : (
                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>৳{p.basePrice?.toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
