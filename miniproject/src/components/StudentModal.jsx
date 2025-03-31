import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../supabase";

const StudentModal = ({ open, onClose, student }) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    if (student && open) {
      setStudentData(student);
      fetchCertificates(student.id);
    }
  }, [student, open]);

  // Fetch all certificates for the student
  const fetchCertificates = async (studentId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", studentId);

      if (error) {
        console.error("Error fetching certificates:", error);
        return;
      }

      const formattedCertificates = data.map((cert) => ({
        id: cert.id,
        points: cert.activity_point || 0,
        img: typeof cert.certificate === "string" ? cert.certificate : "",
        verified: cert.verified || false,
      }));

      setCertificates(formattedCertificates);

      // Update total activity points after fetching certificates
      await updateTotalActivityPoints(studentId);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update total activity points for the student
  const updateTotalActivityPoints = async (studentId) => {
    try {
      // Fetch all certificates for the student
      const { data: certificates, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", studentId);
  
      if (error) {
        console.error("Error fetching certificates:", error);
        return;
      }
  
      // Log all certificates for debugging
      console.log(`Certificates for student ${studentId}:`, certificates);
  
      // Calculate total points (only from verified certificates)
      const totalPoints = certificates
        .filter(cert => cert.verified)
        .reduce((sum, cert) => sum + (cert.activity_point || 0), 0);
  
      console.log(`Total verified points for ${studentId}: ${totalPoints}`);
  
      // Update total points in students table
      const { error: updateError } = await supabase
        .from("student")
        .update({ total_activity_point: totalPoints })
        .eq("id", studentId);
  
      if (updateError) {
        console.error("Error updating total activity points:", updateError);
      }
    } catch (err) {
      console.error("Unexpected error in updateTotalActivityPoints:", err);
    }
  };
  // Update certificate points
  const handleUpdatePoints = async (certificateId, newPoints) => {
    try {
      const { error } = await supabase
        .from("certificates")
        .update({ activity_point: newPoints })
        .eq("id", certificateId)
        .eq("student_id", studentData.id);

      if (error) {
        console.error("Error updating points:", error);
        return;
      }

      setCertificates((prev) =>
        prev.map((cert) => (cert.id === certificateId ? { ...cert, points: newPoints } : cert))
      );

      // Update total points after modifying activity points
      await updateTotalActivityPoints(studentData.id);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // Toggle certificate verification
  const handleToggleVerification = async (certificateId) => {
    const cert = certificates.find((cert) => cert.id === certificateId);
    if (!cert || cert.verified === !cert.verified) return; // Avoid redundant updates
  
    try {
      const { error } = await supabase
        .from("certificates")
        .update({ verified: !cert.verified })
        .eq("id", certificateId)
        .eq("student_id", studentData.id);
  
      if (!error) {
        setCertificates((prev) =>
          prev.map((c) => (c.id === certificateId ? { ...c, verified: !c.verified } : c))
        );
        await updateTotalActivityPoints(studentData.id);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };
  
  if (!studentData) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{studentData.name}'s Certificates</DialogTitle>
      <DialogContent>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
            <CircularProgress />
          </div>
        ) : certificates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px" }}>No certificates found.</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sl No</TableCell>
                <TableCell>Activity Points</TableCell>
                <TableCell>Certificate Image</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.map((cert, index) => (
                <TableRow key={cert.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={cert.points}
                      onChange={(e) => handleUpdatePoints(cert.id, Number(e.target.value))}
                      inputProps={{ min: 0 }}
                      variant="outlined"
                      size="small"
                      disabled={cert.verified}
                    />
                  </TableCell>
                  <TableCell>
                    {cert.img ? (
                      <img
                        src={cert.img}
                        alt="Certificate"
                        width="100"
                        height="70"
                        style={{ borderRadius: "5px", cursor: "pointer", objectFit: "cover" }}
                        onClick={() => setExpandedImage(cert.img)}
                      />
                    ) : (
                      <span>No Image</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      style={{
                        backgroundColor: cert.verified ? "green" : "red",
                        color: "white",
                      }}
                      onClick={() => handleToggleVerification(cert.id)}
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
          <Dialog open={Boolean(expandedImage)} onClose={() => setExpandedImage(null)} maxWidth="md">
            <DialogContent style={{ padding: 0 }}>
              <img
                src={expandedImage}
                alt="Certificate"
                style={{ width: "100%", maxHeight: "80vh", objectFit: "contain" }}
              />
            </DialogContent>
            <Button onClick={() => setExpandedImage(null)} color="primary">
              Close
            </Button>
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
