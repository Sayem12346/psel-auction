import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import axios from 'axios';

const API = 'https://psel-auction.onrender.com';

export default function TeamsPage() {
  const [owners, setOwners] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/admin/owners`).then(r => setOwners(r.data)).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#8b5cf644;border-radius:2px}`}</style>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>TEAMS</h1>
          <p style={{ color: '#6b7280', fontSize: 13 }}>All owner teams in the auction</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {owners.map((o, i) => (
            <div key={o._id} style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0a2e)', border: '1px solid #1e1e3a', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, #8b5cf6, #ef4444)' }} />
              <div style={{ padding: 20 }}>
                {/* Owner header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #8b5cf633' }}>
                      {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20, fontWeight: 900, color: '#8b5cf6' }}>{o.name[0]}</span>}
                    </div>
                    <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#8b5cf6', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>{i + 1}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{o.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{o.team?.length || 0} players</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#00ff88', fontWeight: 700, fontSize: 14, fontFamily: 'Orbitron' }}>{o.availableCoins?.toLocaleString()}</div>
                    <div style={{ color: '#6b7280', fontSize: 10 }}>coins left</div>
                  </div>
                </div>

                {/* Team players */}
                {(!o.team || o.team.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#4b4b6a', fontSize: 13, background: '#1e1e3a22', borderRadius: 10 }}>No players yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {o.team.map((p, j) => (
                      <div key={p._id || j} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e1e3a44', borderRadius: 10, padding: '10px 12px' }}>
                        <span style={{ color: '#4b4b6a', fontSize: 11, width: 20 }}>#{j + 1}</span>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, fontWeight: 900, color: '#8b5cf6' }}>{p.name?.[0] || 'P'}</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{p.name || 'Player'}</div>
                          <div style={{ color: '#6b7280', fontSize: 11 }}>{p.role}</div>
                        </div>
                        <div style={{ color: '#00ff88', fontSize: 12, fontWeight: 700, fontFamily: 'Orbitron' }}>৳{p.soldPrice?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
