// import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { useAuth } from '../contexts/AuthContext';
import TruckAnimation from '../components/animations/TruckAnimation';

export default function HomePage() {
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <div className="homepage">
      {/* Merged Green Navbar */}
      <nav className="navbar" style={{paddingTop: 0, paddingBottom: 0, minHeight: 64}}>
        <div className="logo" style={{fontSize: 24, fontWeight: 800}}>WasteWise</div>
        <div className="nav-links" style={{display: 'flex', alignItems: 'center', flex: 1}}>
          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>
          {isAuthenticated && (
            <Link to={
              user?.role === 'user_admin' || user?.role === 'admin' ? '/user-management/dashboard' :
              user?.role === 'financial_admin' ? '/financial/dashboard' :
              user?.role === 'event_admin' ? '/event/dashboard' :
              user?.role === 'feedback_admin' ? '/feedback/dashboard' :
              user?.role === 'transport_admin' ? '/transport/dashboard' :
              '/user/dashboard'
            }>My Dashboard</Link>
          )}
        </div>
        <div className="auth-actions" style={{display: 'flex', alignItems: 'center'}}>
          {isAuthenticated ? (
            <>
              <span style={{marginRight: 18, fontWeight: 600}}>Welcome, {user?.firstName || user?.username}</span>
              <button 
                onClick={logout} 
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#fff',
                  color: '#16a34a',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/user/login" style={{marginRight: 20, fontWeight: 600}}>Login</Link>
              <Link to="/user/register" style={{fontWeight: 600}}>Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section - split left description and right CTA */}
      <div className="hero-section">
        <div className="overlay"></div>
        <div className="hero-grid">
          <div className="hero-left">
            <h1>
              Smarter Waste Management
              <span className="accent"> for a Greener Tomorrow</span>
            </h1>
            <p className="tagline">
              WasteWise is your one-stop platform to schedule pickups, track recycling,
              and reduce landfill impact. We connect households and businesses with
              eco-friendly collection services—fast, transparent, and convenient.
            </p>
            <ul className="highlights">
              <li>On-demand pickups with real-time status</li>
              <li>Verified recyclers and responsible disposal</li>
              <li>Rewards for sustainable actions</li>
            </ul>
            
            {/* Truck Animation Section */}
            <div className="truck-animation-section">
              <h3 className="animation-title">See How It Works</h3>
              <TruckAnimation className="hero-truck-animation" />
            </div>
          </div>
          <div className="hero-right">
            <div className="cta-card">
              <div className="cta-media">
                <img
                  src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800&auto=format&fit=crop"
                  alt="Recycling bins"
                />
                <img
                  src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=800&auto=format&fit=crop"
                  alt="Sorting recyclables"
                />
              </div>
              <div className="cta-content">
                <h2>Ready to start?</h2>
                <p>Book your first pickup in under 60 seconds.</p>
                <Link to="/user/login" className="primary-btn">Start Service</Link>
                <div className="trust">
                  <span>Trusted by 10,000+ users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}