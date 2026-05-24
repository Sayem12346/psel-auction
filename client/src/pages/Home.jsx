import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
      <h1 className="text-5xl font-bold text-red-500 mb-4">PSEL</h1>
      <p className="text-gray-400 text-xl mb-8">eSports Live Auction Platform</p>
      <div className="flex gap-4">
        <Link to="/auction" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold">Live Auction</Link>
        <Link to="/login" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold">Owner Login</Link>
      </div>
    </div>
  );
}

export default Home;
