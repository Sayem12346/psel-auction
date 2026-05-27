import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API = 'https://psel-auction.onrender.com';
const socket = io(API);

function AuctionControl() {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [auction, setAuction] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [msg, setMsg] = useState('');
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(5);
  const playersRef = useRef([]);

  useEffect(() => {
    fetchPlayers();
    checkRunningAuction();

    socket.on('auctionStarted', (data) => {
      setAuction(data);
      setCurrentPlayer(data.player);
      setStarted(true);
      setPaused(false);
      showMsg('Auction started: ' + data.player.name);
    });
    socket.on('timerUpdate', (data) => setAuction(prev => prev ? {...prev, timer: data.timer} : prev));
    socket.on('bidUpdated', (data) => setAuction(prev => prev ? {...prev, currentBid: data.currentBid, currentLeader: data.currentLeader} : prev));
    socket.on('playerSold', (data) => { showMsg(data.winner + ' won for ' + data.amount + ' coins!'); fetchPlayers(); });
    socket.on('playerUnsold', () => { showMsg('Unsold! Next player coming...'); fetchPlayers(); });
    socket.on('auctionPaused', () => { setPaused(true); showMsg('Paused!'); });
    socket.on('auctionResumed', () => { setPaused(false); showMsg('Resumed!'); });
    socket.on('auctionEnded', () => { showMsg('All players auctioned!'); setStarted(false); setAuction(null); fetchPlayers(); });
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
    if (!selectedPlayer) { showMsg('Select a player first!'); return; }
    socket.emit('startAuction', { playerId: selectedPlayer, maxPlayers: parseInt(maxPlayers) });
    setPaused(false);
  };

  const pauseResumeAuction = () => {
    if (paused) socket.emit('resumeAuction');
    else socket.emit('pauseAuction');
  };

  const skipPlayer = () => {
    socket.emit('skipPlayer');
    showMsg('Skipped!');
  };

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };
  const selectedPlayerData = players.find(p => p._id === selectedPlayer);

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: 'Rajdhani, sans-serif', color: '#fff', padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <h1 style={{ color: '#ef4444', fontFamily: 'Orbitron', fontSize: 22, marginBottom: 16, textAlign: 'center' }}>Auction Control</h1>

      {msg && <div style={{ background: '#8b5cf622', border: '1px solid #8b5cf644', borderRadius: 8, padding: '10px 16px', color: '#8b5cf6', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{msg}</div>}

      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Max Players Setting */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 16 }}>
          <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Team Player Limit</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} style={{ flex: 1, background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14 }} placeholder="Max players per team" />
            <span style={{ color: '#6b7280', fontSize: 13 }}>players max</span>
          </div>
        </div>

        {/* Player Selection */}
        {!started && (
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 16 }}>
            <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Select First Player</h3>
            <select style={{ width: '100%', background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, marginBottom: 12 }} value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
              <option value="">-- Select Player --</option>
              {players.map(p => <option key={p._id} value={p._id}>{p.name} | {p.group} | {p.basePrice} coins {p.status === 'unsold' ? '(Unsold)' : ''}</option>)}
            </select>

            {selectedPlayerData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1e1e3a', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, background: '#2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {selectedPlayerData.playerImage ? <img src={selectedPlayerData.playerImage} alt={selectedPlayerData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22, color: '#8b5cf6', fontWeight: 900 }}>{selectedPlayerData.name[0]}</span>}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{selectedPlayerData.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{selectedPlayerData.group} | {selectedPlayerData.role}</div>
                  <div style={{ color: '#00ff88', fontSize: 12, fontWeight: 700 }}>Base: {selectedPlayerData.basePrice} coins</div>
                </div>
              </div>
            )}

            <button onClick={startAuction} style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>START AUCTION</button>
          </div>
        )}

        {/* Live Controls */}
        {started && (
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 16 }}>
            <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontSize: 14 }}>Now Playing</h3>
            {currentPlayer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1e1e3a', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, background: '#2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {currentPlayer.playerImage ? <img src={currentPlayer.playerImage} alt={currentPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22, color: '#ef4444', fontWeight: 900 }}>{currentPlayer.name?.[0]}</span>}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{currentPlayer.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{currentPlayer.group} | {currentPlayer.role}</div>
                  <div style={{ color: '#00ff88', fontSize: 12, fontWeight: 700 }}>Base: {currentPlayer.basePrice} coins</div>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#1e1e3a', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ color: auction?.timer <= 5 ? '#ef4444' : '#fff', fontSize: 22, fontWeight: 900, fontFamily: 'Orbitron' }}>{auction?.timer}s</div>
                <div style={{ color: '#6b7280', fontSize: 10 }}>Timer</div>
              </div>
              <div style={{ background: '#1e1e3a', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ color: '#00ff88', fontSize: 16, fontWeight: 700, fontFamily: 'Orbitron' }}>{auction?.currentBid}</div>
                <div style={{ color: '#6b7280', fontSize: 10 }}>Bid</div>
              </div>
              <div style={{ background: '#1e1e3a', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>{auction?.currentLeader || 'None'}</div>
                <div style={{ color: '#6b7280', fontSize: 10 }}>Leader</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={pauseResumeAuction} style={{ background: paused ? '#10b981' : '#f59e0b', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>{paused ? 'RESUME' : 'PAUSE'}</button>
              <button onClick={skipPlayer} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>SKIP</button>
            </div>
          </div>
        )}

        {/* Queue */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 16 }}>
          <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Players Queue ({players.length})</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {players.map((p, i) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: p._id === currentPlayer?._id ? '#ef444422' : '#1e1e3a', borderRadius: 8, padding: '8px 12px', border: p._id === currentPlayer?._id ? '1px solid #ef444444' : '1px solid transparent' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 900 }}>{p.name[0]}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>#{i+1} {p.name} {p._id === currentPlayer?._id ? '🔴' : ''}</div>
                  <div style={{ color: '#6b7280', fontSize: 11 }}>{p.group} | {p.basePrice} coins {p.status === 'unsold' ? '• Unsold' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuctionControl;
