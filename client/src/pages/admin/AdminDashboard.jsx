import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://psel-auction.onrender.com';

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [players, setPlayers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [tab, setTab] = useState('stats');
  const [playerForm, setPlayerForm] = useState({ name: '', role: '', group: 'A', basePrice: 500 });
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchStats();
    fetchPlayers();
    fetchOwners();
  }, []);

  const fetchStats = async () => {
    const res = await axios.get(`${API}/api/admin/stats`);
    setStats(res.data);
  };

  const fetchPlayers = async () => {
    const res = await axios.get(`${API}/api/admin/players`);
    setPlayers(res.data);
  };

  const fetchOwners = async () => {
    const res = await axios.get(`${API}/api/admin/owners`);
    setOwners(res.data);
  };

  const addPlayer = async () => {
    try {
      await axios.post(`${API}/api/admin/players`, playerForm);
      setMsg('Player added!');
      fetchPlayers();
      fetchStats();
    } catch (err) {
      setMsg('Error adding player!');
    }
  };

  const addOwner = async () => {
    try {
      await axios.post(`${API}/api/admin/owners`, ownerForm);
      setMsg('Owner added!');
      fetchOwners();
      fetchStats();
    } catch (err) {
      setMsg('Error adding owner!');
    }
  };

  const deletePlayer = async (id) => {
    await axios.delete(`${API}/api/admin/players/${id}`);
    fetchPlayers();
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <h1 className="text-3xl font-bold text-red-500 text-center mb-6">PSEL Admin Panel</h1>
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {['stats','players','owners'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg font-bold capitalize ${tab===t ? 'bg-red-600' : 'bg-gray-800'}`}>{t}</button>
        ))}
      </div>
      {msg && <p className="text-center text-green-400 mb-4">{msg}</p>}

      {tab === 'stats' && (
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-gray-900 p-4 rounded-xl text-center">
            <p className="text-3xl font-bold text-red-500">{stats.totalPlayers || 0}</p>
            <p className="text-gray-400 text-sm">Total Players</p>
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

      {tab === 'players' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-900 p-4 rounded-xl mb-4">
            <h3 className="text-lg font-bold text-white mb-3">Add Player</h3>
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Name" value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} />
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Role (e.g. Fragger)" value={playerForm.role} onChange={e => setPlayerForm({...playerForm, role: e.target.value})} />
            <select className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" value={playerForm.group} onChange={e => setPlayerForm({...playerForm, group: e.target.value})}>
              {['A','B','C','D','E'].map(g => <option key={g} value={g}>Group {g}</option>)}
            </select>
            <input className="w-full bg-gray-800 text-white p-2 rounded-lg mb-2" placeholder="Base Price" type="number" value={playerForm.basePrice} onChange={e => setPlayerForm({...playerForm, basePrice: parseInt(e.target.value)})} />
            <button onClick={addPlayer} className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg font-bold">Add Player</button>
          </div>
          <div className="space-y-2">
            {players.map(p => (
              <div key={p._id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-white font-bold">{p.name}</p>
                  <p className="text-gray-400 text-sm">Group {p.group} | {p.basePrice} coins | {p.status}</p>
                </div>
                <button onClick={() => deletePlayer(p._id)} className="bg-red-800 text-white px-3 py-1 rounded-lg text-sm">Delete</button>
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
            <button onClick={addOwner} className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg font-bold">Add Owner</button>
          </div>
          <div className="space-y-2">
            {owners.map(o => (
              <div key={o._id} className="bg-gray-900 p-3 rounded-lg">
                <p className="text-white font-bold">{o.name}</p>
                <p className="text-gray-400 text-sm">{o.email} | {o.availableCoins} coins</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
