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
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '', totalCoins: 15000 });
  const [newGroup, setNewGroup] = useState('');
  const [editCoins, setEditCoins] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchAll();
    const saved = JSON.parse(localStorage.getItem('psel_groups') || '[]');
    setGroups(saved);
  }, []);

  const fetchAll = () => { fetchStats(); fetchPlayers(); fetchOwners(); };
  const fetchStats = async () => { const r = await axios.get(`${API}/api/admin/stats`); setStats(r.data); };
  const fetchPlayers = async () => { const r = await axios.get(`${API}/api/admin/players`); setPlayers(r.data); };
  const fetchOwners = async () => { const r = await axios.get(`${API}/api/admin/owners`); setOwners(r.data); };

  const addGroup = () => {
    if (!newGroup.trim()) return;
    const updated = [...groups, newGroup.trim()];
    setGroups(updated);
    localStorage.setItem('psel_groups', JSON.stringify(updated));
    setNewGroup('');
    showMsg('Group added!');
  };

  const deleteGroup = (g) => {
    const updated = groups.filter(x => x !== g);
    setGroups(updated);
    localStorage.setItem('psel_groups', JSON.stringify(updated));
  };

  const addPlayer = async () => {
    if (!playerForm.name || !playerForm.group) { showMsg('Name and group required!'); return; }
    try {
      await axios.post(`${API}/api/admin/players`, playerForm);
      showMsg('✅ Player added!');
      setPlayerForm({ name: '', role: '', group: '', basePrice: 500 });
      fetchPlayers(); fetchStats();
    } catch (err) { showMsg('❌ ' + (err.response?.data?.error || 'Error!')); }
  };

  const addOwner = async () => {
    if (!ownerForm.name || !ownerForm.email || !ownerForm.password) { showMsg('All fields required!'); return; }
    try {
      await axios.post(`${API}/api/admin/owners`, ownerForm);
      showMsg('✅ Owner added!');
      setOwnerForm({ name: '', email: '', password: '', totalCoins: 15000 });
      fetchOwners(); fetchStats();
    } catch (err) { showMsg('❌ ' + (err.response?.data?.error || 'Error!')); }
  };

  const updateCoins = async (id) => {
    try {
      await axios.put(`${API}/api/admin/owners/${id}/coins`, { coins: parseInt(editCoins[id]) });
      showMsg('✅ Coins updated!');
      fetchOwners();
    } catch (err) { showMsg('❌ Error updating coins!'); }
  };

  const deletePlayer = async (id) => { await axios.delete(`${API}/api/admin/players/${id}`); fetchPlayers(); fetchStats(); };
  const deleteOwner = async (id) => { await axios.delete(`${API}/api/admin/owners/${id}`); fetchOwners(); fetchStats(); };

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const tabs = ['stats', 'groups', 'players', 'owners'];

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <h1 className="text-2xl font-bold text-red-500 text-center mb-4">PSEL Admin</h1>
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => { setTab(t); setMsg(''); }} className={`px-4 py-2 rounded-lg font-bold capitalize text-sm ${tab===t ? 'bg-red-600' : 'bg-gray-800'}`}>{t}</button>
        ))}
      </div>
      {msg && <p className="text-center text-green-400 mb-4 font-bold">{msg}</p>}

      {tab === 'stats' && (
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-red-500">{stats.totalPlayers || 0}</p>
            <p className="text-gray-400 text-sm">Players</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-green-400">{stats.soldPlayers || 0}</p>
            <p className="text-gray-400 text-sm">Sold</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.totalOwners || 0}</p>
            <p className="text-gray-400 text-sm">Owners</p>
          </div>
        </div>
      )}

      {tab === 'groups' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-900 p-4 rounded-xl mb-4">
            <h3 className="text-lg font-bold text-white mb-3">Add Group</h3>
            <div className="flex gap-2">
              <input className="flex-1 bg-gray-800 text-white p-2 rounded-lg" placeholder="Group name (Elite, Pro, Diamond...)" value={newGroup} onChange={e => setNewGroup(e.target.value)} />
              <button onClick={addGroup} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Add</button>
            </div>
          </div>
          <div className="space-y-2">
            {groups.length === 0 && <p className="text-gray-400 text-center">No groups yet</p>}
            {groups.map((g, i) => (
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
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Role (Fragger, IGL, Support...)" value={playerForm.role} onChange={e => setPlayerForm({...playerForm, role: e.target.value})} />
            <select className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" value={playerForm.group} onChange={e => setPlayerForm({...playerForm, group: e.target.value})}>
              <option value="">-- Select Group --</option>
              {groups.map((g, i) => <option key={i} value={g}>{g}</option>)}
            </select>
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Base Price" type="number" value={playerForm.basePrice} onChange={e => setPlayerForm({...playerForm, basePrice: e.target.value})} />
            <button onClick={addPlayer} className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg font-bold">Add Player</button>
          </div>
          <div className="space-y-2">
            {players.map(p => (
              <div key={p._id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-white font-bold">{p.name}</p>
                  <p className="text-gray-400 text-sm">{p.group} | {p.role} | {p.basePrice} coins | <span className={p.status==='sold' ? 'text-green-400' : p.status==='unsold' ? 'text-red-400' : 'text-yellow-400'}>{p.status}</span></p>
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
            <button onClick={addOwner} className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg font-bold">Add Owner</button>
          </div>
          <div className="space-y-2">
            {owners.map(o => (
              <div key={o._id} className="bg-gray-900 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-white font-bold">{o.name}</p>
                    <p className="text-gray-400 text-sm">{o.email}</p>
                  </div>
                  <button onClick={() => deleteOwner(o._id)} className="bg-red-800 text-white px-3 py-1 rounded-lg text-sm">Del</button>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <p className="text-green-400 text-sm font-bold">Available: {o.availableCoins} coins</p>
                    <p className="text-yellow-400 text-sm">Reserved: {o.reservedCoins} coins</p>
                  </div>
                  <input className="w-24 bg-gray-800 text-white p-1 rounded text-sm" type="number" placeholder="New coins" value={editCoins[o._id] || ''} onChange={e => setEditCoins({...editCoins, [o._id]: e.target.value})} />
                  <button onClick={() => updateCoins(o._id)} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">Set</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
