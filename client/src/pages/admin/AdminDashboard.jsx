import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://psel-auction.onrender.com';

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [players, setPlayers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tab, setTab] = useState('stats');
  const [playerForm, setPlayerForm] = useState({ name: '', role: '', group: '', basePrice: 500 });
  const [playerImage, setPlayerImage] = useState(null);
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '', totalCoins: 15000 });
  const [ownerImage, setOwnerImage] = useState(null);
  const [newGroup, setNewGroup] = useState('');
  const [editCoins, setEditCoins] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line
  useEffect(() => {
    fetchAll();
    const saved = JSON.parse(localStorage.getItem('psel_groups') || '[]');
    setGroups(saved);
  }, []);

  const fetchAll = () => { fetchStats(); fetchPlayers(); fetchOwners(); };
  const fetchStats = async () => { try { const r = await axios.get(`${API}/api/admin/stats`); setStats(r.data); } catch(e){} };
  const fetchPlayers = async () => { try { const r = await axios.get(`${API}/api/admin/players`); setPlayers(r.data); } catch(e){} };
  const fetchOwners = async () => { try { const r = await axios.get(`${API}/api/admin/owners`); setOwners(r.data); } catch(e){} };

  const addGroup = () => {
    if (!newGroup.trim()) return;
    const updated = [...groups, newGroup.trim()];
    setGroups(updated);
    localStorage.setItem('psel_groups', JSON.stringify(updated));
    setNewGroup('');
    showMsg('✅ Group added!');
  };

  const deleteGroup = (g) => {
    const updated = groups.filter(x => x !== g);
    setGroups(updated);
    localStorage.setItem('psel_groups', JSON.stringify(updated));
  };

  const addPlayer = async () => {
    if (!playerForm.name || !playerForm.group) { showMsg('❌ Name and group required!'); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', playerForm.name);
      formData.append('role', playerForm.role);
      formData.append('group', playerForm.group);
      formData.append('basePrice', playerForm.basePrice);
      if (playerImage) formData.append('image', playerImage);
      await axios.post(`${API}/api/admin/players`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMsg('✅ Player added!');
      setPlayerForm({ name: '', role: '', group: '', basePrice: 500 });
      setPlayerImage(null);
      fetchPlayers(); fetchStats();
    } catch (err) { showMsg('❌ ' + (err.response?.data?.error || 'Error!')); }
    finally { setLoading(false); }
  };

  const addOwner = async () => {
    if (!ownerForm.name || !ownerForm.email || !ownerForm.password) { showMsg('❌ All fields required!'); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', ownerForm.name);
      formData.append('email', ownerForm.email);
      formData.append('password', ownerForm.password);
      formData.append('totalCoins', ownerForm.totalCoins);
      if (ownerImage) formData.append('image', ownerImage);
      await axios.post(`${API}/api/admin/owners`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMsg('✅ Owner added!');
      setOwnerForm({ name: '', email: '', password: '', totalCoins: 15000 });
      setOwnerImage(null);
      fetchOwners(); fetchStats();
    } catch (err) { showMsg('❌ ' + (err.response?.data?.error || 'Error!')); }
    finally { setLoading(false); }
  };

  const updateCoins = async (id) => {
    if (!editCoins[id]) { showMsg('❌ Enter coin amount!'); return; }
    try {
      await axios.put(`${API}/api/admin/owners/${id}/coins`, { coins: parseInt(editCoins[id]) });
      showMsg('✅ Coins updated!');
      setEditCoins({...editCoins, [id]: ''});
      fetchOwners();
    } catch (err) { showMsg('❌ Error!'); }
  };

  const removeFromTeam = async (ownerId, playerId) => {
    try {
      await axios.put(`${API}/api/admin/owners/${ownerId}/remove-player`, { playerId });
      showMsg('✅ Player removed!');
      fetchOwners(); fetchPlayers();
    } catch (err) { showMsg('❌ Error!'); }
  };

  const deletePlayer = async (id) => { await axios.delete(`${API}/api/admin/players/${id}`); fetchPlayers(); fetchStats(); };
  const deleteOwner = async (id) => { await axios.delete(`${API}/api/admin/owners/${id}`); fetchOwners(); fetchStats(); };
  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const tabs = ['stats','groups','players','owners','coins','teams'];

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <h1 className="text-2xl font-bold text-red-500 text-center mb-4">PSEL Admin</h1>
      <div className="flex gap-2 mb-4 justify-center flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => { setTab(t); setMsg(''); fetchAll(); }} className={`px-3 py-2 rounded-lg font-bold capitalize text-sm ${tab===t ? 'bg-red-600' : 'bg-gray-800'}`}>{t}</button>
        ))}
      </div>
      {msg && <p className="text-center text-green-400 mb-4 font-bold">{msg}</p>}

      {tab === 'stats' && (
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-gray-900 p-4 rounded-xl text-center"><p className="text-3xl font-bold text-red-500">{stats.totalPlayers||0}</p><p className="text-gray-400 text-sm">Players</p></div>
          <div className="bg-gray-900 p-4 rounded-xl text-center"><p className="text-3xl font-bold text-green-400">{stats.soldPlayers||0}</p><p className="text-gray-400 text-sm">Sold</p></div>
          <div className="bg-gray-900 p-4 rounded-xl text-center"><p className="text-3xl font-bold text-blue-400">{stats.totalOwners||0}</p><p className="text-gray-400 text-sm">Owners</p></div>
        </div>
      )}

      {tab === 'groups' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-900 p-4 rounded-xl mb-4">
            <h3 className="text-lg font-bold text-white mb-3">Add Group</h3>
            <div className="flex gap-2">
              <input className="flex-1 bg-gray-800 text-white p-2 rounded-lg" placeholder="Group name" value={newGroup} onChange={e => setNewGroup(e.target.value)} />
              <button onClick={addGroup} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Add</button>
            </div>
          </div>
          <div className="space-y-2">
            {groups.length === 0 && <p className="text-gray-400 text-center">No groups yet</p>}
            {groups.map((g,i) => (
              <div key={i} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
                <p className="text-white font-bold">{g}</p>
                <button onClick={() => deleteGroup(g)} className="bg-red-800 text-white px-3 py-1 rounded-lg text-sm">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'players' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-900 p-4 rounded-xl mb-4">
            <h3 className="text-lg font-bold text-white mb-3">Add Player</h3>
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Player Name" value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} />
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Role (Fragger, IGL...)" value={playerForm.role} onChange={e => setPlayerForm({...playerForm, role: e.target.value})} />
            <select className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" value={playerForm.group} onChange={e => setPlayerForm({...playerForm, group: e.target.value})}>
              <option value="">-- Select Group --</option>
              {groups.map((g,i) => <option key={i} value={g}>{g}</option>)}
            </select>
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Base Price" type="number" value={playerForm.basePrice} onChange={e => setPlayerForm({...playerForm, basePrice: e.target.value})} />
            <label className="block text-gray-400 text-sm mb-1">Player Image (optional)</label>
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-3" type="file" accept="image/*" onChange={e => setPlayerImage(e.target.files[0])} />
            {playerImage && <p className="text-green-400 text-sm mb-2">✅ {playerImage.name}</p>}
            <button onClick={addPlayer} disabled={loading} className="w-full bg-red-600 text-white p-2 rounded-lg font-bold disabled:opacity-50">{loading ? 'Adding...' : 'Add Player'}</button>
          </div>
          <div className="space-y-2">
            {players.map((p,i) => (
              <div key={p._id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {p.playerImage ? <img src={p.playerImage} alt={p.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">{p.name[0]}</div>}
                  <div>
                    <p className="text-white font-bold">#{i+1} {p.name}</p>
                    <p className="text-gray-400 text-sm">{p.group} | {p.role} | {p.basePrice} coins</p>
                    {p.status==='sold' && <p className="text-green-400 text-xs">Sold: {p.soldPrice} coins</p>}
                  </div>
                </div>
                <button onClick={() => deletePlayer(p._id)} className="bg-red-800 text-white px-3 py-1 rounded-lg text-sm">Del</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'owners' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-900 p-4 rounded-xl mb-4">
            <h3 className="text-lg font-bold text-white mb-3">Add Owner</h3>
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Name" value={ownerForm.name} onChange={e => setOwnerForm({...ownerForm, name: e.target.value})} />
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Email" value={ownerForm.email} onChange={e => setOwnerForm({...ownerForm, email: e.target.value})} />
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" type="password" placeholder="Password" value={ownerForm.password} onChange={e => setOwnerForm({...ownerForm, password: e.target.value})} />
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" type="number" placeholder="Starting Coins (default 15000)" value={ownerForm.totalCoins} onChange={e => setOwnerForm({...ownerForm, totalCoins: e.target.value})} />
            <label className="block text-gray-400 text-sm mb-1">Owner Image (optional)</label>
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-3" type="file" accept="image/*" onChange={e => setOwnerImage(e.target.files[0])} />
            {ownerImage && <p className="text-green-400 text-sm mb-2">✅ {ownerImage.name}</p>}
            <button onClick={addOwner} disabled={loading} className="w-full bg-red-600 text-white p-2 rounded-lg font-bold disabled:opacity-50">{loading ? 'Adding...' : 'Add Owner'}</button>
          </div>
          <div className="space-y-2">
            {owners.map(o => (
              <div key={o._id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {o.profileImage ? <img src={o.profileImage} alt={o.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">{o.name[0]}</div>}
                  <div>
                    <p className="text-white font-bold">{o.name}</p>
                    <p className="text-gray-400 text-sm">{o.email}</p>
                    <p className="text-green-400 text-sm">{o.availableCoins} coins</p>
                  </div>
                </div>
                <button onClick={() => deleteOwner(o._id)} className="bg-red-800 text-white px-3 py-1 rounded-lg text-sm">Del</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'coins' && (
        <div className="max-w-lg mx-auto space-y-3">
          <h3 className="text-lg font-bold text-white mb-3">Set Owner Coins</h3>
          {owners.map(o => (
            <div key={o._id} className="bg-gray-900 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                {o.profileImage ? <img src={o.profileImage} alt={o.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">{o.name[0]}</div>}
                <div>
                  <p className="text-white font-bold">{o.name}</p>
                  <p className="text-green-400 text-sm">Available: {o.availableCoins} | Total: {o.totalCoins}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-800 text-white p-2 rounded-lg" type="number" placeholder="New coin amount" value={editCoins[o._id]||''} onChange={e => setEditCoins({...editCoins, [o._id]: e.target.value})} />
                <button onClick={() => updateCoins(o._id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Set</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'teams' && (
        <div className="max-w-lg mx-auto space-y-4">
          <h3 className="text-lg font-bold text-white mb-3">Owner Teams</h3>
          {owners.map(o => (
            <div key={o._id} className="bg-gray-900 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                {o.profileImage ? <img src={o.profileImage} alt={o.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">{o.name[0]}</div>}
                <div>
                  <p className="text-white font-bold">{o.name}</p>
                  <p className="text-green-400 text-sm">{o.availableCoins} coins left | {o.team?.length||0} players</p>
                </div>
              </div>
              {(!o.team||o.team.length===0) ? <p className="text-gray-500 text-sm">No players yet</p> : (
                <div className="space-y-2">
                  {o.team.map((p,i) => (
                    <div key={p._id||i} className="bg-gray-800 p-2 rounded-lg flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {p.playerImage ? <img src={p.playerImage} alt={p.name} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">{p.name?.[0]||'P'}</div>}
                        <div>
                          <p className="text-white text-sm font-bold">#{i+1} {p.name||'Player'}</p>
                          <p className="text-gray-400 text-xs">{p.soldPrice} coins | {p.role}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFromTeam(o._id, p._id)} className="text-red-400 text-xl font-bold px-2">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
