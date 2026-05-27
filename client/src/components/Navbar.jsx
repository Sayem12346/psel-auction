import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [owner, setOwner] = useState(null);
  const [dropdown, setDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    setMenuOpen(false);
    navigate('/');
  };

  const navLinks = [['/', 'Overview'], ['/live', 'Live Auction'], ['/players', 'Players'], ['/teams', 'Teams']];
  const bottomNav = [
    { path: '/', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/players', label: 'Players', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { path: '/live', label: 'Auction', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { path: '/teams', label: 'Teams', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    { path: owner ? '/owner/dashboard' : '/owner/login', label: owner ? 'Account' : 'Login', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap');
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .nav-link:hover{color:#fff !important;background:#1e1e3a !important}
        .bottom-nav-item:hover svg{stroke:#8b5cf6}
        body{padding-bottom:70px}
        @media(min-width:768px){.bottom-nav{display:none!important} body{padding-bottom:0}}
        @media(max-width:767px){.desktop-nav{display:none!important}}
      `}</style>

      {/* Top Navbar */}
      <nav style={{ background: '#0d0d1a', borderBottom: '1px solid #1e1e3a', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, fontFamily: 'Rajdhani, sans-serif' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #8b5cf6, #ef4444)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#fff', fontFamily: 'Orbitron' }}>P</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 14, fontFamily: 'Orbitron', lineHeight: 1 }}>PSEL</div>
            <div style={{ color: '#8b5cf6', fontSize: 7, letterSpacing: 2 }}>ESPORTS AUCTION</div>
          </div>
        </Link>

        <div className="desktop-nav" style={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {navLinks.map(([path, label]) => (
            <Link key={path} to={path} className="nav-link" style={{ color: location.pathname === path ? '#8b5cf6' : '#9ca3af', textDecoration: 'none', fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 6, letterSpacing: 0.5, whiteSpace: 'nowrap', transition: 'all 0.2s', background: location.pathname === path ? '#8b5cf611' : 'transparent' }}>{label}</Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {owner ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button onClick={() => setDropdown(!dropdown)} style={{ background: '#1e1e3a', border: '1px solid #2e2e4a', borderRadius: 10, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#fff', fontFamily: 'Rajdhani' }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: '#8b5cf622', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {owner.profileImage ? <img src={owner.profileImage} alt={owner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#8b5cf6', fontWeight: 900, fontSize: 12 }}>{owner.name?.[0]}</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{owner.name}</span>
                <span style={{ color: '#6b7280', fontSize: 9 }}>{dropdown ? '▲' : '▼'}</span>
              </button>
              {dropdown && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, minWidth: 200, zIndex: 200, animation: 'slideDown 0.15s ease', boxShadow: '0 8px 32px #00000088' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e3a' }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{owner.name}</div>
                    <div style={{ color: '#00ff88', fontSize: 12, marginTop: 2 }}>{owner.availableCoins?.toLocaleString()} coins</div>
                  </div>
                  <Link to="/owner/dashboard" onClick={() => setDropdown(false)} style={{ display: 'block', padding: '11px 16px', color: '#ccc', textDecoration: 'none', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #1e1e3a22' }}>My Account</Link>
                  <Link to="/live" onClick={() => setDropdown(false)} style={{ display: 'block', padding: '11px 16px', color: '#ccc', textDecoration: 'none', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #1e1e3a22' }}>Live Auction</Link>
                  <button onClick={logout} style={{ width: '100%', padding: '11px 16px', color: '#ef4444', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/owner/login" className="desktop-nav" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', textDecoration: 'none', padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>OWNER LOGIN</Link>
          )}
        </div>
      </nav>

      {/* Bottom Navigation - Mobile only */}
      <div className="bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0d0d1a', borderTop: '1px solid #1e1e3a', zIndex: 100, display: 'flex', alignItems: 'center', height: 65, padding: '0 8px' }}>
        {bottomNav.map(({ path, label, icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none', padding: '8px 4px' }}>
              {label === 'Auction' ? (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: isActive ? 'linear-gradient(135deg, #ef4444, #8b5cf6)' : '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2, border: isActive ? 'none' : '1px solid #2e2e4a' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={isActive ? '#fff' : '#6b7280'} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
                </div>
              ) : (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={isActive ? '#8b5cf6' : '#6b7280'} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
              )}
              <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? '#8b5cf6' : '#6b7280', fontFamily: 'Rajdhani', letterSpacing: 0.5 }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
