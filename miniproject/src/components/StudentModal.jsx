import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, CircularProgress } from "@mui/material";
import { supabase } from "../supabase";

const StudentModal = ({ open, onClose, student, updateCertificatePoints, toggleVerification }) => {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);

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
        .select('certificate_id, id, certificate, activity_point')
        .eq('id', student.id);
      
      if (error) {
        console.error("Error fetching certificates:", error);
        return;
      }
      
      // Map the certificates data to the format expected by the component
      const formattedCertificates = data.map((cert, index) => ({
        id: cert.certificate_id,
        name: cert.certificate || `Certificate ${index + 1}`,
        points: cert.activity_point || 0,
        img: cert.certificate || '#', // If certificate contains a URL, use it
        verified: cert.verified || false, // Add a verified field if it exists in your table
      }));
      
      setCertificates(formattedCertificates);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoints = async (studentId, certificateIndex, newPoints) => {
    const certificateId = certificates[certificateIndex].id;
    
    // First update local state for immediate UI feedback
    const updatedCertificates = [...certificates];
    updatedCertificates[certificateIndex].points = newPoints;
    setCertificates(updatedCertificates);
    
    // Then update in Supabase
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ activity_point: newPoints })
        .eq('certificate_id', certificateId)
        .eq('id', studentId);
        
      if (error) {
        console.error("Error updating points:", error);
        // Revert the local change if update failed
        fetchCertificates();
      }
      
      // Call the parent component's update function if provided
      if (updateCertificatePoints) {
        updateCertificatePoints(studentId, certificateIndex, newPoints);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const handleToggleVerification = async (studentId, certificateIndex) => {
    const certificateId = certificates[certificateIndex].id;
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
        .eq('certificate_id', certificateId)
        .eq('id', studentId);
        
      if (error) {
        console.error("Error updating verification status:", error);
        // Revert the local change if update failed
        fetchCertificates();
      }
      
      // Call the parent component's function if provided
      if (toggleVerification) {
        toggleVerification(studentId, certificateIndex);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
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
                <TableCell>Certificate</TableCell>
                <TableCell>Activity Points</TableCell>
                <TableCell>Certificate Image</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.map((cert, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{cert.name}</TableCell>

                  {/* Editable Input Field for Points (Disabled if Verified) */}
                  <TableCell>
                    <TextField
                      type="number"
                      value={cert.points}
                      onChange={(e) => handleUpdatePoints(student.id, index, Number(e.target.value))}
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

                  {/* Click to View Certificate */}
                  <TableCell>
                    <img
                      src={cert.img}
                      alt={cert.name}
                      width="100"
                      height="50"
                      style={{ borderRadius: "5px", cursor: "pointer" }}
                      onClick={() => window.open(cert.img, "_blank")}
                    />
                  </TableCell>

                  {/* Verify Button - Turns Green When Verified */}
                  <TableCell>
                    <Button
                      variant="contained"
                      style={{
                        backgroundColor: cert.verified ? "green" : "red",
                        color: "white",
                      }}
                      onClick={() => handleToggleVerification(student.id, index)}
                    >
                      {cert.verified ? "VERIFIED" : "VERIFY"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>

      <Button onClick={onClose} style={{ margin: "10px" }} variant="contained" color="secondary">
        CLOSE
      </Button>
    </Dialog>
  );
};

export default StudentModal;






























/*import React from "react";
import { Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField } from "@mui/material";

const StudentModal = ({ open, onClose, student, updateCertificatePoints, toggleVerification }) => {
  if (!student) return null;
  console.log(student.action);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{student.name}'s Certificates</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sl No</TableCell>
              <TableCell>Certificate</TableCell>
              <TableCell>Activity Points</TableCell>
              <TableCell>Certificate Image</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {student.certificates.map((cert, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{cert.name}</TableCell>

               
                <TableCell>
                  <TextField
                    type="number"
                    value={cert.points}
                    onChange={(e) => updateCertificatePoints(student.id, index, Number(e.target.value))}
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

             
                <TableCell>
                  <img
                    src={cert.img}
                    alt={cert.name}
                    width="100"
                    height="50"
                    style={{ borderRadius: "5px", cursor: "pointer" }}
                    onClick={() => window.open(cert.img, "_blank")}
                  />
                </TableCell>

                
                <TableCell>
                  <Button
                    variant="contained"
                    style={{
                      backgroundColor: cert.verified ? "green" : "red",
                      color: "white",
                    }}
                    onClick={() => toggleVerification(student.id, index)}
                  >
                    {cert.verified ? "VERIFIED" : "VERIFY"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>

      <Button onClick={onClose} style={{ margin: "10px" }} variant="contained" color="secondary">
        CLOSE
      </Button>
    </Dialog>
  );
};

export default StudentModal;*/
