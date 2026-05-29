import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API = 'https://psel-auction.onrender.com';
const socket = io(API);

export default function AuctionControl() {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [auction, setAuction] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(5);
  const playersRef = useRef([]);

  useEffect(() => {
    fetchPlayers();
    checkRunningAuction();
    socket.on('auctionStarted', (data) => { setAuction(data); setCurrentPlayer(data.player); setStarted(true); setPaused(false); showMsg(data.player.name + ' auction started!', 'success'); });
    socket.on('timerUpdate', (data) => setAuction(prev => prev ? {...prev, timer: data.timer} : prev));
    socket.on('bidUpdated', (data) => setAuction(prev => prev ? {...prev, currentBid: data.currentBid, currentLeader: data.currentLeader} : prev));
    socket.on('playerSold', (data) => { showMsg(data.winner + ' won for ' + data.amount + ' coins!', 'success'); fetchPlayers(); });
    socket.on('playerUnsold', () => { showMsg('Unsold! Next player loading...', 'warning'); fetchPlayers(); });
    socket.on('auctionPaused', () => { setPaused(true); showMsg('Auction Paused', 'warning'); });
    socket.on('auctionResumed', () => { setPaused(false); showMsg('Auction Resumed', 'success'); });
    socket.on('auctionEnded', () => { showMsg('Auction Complete!', 'success'); setStarted(false); setAuction(null); setCurrentPlayer(null); fetchPlayers(); });
    return () => socket.off();
  }, []);

  const checkRunningAuction = async () => {
    try {
      const r = await axios.get(`${API}/api/admin/auction/status`);
      if (r.data && r.data.currentPlayer) {
        setCurrentPlayer(r.data.currentPlayer);
        setAuction({ currentBid: r.data.currentBid, timer: r.data.timer, currentLeader: r.data.currentLeaderName });
        setStarted(true);
        setPaused(r.data.status === 'paused');
      }
    } catch (e) {}
  };

  const fetchPlayers = async () => {
    const r = await axios.get(`${API}/api/admin/players`);
    const available = r.data.filter(p => p.status === 'available');
    const unsold = r.data.filter(p => p.status === 'unsold');
    const all = [...available, ...unsold];
    setPlayers(all);
    playersRef.current = all;
  };

  const startAuction = () => {
    if (!selectedPlayer) { showMsg('Select a player first!', 'error'); return; }
    socket.emit('startAuction', { playerId: selectedPlayer, maxPlayers: parseInt(maxPlayers) });
    setPaused(false);
  };

  const pauseResumeAuction = () => {
    if (paused) socket.emit('resumeAuction');
    else socket.emit('pauseAuction');
  };

  const skipPlayer = () => { socket.emit('skipPlayer'); showMsg('Player skipped!', 'warning'); };

  const closeAuction = async () => {
    if (!window.confirm('Are you sure you want to close the auction?')) return;
    try {
      socket.emit('closeAuction');
      await axios.post(`${API}/api/admin/auction/close`);
      setStarted(false);
      setAuction(null);
      setCurrentPlayer(null);
      fetchPlayers();
      showMsg('Auction closed!', 'error');
    } catch (e) { showMsg('Error closing auction!', 'error'); }
  };

  const showMsg = (text, type = 'info') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'info' }), 4000); };

  const msgColors = { success: '#00CF33', error: '#ef4444', warning: '#f59e0b', info: '#8b5cf6' };
  const selectedPlayerData = players.find(p => p._id === selectedPlayer);
  const availablePlayers = players.filter(p => p.status === 'available');
  const unsoldPlayers = players.filter(p => p.status === 'unsold');

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: 'Rajdhani, sans-serif', color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#00CF3344;border-radius:2px} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Header */}
      <div style={{ background: '#0d0d1a', borderBottom: '1px solid #1e1e3a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900 }}>AUCTION CONTROL</h1>
          <p style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>Manage live auction sessions</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {started && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: paused ? '#f59e0b22' : '#00CF3322', border: `1px solid ${paused ? '#f59e0b44' : '#00CF3344'}`, borderRadius: 20, padding: '4px 12px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: paused ? '#f59e0b' : '#00CF33', animation: paused ? 'none' : 'pulse 1s infinite' }} />
              <span style={{ color: paused ? '#f59e0b' : '#00CF33', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{paused ? 'PAUSED' : 'LIVE'}</span>
            </div>
          )}
          <a href="/admin/dashboard" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Back to Dashboard</a>
        </div>
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{ background: msgColors[msg.type] + '22', border: `1px solid ${msgColors[msg.type]}44`, padding: '10px 24px', color: msgColors[msg.type], fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
          {msg.text}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Settings */}
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, padding: 20 }}>
            <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Orbitron', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 3, height: 16, background: '#00CF33', borderRadius: 2, display: 'inline-block' }} />
              SETTINGS
            </h3>
            <label style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Max Players Per Team</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} style={{ flex: 1, background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, fontFamily: 'Orbitron' }} min="1" max="20" />
              <div style={{ display: 'flex', gap: 6 }}>
                {[3,5,7,10].map(n => (
                  <button key={n} onClick={() => setMaxPlayers(n)} style={{ background: maxPlayers == n ? '#00CF33' : '#1e1e3a', border: '1px solid #2e2e4a', color: maxPlayers == n ? '#000' : '#fff', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>{n}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Player Selection */}
          {!started && (
            <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, padding: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Orbitron', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 16, background: '#00CF33', borderRadius: 2, display: 'inline-block' }} />
                SELECT FIRST PLAYER
              </h3>
              <select style={{ width: '100%', background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, marginBottom: 12, fontFamily: 'Rajdhani' }} value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
                <option value="">-- Select Player to Start --</option>
                {availablePlayers.map(p => <option key={p._id} value={p._id}>{p.name} | {p.group} | {p.basePrice} coins</option>)}
                {unsoldPlayers.length > 0 && <optgroup label="--- Unsold Players ---">
                  {unsoldPlayers.map(p => <option key={p._id} value={p._id}>{p.name} | {p.group} | {p.basePrice} coins (Unsold)</option>)}
                </optgroup>}
              </select>
              {selectedPlayerData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#1e1e3a', borderRadius: 12, padding: '12px 16px', marginBottom: 14, border: '1px solid #00CF3322' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: '#2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {selectedPlayerData.playerImage ? <img src={selectedPlayerData.playerImage} alt={selectedPlayerData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24, color: '#00CF33', fontWeight: 900, fontFamily: 'Orbitron' }}>{selectedPlayerData.name[0]}</span>}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{selectedPlayerData.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{selectedPlayerData.group} · {selectedPlayerData.role}</div>
                    <div style={{ color: '#00CF33', fontSize: 13, fontWeight: 700 }}>Base: {selectedPlayerData.basePrice?.toLocaleString()} coins</div>
                  </div>
                </div>
              )}
              <button onClick={startAuction} style={{ width: '100%', background: 'linear-gradient(135deg, #00CF33, #00a828)', color: '#000', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: 'pointer', letterSpacing: 2, fontFamily: 'Orbitron' }}>START AUCTION</button>
            </div>
          )}

          {/* Live Controls */}
          {started && (
            <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, padding: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Orbitron', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 16, background: '#00CF33', borderRadius: 2, display: 'inline-block' }} />
                NOW PLAYING
              </h3>
              {currentPlayer && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#1e1e3a', borderRadius: 12, padding: '12px 16px', marginBottom: 16, border: '1px solid #00CF3322' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: '#2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {currentPlayer.playerImage ? <img src={currentPlayer.playerImage} alt={currentPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24, color: '#00CF33', fontWeight: 900, fontFamily: 'Orbitron' }}>{currentPlayer.name?.[0]}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{currentPlayer.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{currentPlayer.group} · {currentPlayer.role}</div>
                    <div style={{ color: '#00CF33', fontSize: 13, fontWeight: 700 }}>Base: {currentPlayer.basePrice?.toLocaleString()} coins</div>
                  </div>
                </div>
              )}

              {/* Live stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#1e1e3a', borderRadius: 10, padding: '12px 8px', textAlign: 'center', border: auction?.timer <= 5 ? '1px solid #ef444444' : '1px solid transparent' }}>
                  <div style={{ color: auction?.timer <= 5 ? '#ef4444' : '#fff', fontSize: 24, fontWeight: 900, fontFamily: 'Orbitron' }}>{auction?.timer || 0}s</div>
                  <div style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Timer</div>
                </div>
                <div style={{ background: '#1e1e3a', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ color: '#00CF33', fontSize: 18, fontWeight: 900, fontFamily: 'Orbitron' }}>{auction?.currentBid?.toLocaleString() || 0}</div>
                  <div style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Current Bid</div>
                </div>
                <div style={{ background: '#1e1e3a', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>{auction?.currentLeader || 'None'}</div>
                  <div style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Leader</div>
                </div>
              </div>

              {/* Control buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <button onClick={pauseResumeAuction} style={{ background: paused ? 'linear-gradient(135deg, #00CF33, #00a828)' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: paused ? '#000' : '#fff', border: 'none', padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Orbitron' }}>{paused ? 'RESUME' : 'PAUSE'}</button>
                <button onClick={skipPlayer} style={{ background: '#1e1e3a', border: '1px solid #2e2e4a', color: '#9ca3af', padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Orbitron' }}>SKIP</button>
              </div>
              <button onClick={closeAuction} style={{ width: '100%', background: '#ef444422', border: '1px solid #ef444444', color: '#ef4444', padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Orbitron' }}>CLOSE AUCTION</button>
            </div>
          )}
        </div>

        {/* Right panel - Queue */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 3, height: 16, background: '#00CF33', borderRadius: 2, display: 'inline-block' }} />
              PLAYERS QUEUE
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ background: '#f59e0b22', border: '1px solid #f59e0b44', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{availablePlayers.length} Available</span>
              <span style={{ background: '#ef444422', border: '1px solid #ef444444', color: '#ef4444', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{unsoldPlayers.length} Unsold</span>
            </div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
            {players.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#4b4b6a' }}>No players in queue</div>}
            {players.map((p, i) => (
              <div key={p._id} style={{ padding: '12px 20px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 12, background: p._id === currentPlayer?._id ? '#00CF3311' : 'transparent', borderLeft: p._id === currentPlayer?._id ? '3px solid #00CF33' : '3px solid transparent' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, color: p.status === 'unsold' ? '#ef4444' : '#f59e0b', fontWeight: 900 }}>{p.name[0]}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    {p._id === currentPlayer?._id && <span style={{ background: '#00CF3322', border: '1px solid #00CF3344', color: '#00CF33', padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>LIVE</span>}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 11 }}>{p.group} · {p.basePrice?.toLocaleString()} coins</div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: p.status === 'unsold' ? '#ef444422' : '#f59e0b22', color: p.status === 'unsold' ? '#ef4444' : '#f59e0b', border: `1px solid ${p.status === 'unsold' ? '#ef444433' : '#f59e0b33'}` }}>{p.status === 'unsold' ? 'UNSOLD' : 'AVAILABLE'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
