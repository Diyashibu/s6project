import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Bell, Search, Settings, User, MessageSquare, Activity, Award, LogOut, Home, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload, FileText, X, CheckCircle } from 'lucide-react';
import './Activity.css';
import { supabase } from "../supabase";

const ActivityPoints = () => {
  // For file upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  // State for uploaded files
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // State for activity data
  const [activityData, setActivityData] = useState([]);
  // State for upload success message
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  // State for any errors
  const [error, setError] = useState(null);
  // Current user ID - in a real app this would come from auth
  const [userId, setUserId] = useState(null);
  // For progress interval tracking
  const [progressInterval, setProgressIntervalId] = useState(null);
  
  // Calculate total points and percentage
  const totalPointsRequired = 100;
  const earnedPoints = activityData.reduce((sum, item) => sum + item.points, 0);
  const completionPercentage = Math.min(Math.round((earnedPoints / totalPointsRequired) * 100), 100);
  
  // Get current user when component mounts
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          setUserId('dummy-user-id');
          return;
        }
        
        if (user) {
          setUserId(user.id);
        } else {
          // For demo purposes
          setUserId('dummy-user-id');
        }
      } catch (err) {
        console.error('Failed to get current user:', err);
        setUserId('dummy-user-id');
      }
    };
    
    getCurrentUser();
  }, []);
  
  // Fetch data when userId is available
  useEffect(() => {
    if (userId) {
      fetchActivityData();
      fetchUploadedFiles();
    }
  }, [userId]);
  
  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);
  
  // Fetch activity data from Supabase
  const fetchActivityData = async () => {
    if (!userId) return;
    
    try {
      // Clear any existing error
      setError(null);
      
      const { data, error } = await supabase
        .from('certificates')
        .select('certificate_id, id, certificate, activity_point, status, uploaded_at')
        .eq('id', userId)
        .eq('status', 'Verified'); // Only get verified certificates for activity points
      
      if (error) throw error;
      
      // Check if data is available
      if (!data || data.length === 0) {
        setActivityData([]);
        return;
      }
      
      // Format data for display
      const formattedData = data.map((item, index) => ({
        id: item.certificate_id,
        activity: `Activity ${index + 1}`, // You might want to customize this based on your needs
        date: item.uploaded_at ? new Date(item.uploaded_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        points: item.activity_point,
        certificate: item.certificate
      }));
      
      setActivityData(formattedData);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity data. Please try again later.');
      setActivityData([]);
    }
  };
  
  // Fetch uploaded files from Supabase
  const fetchUploadedFiles = async () => {
    if (!userId) return;
    
    try {
      // Clear any existing error
      setError(null);
      
      const { data, error } = await supabase
        .from('certificates')
        .select('certificate_id, id, certificate, activity_point, status, uploaded_at')
        .eq('id', userId);
      
      if (error) throw error;
      
      // Check if data is available
      if (!data || data.length === 0) {
        setUploadedFiles([]);
        return;
      }
      
      // Format data for display
      const formattedFiles = data.map((item, index) => ({
        id: item.certificate_id,
        name: item.certificate.split('/').pop() || `Certificate ${index + 1}`, // Extract filename from path
        date: item.uploaded_at ? new Date(item.uploaded_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: item.status || "Pending", // Use status from database
        points: item.activity_point
      }));
      
      setUploadedFiles(formattedFiles);
    } catch (err) {
      console.error('Error fetching uploaded files:', err);
      setError('Failed to load uploaded files. Please try again later.');
      setUploadedFiles([]);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };
  
  // Handle file upload to Supabase
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("No files selected");
      return;
    }
    
    if (!userId) {
      setError("User not authenticated");
      return;
    }
    
    // Clear any previous errors
    setError(null);
    
    try {
      // Start progress simulation
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      setProgressIntervalId(interval);
      
      // Check if the bucket exists
      try {
        const { error: bucketError } = await supabase.storage.getBucket('documents');
        if (bucketError) {
          console.warn('Bucket verification failed:', bucketError);
          // Continue anyway, as the bucket might still be accessible
        }
      } catch (bucketErr) {
        console.warn('Error checking bucket:', bucketErr);
        // Continue anyway, as this might just be a permissions issue
      }
      
      // Process each file
      const uploadedCertificates = [];
      
      for (const file of selectedFiles) {
        // Validate file type and size
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'jpg', 'jpeg', 'png'].includes(fileExt)) {
          throw new Error(`Invalid file type: ${fileExt}. Only PDF, JPG, and PNG are supported.`);
        }
        
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 5MB size limit.`);
        }
        
        // Create a unique file name
        const timestamp = new Date().getTime();
        const filePath = `certificates/${userId}/${timestamp}_${file.name}`;
        
        // Upload file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (storageError) {
          console.error('Storage error:', storageError);
          throw new Error(`Failed to upload ${file.name}: ${storageError.message}`);
        }
        
        // Get the public URL for the uploaded file
        const { data: urlData } = await supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        if (!urlData || !urlData.publicUrl) {
          throw new Error(`Failed to get public URL for ${file.name}`);
        }
        
        // Insert certificate record in the database
        const { data, error } = await supabase
          .from('certificates')
          .insert([
            { 
              id: userId,
              certificate: urlData.publicUrl,
              activity_point: 10, // Default points value
              status: 'Pending',
              uploaded_at: new Date().toISOString()
            }
          ])
          .select();
        
        if (error) {
          console.error('Database insert error:', error);
          throw new Error(`Failed to save ${file.name} record: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
          throw new Error(`No data returned after inserting record for ${file.name}`);
        }
        
        // Add to our list of uploaded certificates
        uploadedCertificates.push({
          id: data[0].certificate_id,
          name: file.name,
          date: new Date().toISOString().split('T')[0],
          status: data[0].status || "Pending",
          points: data[0].activity_point
        });
      }
      
      // Complete progress
      clearInterval(interval);
      setProgressIntervalId(null);
      setUploadProgress(100);
      
      setTimeout(() => {
        // Update state with new certificates
        setUploadedFiles(prev => [...prev, ...uploadedCertificates]);
        setUploadProgress(0);
        setSelectedFiles([]);
        setShowUploadModal(false);
        
        // Show success message
        setShowUploadSuccess(true);
        setTimeout(() => setShowUploadSuccess(false), 5000);
        
        // Refresh data
        fetchActivityData();
        fetchUploadedFiles();
      }, 1000);
      
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Failed to upload files. Please try again.');
      setUploadProgress(0);
      
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressIntervalId(null);
      }
    }
  };
  
  // Remove a file from the selected files list
  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Handle view certificate
  const handleViewCertificate = async (certificate) => {
    try {
      const certificateId = typeof certificate === 'object' ? certificate.id : certificate;
      
      // Fetch the certificate URL from Supabase
      const { data, error } = await supabase
        .from('certificates')
        .select('certificate')
        .eq('certificate_id', certificateId)
        .single();
      
      if (error) throw error;
      
      if (data && data.certificate) {
        // Open the certificate URL in a new tab
        window.open(data.certificate, '_blank');
      } else {
        throw new Error('Certificate URL not found');
      }
    } catch (err) {
      console.error('Error viewing certificate:', err);
      setError('Failed to load certificate. Please try again later.');
    }
  };
  
  // Clear error message
  const clearError = () => {
    setError(null);
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
            <Link to="/activity" className="nav-item active">
              <Activity className="menu-icon" color="#FF5722" />
              Activity
            </Link>
            <Link to="/scholarship" className="nav-item">
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
          {/* Dashboard Header Section*/}
          <div className="dashboard-header">
            <h1>Activity Points</h1>
          </div>
          
          {/* Main Content */}
          <main className="main-content">
            {error && (
              <div className="error-message">
                <X size={18} color="#F44336" />
                <span>{error}</span>
                <button 
                  className="dismiss-error"
                  onClick={clearError}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
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
                  <button 
                    className="upload-btn" 
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload size={18} />
                    Upload Certificates
                  </button>
                  
                  {/* Uploaded Files Section */}
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
                              <th>Points</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadedFiles.map(file => (
                              <tr key={file.id} className={`status-${file.status?.toLowerCase()}`}>
                                <td>
                                  <div className="file-info">
                                    <FileText size={16} />
                                    <span>{file.name}</span>
                                  </div>
                                </td>
                                <td>{file.date}</td>
                                <td>
                                  <span className={`status-badge status-${file.status?.toLowerCase()}`}>
                                    {file.status || "Pending"}
                                  </span>
                                </td>
                                <td>{file.points}</td>
                                <td>
                                  <button 
                                    className="view-cert-btn"
                                    onClick={() => handleViewCertificate(file)}
                                  >
                                    <FileText size={16} />
                                    View
                                  </button>
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
                    {activityData.length > 0 ? (
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
                                <button 
                                  className="view-cert-btn"
                                  onClick={() => handleViewCertificate(item)}
                                >
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
                    ) : (
                      <div className="no-data-message">
                        <p>No verified activities yet. Upload certificates to earn activity points.</p>
                      </div>
                    )}
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
                  accept=".pdf,.jpg,.jpeg,.png" 
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="certificate-upload" className="file-label">
                  <Upload size={20} />
                  Select Files
                </label>
                <p className="file-types">Supported: PDF, JPG, PNG (max 5MB each)</p>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>Selected Files:</h4>
                  <ul className="file-list">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="file-item">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
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
                disabled={selectedFiles.length === 0 || uploadProgress > 0}
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