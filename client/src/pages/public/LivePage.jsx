import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const API = 'https://psel-auction.onrender.com';
const socket = io(API);

const Navbar = () => (
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
);

export default function LivePage() {
  const [auction, setAuction] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [timer, setTimer] = useState(30);
  const [currentBid, setCurrentBid] = useState(0);
  const [currentLeader, setCurrentLeader] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [owners, setOwners] = useState([]);
  const [soldPlayers, setSoldPlayers] = useState([]);

  useEffect(() => {
    socket.emit('joinAuction');
    axios.get(`${API}/api/admin/owners`).then(r => setOwners(r.data)).catch(() => {});
    axios.get(`${API}/api/admin/players`).then(r => setSoldPlayers(r.data.filter(p => p.status === 'sold'))).catch(() => {});

    socket.on('auctionStarted', (data) => {
      setCurrentPlayer(data.player);
      setCurrentBid(data.currentBid);
      setTimer(data.timer);
      setCurrentLeader('');
      setBidHistory([]);
    });
    socket.on('timerUpdate', (data) => setTimer(data.timer));
    socket.on('bidUpdated', (data) => {
      setCurrentBid(data.currentBid);
      setCurrentLeader(data.currentLeader);
      setBidHistory(prev => [{ owner: data.currentLeader, amount: data.currentBid, time: 'Just now' }, ...prev.slice(0, 9)]);
    });
    socket.on('playerSold', (data) => {
      axios.get(`${API}/api/admin/players`).then(r => setSoldPlayers(r.data.filter(p => p.status === 'sold'))).catch(() => {});
    });
    return () => { socket.off('auctionStarted'); socket.off('timerUpdate'); socket.off('bidUpdated'); socket.off('playerSold'); };
  }, []);

  const timerColor = timer <= 5 ? '#ef4444' : timer <= 10 ? '#f59e0b' : '#00ff88';
  const pct = (timer / 30) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#8b5cf644;border-radius:2px} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes glow{0%,100%{box-shadow:0 0 10px #ef444444}50%{box-shadow:0 0 20px #ef4444aa}}`}</style>
      <Navbar />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px' }}>
        {!currentPlayer ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
            <div style={{ width: 60, height: 60, border: '3px solid #8b5cf644', borderTop: '3px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#6b7280', fontSize: 18, fontFamily: 'Orbitron' }}>WAITING FOR AUCTION</div>
            <div style={{ color: '#4b4b6a', fontSize: 13 }}>Auction will begin shortly</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px', gap: 16 }}>

            {/* Left owners */}
            <div style={{ background: '#0d0d1a', borderRadius: 12, border: '1px solid #1e1e3a', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e3a', color: '#f59e0b', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>OWNERS ({owners.length})</div>
              <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                {owners.map((o, i) => (
                  <div key={o._id} style={{ padding: '10px 12px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 8, background: o.name === currentLeader ? '#8b5cf611' : 'transparent' }}>
                    <span style={{ color: '#4b4b6a', fontSize: 11, width: 20 }}>#{i + 1}</span>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, fontWeight: 900, color: '#8b5cf6' }}>{o.name[0]}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                      <div style={{ color: '#00ff88', fontSize: 10 }}>{o.availableCoins?.toLocaleString()} coins</div>
                    </div>
                    {o.name === currentLeader && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Center */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Live badge */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 20, padding: '4px 20px', display: 'flex', alignItems: 'center', gap: 8, animation: 'glow 2s infinite' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                  <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, letterSpacing: 2, fontFamily: 'Orbitron' }}>LIVE AUCTION</span>
                </div>
              </div>

              {/* Player card */}
              <div style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 100%)', border: '1px solid #8b5cf633', borderRadius: 16, padding: '24px', display: 'flex', gap: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #8b5cf6, #ef4444, #8b5cf6)' }} />
                <div style={{ width: 140, height: 160, borderRadius: 12, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #8b5cf633', flexShrink: 0, overflow: 'hidden' }}>
                  {currentPlayer?.playerImage ? <img src={currentPlayer.playerImage} alt={currentPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : <span style={{ fontSize: 52, fontWeight: 900, color: '#8b5cf688', fontFamily: 'Orbitron' }}>{currentPlayer?.name?.[0]}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900, fontFamily: 'Orbitron', marginBottom: 8 }}>{currentPlayer?.name}</h2>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {currentPlayer?.role && <span style={{ background: '#8b5cf622', border: '1px solid #8b5cf644', padding: '3px 10px', borderRadius: 4, fontSize: 11, color: '#8b5cf6', fontWeight: 700 }}>{currentPlayer.role}</span>}
                    {currentPlayer?.group && <span style={{ background: '#1e1e3a', padding: '3px 10px', borderRadius: 4, fontSize: 11, color: '#9ca3af' }}>{currentPlayer.group}</span>}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>Base Price: <span style={{ color: '#f59e0b', fontWeight: 700 }}>৳{currentPlayer?.basePrice?.toLocaleString()}</span></div>
                </div>
                {/* Timer */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>TIME LEFT</div>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: `conic-gradient(${timerColor} ${pct}%, #1e1e3a ${pct}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ color: timerColor, fontSize: 26, fontWeight: 900, fontFamily: 'Orbitron', lineHeight: 1 }}>{timer}</span>
                      <span style={{ color: '#6b7280', fontSize: 9 }}>SEC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current bid */}
              <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>CURRENT BID</div>
                  <div style={{ color: '#00ff88', fontSize: 36, fontWeight: 900, fontFamily: 'Orbitron' }}>৳{currentBid?.toLocaleString() || 0}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>BID LEADER</div>
                  {currentLeader ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {owners.find(o => o.name === currentLeader)?.profileImage ? <img src={owners.find(o => o.name === currentLeader).profileImage} alt={currentLeader} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#f59e0b', fontWeight: 900 }}>{currentLeader[0]}</span>}
                      </div>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{currentLeader}</span>
                    </div>
                  ) : <div style={{ color: '#4b4b6a', fontSize: 14 }}>No bids yet</div>}
                </div>
              </div>

              {/* Bid history */}
              <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e1e3a', color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 1, fontFamily: 'Orbitron' }}>BID HISTORY</div>
                {bidHistory.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#4b4b6a' }}>No bids yet</div>
                ) : bidHistory.map((b, i) => (
                  <div key={i} style={{ padding: '10px 20px', borderBottom: '1px solid #1e1e3a11', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#8b5cf6' }}>{b.owner[0]}</span>
                      </div>
                      <span style={{ color: '#ccc', fontSize: 13 }}>{b.owner}</span>
                    </div>
                    <span style={{ color: '#00ff88', fontSize: 13, fontWeight: 700, fontFamily: 'Orbitron' }}>৳{b.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: sold players */}
            <div style={{ background: '#0d0d1a', borderRadius: 12, border: '1px solid #1e1e3a', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e3a', color: '#00ff88', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>SOLD ({soldPlayers.length})</div>
              <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                {soldPlayers.map((p, i) => (
                  <div key={p._id} style={{ padding: '10px 12px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 11, fontWeight: 900, color: '#00ff88' }}>{p.name[0]}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ color: '#6b7280', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.soldTo}</div>
                    </div>
                    <div style={{ color: '#00ff88', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>৳{p.soldPrice?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
