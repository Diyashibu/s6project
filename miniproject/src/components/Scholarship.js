import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Bell, Search, Settings, User, Activity, Award, LogOut, Home } from 'lucide-react';
import { supabase } from '../supabase';
import './Scholarship.css';

const ScholarshipPage = () => {
  // State for scholarships from database
  const [scholarships, setScholarships] = useState([]);
  const [appliedScholarships, setAppliedScholarships] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Add new state for modal details
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  // Fetch scholarships and applied scholarships
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
        
        // If student is logged in, fetch their applications
        if (studentId) {
          try {
            // Fetch applied scholarships with full details
            const { data: applications, error: appError } = await supabase
              .from('scholarship_applications')
              .select('*')
              .eq('student_id', studentId);
            
            if (appError) {
              console.warn("Error fetching applications:", appError);
            } else {
              console.log("Applied scholarships data:", applications);
              
              // Extract scholarship IDs from applications
              const appliedScholarshipIds = applications.map(app => app.scholarship_id);
              
              // Mark scholarships that have been applied for
              const processedScholarships = scholarshipsData.map(scholarship => ({
                ...scholarship,
                applied: appliedScholarshipIds.includes(scholarship.id)
              }));
              
              setScholarships(processedScholarships || []);
              
              // Fetch full details for applied scholarships
              if (appliedScholarshipIds.length > 0) {
                const { data: appliedScholarshipsData, error: appliedError } = await supabase
                  .from('scholarships')
                  .select('*')
                  .in('id', appliedScholarshipIds);
                
                if (appliedError) {
                  console.error("Error fetching applied scholarships details:", appliedError);
                } else {
                  // Combine with application status data
                  const fullAppliedScholarships = appliedScholarshipsData.map(scholarship => {
                    const applicationData = applications.find(app => app.scholarship_id === scholarship.id);
                    return {
                      ...scholarship,
                      applied: true,
                      applicationStatus: applicationData?.status || 'pending',
                      appliedDate: applicationData?.applied_date
                    };
                  });
                  
                  setAppliedScholarships(fullAppliedScholarships);
                }
              } else {
                setAppliedScholarships([]);
              }
            }
          } catch (appErr) {
            console.error("Error with applications:", appErr);
            // Use the original scholarships data without applied status
            setScholarships(scholarshipsData || []);
            setAppliedScholarships([]);
          }
        } else {
          // No student ID, just set the scholarships
          setScholarships(scholarshipsData || []);
        }
        
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
      
      // Add subscription to applications table as well
      scholarshipsSubscription = supabase
        .channel('applications-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'scholarship_applications' }, 
          (payload) => {
            console.log("Applications changed, payload:", payload);
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
    ? scholarships.filter(scholarship => !scholarship.applied)
    : activeTab === 'applied'
      ? appliedScholarships  // Use the dedicated applied scholarships state
      : scholarships;

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
      
      // Update local state
      // Mark the scholarship as applied in the main scholarships list
      setScholarships(prev => prev.map(sch => 
        String(sch.id) === String(id) ? { ...sch, applied: true } : sch
      ));
      
      // Add to applied scholarships list
      const appliedScholarship = {
        ...scholarship,
        applied: true,
        applicationStatus: 'pending',
        appliedDate: new Date().toISOString()
      };
      setAppliedScholarships(prev => [...prev, appliedScholarship]);
      
      // Switch to applied tab
      setActiveTab('applied');
      
      alert("Application submitted successfully!");
    } catch (error) {
      console.error("General error in apply function:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
  };

  // Handle View Details button click
  const handleViewDetails = (scholarship) => {
    setSelectedScholarship(scholarship);
    setShowDetailsModal(true);
  };

  // Close modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedScholarship(null);
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
            <div className="auth-message">
              You are not logged in. Please <Link to="/" style={{fontWeight: "bold"}}>log in</Link> to apply for scholarships.
            </div>
          )}
          
          {/* Error Message (if any) */}
          {error && (
            <div className="error-message">
              {error} <button onClick={handleRefresh} className="refresh-button">Try Again</button>
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
                      {scholarship.applied && scholarship.applicationStatus && (
                        <p className="application-status">
                          <strong>Status:</strong> 
                          <span className={`status-${scholarship.applicationStatus}`}>
                            {" " + scholarship.applicationStatus.charAt(0).toUpperCase() + scholarship.applicationStatus.slice(1)}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="scholarship-actions">
                      {scholarship.applied ? (
                        <p className="applied-tag">Applied</p>
                      ) : (
                        <>
                          <button 
                            className="apply-button" 
                            onClick={() => handleApply(scholarship.id)}
                            disabled={!studentId}
                          >
                            Apply Now
                          </button>
                          <button 
                            className="details-button"
                            onClick={() => handleViewDetails(scholarship)}
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
          
          {/* Details Modal */}
          {showDetailsModal && selectedScholarship && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>{selectedScholarship.name}</h2>
                  <button 
                    onClick={closeDetailsModal}
                    className="close-button"
                  >
                    ×
                  </button>
                </div>
                
                <div className="scholarship-detail-content">
                  <div className="detail-item">
                    <h3 className="detail-heading amount">Amount</h3>
                    <p className="detail-value amount-value">{selectedScholarship.amount}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h3 className="detail-heading provider">Provider</h3>
                    <p className="detail-value">{selectedScholarship.provider}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h3 className="detail-heading deadline">Deadline</h3>
                    <p className="detail-value">{selectedScholarship.deadline || "Not specified"}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h3 className="detail-heading eligibility">Eligibility</h3>
                    <p className="detail-value">{selectedScholarship.eligibility || "Open to all students"}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h3 className="detail-heading description">Description</h3>
                    <p className="detail-value">{selectedScholarship.description || "No description provided"}</p>
                  </div>
                  
                  {selectedScholarship.requirements && (
                    <div className="detail-item">
                      <h3 className="detail-heading requirements">Requirements</h3>
                      <p className="detail-value">{selectedScholarship.requirements}</p>
                    </div>
                  )}
                  
                  {selectedScholarship.website && (
                    <div className="detail-item">
                      <h3 className="detail-heading website">Website</h3>
                      <a href={selectedScholarship.website} target="_blank" rel="noopener noreferrer" className="website-link">
                        Visit Provider Website
                      </a>
                    </div>
                  )}
                  
                  {selectedScholarship.contact_info && (
                    <div className="detail-item">
                      <h3 className="detail-heading contact">Contact Information</h3>
                      <p className="detail-value">{selectedScholarship.contact_info}</p>
                    </div>
                  )}
                </div>
                
                <div className="modal-footer">
                  {!selectedScholarship.applied && studentId && (
                    <button 
                      onClick={() => {
                        handleApply(selectedScholarship.id);
                        closeDetailsModal();
                      }}
                      className="modal-apply-button"
                    >
                      Apply Now
                    </button>
                  )}
                  <button 
                    onClick={closeDetailsModal}
                    className="modal-close-button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScholarshipPage;