import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Bell, Search, Settings, User, Activity, Award, LogOut, Home } from 'lucide-react';
import { supabase } from '../supabase'; // Ensure this is correctly set up
import './Scholarship.css';

const ScholarshipPage = () => {
  // State for scholarships from database
  const [scholarships, setScholarships] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user information and scholarships from Supabase
  useEffect(() => {
    // Get current authenticated user
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
          
          if (studentError) throw studentError;
          if (studentData) {
            setStudentId(studentData.id);
          }
        }
      } catch (err) {
        console.error("Error getting current user:", err);
        setError("Failed to authenticate user. Please try logging in again.");
      }
    };

    getCurrentUser();
  }, []);

  // Fetch scholarships whenever studentId changes or when component mounts
  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        setLoading(true);
        
        // Fetch all scholarships from the database
        const { data: scholarshipsData, error: scholarshipsError } = await supabase
          .from('scholarships')
          .select('*');
        
        if (scholarshipsError) throw scholarshipsError;
        
        // If student is logged in, fetch their applications to mark which scholarships they've applied to
        let appliedScholarshipIds = [];
        if (studentId) {
          const { data: applications, error: appError } = await supabase
            .from('scholarship_applications')
            .select('*')
            .eq('student_id', studentId);
          
          if (appError) throw appError;
          appliedScholarshipIds = applications ? applications.map(app => app.scholarship_id) : [];
        }
        
        // Mark scholarships that have been applied for
        const processedScholarships = scholarshipsData.map(scholarship => ({
          ...scholarship,
          applied: appliedScholarshipIds.includes(scholarship.id)
        }));
        
        setScholarships(processedScholarships || []);
      } catch (err) {
        console.error("Error fetching scholarships:", err);
        setError("Failed to load scholarships. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchScholarships();
    
    // Set up real-time subscription to the scholarships table
    const scholarshipsSubscription = supabase
      .channel('scholarships-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'scholarships' }, 
        fetchScholarships
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(scholarshipsSubscription);
    };
  }, [studentId]);

  // Load BotPress chatbot scripts dynamically
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
    script1.async = true;
    script1.onerror = () => console.error("Failed to load inject.js");

    const script2 = document.createElement("script");
    script2.src = "https://files.bpcontent.cloud/2025/03/06/19/20250306190115-WCWOMQ1I.js";
    script2.async = true;
    script2.onerror = () => console.error("Failed to load chatbot script");

    document.body.appendChild(script1);
    document.body.appendChild(script2);

    return () => {
      if (script1.parentNode) script1.parentNode.removeChild(script1);
      if (script2.parentNode) script2.parentNode.removeChild(script2);
    };
  }, []);

  // Filter scholarships based on active tab
  const filteredScholarships = activeTab === 'eligible'
    ? (scholarships || []).filter(scholarship => !scholarship.applied)
    : activeTab === 'applied'
      ? (scholarships || []).filter(scholarship => scholarship.applied)
      : scholarships || [];

  // Apply to scholarship
  const handleApply = async (id) => {
    if (!studentId) {
      alert("You must be logged in to apply");
      return;
    }
    
    try {
      // Update local state first for immediate UI feedback
      setScholarships(prev => prev.map(sch => sch.id === id ? { ...sch, applied: true } : sch));
      
      // Get scholarship details for the notification
      const scholarship = scholarships.find(s => s.id === id);
      
      // Create an application record in the database
      const { data, error } = await supabase
        .from('scholarship_applications')
        .insert([
          { 
            student_id: studentId, 
            scholarship_id: id,
            scholarship_name: scholarship.name,
            status: 'pending',
            applied_date: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
      alert("Application submitted successfully!");
    } catch (error) {
      console.error("Error applying for scholarship:", error);
      
      // Revert the local state change if the database update failed
      setScholarships(prev => prev.map(sch => sch.id === id ? { ...sch, applied: false } : sch));
      
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
            ) : error ? (
              <div className="error-message">{error}</div>
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