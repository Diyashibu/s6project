import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { Bell, Search, Settings, User, MessageSquare, Activity, Award, LogOut, Home } from 'lucide-react';
import './Scholarship.css';

const ScholarshipPage = () => {
  // Sample scholarship data
  const scholarships = [
    {
      id: 1,
      name: "National Merit Scholarship",
      provider: "National Education Foundation",
      amount: "$5,000",
      deadline: "March 30, 2025",
      eligibility: "CGPA above 3.5, Third Year Students",
      description: "Awarded to exceptional students showing academic excellence in their field of study.",
      applied: false
    },
    {
      id: 2,
      name: "STEM Excellence Scholarship",
      provider: "Tech Forward Initiative",
      amount: "$3,500",
      deadline: "April 15, 2025",
      eligibility: "Computer Science, Engineering students",
      description: "Supporting the next generation of technology innovators and leaders.",
      applied: false
    },
    {
      id: 3,
      name: "Community Leadership Grant",
      provider: "Community Foundation",
      amount: "$2,000",
      deadline: "May 1, 2025",
      eligibility: "All students with community service experience",
      description: "For students who have demonstrated exceptional leadership in community service.",
      applied: true
    }
  ];

  // State for the active tab
  const [activeTab, setActiveTab] = useState('');

  // Filter scholarships based on active tab
  const filteredScholarships = activeTab === 'eligible'
    ? scholarships.filter(scholarship => !scholarship.applied) // Only non-applied scholarships
    : activeTab === 'applied'
      ? scholarships.filter(scholarship => scholarship.applied) // Only applied scholarships
      : scholarships; // Show all scholarships when no tab is selected

  return (
    <div className="portal-container">
      {/* Top Navigation Bar - Same as Dashboard */}
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
        {/* Sidebar - Same as Dashboard */}
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
          {/* Header Section - Updated to Scholarships */}
          <div className="dashboard-header scholarship-header">
            <div className="header-content">
              <h1>Scholarships</h1>
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${activeTab === 'eligible' ? 'active' : ''}`}
                  onClick={() => setActiveTab(activeTab === 'eligible' ? '' : 'eligible')} // Toggle Eligible tab
                >
                  Eligible
                </button>
                <button 
                  className={`tab-button ${activeTab === 'applied' ? 'active' : ''}`}
                  onClick={() => setActiveTab(activeTab === 'applied' ? '' : 'applied')} // Toggle Applied tab
                >
                  Applied
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Content - Scholarship list with scrolling */}
          <main className="main-content">
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
                    {activeTab === 'eligible' ? (
                      <>
                        <button className="apply-button">Apply Now</button>
                        <button className="details-button">View Details</button>
                      </>
                    ) : activeTab === 'applied' ? (
                      <p style={{ color: "#FF5722", fontWeight: "bold" }}>Applied</p>
                    ) : (
                      <button className="details-button">View Details</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipPage;
