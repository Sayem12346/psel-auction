import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import Navbar from '../../components/Navbar';

const API = 'https://psel-auction.onrender.com';
const socket = io(API);

export default function LivePage() {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [timer, setTimer] = useState(30);
  const [currentBid, setCurrentBid] = useState(0);
  const [currentLeader, setCurrentLeader] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [owners, setOwners] = useState([]);
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('ownerData');
    if (stored) setOwner(JSON.parse(stored));
    socket.emit('joinAuction');
    fetchData();

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
      setBidHistory(prev => [{ owner: data.currentLeader, amount: data.currentBid }, ...prev.slice(0, 9)]);
    });
    socket.on('playerSold', () => fetchData());
    socket.on('playerUnsold', () => fetchData());
    return () => { socket.off('auctionStarted'); socket.off('timerUpdate'); socket.off('bidUpdated'); socket.off('playerSold'); socket.off('playerUnsold'); };
  }, []);

  const fetchData = async () => {
    try {
      const [ownersRes, playersRes] = await Promise.all([
        axios.get(`${API}/api/admin/owners`),
        axios.get(`${API}/api/admin/players`)
      ]);
      setOwners(ownersRes.data);
      setSoldPlayers(playersRes.data.filter(p => p.status === 'sold'));
      setUnsoldPlayers(playersRes.data.filter(p => p.status === 'unsold'));
    } catch (e) {}
  };

  const placeBid = (amount) => {
    if (!owner) { setMsg('Login করুন bid করতে'); setTimeout(() => setMsg(''), 3000); return; }
    const finalAmount = amount || parseInt(bidAmount);
    if (!finalAmount || finalAmount <= currentBid) { setMsg('Higher bid required!'); setTimeout(() => setMsg(''), 3000); return; }
    socket.emit('placeBid', { ownerId: owner._id, amount: finalAmount });
    setBidAmount('');
  };

  const timerColor = timer <= 5 ? '#ef4444' : timer <= 10 ? '#f59e0b' : '#00ff88';
  const pct = (timer / 30) * 100;
  const myOwner = owners.find(o => o._id === owner?._id);

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#8b5cf644;border-radius:2px} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes glow{0%,100%{box-shadow:0 0 10px #ef444433}50%{box-shadow:0 0 20px #ef4444aa}} input:focus{outline:none;border-color:#8b5cf6 !important}`}</style>
      <Navbar />

      {!currentPlayer ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 130px)', gap: 16 }}>
          <div style={{ width: 60, height: 60, border: '3px solid #8b5cf644', borderTop: '3px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ color: '#6b7280', fontSize: 18, fontFamily: 'Orbitron' }}>WAITING FOR AUCTION</div>
          <div style={{ color: '#4b4b6a', fontSize: 13 }}>Auction will begin shortly</div>
        </div>
      ) : (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 12px' }}>

          {/* Live badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 20, padding: '4px 20px', display: 'flex', alignItems: 'center', gap: 8, animation: 'glow 2s infinite' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
              <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, letterSpacing: 2, fontFamily: 'Orbitron' }}>LIVE AUCTION</span>
            </div>
          </div>

          {/* Main layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>

            {/* Player hero card */}
            <div style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 100%)', border: '1px solid #8b5cf633', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #8b5cf6, #ef4444, #8b5cf6)' }} />
              <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
                {/* Player image */}
                <div style={{ width: 120, height: 150, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf622, #ef444422)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #8b5cf633', flexShrink: 0, overflow: 'hidden' }}>
                  {currentPlayer?.playerImage ? <img src={currentPlayer.playerImage} alt={currentPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 48, fontWeight: 900, color: '#8b5cf688', fontFamily: 'Orbitron' }}>{currentPlayer?.name?.[0]}</span>}
                </div>
                {/* Player info */}
                <div style={{ flex: 1, minWidth: 150 }}>
                  <h2 style={{ color: '#fff', fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 900, fontFamily: 'Orbitron', marginBottom: 8 }}>{currentPlayer?.name}</h2>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {currentPlayer?.role && <span style={{ background: '#8b5cf622', border: '1px solid #8b5cf644', padding: '3px 10px', borderRadius: 4, fontSize: 11, color: '#8b5cf6', fontWeight: 700 }}>{currentPlayer.role}</span>}
                    {currentPlayer?.group && <span style={{ background: '#1e1e3a', padding: '3px 10px', borderRadius: 4, fontSize: 11, color: '#9ca3af' }}>{currentPlayer.group}</span>}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>Base Price: <span style={{ color: '#f59e0b', fontWeight: 700 }}>৳{currentPlayer?.basePrice?.toLocaleString()}</span></div>
                  {/* Bid + Timer */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Current Bid</div>
                      <div style={{ color: '#00ff88', fontSize: 24, fontWeight: 900, fontFamily: 'Orbitron' }}>৳{currentBid?.toLocaleString()}</div>
                      {currentLeader && <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>Leader: {currentLeader}</div>}
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: `conic-gradient(${timerColor} ${pct}%, #1e1e3a ${pct}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                          <span style={{ color: timerColor, fontSize: 20, fontWeight: 900, fontFamily: 'Orbitron', lineHeight: 1 }}>{timer}</span>
                          <span style={{ color: '#6b7280', fontSize: 8 }}>SEC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid panel - only for owners */}
              {owner ? (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e3a', background: '#0d0d1a' }}>
                  {msg && <div style={{ background: '#ef444422', border: '1px solid #ef444444', borderRadius: 8, padding: '8px 12px', color: '#ef4444', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{msg}</div>}
                  <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 6 }}>Your balance: <span style={{ color: '#00ff88', fontWeight: 700 }}>৳{myOwner?.availableCoins?.toLocaleString() || owner?.availableCoins?.toLocaleString()}</span></div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    {[1000, 5000, 10000, 20000, 50000].map(inc => (
                      <button key={inc} onClick={() => placeBid(currentBid + inc)} style={{ background: '#1e1e3a', border: '1px solid #2e2e4a', color: '#ccc', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Rajdhani' }}>+৳{(inc/1000)}K</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="Custom amount" type="number" style={{ flex: 1, background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: 'Rajdhani' }} />
                    <button onClick={() => placeBid()} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Rajdhani', letterSpacing: 1 }}>PLACE BID</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e3a', background: '#0d0d1a', textAlign: 'center' }}>
                  <span style={{ color: '#6b7280', fontSize: 13 }}>Want to bid? </span>
                  <Link to="/owner/login" style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Login as Owner</Link>
                </div>
              )}
            </div>

            {/* Desktop: 3 column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {/* Owners list */}
              <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e3a', color: '#f59e0b', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>OWNERS ({owners.length})</div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {owners.map((o, i) => (
                    <div key={o._id} style={{ padding: '8px 12px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 8, background: o.name === currentLeader ? '#8b5cf611' : 'transparent' }}>
                      <span style={{ color: '#4b4b6a', fontSize: 11, width: 22, flexShrink: 0 }}>#{i+1}</span>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 11, fontWeight: 900, color: '#8b5cf6' }}>{o.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                        <div style={{ color: '#00ff88', fontSize: 10 }}>৳{o.availableCoins?.toLocaleString()}</div>
                      </div>
                      {o.name === currentLeader && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bid history */}
              <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e3a', color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: 1, fontFamily: 'Orbitron' }}>BID HISTORY</div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {bidHistory.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#4b4b6a', fontSize: 13 }}>No bids yet</div>
                  ) : bidHistory.map((b, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e3a11', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#8b5cf6' }}>{b.owner[0]}</span>
                        </div>
                        <span style={{ color: '#ccc', fontSize: 12 }}>{b.owner}</span>
                      </div>
                      <span style={{ color: '#00ff88', fontSize: 12, fontWeight: 700, fontFamily: 'Orbitron' }}>৳{b.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sold players */}
              <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#00ff88', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>SOLD ({soldPlayers.length})</span>
                  <Link to="/players" style={{ color: '#8b5cf6', fontSize: 11, textDecoration: 'none' }}>View All</Link>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {soldPlayers.slice(0, 8).map(p => (
                    <div key={p._id} style={{ padding: '8px 12px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 8 }}>
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

            {/* Unsold players */}
            {unsoldPlayers.length > 0 && (
              <div style={{ background: '#0d0d1a', border: '1px solid #ef444433', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>UNSOLD ({unsoldPlayers.length})</span>
                </div>
                <div style={{ display: 'flex', gap: 8, padding: 12, overflowX: 'auto' }}>
                  {unsoldPlayers.map(p => (
                    <div key={p._id} style={{ background: '#1e1e3a', borderRadius: 10, padding: '10px', textAlign: 'center', minWidth: 80, flexShrink: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', overflow: 'hidden' }}>
                        {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16, fontWeight: 900, color: '#ef444488' }}>{p.name[0]}</span>}
                      </div>
                      <div style={{ color: '#fff', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ color: '#ef4444', fontSize: 9 }}>No Bids</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
