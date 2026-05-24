import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API = 'https://your-backend-url.onrender.com';
const socket = io(API);

function Auction() {
  const [auction, setAuction] = useState(null);
  const [bid, setBid] = useState('');
  const owner = JSON.parse(localStorage.getItem('owner') || 'null');

  useEffect(() => {
    socket.on('auctionUpdate', (data) => setAuction(data));
    socket.on('timerUpdate', (data) => setAuction(prev => ({...prev, timer: data.timer})));
    return () => socket.off();
  }, []);

  const placeBid = () => {
    if (!owner) return alert('Please login first!');
    socket.emit('placeBid', { ownerId: owner._id, amount: parseInt(bid) });
    setBid('');
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <h1 className="text-3xl font-bold text-red-500 text-center mb-6">PSEL Live Auction</h1>
      {auction ? (
        <div className="max-w-lg mx-auto bg-gray-900 rounded-xl p-6">
          <div className="text-center mb-4">
            <p className="text-gray-400">Current Player</p>
            <h2 className="text-2xl font-bold text-white">{auction.currentPlayer?.name || 'Waiting...'}</h2>
          </div>
          <div className="flex justify-between mb-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Current Bid</p>
              <p className="text-2xl font-bold text-green-400">{auction.currentBid} coins</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Timer</p>
              <p className="text-2xl font-bold text-red-400">{auction.timer}s</p>
            </div>
          </div>
          {owner && (
            <div className="flex gap-2">
              <input className="flex-1 bg-gray-800 text-white p-3 rounded-lg" placeholder="Bid amount" value={bid} onChange={e => setBid(e.target.value)} type="number" />
              <button onClick={placeBid} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold">BID</button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-20">
          <p className="text-xl">Waiting for auction to start...</p>
        </div>
      )}
    </div>
  );
}

export default Auction;
