import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Button,
  Divider,
  Alert
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function StudentScholarshipModal({ open, onClose, student }) {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScholarshipApplications = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch scholarship applications for the student
        const { data: applications, error: applicationsError } = await supabase
          .from("scholarship_applications")
          .select("*, scholarship_id")
          .eq("student_id", student.id);
          
        if (applicationsError) throw applicationsError;
        
        if (applications && applications.length > 0) {
          // Get the scholarship details for each application
          const scholarshipIds = applications.map(app => app.scholarship_id);
          
          const { data: scholarshipsData, error: scholarshipsError } = await supabase
            .from("scholarships")
            .select("*")
            .in("id", scholarshipIds);
            
          if (scholarshipsError) throw scholarshipsError;
          
          // Combine application data with scholarship details
          const combinedData = applications.map(app => {
            const scholarship = scholarshipsData.find(s => s.id === app.scholarship_id);
            return {
              ...app,
              scholarship_details: scholarship || {}
            };
          });
          
          setScholarships(combinedData);
        } else {
          setScholarships([]);
        }
      } catch (err) {
        console.error("Error fetching scholarship applications:", err);
        setError("Failed to load scholarship applications. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    if (open && student) {
      fetchScholarshipApplications();
    }
  }, [open, student]);

  // Function to update application status
  const updateApplicationStatus = async (applicationId, newStatus) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("scholarship_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);
        
      if (error) throw error;
      
      // Update local state
      setScholarships(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
    } catch (err) {
      console.error("Error updating application status:", err);
      setError("Failed to update application status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" component="div" fontWeight="bold">
          Scholarship Applications
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            {student.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            KTU ID: {student.formattedId || `KTU${String(student.id).padStart(4, '0')}`}
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : scholarships.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            This student has not applied for any scholarships yet.
          </Alert>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                <TableRow>
                  <TableCell>Scholarship Name</TableCell>
                  <TableCell>Applied Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scholarships.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>{application.scholarship_name || application.scholarship_details.name || "N/A"}</TableCell>
                    <TableCell>{formatDate(application.applied_date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={application.status || "pending"} 
                        color={getStatusColor(application.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {application.status === "pending" && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            onClick={() => updateApplicationStatus(application.id, "approved")}
                            disabled={loading}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => updateApplicationStatus(application.id, "rejected")}
                            disabled={loading}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}