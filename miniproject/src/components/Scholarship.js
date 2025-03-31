import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Bell, Search, Settings, User, Activity, Award, LogOut, Home } from 'lucide-react';
import { supabase } from '../supabase'; 
import './Scholarship.css';

const ScholarshipPage = () => {
  // State for scholarships from database
  const [scholarships, setScholarships] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);

  // Fetch user information and scholarships
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get the student profile from the database
          const { data: studentData, error: studentError } = await supabase
            .from('student')
            .select('*')
            .eq('auth_id', user.id)
            .single();
          
          if (studentError) {
            console.error("Error fetching student data:", studentError);
            // Continue with fetching scholarships even if student data has an error
          }
          
          if (studentData) {
            setStudentId(studentData.id);
          }
        }
        
        // Fetch scholarships regardless of user authentication status
        fetchScholarships();
      } catch (err) {
        console.error("Error getting current user:", err);
        // Continue with fetching scholarships even if getting user fails
        fetchScholarships();
      }
    };

    const fetchScholarships = async () => {
      try {
        console.log("Fetching all scholarships");
        const { data, error } = await supabase.from('scholarships').select('*');
        
        if (error) {
          console.error("Error fetching scholarships:", error);
          setLoading(false);
          return;
        }
        
        console.log("Scholarships fetched:", data ? data.length : 0);
        
        // Since scholarship_applications table doesn't exist, 
        // we'll set all scholarships as not applied
        const processedScholarships = data.map(scholarship => ({
          ...scholarship,
          applied: false // No applications table, so no scholarships are applied for
        }));
        
        setScholarships(processedScholarships || []);
      } catch (err) {
        console.error("Error in scholarship fetching process:", err);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  // Load BotPress chatbot scripts
  useEffect(() => {
    // Create a window.botpressWebChat object if it doesn't exist
    if (!window.botpressWebChat) {
      window.botpressWebChat = {
        init: function() {
          // This will be overwritten when the script loads
          console.log("BotPress initialization placeholder");
        }
      };
    }

    // Function to load a script with promise
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    // Load scripts in sequence
    const loadBotPressScripts = async () => {
      try {
        // First load the inject.js script
        await loadScript("https://cdn.botpress.cloud/webchat/v2.2/inject.js");
        console.log("BotPress inject.js loaded successfully");
        
        // Then load the chatbot config script
        await loadScript("https://files.bpcontent.cloud/2025/03/06/19/20250306190115-WCWOMQ1I.js");
        console.log("BotPress chatbot config loaded successfully");
      } catch (error) {
        console.error("Failed to load BotPress scripts:", error);
      }
    };

    loadBotPressScripts();

    return () => {
      // Optional: Clean up any BotPress related resources
      if (window.botpressWebChat && window.botpressWebChat.onClose) {
        try {
          window.botpressWebChat.onClose();
        } catch (err) {
          console.error("Error closing BotPress chat:", err);
        }
      }
    };
  }, []);

  // Since there's no scholarship_applications table, we'll modify the filter logic
  const filteredScholarships = activeTab === 'eligible'
    ? scholarships // All scholarships are eligible since none are applied
    : activeTab === 'applied'
      ? [] // No scholarships are applied since there's no applications table
      : scholarships;

  // Simplified apply function since there's no applications table
  const handleApply = async (id) => {
    if (!studentId) {
      alert("You must be logged in to apply");
      return;
    }
    
    try {
      // Find the scholarship
      const scholarship = scholarships.find(s => s.id === id);
      if (!scholarship) {
        throw new Error("Scholarship not found");
      }
      
      // Since there's no applications table, we'll just mark it as applied in the UI
      setScholarships(prev => prev.map(sch => 
        sch.id === id ? { ...sch, applied: true } : sch
      ));
      
      // Show a success message, but let the user know this is just UI feedback
      alert("Application submitted successfully! (Note: This is a UI simulation as the applications database table doesn't exist yet)");
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
          <Link to="/Dashboard" className="nav-item1">
            <Home className="menu-icon" color="white" />
          </Link>
          <div className="profile-brief">
            <div className="avatar"></div>
          </div>
          <nav className="nav-menu">
            <Link to="/Dashboard" className="nav-item">
              <User className="menu-icon" color="#4CAF50" />
              Profile
            </Link>
            
            <Link to="/activity" className="nav-item">
              <Activity className="menu-icon" color="#FF5722" />
              Activity
            </Link>
            <Link to="/scholarship" className="nav-item active">
              <Award className="menu-icon" color="#FFD700" />
              Scholarship
            </Link>
            <Link to="/" className="nav-item">
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