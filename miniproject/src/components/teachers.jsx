import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import StudentModal from "./StudentModal";
import { 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Badge, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Button, 
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { LibraryBooks, EmojiEvents } from "@mui/icons-material";

export default function TeacherDashboard() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [students, setStudents] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("student")
        .select("id, name, total_activity_point");
  
      if (error) {
        console.error("Error fetching students:", error.message);
      } else {
        console.log("Fetched students:", data);
        setStudents(data);
      }
    };
    fetchStudents();
  }, []);

  // Function to toggle verification status
  const toggleVerification = (studentId, certIndex) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.id === studentId) {
          return {
            ...student,
            certificates: student.certificates.map((cert, index) =>
              index === certIndex ? { ...cert, verified: !cert.verified } : cert
            ),
          };
        }
        return student;
      })
    );
  
    // Ensure the modal gets the updated student object
    setSelectedStudent((prevStudent) => {
      if (!prevStudent) return null;
      if (prevStudent.id === studentId) {
        return {
          ...prevStudent,
          certificates: prevStudent.certificates.map((cert, index) =>
            index === certIndex ? { ...cert, verified: !cert.verified } : cert
          ),
        };
      }
      return prevStudent;
    });
  };

  // Function to update points only if not verified
  const updateCertificatePoints = (studentId, certIndex, newPoints) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.id === studentId) {
          return {
            ...student,
            certificates: student.certificates.map((cert, index) =>
              index === certIndex && !cert.verified ? { ...cert, points: newPoints } : cert
            ),
          };
        }
        return student;
      })
    );
  
    // Ensure the modal updates the selected student's points
    setSelectedStudent((prevStudent) => {
      if (!prevStudent) return null;
      if (prevStudent.id === studentId) {
        return {
          ...prevStudent,
          certificates: prevStudent.certificates.map((cert, index) =>
            index === certIndex && !cert.verified ? { ...cert, points: newPoints } : cert
          ),
        };
      }
      return prevStudent;
    });
  };

  const handleStudentClick = (student) => {
    if (activeTab === 1) {
      setSelectedStudent(student);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, newApplications: 0 } : s))
      );
    } else {
      setSelectedStudent(student);
    }
  };

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
          Teacher Dashboard
        </Typography>
      </Box>

      {/* Dashboard Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card 
            elevation={activeTab === 0 ? 4 : 1}
            onClick={() => handleTabChange(0)}
            sx={{ 
              cursor: 'pointer', 
              transition: 'all 0.3s',
              transform: activeTab === 0 ? 'scale(1.02)' : 'scale(1)',
              border: activeTab === 0 ? `1px solid ${theme.palette.primary.main}` : 'none',
              height: '100%'
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: '#f0f0f0', color: '#333', mr: 2 }}>
                <EmojiEvents />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Activity Points
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track student engagement
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card 
            elevation={activeTab === 1 ? 4 : 1}
            onClick={() => handleTabChange(1)}
            sx={{ 
              cursor: 'pointer', 
              transition: 'all 0.3s',
              transform: activeTab === 1 ? 'scale(1.02)' : 'scale(1)',
              border: activeTab === 1 ? `1px solid ${theme.palette.primary.main}` : 'none',
              height: '100%'
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: '#f0f0f0', color: '#333', mr: 2 }}>
                <LibraryBooks />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Scholarships
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage applications
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Student List
          </Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f9f9f9' }}>
              <TableRow>
                <TableCell>SL NO</TableCell>
                <TableCell>KTU ID</TableCell>
                <TableCell>NAME</TableCell>
                {activeTab === 0 ? (
                  <TableCell>TOTAL ACTIVITY POINTS</TableCell>
                ) : (
                  <TableCell>NEW APPLICATIONS</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, index) => {
                const totalPoints = student.certificates 
                  ? student.certificates.filter(cert => cert.verified).reduce((sum, cert) => sum + cert.points, 0)
                  : student.total_activity_point || 0;
                
                return (
                  <TableRow key={student.id} onClick={() => handleStudentClick(student)} 
                    sx={{ 
                      cursor: "pointer",
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{student.id}</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                      {student.name}
                    </TableCell>
                    {activeTab === 0 ? (
                      <TableCell>{totalPoints}</TableCell>
                    ) : (
                      <TableCell>
                        {student.newApplications > 0 ? 
                          <Badge color="error" badgeContent={student.newApplications} /> : 
                          "No New Applications"}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Student Activity Points Modal */}
      {activeTab === 0 && selectedStudent && (
        <StudentModal
          open={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          student={selectedStudent}
          updateCertificatePoints={updateCertificatePoints}
          toggleVerification={toggleVerification}
        />
      )}

      {/* Student Scholarships Modal */}
      {selectedStudent && activeTab === 1 && (
        <Dialog 
          open={!!selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
          fullWidth 
          maxWidth="md"
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
            {selectedStudent.name}'s Scholarships
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                <TableRow>
                  <TableCell>Scholarship</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedStudent.scholarships || []).map((scholarship, index) => (
                  <TableRow 
                    key={index} 
                    onClick={() => setSelectedScholarship(scholarship)} 
                    sx={{ 
                      cursor: "pointer",
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <TableCell>{scholarship.name}</TableCell>
                    <TableCell>{scholarship.status}</TableCell>
                  </TableRow>
                ))}
                {(!selectedStudent.scholarships || selectedStudent.scholarships.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">No scholarships found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => setSelectedStudent(null)} 
                variant="contained" 
                color="primary"
              >
                Close
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Scholarship Details Modal */}
      {selectedScholarship && (
        <Dialog 
          open={!!selectedScholarship} 
          onClose={() => setSelectedScholarship(null)} 
          fullWidth 
          maxWidth="md"
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
            {selectedScholarship.name} Details
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body1" paragraph>
              <strong>Status:</strong> {selectedScholarship.status}
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Details:</strong> {selectedScholarship.details}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                onClick={() => setSelectedScholarship(null)} 
                variant="contained" 
                color="primary"
              >
                Close
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Container>
  );
}

/*import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import StudentModal from "./StudentModal";
import { Table, TableHead, TableRow, TableCell, TableBody, Badge, Dialog, DialogTitle, DialogContent, Button, Tabs, Tab } from "@mui/material";

export default function TeacherDashboard() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  

  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("student")
        .select("id, name, total_activity_point");
  
      if (error) {
        console.error("Error fetching students:", error.message);
      } else {
        console.log("Fetched students:", data);
        setStudents(data);
      }
    };
    fetchStudents();
  }, []);
  
  

  // Function to toggle verification status
  const toggleVerification = (studentId, certIndex) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.id === studentId) {
          return {
            ...student,
            certificates: student.certificates.map((cert, index) =>
              index === certIndex ? { ...cert, verified: !cert.verified } : cert
            ),
          };
        }
        return student;
      })
    );
  
    // Ensure the modal gets the updated student object
    setSelectedStudent((prevStudent) => {
      if (!prevStudent) return null;
      if (prevStudent.id === studentId) {
        return {
          ...prevStudent,
          certificates: prevStudent.certificates.map((cert, index) =>
            index === certIndex ? { ...cert, verified: !cert.verified } : cert
          ),
        };
      }
      return prevStudent;
    });
  };
  
  

  // Function to update points only if not verified
  const updateCertificatePoints = (studentId, certIndex, newPoints) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.id === studentId) {
          return {
            ...student,
            certificates: student.certificates.map((cert, index) =>
              index === certIndex && !cert.verified ? { ...cert, points: newPoints } : cert
            ),
          };
        }
        return student;
      })
    );
  
    // Ensure the modal updates the selected student's points
    setSelectedStudent((prevStudent) => {
      if (!prevStudent) return null;
      if (prevStudent.id === studentId) {
        return {
          ...prevStudent,
          certificates: prevStudent.certificates.map((cert, index) =>
            index === certIndex && !cert.verified ? { ...cert, points: newPoints } : cert
          ),
        };
      }
      return prevStudent;
    });
  };
  

  const handleStudentClick = (student) => {
    if (activeTab === 1) {
      setSelectedStudent(student);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, newApplications: 0 } : s))
      );
    }
  };
  
    
 
 
  return (
    <div style={{ padding: "20px" }}>
      <h2>Teacher Dashboard</h2>


      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
        <Tab label="Activity Points" />
        <Tab label="Scholarships" />
      </Tabs>

      {activeTab === 0 ? (
         <Table>
        <TableHead>
          <TableRow>
            <TableCell>Sl No</TableCell>
            <TableCell>KTU ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Total Activity Points</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student, index) => {
            const totalPoints = student.certificates 
            ? student.certificates.filter(cert => cert.verified).reduce((sum, cert) => sum + cert.points, 0)
            : 0;
          
          
            return (
              <TableRow key={student.id} onClick={() => setSelectedStudent(student)} style={{ cursor: "pointer" }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{student.id}</TableCell>
                <TableCell style={{ color: "blue", textDecoration: "underline" }}>
                  {student.name}
                </TableCell>
                <TableCell>{totalPoints}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

     
      
      ) : (
        // Scholarships Tab
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sl No</TableCell>
              <TableCell>KTU ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>New Applications</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student, index) => (
              <TableRow key={student.id} onClick={() => handleStudentClick(student)} style={{ cursor: "pointer" }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{student.id}</TableCell>
                <TableCell style={{ color: "blue", textDecoration: "underline" }}>{student.name}</TableCell>
                <TableCell>
                  {student.newApplications > 0 ? <Badge color="error" badgeContent={student.newApplications} /> : "No New Applications"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}


      {activeTab === 0 && selectedStudent && (
  <StudentModal
    open={!!selectedStudent}
    onClose={() => setSelectedStudent(null)}
    student={selectedStudent}
    updateCertificatePoints={updateCertificatePoints}
    toggleVerification={toggleVerification}
  />
)}


      {selectedStudent && activeTab === 1 && (
        <Dialog open={!!selectedStudent} onClose={() => setSelectedStudent(null)} fullWidth maxWidth="md">
          <DialogTitle>{selectedStudent.name}'s Scholarships</DialogTitle>
          <DialogContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Scholarship</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedStudent.scholarships.map((scholarship, index) => (
                  <TableRow key={index} onClick={() => setSelectedScholarship(scholarship)} style={{ cursor: "pointer" }}>
                    <TableCell>{scholarship.name}</TableCell>
                    <TableCell>{scholarship.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <Button onClick={() => setSelectedStudent(null)} variant="contained" color="secondary" style={{ margin: "10px" }}>
            CLOSE
          </Button>
        </Dialog>
      )}

      {selectedScholarship && (
        <Dialog open={!!selectedScholarship} onClose={() => setSelectedScholarship(null)} fullWidth maxWidth="md">
          <DialogTitle>{selectedScholarship.name} Details</DialogTitle>
          <DialogContent>
            <p><strong>Status:</strong> {selectedScholarship.status}</p>
            <p><strong>Details:</strong> {selectedScholarship.details}</p>
          </DialogContent>
          <Button onClick={() => setSelectedScholarship(null)} variant="contained" color="secondary" style={{ margin: "10px" }}>
            CLOSE
          </Button>
        </Dialog>
      )}
    </div>
  );
}
*/