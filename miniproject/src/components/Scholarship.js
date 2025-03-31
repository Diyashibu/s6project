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
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch user information from local storage
  useEffect(() => {
    const fetchStudentData = async () => {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        console.error('No user ID found in local storage');
        setError("You are not logged in. Please log in to view and apply for scholarships.");
        setLoading(false);
        return;
      }
      
      try {
        setStudentId(userId);
        
        const { data, error } = await supabase
          .from('student')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching student data:', error);
          setError("Failed to load student profile. Some features may be limited.");
        } else if (data) {
          setStudentData(data);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("An error occurred while loading your profile.");
      }
    };

    fetchStudentData();
  }, []);

  // Create scholarship_applications table if it doesn't exist
  const createApplicationsTable = async () => {
    try {
      // Try to create the table using SQL
      const { error } = await supabase.rpc('create_scholarship_applications_table', {});
      
      if (error) {
        console.error("Could not create applications table using RPC:", error);
        
        // Fallback: Try direct SQL if RPC fails
        const { error: sqlError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS scholarship_applications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID NOT NULL,
            scholarship_id UUID NOT NULL,
            scholarship_name TEXT,
            status TEXT DEFAULT 'pending',
            applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        
        if (sqlError) {
          console.error("Failed to create table via SQL:", sqlError);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error("Error in createApplicationsTable:", err);
      return false;
    }
  };

  // Fetch scholarships
  useEffect(() => {
    const fetchScholarships = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching scholarships data...");
        
        // Make sure the applications table exists
        await createApplicationsTable();
        
        // Fetch all scholarships from the database
        const { data: scholarshipsData, error: scholarshipsError } = await supabase
          .from('scholarships')
          .select('*');
        
        if (scholarshipsError) {
          console.error("Supabase error details:", scholarshipsError);
          throw scholarshipsError;
        }
        
        console.log("Scholarships data received:", scholarshipsData);
        
        // If student is logged in, try to fetch their applications
        let appliedScholarshipIds = [];
        if (studentId) {
          try {
            const { data: applications, error: appError } = await supabase
              .from('scholarship_applications')
              .select('scholarship_id')
              .eq('student_id', studentId);
            
            if (!appError && applications) {
              appliedScholarshipIds = applications.map(app => app.scholarship_id);
              console.log("Applied scholarship IDs:", appliedScholarshipIds);
            } else if (appError) {
              console.warn("Error fetching applications:", appError);
            }
          } catch (appErr) {
            console.error("Error with applications, continuing without applied status:", appErr);
            // Continue without the applied status - non-critical error
          }
        }
        
        // Mark scholarships that have been applied for
        const processedScholarships = scholarshipsData.map(scholarship => ({
          ...scholarship,
          applied: appliedScholarshipIds.includes(scholarship.id)
        }));
        
        console.log("Processed scholarships:", processedScholarships);
        setScholarships(processedScholarships || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching scholarships (full error):", err);
        setError("Failed to load scholarships. Please try again.");
        // Don't reset scholarships on error to maintain any existing data
      } finally {
        setLoading(false);
      }
    };

    // Failsafe timeout
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("Loading timeout reached, forcing state update");
        setLoading(false);
      }
    }, 10000);

    // Fetch scholarships if studentId exists or if we're done initial loading
    fetchScholarships();
    
    // Set up real-time subscription to the scholarships table
    let scholarshipsSubscription;
    if (studentId) {
      scholarshipsSubscription = supabase
        .channel('scholarships-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'scholarships' }, 
          (payload) => {
            console.log("Database changed, payload:", payload);
            setRefreshTrigger(prev => prev + 1);
          }
        )
        .subscribe();
    }
    
    // Clean up function
    return () => {
      clearTimeout(loadingTimeout);
      if (scholarshipsSubscription) {
        supabase.removeChannel(scholarshipsSubscription);
      }
    };
  }, [studentId, refreshTrigger]);

  // Function to manually refresh scholarships
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
      window.location.href = '/';
      return;
    }
    
    try {
      // Log the IDs for debugging
      console.log("Student ID type:", typeof studentId, "value:", studentId);
      console.log("Scholarship ID type:", typeof id, "value:", id);
      
      // Get scholarship details
      const scholarship = scholarships.find(s => String(s.id) === String(id));
      
      if (!scholarship) {
        alert("Scholarship not found");
        return;
      }
      
      // Ensure both IDs are strings
      const studentIdString = String(studentId);
      const scholarshipIdString = String(id);
      
      // Create application record
      const { data, error } = await supabase
        .from('scholarship_applications')
        .insert([
          { 
            student_id: studentIdString,
            scholarship_id: scholarshipIdString,
            scholarship_name: scholarship.name,
            status: 'pending',
            applied_date: new Date().toISOString()
          }
        ]);
      
      if (error) {
        console.error("Error inserting application:", error);
        alert(error.message || "Failed to submit application. Please try again.");
        return;
      }
      
      // Update local state and switch tabs
      setScholarships(prev => prev.map(sch => 
        String(sch.id) === String(id) ? { ...sch, applied: true } : sch
      ));
      setActiveTab('applied');
      
      alert("Application submitted successfully!");
    } catch (error) {
      console.error("General error in apply function:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <div className="portal-container">
      {/* Top Navigation Bar */}
      <header className="top-nav">
        <div className="nav-left">
          <span className="nav-title">Student Portal</span>
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
                  All
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
          
          {/* Authentication Status Message */}
          {!studentId && !loading && (
            <div className="auth-message" style={{
              backgroundColor: "#FFF3CD", 
              color: "#856404", 
              padding: "12px", 
              margin: "12px", 
              borderRadius: "4px",
              textAlign: "center"
            }}>
              You are not logged in. Please <Link to="/" style={{fontWeight: "bold"}}>log in</Link> to apply for scholarships.
            </div>
          )}
          
          {/* Error Message (if any) */}
          {error && (
            <div className="error-message" style={{
              backgroundColor: "#F8D7DA",
              color: "#721C24",
              padding: "12px",
              margin: "12px",
              borderRadius: "4px",
              textAlign: "center"
            }}>
              {error} <button onClick={handleRefresh} style={{marginLeft: "10px", fontWeight: "bold", padding: "5px 10px", backgroundColor: "#DC3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer"}}>Try Again</button>
            </div>
          )}
          
          {/* Scholarship List */}
          <main className="main-content">
            {loading ? (
              <div className="loading-message">Loading scholarships...</div>
            ) : filteredScholarships.length === 0 && !error ? (
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
                      <p><strong>Eligibility:</strong> {scholarship.eligibility || "Open to all students"}</p>
                      <p><strong>Description:</strong> {scholarship.description || "No description provided"}</p>
                      <p className="deadline"><strong>Deadline:</strong> {scholarship.deadline || "Not specified"}</p>
                    </div>
                    <div className="scholarship-actions">
                      {scholarship.applied ? (
                        <p style={{ color: "#FF5722", fontWeight: "bold" }}>Applied</p>
                      ) : (
                        <>
                          <button 
                            className="apply-button" 
                            onClick={() => handleApply(scholarship.id)}
                            disabled={!studentId}
                            style={{
                              backgroundColor: "#4CAF50",
                              color: "white",
                              border: "none",
                              padding: "8px 16px",
                              borderRadius: "4px",
                              cursor: studentId ? "pointer" : "not-allowed",
                              opacity: studentId ? 1 : 0.6
                            }}
                          >
                            Apply Now
                          </button>
                          <button 
                            className="details-button"
                            style={{
                              backgroundColor: "#2196F3",
                              color: "white",
                              border: "none",
                              padding: "8px 16px",
                              borderRadius: "4px",
                              marginLeft: "8px",
                              cursor: "pointer"
                            }}
                          >
                            View Details
                          </button>
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