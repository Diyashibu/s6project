import { Link } from 'react-router-dom';
import React, { useRef, useState, useEffect } from 'react';
import { Bell, Search, Settings, User, MessageSquare, Activity, Award, LogOut, Home, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload, FileText, X, CheckCircle, Trash2 } from 'lucide-react';
import './Activity.css';
// import logo from '../assets/logo.png'
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
  const [certificateData, setCertificateData] = useState([]);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  // New state for delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Get verified certificates only
  const verifiedCertificates = certificateData.filter(item => item.status === "Verified");

  // Calculate total points and percentage based on verified certificates only
  const totalPointsRequired = 100;
  const earnedPoints = verifiedCertificates.reduce((sum, item) => sum + item.points, 0);
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
  const fetchCertificates = async (userId) => {
    try {
      // Fetch certificates from the certificates table
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', userId);
      
      if (error) {
        console.error("Error fetching certificates:", error);
        return;
      }
      
      if (data) {
        // Enhance certificate data with points and activities
        const enhancedData = data.map((cert) => ({
          id: cert.id || cert.certificate.split('/').pop(),
          name: cert.certificate.split('/').pop() || `Certificate`,
          date: new Date(cert.created_at || Date.now()).toISOString().split('T')[0],
          points: cert.activity_point || calculatePoints(cert.certificate),
          certificate: cert.certificate,
          status: cert.verified ? "Verified" : "Pending",
          storageKey: extractStorageKeyFromUrl(cert.certificate)
        }));
        
        setCertificateData(enhancedData);
        setUploadedFiles(enhancedData);
      }
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    }
  };

  // Extract storage key from the URL
  const extractStorageKeyFromUrl = (url) => {
    try {
      // Example URL: https://your-bucket.supabase.co/storage/v1/object/public/certuploads/1234567-filename.png
      const parts = url.split('/');
      return parts[parts.length - 1]; // Get the filename with timestamp
    } catch (error) {
      console.error("Failed to extract storage key:", error);
      return null;
    }
  };

  // Helper function to calculate points based on certificate type
  const calculatePoints = (certificatePath) => {
    // This is a placeholder logic - you should implement your own point calculation
    const fileName = certificatePath.toLowerCase();
    if (fileName.includes('ieee') || fileName.includes('conference')) return 15;
    if (fileName.includes('hackathon')) return 25;
    if (fileName.includes('community') || fileName.includes('service')) return 10;
    if (fileName.includes('workshop')) return 20;
    if (fileName.includes('research') || fileName.includes('paper')) return 30;
    return 10; // Default points
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; // Optional chaining to avoid undefined error
  
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

    if (error) {
      console.error("Upload failed:", error.message);
      return;
    }

    const { data: urlData } = supabase
      .storage
      .from('certuploads')
      .getPublicUrl(uniqueFileName);

    const fileUrl = urlData.publicUrl;

    // Insert into 'certificates' table
    const { error: insertError } = await supabase
      .from('certificates')
      .insert([{ 
        student_id: userId, 
        certificate: fileUrl,
        activity_point: calculatePoints(file.name)
      }]);
    
    if (insertError) {
      console.error("Failed to save certificate record:", insertError);
    } else {
      console.log("File uploaded successfully");
      setShowUploadSuccess(true);
      setTimeout(() => setShowUploadSuccess(false), 3000);
      
      // Refresh the certificates list
      fetchCertificates(userId);
    }
  };
  
  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Initiate delete process
  const initiateDelete = (file) => {
    setFileToDelete(file);
    setShowDeleteConfirmation(true);
  };

  // Handle file deletion
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      // Delete from Supabase storage if storageKey is available
      if (fileToDelete.storageKey) {
        const { error: storageError } = await supabase.storage
          .from('certuploads')
          .remove([fileToDelete.storageKey]);
        
        if (storageError) {
          console.error("Failed to delete file from storage:", storageError);
        }
      }

      // Delete the record from the certificates table
      const { error: dbError } = await supabase
        .from('certificates')
        .delete()
        .eq('id', fileToDelete.id);
      
      if (dbError) {
        console.error("Failed to delete certificate record:", dbError);
      } else {
        // Update local state to remove the deleted file
        setCertificateData(prevData => prevData.filter(cert => cert.id !== fileToDelete.id));
        setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== fileToDelete.id));
        setShowDeleteConfirmation(false);
        setFileToDelete(null);
      }
    } catch (error) {
      console.error("Error during file deletion:", error);
    }
  };

  const handleViewCertificate = (cert) => {
    setSelectedCertificate(cert);
    setShowCertificateModal(true);
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
          <div className="avatar">
            <img src="/assets/l2.png" alt="User Avatar" className="avatar-img" />
          </div>
            
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
                              <th>Actions</th>
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
                                <td>
                                  {file.status === "Pending" && (
                                    <button 
                                      className="delete-file-btn" 
                                      onClick={() => initiateDelete(file)}
                                      title="Delete file"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                  <button 
                                    className="view-file-btn" 
                                    onClick={() => handleViewCertificate(file)}
                                    title="View certificate"
                                  >
                                    <FileText size={16} />
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
              
              {/* Activity Points Table Section - UPDATED TO SHOW ONLY VERIFIED CERTIFICATES */}
              <div className="activity-table-section">
                <div className="table-card">
                  <h2 className="card-title">Activity Points Details (Verified Only)</h2>
                  <div className="table-container">
                    <table className="activity-table">
                      <thead>
                        <tr>
                          <th>Sl No.</th>
                          <th>Date</th>
                          <th>Points</th>
                          <th>Certificate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifiedCertificates.length > 0 ? (
                          verifiedCertificates.map((item, index) => (
                            <tr key={item.id}>
                              <td>{index + 1}</td>
                              <td>{new Date(item.date).toLocaleDateString()}</td>
                              <td>{item.points}</td>
                              <td>
                                <button 
                                  className="view-cert-btn"
                                  onClick={() => handleViewCertificate(item)}
                                >
                                  <div className="certificate-thumbnail">
                                    {item.certificate && (
                                      <img 
                                        src={item.certificate} 
                                        alt="Certificate thumbnail" 
                                        className="cert-thumbnail" 
                                        onError={(e) => {
                                          e.target.onError = null;
                                          e.target.src = "/placeholder-certificate.png";
                                        }}
                                      />
                                    )}
                                  </div>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="no-data-message">No verified certificates found</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2" className="total-label">Total Verified Points Earned:</td>
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

      {/* Certificate Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="modal-overlay">
          <div className="certificate-modal">
            <div className="modal-header">
              <h3>Certificate Preview</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowCertificateModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="certificate-preview">
              <div className="certificate-container">
                <img 
                  src={selectedCertificate.certificate} 
                  alt="Certificate" 
                  className="certificate-image"
                  onError={(e) => {
                    e.target.onError = null;
                    e.target.src = "/placeholder-certificate.png";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && fileToDelete && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setFileToDelete(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this certificate?</p>
              <div className="file-to-delete-info">
                <FileText size={18} />
                <span>{fileToDelete.name}</span>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setFileToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn" 
                onClick={handleDeleteFile}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPoints;