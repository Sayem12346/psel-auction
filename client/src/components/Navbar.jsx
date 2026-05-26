import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [owner, setOwner] = useState(null);
  const [dropdown, setDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('ownerData');
    if (stored) setOwner(JSON.parse(stored));
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerData');
    setOwner(null);
    setDropdown(false);
    navigate('/');
  };

  const navLinks = [['/', 'Overview'], ['/live', 'Live Auction'], ['/players', 'Players'], ['/teams', 'Teams']];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap'); @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <nav style={{ background: '#0d0d1a', borderBottom: '1px solid #1e1e3a', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, fontFamily: 'Rajdhani, sans-serif' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #8b5cf6, #ef4444)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff', fontFamily: 'Orbitron' }}>P</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, fontFamily: 'Orbitron', lineHeight: 1 }}>PSEL</div>
            <div style={{ color: '#8b5cf6', fontSize: 8, letterSpacing: 2 }}>ESPORTS AUCTION</div>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {navLinks.map(([path, label]) => (
            <Link key={path} to={path} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 12, fontWeight: 600, padding: '6px 8px', borderRadius: 8, letterSpacing: 1, whiteSpace: 'nowrap' }}>{label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {owner ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button onClick={() => setDropdown(!dropdown)} style={{ background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#fff', fontFamily: 'Rajdhani' }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: '#8b5cf622', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {owner.profileImage ? <img src={owner.profileImage} alt={owner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#8b5cf6', fontWeight: 900, fontSize: 12 }}>{owner.name?.[0]}</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{owner.name}</span>
                <span style={{ color: '#6b7280', fontSize: 9 }}>▼</span>
              </button>
              {dropdown && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, minWidth: 180, zIndex: 200, animation: 'fadeIn 0.15s ease', boxShadow: '0 8px 32px #00000088' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e3a' }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{owner.name}</div>
                    <div style={{ color: '#00ff88', fontSize: 12, marginTop: 2 }}>{owner.availableCoins?.toLocaleString()} coins</div>
                  </div>
                  <Link to="/owner/dashboard" onClick={() => setDropdown(false)} style={{ display: 'block', padding: '10px 16px', color: '#ccc', textDecoration: 'none', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #1e1e3a22' }}>My Account</Link>
                  <Link to="/live" onClick={() => setDropdown(false)} style={{ display: 'block', padding: '10px 16px', color: '#ccc', textDecoration: 'none', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #1e1e3a22' }}>Live Auction</Link>
                  <button onClick={logout} style={{ width: '100%', padding: '10px 16px', color: '#ef4444', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/owner/login" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', textDecoration: 'none', padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>OWNER LOGIN</Link>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 8, padding: '7px 9px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 16, height: 2, background: '#9ca3af', borderRadius: 1 }} />)}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, background: '#0d0d1a', borderBottom: '1px solid #1e1e3a', zIndex: 99, animation: 'fadeIn 0.15s ease' }}>
          {navLinks.map(([path, label]) => (
            <Link key={path} to={path} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 24px', color: '#ccc', textDecoration: 'none', fontSize: 15, fontWeight: 600, borderBottom: '1px solid #1e1e3a22' }}>{label}</Link>
          ))}
          {!owner && <Link to="/owner/login" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 24px', color: '#8b5cf6', textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>Owner Login</Link>}
        </div>
      )}
    </>
  );
}
