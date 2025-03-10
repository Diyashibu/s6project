import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Bell, Search, Settings, User, MessageSquare, Activity, Award, LogOut, Home } from 'lucide-react';
import { supabase } from '../supabase'; // Assuming supabase is set up in a parent directory
import './Scholarship.css';

const ScholarshipPage = () => {
  // State for scholarships from database
  const [scholarships, setScholarships] = useState([]);
  
  // State for the active tab
  const [activeTab, setActiveTab] = useState('');
  
  // State for loading
  const [loading, setLoading] = useState(true);

  // Fetch scholarships from Supabase
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
    script1.async = true;
    
    const script2 = document.createElement("script");
    script2.src = "https://files.bpcontent.cloud/2025/03/06/19/20250306190115-WCWOMQ1I.js";
    script2.async = true;
    
    document.body.appendChild(script1);
    document.body.appendChild(script2);
  
    return () => {
      // Check if scripts still exist in DOM before removing
      if (script1.parentNode) {
        script1.parentNode.removeChild(script1);
      }
      if (script2.parentNode) {
        script2.parentNode.removeChild(script2);
      }
    };
  }, []);
  // Load BotPress chatbot scripts dynamically
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
    script1.async = true;
    document.body.appendChild(script1);

    const script2 = document.createElement("script");
    script2.src = "https://files.bpcontent.cloud/2025/03/06/19/20250306190115-WCWOMQ1I.js";
    script2.async = true;
    document.body.appendChild(script2);

    return () => {
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, []);

  // Filter scholarships based on active tab
  const filteredScholarships = activeTab === 'eligible'
    ? scholarships.filter(scholarship => !scholarship.applied) // Only non-applied scholarships
    : activeTab === 'applied'
      ? scholarships.filter(scholarship => scholarship.applied) // Only applied scholarships
      : scholarships; // Show all scholarships when no tab is selected

  // Apply to scholarship
  const handleApply = async (id) => {
    try {
      // In a real application, you would update both the user's applied scholarships 
      // and the scholarship's applicants list in the database
      
      // For now, we'll just update the local state
      setScholarships(scholarships.map(scholarship => 
        scholarship.id === id ? { ...scholarship, applied: true } : scholarship
      ));
      
      // Here you would add code to update the supabase database
      // e.g., await supabase.from("user_scholarships").insert([{ user_id: currentUserId, scholarship_id: id }]);
      
      alert("Application submitted successfully!");
    } catch (error) {
      console.error("Error applying for scholarship:", error);
      alert("Failed to submit application. Please try again.");
    }
  };

  return (
    <div className="portal-container">
      {/* Top Navigation Bar */}
      <header className="top-nav">
        <div className="nav-left">
          <span className="nav-title">Student Portal</span>
        </div>
        <div className="nav-right">
          <div className="search-container">
            <input type="text" placeholder="Search" className="search-input" />
            <Search className="search-icon" />
          </div>
          <Bell className="nav-icon" color="#FFD700" />
          <Settings className="nav-icon" color="#4CAF50" />
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <a href="#" className="nav-item1">
            <Home className="menu-icon" color="white" />
          </a>
          <div className="profile-brief">
            <div className="avatar"></div>
          </div>
          <nav className="nav-menu">
            <Link to="/" className="nav-item">
              <User className="menu-icon" color="#4CAF50" />
              Profile
            </Link>
            <Link to="#" className="nav-item">
              <MessageSquare className="menu-icon" color="#2196F3" />
              Chatbot
            </Link>
            <Link to="/activity" className="nav-item">
              <Activity className="menu-icon" color="#FF5722" />
              Activity
            </Link>
            <Link to="/scholarship" className="nav-item active">
              <Award className="menu-icon" color="#FFD700" />
              Scholarship
            </Link>
            <Link to="#" className="nav-item">
              <LogOut className="menu-icon" color="#F44336" />
              Logout
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="content-area">
          {/* Header Section */}
          <div className="dashboard-header scholarship-header">
            <div className="header-content">
              <h1>Scholarships</h1>
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${activeTab === 'eligible' ? 'active' : ''}`}
                  onClick={() => setActiveTab(activeTab === 'eligible' ? '' : 'eligible')} 
                >
                  Eligible
                </button>
                <button 
                  className={`tab-button ${activeTab === 'applied' ? 'active' : ''}`}
                  onClick={() => setActiveTab(activeTab === 'applied' ? '' : 'applied')} 
                >
                  Applied
                </button>
              </div>
            </div>
          </div>
          
          {/* Scholarship List */}
          <main className="main-content">
            {loading ? (
              <div className="loading-message">Loading scholarships...</div>
            ) : filteredScholarships.length === 0 ? (
              <div className="no-scholarships-message">
                {activeTab === 'eligible' ? 
                  "No eligible scholarships available at the moment." : 
                  activeTab === 'applied' ? 
                    "You haven't applied to any scholarships yet." : 
                    "No scholarships available at the moment."
                }
              </div>
            ) : (
              <div className="scholarship-container">
                {filteredScholarships.map(scholarship => (
                  <div key={scholarship.id} className="scholarship-card">
                    <div className="scholarship-header">
                      <h3>{scholarship.name}</h3>
                      <span className="scholarship-amount">{scholarship.amount}</span>
                    </div>
                    <div className="scholarship-provider">
                      <span>Provider: {scholarship.provider}</span>
                    </div>
                    <div className="scholarship-details">
                      <p><strong>Eligibility:</strong> {scholarship.eligibility}</p>
                      <p><strong>Description:</strong> {scholarship.description}</p>
                      <p className="deadline"><strong>Deadline:</strong> {scholarship.deadline}</p>
                    </div>
                    <div className="scholarship-actions">
                      {scholarship.applied ? (
                        <p style={{ color: "#FF5722", fontWeight: "bold" }}>Applied</p>
                      ) : (
                        <>
                          <button className="apply-button" onClick={() => handleApply(scholarship.id)}>Apply Now</button>
                          <button className="details-button">View Details</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipPage;