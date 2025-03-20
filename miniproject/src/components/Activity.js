import { Link } from 'react-router-dom';
import React, {useRef, useState, useEffect } from 'react';
import { Bell, Search, Settings, User, MessageSquare, Activity, Award, LogOut, Home, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload, FileText, X, CheckCircle } from 'lucide-react';
import './Activity.css';
import { supabase } from '../supabase'; // Make sure to import your Supabase client

const ActivityPoints = () => {
  const fileInputRef = useRef(null);

  // For file upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  // Empty state for uploaded files - will be populated from Supabase
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // New state for upload success message
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [userId, setUserId] = useState(null);
  // Mock activity points data
  const activityData = [
    { id: 1, activity: "IEEE Conference Participation", date: "2024-11-10", points: 15, certificate: "ieee_cert.pdf" },
    { id: 2, activity: "Hackathon Winner", date: "2024-09-22", points: 25, certificate: "hackathon_cert.pdf" },
    { id: 3, activity: "Community Service", date: "2024-10-05", points: 10, certificate: "community_cert.pdf" },
    { id: 4, activity: "Workshop Organizer", date: "2024-08-15", points: 20, certificate: "workshop_cert.pdf" },
    { id: 5, activity: "Research Paper Publication", date: "2024-07-30", points: 30, certificate: "research_cert.pdf" }
  ];

  // Calculate total points and percentage
  const totalPointsRequired = 100;
  const earnedPoints = activityData.reduce((sum, item) => sum + item.points, 0);
  const completionPercentage = Math.min(Math.round((earnedPoints / totalPointsRequired) * 100), 100);
  
  // Fetch certificates from Supabase on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      // Call fetchCertificates with the userId
      fetchCertificates(storedUserId);
    } else {
      console.error("User not authenticated");
      // Optional redirect to login page
    }
  }, []);
  // Function to fetch certificates from Supabase
  const fetchCertificates = async () => {
    try {
      // Fetch list of files from the certuploads bucket
      const { data, error } = await supabase
        .storage
        .from('certuploads')
        .list();
      
      if (error) {
        console.error("Error fetching certificates:", error);
        return;
      }
      
      if (data) {
        // Map the data to our uploadedFiles format
        const formattedFiles = data.map((file, index) => ({
          id: index + 1,
          name: file.name,
          date: new Date(file.created_at || Date.now()).toISOString().split('T')[0],
          status: "Pending", // Default status
          path: file.name
        }));
        
        setUploadedFiles(formattedFiles);
      }
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    }
  };
  /*const fetchStudentData = async () => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      // Redirect to login if no user ID found
      window.location.href = '/';
      return;
    }
    fetchStudentData();
  };*/
  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; // ✅ Optional chaining added to avoid undefined error
  
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    // Generate a unique file name
    const uniqueFileName = `${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('certuploads')
      .upload(uniqueFileName, file);

      const { data: urlData } = supabase
        .storage
        .from('certuploads')
        .getPublicUrl(uniqueFileName);

    const fileUrl = urlData.publicUrl;

    // Insert into 'certificates' table
    const { error: insertError } = await supabase
        .from('certificates')
        .insert([{ student_id: userId, certificate: fileUrl }]);
    
    if (error) {
      console.error("Upload failed:", error.message);
    } else {
      console.log("File uploaded successfully:", data);
    }
    

  
    console.log(file); // 🎯 File is uploaded successfully
  };
  
  
  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
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
            
            <Link to="/activity" className="nav-item active">
              <Activity className="menu-icon" color="#FF5722" />
              Activity
            </Link>
            <Link to="/scholarship" className="nav-item">
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
          {/* Dashboard Header Section*/}
          <div className="dashboard-header">
            <h1>Activity Points</h1>
          </div>
          
          {/* Main Content */}
          <main className="main-content">
            <div className="activity-dashboard">
              {/* Progress Section */}
              <div className="activity-progress-section">
                <div className="progress-card">
                  <h2 className="card-title">Activity Points Progress</h2>
                  <div className="progress-indicator">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <div className="progress-numbers">
                      <span>{earnedPoints} points earned</span>
                      <span>{completionPercentage}% complete</span>
                      <span>{totalPointsRequired} points required</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Certificate Upload Section */}
<div className="certificate-upload-section">
  <div className="upload-card">
    <h2 className="card-title">Upload Certificates</h2>
    <p className="upload-description">
      Upload certificates for activity points verification. Supported formats: PDF, JPG, PNG (max 5MB each)
    </p>

    {/* Upload Success Message */}
    {showUploadSuccess && (
      <div className="upload-success-message">
        <CheckCircle size={18} color="#4CAF50" />
        <span>Files successfully uploaded! Waiting for verification.</span>
      </div>
    )}

    {/* File Input for Upload */}
    <input 
      type="file"
      accept=".pdf,.jpg,.png"
      onChange={handleUpload}
      style={{ display: 'none' }}
      ref={fileInputRef}
    />

    {/* Upload Button */}
    <button 
      className="upload-btn" 
      onClick={() => fileInputRef.current.click()}
    >
      <Upload size={18} />
      Upload Certificates
    </button>

    {/* Uploaded Files Section - Only shown if there are files */}
    {uploadedFiles.length > 0 && (
      <div className="uploaded-files-section">
        <h3 className="uploaded-files-title">Uploaded Files</h3>
        <div className="uploaded-files-table-container">
          <table className="uploaded-files-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Upload Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {uploadedFiles.map(file => (
                <tr key={file.id} className={`status-${file.status.toLowerCase()}`}>
                  <td>
                    <div className="file-info">
                      <FileText size={16} />
                      <span>{file.name}</span>
                    </div>
                  </td>
                  <td>{file.date}</td>
                  <td>
                    <span className={`status-badge status-${file.status.toLowerCase()}`}>
                      {file.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
</div>

              
              {/* Activity Points Table Section */}
              <div className="activity-table-section">
                <div className="table-card">
                  <h2 className="card-title">Activity Points Details</h2>
                  <div className="table-container">
                    <table className="activity-table">
                      <thead>
                        <tr>
                          <th>Activity</th>
                          <th>Date</th>
                          <th>Points</th>
                          <th>Certificate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityData.map(item => (
                          <tr key={item.id}>
                            <td>{item.activity}</td>
                            <td>{new Date(item.date).toLocaleDateString()}</td>
                            <td>{item.points}</td>
                            <td>
                              <button className="view-cert-btn">
                                <FileText size={16} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2" className="total-label">Total Points Earned:</td>
                          <td colSpan="2" className="total-value">{earnedPoints}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h3>Upload Certificates</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowUploadModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="file-input-container">
                <input 
                  type="file" 
                  id="certificate-upload" 
                  multiple 
                  onChange={handleFileChange}
                  className="file-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="certificate-upload" className="file-label">
                  <Upload size={20} />
                  Select Files
                </label>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>Selected Files:</h4>
                  <ul className="file-list">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="file-item">
                        <span className="file-name">{file.name}</span>
                        <button 
                          className="remove-file-btn" 
                          onClick={() => removeFile(index)}
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {uploadProgress > 0 && (
                <div className="upload-progress-container">
                  <div 
                    className="upload-progress-bar" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <span className="upload-progress-text">{uploadProgress}%</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button 
                className="upload-confirm-btn" 
                onClick={handleUpload}
                disabled={selectedFiles.length === 0}
              >
                Upload Files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPoints;