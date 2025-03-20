import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, CircularProgress } from "@mui/material";
import { supabase } from "../supabase";

const StudentModal = ({ open, onClose, student, updateCertificatePoints, toggleVerification }) => {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    if (student && open) {
      fetchCertificates();
    }
  }, [student, open]);

  const fetchCertificates = async () => {
    if (!student) return;
    
    setLoading(true);
    try {
      // Query the certificates table to get certificates associated with this student
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', student.id);
      
      if (error) {
        console.error("Error fetching certificates:", error);
        return;
      }
      
      console.log("Raw certificate data:", data);
      
      // Map the certificates data to the format expected by the component
      const formattedCertificates = data.map((cert) => {
        // Extract certificate name from URL or use a default name
        let certName = 'Certificate';
        
        // Check what's in the certificate field
        console.log("Certificate field for ID", cert.id, ":", cert.certificate);
        
        if (cert.certificate) {
          // If it's a URL string, try to extract a name
          if (typeof cert.certificate === 'string') {
            try {
              // Try to extract a meaningful name from the URL
              const url = new URL(cert.certificate);
              const pathParts = url.pathname.split('/');
              certName = pathParts[pathParts.length - 1].replace(/\.[^/.]+$/, "") || 'Certificate';
            } catch (e) {
              // If URL parsing fails, use the raw value or a default
              certName = cert.certificate.split('/').pop().replace(/\.[^/.]+$/, "") || 'Certificate';
            }
          }
          // If it's an object (maybe it's from Supabase storage), get the name from the object
          else if (typeof cert.certificate === 'object' && cert.certificate !== null) {
            certName = cert.certificate.name || 'Certificate';
          }
        }
        
        // Get the image URL based on the certificate field type
        let imageUrl;
        
        if (typeof cert.certificate === 'string') {
          imageUrl = cert.certificate;
          
          // If this is a Supabase storage URL or path
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            try {
              // Try to get public URL from Supabase storage
              const { publicURL, error } = supabase
                .storage
                .from('certificates') // Replace with your bucket name
                .getPublicUrl(imageUrl);
                
              if (!error && publicURL) {
                imageUrl = publicURL;
              } else {
                console.error("Error getting public URL:", error);
              }
            } catch (e) {
              console.error("Error processing Supabase URL:", e);
            }
          }
        } else if (typeof cert.certificate === 'object' && cert.certificate !== null) {
          // If it's an object, it might be a Supabase storage object
          imageUrl = cert.certificate.url || '';
        }
        
        console.log("Processed image URL for certificate", cert.id, ":", imageUrl);
        
        return {
          id: cert.id,
          points: cert.activity_point || 0,
          img: imageUrl, // Processed image URL
          verified: cert.verified || false
        };
      });
      
      setCertificates(formattedCertificates);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoints = async (studentId, certificateId, newPoints) => {
    // First update local state for immediate UI feedback
    const updatedCertificates = certificates.map(cert => 
      cert.id === certificateId ? { ...cert, points: newPoints } : cert
    );
    setCertificates(updatedCertificates);
    
    // Then update in Supabase
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ activity_point: newPoints })
        .eq('id', certificateId)
        .eq('student_id', studentId);
        
      if (error) {
        console.error("Error updating points:", error);
        // Revert the local change if update failed
        fetchCertificates();
      }
      
      // Call the parent component's update function if provided
      if (updateCertificatePoints) {
        updateCertificatePoints(studentId, certificateId, newPoints);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const handleToggleVerification = async (studentId, certificateId) => {
    // Find the certificate in the local state
    const certificateIndex = certificates.findIndex(cert => cert.id === certificateId);
    if (certificateIndex === -1) return;
    
    const currentVerifiedStatus = certificates[certificateIndex].verified;
    
    // First update local state
    const updatedCertificates = [...certificates];
    updatedCertificates[certificateIndex].verified = !currentVerifiedStatus;
    setCertificates(updatedCertificates);
    
    // Then update in Supabase
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ verified: !currentVerifiedStatus })
        .eq('id', certificateId)
        .eq('student_id', studentId);
        
      if (error) {
        console.error("Error updating verification status:", error);
        // Revert the local change if update failed
        fetchCertificates();
      }
      
      // Call the parent component's function if provided
      if (toggleVerification) {
        toggleVerification(studentId, certificateId, !currentVerifiedStatus);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const handleImageClick = (imageUrl, certificateId) => {
    console.log("Viewing image:", imageUrl);
    setExpandedImage(imageUrl);
  };

  const handleCloseExpandedImage = () => {
    setExpandedImage(null);
  };

  // Function to check if a string is a valid URL
  const isValidUrl = (urlString) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Function to check if a string is a valid image URL or data URI
  const isValidImageUrl = (urlString) => {
    if (!urlString) return false;
    
    // Check if it's a data URI for an image
    if (urlString.startsWith('data:image/')) {
      return true;
    }
    
    // Check if it's a valid URL with an image extension
    if (isValidUrl(urlString)) {
      const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      const lowercaseUrl = urlString.toLowerCase();
      return extensions.some(ext => lowercaseUrl.includes(ext));
    }
    
    return false;
  };

  if (!student) return null;
  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{student.name}'s Certificates</DialogTitle>
      <DialogContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        ) : certificates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            No certificates found for this student.
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sl No</TableCell>
                {/*<TableCell>Certificate</TableCell>*/}
                <TableCell>Activity Points</TableCell>
                <TableCell>Certificate Image</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.map((cert, index) => (
                <TableRow key={cert.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{cert.name}</TableCell>

                  {/* Editable Input Field for Points (Disabled if Verified) */}
                  <TableCell>
                    <TextField
                      type="number"
                      value={cert.points}
                      onChange={(e) => handleUpdatePoints(student.id, cert.id, Number(e.target.value))}
                      inputProps={{ min: 0 }}
                      variant="outlined"
                      size="small"
                      disabled={cert.verified}
                      style={{
                        color: cert.verified ? "black" : "inherit",
                        fontWeight: cert.verified ? "bold" : "normal",
                      }}
                    />
                  </TableCell>

                  {/* Certificate Image with Improved Display Logic */}
                  <TableCell>
                    {cert.img && isValidImageUrl(cert.img) ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={cert.img}
                          alt={cert.name}
                          width="100"
                          height="70"
                          style={{ 
                            borderRadius: "5px", 
                            cursor: "pointer",
                            objectFit: "cover",
                            border: "1px solid #ddd"
                          }}
                          onClick={() => handleImageClick(cert.img, cert.id)}
                          onError={(e) => {
                            console.log("Image load failed for:", cert.img);
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/100x70?text=Image+Error";
                          }}
                        />
                        {/* Debug overlay - uncomment to show URL for debugging */}
                        {/* <div style={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          background: 'rgba(0,0,0,0.7)', 
                          color: 'white', 
                          width: '100%', 
                          fontSize: '8px', 
                          padding: '2px' 
                        }}>
                          {cert.img.substring(0, 20)}...
                        </div> */}
                      </div>
                    ) : (
                      <div>
                        <span>No valid image</span>
                        <Button 
                          size="small" 
                          style={{ marginLeft: '8px' }}
                          onClick={() => console.log("Certificate data:", cert)}
                        >
                          Debug
                        </Button>
                      </div>
                    )}
                  </TableCell>

                  {/* Verify Button - Turns Green When Verified */}
                  <TableCell>
                    <Button
                      variant="contained"
                      style={{
                        backgroundColor: cert.verified ? "green" : "red",
                        color: "white",
                      }}
                      onClick={() => handleToggleVerification(student.id, cert.id)}
                    >
                      {cert.verified ? "VERIFIED" : "VERIFY"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Expanded Image Dialog */}
        {expandedImage && (
          <Dialog open={Boolean(expandedImage)} onClose={handleCloseExpandedImage} maxWidth="md">
            <DialogContent style={{ padding: 0 }}>
              <img
                src={expandedImage}
                alt="Certificate"
                style={{ 
                  width: '100%', 
                  maxHeight: '80vh', 
                  objectFit: 'contain' 
                }}
                onError={(e) => {
                  console.log("Expanded image load failed");
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/600x400?text=Failed+to+load+image";
                }}
              />
            </DialogContent>
            <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleCloseExpandedImage} color="primary">
                Close
              </Button>
              <Button onClick={() => console.log("Image URL:", expandedImage)} color="secondary">
                Debug URL
              </Button>
            </div>
          </Dialog>
        )}
      </DialogContent>

      <Button onClick={onClose} style={{ margin: "10px" }} variant="contained" color="secondary">
        CLOSE
      </Button>
    </Dialog>
  );
};

export default StudentModal;