import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('ownerData');
    if (stored) setOwner(JSON.parse(stored));
    socket.emit('joinAuction');
    fetchData();
    socket.on('auctionStarted', (data) => { setCurrentPlayer(data.player); setCurrentBid(data.currentBid); setTimer(data.timer); setCurrentLeader(''); setBidHistory([]); });
    socket.on('timerUpdate', (data) => setTimer(data.timer));
    socket.on('bidUpdated', (data) => { setCurrentBid(data.currentBid); setCurrentLeader(data.currentLeader); setBidHistory(prev => [{ owner: data.currentLeader, amount: data.currentBid }, ...prev.slice(0, 9)]); });
    socket.on('playerSold', (data) => { setPopup({ type: 'sold', winner: data.winner, amount: data.amount }); setTimeout(() => setPopup(null), 4000); fetchData(); });
    socket.on('playerUnsold', () => { setPopup({ type: 'unsold' }); setTimeout(() => setPopup(null), 4000); fetchData(); });
    return () => { socket.off('auctionStarted'); socket.off('timerUpdate'); socket.off('bidUpdated'); socket.off('playerSold'); socket.off('playerUnsold'); };
  }, []);

  const fetchData = async () => {
    try {
      const [or, pr] = await Promise.all([axios.get(`${API}/api/admin/owners`), axios.get(`${API}/api/admin/players`)]);
      setOwners(or.data);
      setSoldPlayers(pr.data.filter(p => p.status === 'sold'));
      setUnsoldPlayers(pr.data.filter(p => p.status === 'unsold'));
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
  const leftOwners = owners.slice(0, Math.ceil(owners.length / 2));
  const rightOwners = owners.slice(Math.ceil(owners.length / 2));

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#8b5cf644;border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes glow{0%,100%{box-shadow:0 0 10px #ef444433}50%{box-shadow:0 0 20px #ef4444aa}}
        @keyframes popIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.5)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes popOut{from{opacity:1;transform:translate(-50%,-50%) scale(1)}to{opacity:0;transform:translate(-50%,-50%) scale(0.5)}}
        input:focus{outline:none;border-color:#8b5cf6 !important}
        .owner-row:hover{background:#8b5cf611 !important}
        @media(max-width:768px){.desktop-3col{display:none!important} .mobile-sections{display:block!important}}
        @media(min-width:769px){.mobile-sections{display:none!important}}
      `}</style>
      <Navbar />

      {/* Sold/Unsold Popup */}
      {popup && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: popup.type === 'sold' ? 'linear-gradient(135deg, #0d2a0d, #0d0d1a)' : 'linear-gradient(135deg, #2a0d0d, #0d0d1a)', border: `2px solid ${popup.type === 'sold' ? '#00ff88' : '#ef4444'}`, borderRadius: 20, padding: '40px 48px', textAlign: 'center', animation: 'popIn 0.3s ease', boxShadow: `0 0 60px ${popup.type === 'sold' ? '#00ff8844' : '#ef444444'}` }}>
            {popup.type === 'sold' ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                <div style={{ color: '#00ff88', fontSize: 28, fontWeight: 900, fontFamily: 'Orbitron', marginBottom: 8 }}>SOLD!</div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{popup.winner}</div>
                <div style={{ color: '#f59e0b', fontSize: 22, fontWeight: 900, fontFamily: 'Orbitron' }}>৳{popup.amount?.toLocaleString()}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                <div style={{ color: '#ef4444', fontSize: 28, fontWeight: 900, fontFamily: 'Orbitron' }}>UNSOLD!</div>
                <div style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>No bids placed</div>
              </>
            )}
          </div>
        </div>
      )}

      {!currentPlayer ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 130px)', gap: 16 }}>
          <div style={{ color: '#6b7280', fontSize: 18, fontFamily: 'Orbitron' }}>WAITING FOR AUCTION</div>
          <div style={{ color: '#4b4b6a', fontSize: 13 }}>Auction will begin shortly</div>
        </div>
      ) : (
        <>
          {/* DESKTOP LAYOUT */}
          <div className="desktop-3col" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 180px', gap: 10, maxWidth: 1400, margin: '0 auto', padding: '10px 16px' }}>

            {/* Left owners */}
            <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden', height: 'fit-content' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e1e3a', color: '#f59e0b', fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>OWNERS</div>
              {leftOwners.map((o, i) => (
                <div key={o._id} className="owner-row" style={{ padding: '6px 10px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 6, background: o.name === currentLeader ? '#8b5cf611' : 'transparent', cursor: 'default' }}>
                  <span style={{ color: '#4b4b6a', fontSize: 9, width: 16, flexShrink: 0 }}>#{i+1}</span>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: o.name === currentLeader ? '1px solid #00ff88' : 'none' }}>
                    {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 9, fontWeight: 900, color: '#8b5cf6' }}>{o.name[0]}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: o.name === currentLeader ? '#fff' : '#ccc', fontSize: 10, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                    <div style={{ color: '#00ff88', fontSize: 9 }}>৳{o.availableCoins?.toLocaleString()}</div>
                  </div>
                  {o.name === currentLeader && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', flexShrink: 0 }} />}
                </div>
              ))}
            </div>

            {/* Center */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Live badge */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 20, padding: '3px 16px', display: 'flex', alignItems: 'center', gap: 6, animation: 'glow 2s infinite' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                  <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Orbitron' }}>LIVE AUCTION</span>
                </div>
              </div>

              {/* Player card */}
              <div style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0a2e)', border: '1px solid #8b5cf633', borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #8b5cf6, #ef4444, #8b5cf6)' }} />
                <div style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 120, height: 145, borderRadius: 10, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '2px solid #8b5cf633' }}>
                    {currentPlayer?.playerImage ? <img src={currentPlayer.playerImage} alt={currentPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 44, fontWeight: 900, color: '#8b5cf688', fontFamily: 'Orbitron' }}>{currentPlayer?.name?.[0]}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ color: '#fff', fontSize: 'clamp(16px,3vw,24px)', fontWeight: 900, fontFamily: 'Orbitron', marginBottom: 8 }}>{currentPlayer?.name}</h2>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      {currentPlayer?.role && <span style={{ background: '#8b5cf622', border: '1px solid #8b5cf644', padding: '2px 8px', borderRadius: 4, fontSize: 10, color: '#8b5cf6', fontWeight: 700 }}>{currentPlayer.role}</span>}
                      {currentPlayer?.group && <span style={{ background: '#1e1e3a', padding: '2px 8px', borderRadius: 4, fontSize: 10, color: '#9ca3af' }}>{currentPlayer.group}</span>}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 10 }}>Base: <span style={{ color: '#f59e0b', fontWeight: 700 }}>৳{currentPlayer?.basePrice?.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#6b7280', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Current Bid</div>
                        <div style={{ color: '#00ff88', fontSize: 22, fontWeight: 900, fontFamily: 'Orbitron' }}>৳{currentBid?.toLocaleString()}</div>
                        {currentLeader && <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>Leader: {currentLeader}</div>}
                      </div>
                      <div style={{ marginLeft: 'auto' }}>
                        <div style={{ width: 68, height: 68, borderRadius: '50%', background: `conic-gradient(${timerColor} ${pct}%, #1e1e3a ${pct}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <span style={{ color: timerColor, fontSize: 18, fontWeight: 900, fontFamily: 'Orbitron', lineHeight: 1 }}>{timer}</span>
                            <span style={{ color: '#6b7280', fontSize: 8 }}>SEC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {owner ? (
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #1e1e3a', background: '#0a0a16' }}>
                    {msg && <div style={{ background: '#ef444422', borderRadius: 6, padding: '6px 10px', color: '#ef4444', fontSize: 11, marginBottom: 8, textAlign: 'center' }}>{msg}</div>}
                    <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6 }}>Balance: <span style={{ color: '#00ff88', fontWeight: 700 }}>৳{myOwner?.availableCoins?.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      {[1,100,500,1000,2000].map(inc => (
                        <button key={inc} onClick={() => setBidAmount(String(currentBid+inc))} style={{ background: '#1e1e3a', border: '1px solid #2e2e4a', color: '#ccc', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+৳{inc/1000}K</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="Custom amount" type="number" style={{ flex: 1, background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12 }} />
                      <button onClick={() => placeBid()} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>PLACE BID</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #1e1e3a', background: '#0a0a16', textAlign: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>Want to bid? </span>
                    <Link to="/owner/login" style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Login as Owner</Link>
                  </div>
                )}
              </div>

              {/* Bid history */}
              <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '8px 14px', borderBottom: '1px solid #1e1e3a', color: '#fff', fontWeight: 700, fontSize: 11, letterSpacing: 1, fontFamily: 'Orbitron' }}>BID HISTORY</div>
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {bidHistory.length === 0 ? <div style={{ padding: '16px', textAlign: 'center', color: '#4b4b6a', fontSize: 12 }}>No bids yet</div> : bidHistory.map((b, i) => (
                    <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid #1e1e3a11', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: '#8b5cf6' }}>{b.owner[0]}</span>
                        </div>
                        <span style={{ color: '#ccc', fontSize: 12 }}>{b.owner}</span>
                      </div>
                      <span style={{ color: '#00ff88', fontSize: 12, fontWeight: 700, fontFamily: 'Orbitron' }}>৳{b.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sold + Unsold */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#0d0d1a', border: '1px solid #00ff8822', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e1e3a', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#00ff88', fontWeight: 700, fontSize: 11 }}>SOLD ({soldPlayers.length})</span>
                    <Link to="/players" style={{ color: '#8b5cf6', fontSize: 10, textDecoration: 'none' }}>All</Link>
                  </div>
                  <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                    {soldPlayers.slice(0,6).map(p => (
                      <div key={p._id} style={{ padding: '6px 10px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 4, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 9, fontWeight: 900, color: '#00ff88' }}>{p.name[0]}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#fff', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ color: '#00ff88', fontSize: 9 }}>৳{p.soldPrice?.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#0d0d1a', border: '1px solid #ef444422', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e1e3a' }}>
                    <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 11 }}>UNSOLD ({unsoldPlayers.length})</span>
                  </div>
                  <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                    {unsoldPlayers.slice(0,6).map(p => (
                      <div key={p._id} style={{ padding: '6px 10px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 4, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 9, fontWeight: 900, color: '#ef4444' }}>{p.name[0]}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#fff', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ color: '#ef4444', fontSize: 9 }}>No Bids</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right owners */}
            <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden', height: 'fit-content' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e1e3a', color: '#f59e0b', fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>OWNERS</div>
              {rightOwners.map((o, i) => (
                <div key={o._id} className="owner-row" style={{ padding: '6px 10px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 6, background: o.name === currentLeader ? '#8b5cf611' : 'transparent' }}>
                  <span style={{ color: '#4b4b6a', fontSize: 9, width: 20, flexShrink: 0 }}>#{leftOwners.length+i+1}</span>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: o.name === currentLeader ? '1px solid #00ff88' : 'none' }}>
                    {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 9, fontWeight: 900, color: '#8b5cf6' }}>{o.name[0]}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: o.name === currentLeader ? '#fff' : '#ccc', fontSize: 10, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                    <div style={{ color: '#00ff88', fontSize: 9 }}>৳{o.availableCoins?.toLocaleString()}</div>
                  </div>
                  {o.name === currentLeader && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>

          {/* MOBILE LAYOUT */}
          <div className="mobile-sections" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 20, padding: '3px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Orbitron' }}>LIVE AUCTION</span>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #0d0d1a, #1a0a2e)', border: '1px solid #8b5cf633', borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, #8b5cf6, #ef4444)' }} />
              <div style={{ display: 'flex', gap: 12, padding: 14 }}>
                <div style={{ width: 100, height: 120, borderRadius: 10, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {currentPlayer?.playerImage ? <img src={currentPlayer.playerImage} alt={currentPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 36, fontWeight: 900, color: '#8b5cf688', fontFamily: 'Orbitron' }}>{currentPlayer?.name?.[0]}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 900, fontFamily: 'Orbitron', marginBottom: 6 }}>{currentPlayer?.name}</h2>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {currentPlayer?.role && <span style={{ background: '#8b5cf622', border: '1px solid #8b5cf644', padding: '2px 8px', borderRadius: 4, fontSize: 10, color: '#8b5cf6', fontWeight: 700 }}>{currentPlayer.role}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#6b7280', fontSize: 9, textTransform: 'uppercase' }}>Current Bid</div>
                      <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 900, fontFamily: 'Orbitron' }}>৳{currentBid?.toLocaleString()}</div>
                      {currentLeader && <div style={{ color: '#f59e0b', fontSize: 10 }}>{currentLeader}</div>}
                    </div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: `conic-gradient(${timerColor} ${pct}%, #1e1e3a ${pct}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <span style={{ color: timerColor, fontSize: 16, fontWeight: 900, fontFamily: 'Orbitron', lineHeight: 1 }}>{timer}</span>
                        <span style={{ color: '#6b7280', fontSize: 7 }}>SEC</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {owner ? (
                <div style={{ padding: '10px 14px', borderTop: '1px solid #1e1e3a', background: '#0a0a16' }}>
                  {msg && <div style={{ background: '#ef444422', borderRadius: 6, padding: '6px', color: '#ef4444', fontSize: 11, marginBottom: 8, textAlign: 'center' }}>{msg}</div>}
                  <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6 }}>Balance: <span style={{ color: '#00ff88', fontWeight: 700 }}>৳{myOwner?.availableCoins?.toLocaleString()}</span></div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8, overflowX: 'auto' }}>
                    {[1,100,500,1000,2000].map(inc => (
                      <button key={inc} onClick={() => setBidAmount(String(currentBid+inc))} style={{ background: '#1e1e3a', border: '1px solid #2e2e4a', color: '#ccc', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>+৳{inc/1000}K</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="Custom amount" type="number" style={{ flex: 1, background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 12 }} />
                    <button onClick={() => placeBid()} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>BID</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '10px', borderTop: '1px solid #1e1e3a', background: '#0a0a16', textAlign: 'center' }}>
                  <Link to="/owner/login" style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Login to Place Bid</Link>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '6px 10px', borderBottom: '1px solid #1e1e3a', color: '#f59e0b', fontSize: 10, fontWeight: 700 }}>OWNERS</div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {owners.map((o, i) => (
                    <div key={o._id} style={{ padding: '5px 8px', borderBottom: '1px solid #1e1e3a11', display: 'flex', alignItems: 'center', gap: 5, background: o.name === currentLeader ? '#8b5cf611' : 'transparent' }}>
                      <span style={{ color: '#4b4b6a', fontSize: 8, width: 14 }}>#{i+1}</span>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 8, fontWeight: 900, color: '#8b5cf6' }}>{o.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#ccc', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                        <div style={{ color: '#00ff88', fontSize: 8 }}>৳{o.availableCoins?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '6px 10px', borderBottom: '1px solid #1e1e3a', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Orbitron' }}>BID HISTORY</div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {bidHistory.length === 0 ? <div style={{ padding: '12px', textAlign: 'center', color: '#4b4b6a', fontSize: 10 }}>No bids yet</div> : bidHistory.map((b, i) => (
                    <div key={i} style={{ padding: '6px 8px', borderBottom: '1px solid #1e1e3a11', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#ccc', fontSize: 9 }}>{b.owner}</span>
                      <span style={{ color: '#00ff88', fontSize: 9, fontWeight: 700 }}>৳{b.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#0d0d1a', border: '1px solid #00ff8822', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '6px 10px', borderBottom: '1px solid #1e1e3a', color: '#00ff88', fontSize: 10, fontWeight: 700 }}>SOLD ({soldPlayers.length})</div>
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {soldPlayers.map(p => (
                    <div key={p._id} style={{ padding: '5px 8px', borderBottom: '1px solid #1e1e3a11', display: 'flex', gap: 5, alignItems: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 3, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {p.playerImage ? <img src={p.playerImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 8, color: '#00ff88', fontWeight: 900 }}>{p.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ color: '#00ff88', fontSize: 8 }}>৳{p.soldPrice?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#0d0d1a', border: '1px solid #ef444422', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '6px 10px', borderBottom: '1px solid #1e1e3a', color: '#ef4444', fontSize: 10, fontWeight: 700 }}>UNSOLD ({unsoldPlayers.length})</div>
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {unsoldPlayers.map(p => (
                    <div key={p._id} style={{ padding: '5px 8px', borderBottom: '1px solid #1e1e3a11', display: 'flex', gap: 5, alignItems: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 3, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {p.playerImage ? <img src={p.playerImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 8, color: '#ef4444', fontWeight: 900 }}>{p.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ color: '#ef4444', fontSize: 8 }}>No Bids</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
