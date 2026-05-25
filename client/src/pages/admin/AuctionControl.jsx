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
  const queueRef = useRef([]);
  const playersRef = useRef([]);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    socket.on('auctionStarted', (data) => {
      setAuction(data);
      setCurrentPlayer(data.player);
      setStarted(true);
      showMsg('✅ ' + data.player.name + ' auction শুরু!');
    });
    socket.on('timerUpdate', (data) => {
      setAuction(prev => prev ? {...prev, timer: data.timer} : prev);
    });
    socket.on('bidUpdated', (data) => {
      setAuction(prev => prev ? {...prev, currentBid: data.currentBid, currentLeader: data.currentLeader} : prev);
    });
    socket.on('playerSold', (data) => {
      showMsg('🎉 ' + data.winner + ' জিতেছে! ' + data.amount + ' coins');
      setTimeout(() => goNextPlayer(), 3000);
    });
    socket.on('playerUnsold', () => {
      showMsg('❌ Unsold!');
      setTimeout(() => goNextPlayer(), 3000);
    });
    socket.on('auctionPaused', () => { setPaused(true); showMsg('⏸️ Paused!'); });
    socket.on('auctionResumed', () => { setPaused(false); showMsg('▶️ Resumed!'); });
    return () => {
      socket.off('auctionStarted');
      socket.off('timerUpdate');
      socket.off('bidUpdated');
      socket.off('playerSold');
      socket.off('playerUnsold');
      socket.off('auctionPaused');
      socket.off('auctionResumed');
    };
  }, []);

  const loadPlayers = async () => {
    const r = await axios.get(`${API}/api/admin/players`);
    const available = r.data.filter(p => p.status === 'available');
    const unsold = r.data.filter(p => p.status === 'unsold');
    const all = [...available, ...unsold];
    setPlayers(all);
    playersRef.current = all;
  };

  const goNextPlayer = () => {
    const queue = queueRef.current;
    if (queue.length > 0) {
      const nextId = queue[0];
      queueRef.current = queue.slice(1);
      const nextPlayer = playersRef.current.find(p => p._id === nextId);
      if (nextPlayer) {
        setCurrentPlayer(nextPlayer);
        socket.emit('startAuction', { playerId: nextId });
      }
    } else {
      showMsg('🏁 সব players auction শেষ!');
      setStarted(false);
      setAuction(null);
      loadPlayers();
    }
  };

  const startAuction = () => {
    if (!selectedPlayer) { showMsg('❌ প্রথমে একটা player select করুন!'); return; }
    const remaining = playersRef.current.filter(p => p._id !== selectedPlayer).map(p => p._id);
    queueRef.current = remaining;
    socket.emit('startAuction', { playerId: selectedPlayer });
    setPaused(false);
  };

  const skipPlayer = () => {
    showMsg('⏭️ Skipped!');
    goNextPlayer();
  };

  const pauseResumeAuction = () => {
    if (paused) socket.emit('resumeAuction');
    else socket.emit('pauseAuction');
  };

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };
  const selectedPlayerData = players.find(p => p._id === selectedPlayer);

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <h1 className="text-2xl font-bold text-red-500 text-center mb-4">🎮 Auction Control</h1>
      {msg && <div className="bg-gray-800 text-center font-bold text-green-400 mb-4 p-3 rounded-lg">{msg}</div>}
      <div className="max-w-lg mx-auto space-y-4">

        {!started && (
          <div className="bg-gray-900 p-4 rounded-xl">
            <h3 className="text-white font-bold mb-3">প্রথম Player Select করুন</h3>
            <select className="w-full bg-gray-800 text-white p-3 rounded-lg mb-3" value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
              <option value="">-- Select First Player --</option>
              {players.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} | {p.group} | {p.basePrice} coins {p.status==='unsold'?'(Unsold)':''}
                </option>
              ))}
            </select>
            {selectedPlayerData && (
              <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg mb-3">
                {selectedPlayerData.playerImage
                  ? <img src={selectedPlayerData.playerImage} alt={selectedPlayerData.name} className="w-16 h-16 rounded-full object-cover border-2 border-red-500" />
                  : <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">{selectedPlayerData.name[0]}</div>}
                <div>
                  <p className="text-white font-bold text-lg">{selectedPlayerData.name}</p>
                  <p className="text-gray-400">{selectedPlayerData.group} | {selectedPlayerData.role}</p>
                  <p className="text-green-400 font-bold">Base: {selectedPlayerData.basePrice} coins</p>
                </div>
              </div>
            )}
            <button onClick={startAuction} className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg font-bold text-lg">🚀 Start Auction</button>
          </div>
        )}

        {started && currentPlayer && (
          <div className="bg-gray-900 p-4 rounded-xl">
            <h3 className="text-white font-bold mb-3 text-center">Now Playing</h3>
            <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg mb-3">
              {currentPlayer.playerImage
                ? <img src={currentPlayer.playerImage} alt={currentPlayer.name} className="w-16 h-16 rounded-full object-cover border-2 border-red-500" />
                : <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">{currentPlayer.name?.[0]}</div>}
              <div>
                <p className="text-white font-bold text-lg">{currentPlayer.name}</p>
                <p className="text-gray-400">{currentPlayer.group} | {currentPlayer.role}</p>
                <p className="text-green-400 font-bold">Base: {currentPlayer.basePrice} coins</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={pauseResumeAuction} className={`text-white p-3 rounded-lg font-bold ${paused ? 'bg-green-600' : 'bg-yellow-600'}`}>
                {paused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button onClick={skipPlayer} className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg font-bold">⏭️ Skip</button>
            </div>
          </div>
        )}

        {auction && (
          <div className="bg-gray-900 p-4 rounded-xl">
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-lg text-center ${auction.timer <= 5 ? 'bg-red-900' : 'bg-gray-800'}`}>
                <p className={`text-2xl font-bold ${auction.timer <= 5 ? 'text-red-400' : 'text-white'}`}>{auction.timer}s</p>
                <p className="text-gray-400 text-sm">Timer</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-green-400 text-xl font-bold">{auction.currentBid}</p>
                <p className="text-gray-400 text-sm">Bid</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-blue-400 text-sm font-bold">{auction.currentLeader || 'None'}</p>
                <p className="text-gray-400 text-sm">Leader</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 p-4 rounded-xl">
          <h3 className="text-white font-bold mb-2">Queue: {queueRef.current.length} remaining</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {players.map((p, i) => (
              <div key={p._id} className={`flex items-center gap-2 p-2 rounded-lg ${p._id === currentPlayer?._id ? 'bg-red-900' : 'bg-gray-800'}`}>
                {p.playerImage
                  ? <img src={p.playerImage} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">{p.name[0]}</div>}
                <div>
                  <p className="text-white text-sm font-bold">#{i+1} {p.name} {p._id === currentPlayer?._id ? '🔴' : ''}</p>
                  <p className="text-gray-400 text-xs">{p.group} | {p.basePrice} coins {p.status==='unsold'?'• Unsold':''}</p>
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
