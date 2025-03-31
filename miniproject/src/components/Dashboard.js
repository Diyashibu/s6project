import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Bell, Search, Settings, User, MessageSquare, Activity, Award, LogOut, Home, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import './Dashboard.css';
import { supabase } from "../supabase";

const StudentPortal = () => {
  // User state
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  useEffect(() => {
    // Get the logged-in user's ID from local storage
    const fetchStudentData = async () => {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        // Redirect to login if no user ID found
        window.location.href = '/';
        return;
      }
      
      try {
        // Fetch student data from Supabase
        const { data, error } = await supabase
          .from('student')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching student data:', error);
          setLoading(false);
          return;
        }
        
        if (data) {
          setStudentData(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, []);
  
  // Calendar navigation functions
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const prevYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  };
  
  const nextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  };
  
  // Calendar helper functions
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Get month name and year for display
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  // Calendar data
  const daysInMonth = getDaysInMonth(currentYear, currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentYear, currentDate.getMonth());
  
  // Generate calendar dates array
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="date-cell empty"></div>);
  }
  
  // Add cells for each day of the month
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = 
      today.getDate() === i && 
      today.getMonth() === currentDate.getMonth() && 
      today.getFullYear() === currentDate.getFullYear();
    
    calendarDays.push(
      <div key={i} className={`date-cell ${isToday ? 'current' : ''}`}>
        {i}
      </div>
    );
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    window.location.href = '/';
  };

  if (loading) {
    return <div className="loading-indicator">Loading...</div>;
  }

  return (
    <div className="portal-container">
      {/* Top Navigation Bar */}
      <header className="top-nav">
        <div className="nav-left">
          <span className="nav-title">Student Portal</span>
        </div>
    {/*   <div className="nav-right">
          <div className="search-container">
            <input type="text" placeholder="Search" className="search-input" />
            <Search className="search-icon" />
          </div>
          <Bell className="nav-icon" color="#FFD700" />
          <Settings className="nav-icon" color="#4CAF50" />
        </div>  */}
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
            <Link to="/scholarship" className="nav-item">
              <Award className="menu-icon" color="#FFD700" />
              Scholarship
            </Link>
            <Link to="/" className="nav-item" onClick={handleLogout}>
              <LogOut className="menu-icon" color="#F44336" />
              Logout
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="content-area">
          {/* Dashboard Header Section*/}
          <div className="dashboard-header">
            <h1>Dashboard</h1>
          </div>
          
          {/* Main Content */}
          <main className="main-content">
            <div className="dashboard-content">
              {/* Left Column */}
              <div className="dashboard-column-left">
                {/* Personal Details Card */}
                <div className="details-card">
                  <h2 className="card-title">Personal Details</h2>
                  <div className="info-row">
                    <label>Name:</label>
                    <span>{studentData?.name || "Not available"}</span>
                  </div>
                  <div className="info-row">
                    <label>Roll Number:</label>
                    <span>{studentData?.id || "Not available"}</span>
                  </div>
                  <div className="info-row">
                    <label>College:</label>
                    <span>Model Engineering College, Thrikkakara</span>
                  </div>
                  <div className="info-row">
                    <label>Department:</label>
                    <span>Computer Science Engineering</span>
                  </div>
                  <div className="info-row">
                    <label>Class:</label>
                    <span>{studentData?.class || "Not available"}</span>
                  </div>
                  <div className="info-row">
                    <label>Date of Birth:</label>
                    <span>{studentData?.dob || "Not available"}</span>
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="dashboard-column-right">
                {/* Calendar Card */}
                <div className="calendar-card">
                  <h2 className="card-title">Calendar</h2>
                  <div className="calendar-display">
                    <div className="calendar-header">
                      <div className="month-navigation">
                        <button className="month-nav-btn" onClick={prevYear} title="Previous Year">
                          <ChevronsLeft size={18} />
                        </button>
                        <button className="month-nav-btn" onClick={prevMonth} title="Previous Month">
                          <ChevronLeft size={18} />
                        </button>
                        <span>{currentMonthName} {currentYear}</span>
                        <button className="month-nav-btn" onClick={nextMonth} title="Next Month">
                          <ChevronRight size={18} />
                        </button>
                        <button className="month-nav-btn" onClick={nextYear} title="Next Year">
                          <ChevronsRight size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="calendar-days">
                      <div>Su</div>
                      <div>Mo</div>
                      <div>Tu</div>
                      <div>We</div>
                      <div>Th</div>
                      <div>Fr</div>
                      <div>Sa</div>
                    </div>
                    <div className="calendar-dates">
                      {calendarDays}
                    </div>
                  </div>
                </div>
                
                {/* Activity Points Card */}
                <div className="activity-card">
                  <h2 className="card-title">Activity Points</h2>
                  <div className="progress-container">
                    <div className="progress-circle">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path 
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          className="circle-bg"
                        />
                        <path 
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          className="circle"
                          strokeDasharray={`${(studentData?.total_activity_point || 0)}, 100`}
                        />
                      </svg>
                      <div className="percentage">
                        {studentData?.total_activity_point || 0}%
                      </div>
                    </div>
                    <div className="progress-legend">
                      <div className="legend-item">
                        <span className="legend-color completed"></span>
                        <span className="legend-text">Completed ({studentData?.total_activity_point || 0}%)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color remaining"></span>
                        <span className="legend-text">Remaining ({100 - (studentData?.total_activity_point || 0)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;