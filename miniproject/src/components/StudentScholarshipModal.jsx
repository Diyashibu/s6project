import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  Chip,
  CircularProgress,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Divider
} from "@mui/material";
// Add missing imports at the top if you're not using them above
import { Grid, TextField } from "@mui/material";
import { Check, Close, InfoOutlined, FileDownload } from "@mui/icons-material";

const StudentScholarshipModal = ({ open, onClose, student }) => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchScholarships = async () => {
      setLoading(true);
      try {
        // Fetch scholarship applications for this student
        const { data, error } = await supabase
          .from("scholarship_applications")
          .select(`
            id,
            scholarship_id,
            scholarship_name,
            status,
            applied_date,
            teacher_notes,
            rejection_reason,
            scholarship:scholarships (*)
          `)
          .eq("student_id", student.id);

        if (error) {
          console.error("Error fetching scholarships:", error.message);
        } else {
          console.log("Fetched scholarships:", data);
          setScholarships(data || []);
        }
      } catch (err) {
        console.error("Exception fetching scholarships:", err);
      } finally {
        setLoading(false);
      }
    };

    if (open && student) {
      fetchScholarships();
    }
  }, [open, student]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from("scholarship_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      // Update local state
      setScholarships(scholarships.map(s => 
        s.id === applicationId ? { ...s, status: newStatus } : s
      ));

      // Update the selection if we're viewing this scholarship
      if (selectedScholarship && selectedScholarship.id === applicationId) {
        setSelectedScholarship(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Error updating scholarship status:", err);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleSaveNotes = async (applicationId, notes) => {
    try {
      const { error } = await supabase
        .from("scholarship_applications")
        .update({ teacher_notes: notes })
        .eq("id", applicationId);

      if (error) throw error;

      // Update local state
      setScholarships(scholarships.map(s => 
        s.id === applicationId ? { ...s, teacher_notes: notes } : s
      ));
      
      // Close detail view
      setSelectedScholarship(null);
    } catch (err) {
      console.error("Error saving notes:", err);
      alert("Failed to save notes. Please try again.");
    }
  };

  const getStatusChip = (status) => {
    let color = "default";
    
    switch (status) {
      case "pending":
        color = "warning";
        break;
      case "approved":
        color = "success";
        break;
      case "rejected":
        color = "error";
        break;
      default:
        color = "default";
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        fullWidth 
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #eee', 
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            {student?.name}'s Scholarship Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            KTU ID: {student?.formattedId || `KTU${String(student?.id).padStart(4, '0')}`}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : scholarships.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No scholarship applications found for this student.
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                <TableRow>
                  <TableCell>Scholarship</TableCell>
                  <TableCell>Applied On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scholarships.map((scholarship) => (
                  <TableRow 
                    key={scholarship.id} 
                    sx={{ 
                      cursor: "pointer",
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                      bgcolor: selectedScholarship?.id === scholarship.id ? 'rgba(0, 0, 0, 0.08)' : 'inherit'
                    }}
                  >
                    <TableCell 
                      onClick={() => setSelectedScholarship(scholarship)} 
                      sx={{ color: 'primary.main', fontWeight: 'medium' }}
                    >
                      {scholarship.scholarship_name}
                    </TableCell>
                    <TableCell onClick={() => setSelectedScholarship(scholarship)}>
                      {formatDate(scholarship.applied_date)}
                    </TableCell>
                    <TableCell onClick={() => setSelectedScholarship(scholarship)}>
                      {getStatusChip(scholarship.status)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {scholarship.status === "pending" && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleStatusChange(scholarship.id, "approved")}
                              >
                                <Check fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleStatusChange(scholarship.id, "rejected")}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => setSelectedScholarship(scholarship)}
                          >
                            <InfoOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              onClick={onClose} 
              variant="contained" 
              color="primary"
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Scholarship Details Dialog */}
      {selectedScholarship && (
        <Dialog 
          open={!!selectedScholarship} 
          onClose={() => setSelectedScholarship(null)} 
          fullWidth 
          maxWidth="md"
        >
          <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
            <Typography variant="h6">
              {selectedScholarship.scholarship_name} Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Application ID: {selectedScholarship.id}
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {getStatusChip(selectedScholarship.status)}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Applied On</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatDate(selectedScholarship.applied_date)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Provider</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedScholarship.scholarship?.provider || "N/A"}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedScholarship.scholarship?.amount || "N/A"}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Scholarship Details</Typography>
            <Typography variant="body2" paragraph>
              {selectedScholarship.scholarship?.description || "No description available"}
            </Typography>
            
            <Typography variant="subtitle2" color="text.secondary">Eligibility Criteria</Typography>
            <Typography variant="body2" paragraph>
              {selectedScholarship.scholarship?.eligibility || "No eligibility information available"}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Application Assessment</Typography>
            <TextField
              label="Teacher Notes"
              multiline
              rows={4}
              defaultValue={selectedScholarship.teacher_notes || ""}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              placeholder="Add your assessment notes here..."
              id="teacher-notes"
            />
            
            {selectedScholarship.status === "pending" && (
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  startIcon={<Check />}
                  onClick={() => handleStatusChange(selectedScholarship.id, "approved")}
                >
                  Approve Application
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  startIcon={<Close />}
                  onClick={() => handleStatusChange(selectedScholarship.id, "rejected")}
                >
                  Reject Application
                </Button>
              </Box>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="outlined"
                onClick={() => setSelectedScholarship(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleSaveNotes(
                  selectedScholarship.id, 
                  document.getElementById('teacher-notes').value
                )}
              >
                Save Notes
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default StudentScholarshipModal;

