import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API = 'https://psel-auction.onrender.com';
const socket = io(API);

function AuctionControl() {
  const [players, setPlayers] = useState([]);
  const [auction, setAuction] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [msg, setMsg] = useState('');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetchPlayers();
    socket.on('auctionStarted', (data) => { setAuction(data); setMsg('✅ Auction started!'); });
    socket.on('timerUpdate', (data) => setAuction(prev => prev ? {...prev, timer: data.timer} : prev));
    socket.on('bidUpdated', (data) => setAuction(prev => prev ? {...prev, currentBid: data.currentBid, currentLeader: data.currentLeader} : prev));
    socket.on('playerSold', (data) => { setMsg(`🎉 Sold to ${data.winner} for ${data.amount} coins!`); setTimeout(() => nextPlayer(), 3000); });
    socket.on('playerUnsold', () => { setMsg('❌ Unsold!'); setTimeout(() => nextPlayer(), 3000); });
    return () => socket.off();
  }, []);

  const fetchPlayers = async () => {
    const r = await axios.get(`${API}/api/admin/players`);
    setPlayers(r.data.filter(p => p.status === 'available'));
  };

  const startAuction = () => {
    if (!selectedPlayer) { setMsg('❌ Select a player first!'); return; }
    socket.emit('startAuction', { playerId: selectedPlayer });
    setPaused(false);
  };

  const pauseResumeAuction = () => {
    if (paused) {
      socket.emit('resumeAuction');
      setPaused(false);
      setMsg('▶️ Resumed!');
    } else {
      socket.emit('pauseAuction');
      setPaused(true);
      setMsg('⏸️ Paused!');
    }
  };

  const nextPlayer = () => {
    const available = players.filter(p => p.status === 'available');
    if (available.length > 0) {
      setSelectedPlayer(available[0]._id);
      socket.emit('startAuction', { playerId: available[0]._id });
      fetchPlayers();
    } else {
      setMsg('🏁 All players auctioned!');
    }
  };

  const currentPlayer = players.find(p => p._id === selectedPlayer);

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <h1 className="text-2xl font-bold text-red-500 text-center mb-6">Auction Control</h1>

      {msg && <p className="text-center font-bold text-green-400 mb-4">{msg}</p>}

      <div className="max-w-lg mx-auto">
        <div className="bg-gray-900 p-4 rounded-xl mb-4">
          <h3 className="text-white font-bold mb-3">Select Player</h3>
          <select className="w-full bg-gray-800 text-white p-3 rounded-lg mb-3" value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
            <option value="">-- Select Player --</option>
            {players.map(p => <option key={p._id} value={p._id}>{p.name} | {p.group} | {p.basePrice} coins</option>)}
          </select>

          {currentPlayer && (
            <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg mb-3">
              {currentPlayer.playerImage ? <img src={currentPlayer.playerImage} alt={currentPlayer.name} className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-white text-2xl font-bold">{currentPlayer.name[0]}</div>}
              <div>
                <p className="text-white font-bold text-lg">{currentPlayer.name}</p>
                <p className="text-gray-400">{currentPlayer.group} | {currentPlayer.role}</p>
                <p className="text-green-400 font-bold">Base: {currentPlayer.basePrice} coins</p>
              </div>
            </div>
          )}

          <button onClick={startAuction} className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg font-bold mb-2">🚀 Start Auction</button>
          <button onClick={pauseResumeAuction} className={`w-full text-white p-3 rounded-lg font-bold ${paused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>{paused ? '▶️ Resume' : '⏸️ Pause'}</button>
        </div>

        {auction && (
          <div className="bg-gray-900 p-4 rounded-xl">
            <h3 className="text-white font-bold mb-3">Live Auction Status</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-red-400 text-2xl font-bold">{auction.timer || 0}s</p>
                <p className="text-gray-400 text-sm">Timer</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-green-400 text-xl font-bold">{auction.currentBid || 0}</p>
                <p className="text-gray-400 text-sm">Current Bid</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-blue-400 text-sm font-bold">{auction.currentLeader || 'None'}</p>
                <p className="text-gray-400 text-sm">Leader</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 bg-gray-900 p-4 rounded-xl">
          <h3 className="text-white font-bold mb-2">Available Players: {players.length}</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {players.map((p, i) => (
              <div key={p._id} className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg">
                {p.playerImage ? <img src={p.playerImage} alt={p.name} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">{p.name[0]}</div>}
                <p className="text-white text-sm">#{i+1} {p.name} | {p.group}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuctionControl;
