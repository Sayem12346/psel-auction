import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://psel-auction.onrender.com';

const S = {
  card: { background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 16, padding: '20px' },
  btn: { border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: 1 },
  input: { background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, width: '100%', fontFamily: 'Rajdhani', outline: 'none' },
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState({});
  const [players, setPlayers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [groups, setGroups] = useState([]);
  const [playerForm, setPlayerForm] = useState({ name: '', role: '', group: '', basePrice: 500 });
  const [playerImage, setPlayerImage] = useState(null);
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '', totalCoins: 15000 });
  const [ownerImage, setOwnerImage] = useState(null);
  const [newGroup, setNewGroup] = useState('');
  const [editCoins, setEditCoins] = useState({});
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { fetchAll(); const saved = JSON.parse(localStorage.getItem('psel_groups') || '[]'); setGroups(saved); }, []);

  const fetchAll = () => { fetchStats(); fetchPlayers(); fetchOwners(); };
  const fetchStats = async () => { try { const r = await axios.get(`${API}/api/admin/stats`); setStats(r.data); } catch(e){} };
  const fetchPlayers = async () => { try { const r = await axios.get(`${API}/api/admin/players`); setPlayers(r.data); } catch(e){} };
  const fetchOwners = async () => { try { const r = await axios.get(`${API}/api/admin/owners`); setOwners(r.data); } catch(e){} };

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'success' }), 3000); };

  const addGroup = () => {
    if (!newGroup.trim()) return;
    const updated = [...groups, newGroup.trim()];
    setGroups(updated);
    localStorage.setItem('psel_groups', JSON.stringify(updated));
    setNewGroup('');
    showMsg('Group added!');
  };

  const deleteGroup = (g) => { const updated = groups.filter(x => x !== g); setGroups(updated); localStorage.setItem('psel_groups', JSON.stringify(updated)); };

  const addPlayer = async () => {
    if (!playerForm.name || !playerForm.group) { showMsg('Name and group required!', 'error'); return; }
    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(playerForm).forEach(([k, v]) => fd.append(k, v));
      if (playerImage) fd.append('image', playerImage);
      await axios.post(`${API}/api/admin/players`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMsg('Player added!');
      setPlayerForm({ name: '', role: '', group: '', basePrice: 500 });
      setPlayerImage(null);
      fetchPlayers(); fetchStats();
    } catch (err) { showMsg(err.response?.data?.error || 'Error!', 'error'); }
    finally { setLoading(false); }
  };

  const addOwner = async () => {
    if (!ownerForm.name || !ownerForm.email || !ownerForm.password) { showMsg('All fields required!', 'error'); return; }
    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(ownerForm).forEach(([k, v]) => fd.append(k, v));
      if (ownerImage) fd.append('image', ownerImage);
      await axios.post(`${API}/api/admin/owners`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMsg('Owner added!');
      setOwnerForm({ name: '', email: '', password: '', totalCoins: 15000 });
      setOwnerImage(null);
      fetchOwners(); fetchStats();
    } catch (err) { showMsg(err.response?.data?.error || 'Error!', 'error'); }
    finally { setLoading(false); }
  };

  const updateCoins = async (id) => {
    if (!editCoins[id]) { showMsg('Enter coin amount!', 'error'); return; }
    try { await axios.put(`${API}/api/admin/owners/${id}/coins`, { coins: parseInt(editCoins[id]) }); showMsg('Coins updated!'); setEditCoins({...editCoins, [id]: ''}); fetchOwners(); }
    catch (err) { showMsg('Error!', 'error'); }
  };

  const removeFromTeam = async (ownerId, playerId) => {
    try { await axios.put(`${API}/api/admin/owners/${ownerId}/remove-player`, { playerId }); showMsg('Player removed!'); fetchOwners(); fetchPlayers(); }
    catch (err) { showMsg('Error!', 'error'); }
  };

  const deletePlayer = async (id) => { await axios.delete(`${API}/api/admin/players/${id}`); fetchPlayers(); fetchStats(); };
  const deleteOwner = async (id) => { await axios.delete(`${API}/api/admin/owners/${id}`); fetchOwners(); fetchStats(); };

  const msgColor = msg.type === 'error' ? '#ef4444' : '#00CF33';

  const navItems = [
    { id: 'stats', icon: '📊', label: 'Dashboard' },
    { id: 'groups', icon: '🗂', label: 'Groups' },
    { id: 'players', icon: '🎮', label: 'Players' },
    { id: 'owners', icon: '👑', label: 'Owners' },
    { id: 'coins', icon: '💰', label: 'Coins' },
    { id: 'teams', icon: '🏆', label: 'Teams' },
  ];

  const handleNav = (id) => { setTab(id); fetchAll(); setSidebarOpen(false); };

  return (
    <div style={{ minHeight: '100vh', background: '#080812', fontFamily: 'Rajdhani, sans-serif', color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#00CF3344;border-radius:2px}
        input:focus,select:focus{outline:none;border-color:#00CF3344!important}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 40 }} />}

      {/* Sidebar */}
      <div style={{ width: 220, background: '#0d0d1a', borderRight: '1px solid #1e1e3a', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease' }} className="admin-sidebar">
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #00CF33, #00a828)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#000', fontFamily: 'Orbitron' }}>P</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 13, fontFamily: 'Orbitron', lineHeight: 1 }}>PSEL</div>
              <div style={{ color: '#00CF33', fontSize: 7, letterSpacing: 2 }}>ADMIN PANEL</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => handleNav(n.id)} style={{ background: tab === n.id ? '#00CF3311' : 'transparent', color: tab === n.id ? '#00CF33' : '#6b7280', padding: '12px 20px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, border: 'none', borderLeft: tab === n.id ? '3px solid #00CF33' : '3px solid transparent', cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 600 }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid #1e1e3a' }}>
          <a href="/admin/auction" style={{ display: 'block', background: 'linear-gradient(135deg, #00CF33, #00a828)', color: '#000', textDecoration: 'none', padding: '11px 16px', borderRadius: 10, fontSize: 12, fontWeight: 900, textAlign: 'center', letterSpacing: 1, fontFamily: 'Orbitron' }}>AUCTION CONTROL</a>
        </div>
      </div>

      {/* Desktop sidebar - always visible on large screens */}
      <style>{`@media(min-width:769px){.admin-sidebar{transform:translateX(0)!important} .admin-main{margin-left:220px!important}}`}</style>

      {/* Main content */}
      <div className="admin-main" style={{ marginLeft: 0, minHeight: '100vh' }}>
        {/* Top header */}
        <div style={{ background: '#0d0d1a', borderBottom: '1px solid #1e1e3a', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 16, height: 2, background: '#9ca3af', borderRadius: 1 }} />)}
            </button>
            <div>
              <h1 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900 }}>{navItems.find(n => n.id === tab)?.label?.toUpperCase()}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchAll} style={{ ...S.btn, background: '#1e1e3a', color: '#9ca3af', padding: '7px 14px', fontSize: 11 }}>Refresh</button>
            <a href="/" style={{ ...S.btn, background: '#1e1e3a', color: '#9ca3af', padding: '7px 14px', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Site</a>
          </div>
        </div>

        <div style={{ padding: '20px 16px' }}>
          {msg.text && <div style={{ background: msgColor + '22', border: `1px solid ${msgColor}44`, borderRadius: 10, padding: '10px 16px', color: msgColor, fontSize: 13, fontWeight: 600, marginBottom: 16, animation: 'fadeIn 0.2s ease' }}>{msg.text}</div>}

          {/* STATS */}
          {tab === 'stats' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Players', value: stats.totalPlayers || 0, color: '#00CF33' },
                  { label: 'Sold', value: stats.soldPlayers || 0, color: '#f59e0b' },
                  { label: 'Unsold', value: (stats.totalPlayers || 0) - (stats.soldPlayers || 0), color: '#ef4444' },
                  { label: 'Owners', value: stats.totalOwners || 0, color: '#06b6d4' },
                ].map((s, i) => (
                  <div key={i} style={{ ...S.card, borderTop: `3px solid ${s.color}`, textAlign: 'center' }}>
                    <div style={{ color: s.color, fontSize: 32, fontWeight: 900, fontFamily: 'Orbitron' }}>{s.value}</div>
                    <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div style={S.card}>
                  <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 14, fontSize: 13, fontFamily: 'Orbitron' }}>RECENT PLAYERS</h3>
                  {players.slice(0,5).map(p => (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, color: '#00CF33', fontWeight: 900 }}>{p.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1 }}><div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{p.name}</div><div style={{ color: '#6b7280', fontSize: 10 }}>{p.group} · {p.role}</div></div>
                      <span style={{ color: p.status==='sold'?'#00CF33':p.status==='unsold'?'#ef4444':'#f59e0b', fontSize: 10, fontWeight: 700 }}>{p.status}</span>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 14, fontSize: 13, fontFamily: 'Orbitron' }}>OWNERS</h3>
                  {owners.slice(0,5).map(o => (
                    <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, color: '#00CF33', fontWeight: 900 }}>{o.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1 }}><div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{o.name}</div><div style={{ color: '#6b7280', fontSize: 10 }}>{o.email}</div></div>
                      <span style={{ color: '#00CF33', fontSize: 10, fontWeight: 700 }}>{o.availableCoins?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GROUPS */}
          {tab === 'groups' && (
            <div style={{ maxWidth: 560 }}>
              <div style={S.card}>
                <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 14, fontSize: 13, fontFamily: 'Orbitron' }}>ADD GROUP</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input style={S.input} placeholder="Group name..." value={newGroup} onChange={e => setNewGroup(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGroup()} />
                  <button onClick={addGroup} style={{ ...S.btn, background: 'linear-gradient(135deg, #00CF33, #00a828)', color: '#000', padding: '10px 18px', fontSize: 13 }}>ADD</button>
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groups.length === 0 && <div style={{ color: '#4b4b6a', textAlign: 'center', padding: 24, fontSize: 13 }}>No groups yet</div>}
                {groups.map((g, i) => (
                  <div key={i} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00CF33' }} />
                      <span style={{ color: '#fff', fontWeight: 600 }}>{g}</span>
                    </div>
                    <button onClick={() => deleteGroup(g)} style={{ ...S.btn, background: '#ef444422', color: '#ef4444', padding: '5px 12px', fontSize: 11, border: '1px solid #ef444433' }}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PLAYERS */}
          {tab === 'players' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={S.card}>
                <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 14, fontSize: 13, fontFamily: 'Orbitron' }}>ADD PLAYER</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input style={S.input} placeholder="Player Name" value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} />
                  <input style={S.input} placeholder="Role (Fragger, IGL...)" value={playerForm.role} onChange={e => setPlayerForm({...playerForm, role: e.target.value})} />
                  <select style={S.input} value={playerForm.group} onChange={e => setPlayerForm({...playerForm, group: e.target.value})}>
                    <option value="">-- Select Group --</option>
                    {groups.map((g, i) => <option key={i} value={g}>{g}</option>)}
                  </select>
                  <input style={S.input} placeholder="Base Price" type="number" value={playerForm.basePrice} onChange={e => setPlayerForm({...playerForm, basePrice: e.target.value})} />
                  <div style={{ border: '1px dashed #2e2e4a', borderRadius: 10, padding: '12px', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" onChange={e => setPlayerImage(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    <div style={{ color: playerImage ? '#00CF33' : '#6b7280', fontSize: 12 }}>{playerImage ? '✅ ' + playerImage.name : 'Upload Image (optional)'}</div>
                  </div>
                  <button onClick={addPlayer} disabled={loading} style={{ ...S.btn, background: loading ? '#1e1e3a' : 'linear-gradient(135deg, #00CF33, #00a828)', color: loading ? '#6b7280' : '#000', padding: '12px', fontSize: 14 }}>{loading ? 'Adding...' : 'ADD PLAYER'}</button>
                </div>
              </div>
              <div style={S.card}>
                <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 14, fontSize: 13, fontFamily: 'Orbitron' }}>PLAYERS ({players.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
                  {players.map((p, i) => (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e1e3a', borderRadius: 10, padding: '10px 12px' }}>
                      <span style={{ color: '#4b4b6a', fontSize: 10, width: 20 }}>#{i+1}</span>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 13, color: '#00CF33', fontWeight: 900 }}>{p.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ color: '#6b7280', fontSize: 10 }}>{p.group} · {p.role} · {p.basePrice?.toLocaleString()} coins</div>
                      </div>
                      <span style={{ color: p.status==='sold'?'#00CF33':p.status==='unsold'?'#ef4444':'#f59e0b', fontSize: 9, fontWeight: 700, marginRight: 4 }}>{p.status}</span>
                      <button onClick={() => deletePlayer(p._id)} style={{ ...S.btn, background: '#ef444422', color: '#ef4444', padding: '4px 8px', fontSize: 10, border: '1px solid #ef444433' }}>Del</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OWNERS */}
          {tab === 'owners' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={S.card}>
                <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 14, fontSize: 13, fontFamily: 'Orbitron' }}>ADD OWNER</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input style={S.input} placeholder="Owner Name" value={ownerForm.name} onChange={e => setOwnerForm({...ownerForm, name: e.target.value})} />
                  <input style={S.input} placeholder="Email" value={ownerForm.email} onChange={e => setOwnerForm({...ownerForm, email: e.target.value})} />
                  <input style={S.input} type="password" placeholder="Password" value={ownerForm.password} onChange={e => setOwnerForm({...ownerForm, password: e.target.value})} />
                  <input style={S.input} type="number" placeholder="Starting Coins (default 15000)" value={ownerForm.totalCoins} onChange={e => setOwnerForm({...ownerForm, totalCoins: e.target.value})} />
                  <div style={{ border: '1px dashed #2e2e4a', borderRadius: 10, padding: '12px', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" onChange={e => setOwnerImage(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    <div style={{ color: ownerImage ? '#00CF33' : '#6b7280', fontSize: 12 }}>{ownerImage ? '✅ ' + ownerImage.name : 'Upload Image (optional)'}</div>
                  </div>
                  <button onClick={addOwner} disabled={loading} style={{ ...S.btn, background: loading ? '#1e1e3a' : 'linear-gradient(135deg, #00CF33, #00a828)', color: loading ? '#6b7280' : '#000', padding: '12px', fontSize: 14 }}>{loading ? 'Adding...' : 'ADD OWNER'}</button>
                </div>
              </div>
              <div style={S.card}>
                <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 14, fontSize: 13, fontFamily: 'Orbitron' }}>OWNERS ({owners.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
                  {owners.map((o, i) => (
                    <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e1e3a', borderRadius: 10, padding: '10px 12px' }}>
                      <span style={{ color: '#4b4b6a', fontSize: 10, width: 20 }}>#{i+1}</span>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 13, color: '#00CF33', fontWeight: 900 }}>{o.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{o.name}</div>
                        <div style={{ color: '#6b7280', fontSize: 10 }}>{o.email}</div>
                        <div style={{ color: '#00CF33', fontSize: 10, fontWeight: 700 }}>{o.availableCoins?.toLocaleString()} coins</div>
                      </div>
                      <button onClick={() => deleteOwner(o._id)} style={{ ...S.btn, background: '#ef444422', color: '#ef4444', padding: '4px 8px', fontSize: 10, border: '1px solid #ef444433' }}>Del</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COINS */}
          {tab === 'coins' && (
            <div style={{ maxWidth: 560 }}>
              <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 14, fontSize: 13, fontFamily: 'Orbitron' }}>SET OWNER COINS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {owners.map(o => (
                  <div key={o._id} style={S.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16, color: '#00CF33', fontWeight: 900 }}>{o.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{o.name}</div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                          <span style={{ color: '#00CF33', fontSize: 11 }}>Available: {o.availableCoins?.toLocaleString()}</span>
                          <span style={{ color: '#f59e0b', fontSize: 11 }}>Reserved: {o.reservedCoins?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input style={{ ...S.input, flex: 1 }} type="number" placeholder="New coin amount" value={editCoins[o._id] || ''} onChange={e => setEditCoins({...editCoins, [o._id]: e.target.value})} />
                      <button onClick={() => updateCoins(o._id)} style={{ ...S.btn, background: 'linear-gradient(135deg, #00CF33, #00a828)', color: '#000', padding: '10px 18px', fontSize: 13 }}>SET</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEAMS */}
          {tab === 'teams' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {owners.map(o => (
                <div key={o._id} style={S.card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #1e1e3a' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {o.profileImage ? <img src={o.profileImage} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18, color: '#00CF33', fontWeight: 900 }}>{o.name[0]}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{o.name}</div>
                      <div style={{ color: '#00CF33', fontSize: 11 }}>{o.availableCoins?.toLocaleString()} coins · {o.team?.length || 0} players</div>
                    </div>
                  </div>
                  {(!o.team || o.team.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '14px', color: '#4b4b6a', fontSize: 12 }}>No players yet</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {o.team.map((p, i) => (
                        <div key={p._id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e1e3a', borderRadius: 10, padding: '8px 12px' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {p.playerImage ? <img src={p.playerImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, color: '#00CF33', fontWeight: 900 }}>{p.name?.[0] || 'P'}</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{p.name || 'Player'}</div>
                            <div style={{ color: '#00CF33', fontSize: 11, fontWeight: 700 }}>৳{p.soldPrice?.toLocaleString() || 0}</div>
                          </div>
                          <button onClick={() => removeFromTeam(o._id, p._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
