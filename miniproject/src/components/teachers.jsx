import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import StudentModal from "./StudentModal";
import StudentScholarshipModal from "./StudentScholarshipModal";
import { 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Badge, 
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
  useTheme,
  CircularProgress,
  TextField,
  Alert,
  Tooltip
} from "@mui/material";
import { LibraryBooks, EmojiEvents, School, FileDownload } from "@mui/icons-material";
import * as XLSX from 'xlsx';

export default function TeacherDashboard() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Store all students
  const [loading, setLoading] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isScholarshipModalOpen, setIsScholarshipModalOpen] = useState(false);
  const [isScholarshipModalClose, setIsScholarshipModalClose] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Class filtering state
  const [classUniqueId, setClassUniqueId] = useState("");
  const [currentClass, setCurrentClass] = useState(null);
  const [classError, setClassError] = useState("");
  const [showClassPrompt, setShowClassPrompt] = useState(true);
  
  const fetchUnverifiedCertificates = async (studentsList) => {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("student_id")
        .is("verified", false);
  
      if (error) throw error;
  
      const unverifiedCounts = data.reduce((acc, cert) => {
        acc[cert.student_id] = (acc[cert.student_id] || 0) + 1;
        return acc;
      }, {});
  
      const updatedStudents = studentsList.map(student => ({
        ...student,
        unverifiedCertificates: unverifiedCounts[student.id] || 0
      }));
  
      return updatedStudents;
    } catch (err) {
      console.error("Error fetching unverified certificates:", err);
      return studentsList;
    }
  };
  
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("student")
          .select("*");
        if (error) {
          console.error("Error fetching students:", error.message);
        } else {
          console.log("Fetched students:", data);
          
          // Process the data to format student IDs correctly
          const processedData = data.map(student => ({
            ...student,
            // Format the ID as KTU ID pattern (e.g., KTU1234)
            formattedId: student.ktu_id || `${String(student.id).padStart(4, '0')}`,
            unverifiedCertificates: 0
          }));
          
          // Store all students but don't set as current students yet
          setAllStudents(processedData || []);
          
          // We'll set students based on class selection
          // Only fetch certificate data for all students initially
          const studentsWithCertificates = await fetchUnverifiedCertificates(processedData);
          setAllStudents(studentsWithCertificates);
        }
      } catch (err) {
        console.error("Exception fetching students:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, []);
  
  // Fetch scholarship applications count for each student
  useEffect(() => {
    const fetchScholarshipCounts = async () => {
      if (!students.length) return;
      
      try {
        // Get all scholarship applications
        const { data, error } = await supabase
          .from("scholarship_applications")
          .select("student_id, status");
          
        if (error) throw error;
        
        // Process scholarship data to count pending applications per student
        const applicationCounts = {};
        data.forEach(app => {
          if (app.status === "pending") {
            applicationCounts[app.student_id] = (applicationCounts[app.student_id] || 0) + 1;
          }
        });
        
        // Update students with application counts
        const updatedStudents = students.map(student => ({
          ...student,
          newApplications: applicationCounts[student.id] || 0
        }));
        
        setStudents(updatedStudents);
      } catch (err) {
        console.error("Error fetching scholarship applications:", err);
      }
    };
    
    if (currentClass && activeTab === 1) {
      fetchScholarshipCounts();
    }
  }, [currentClass, activeTab]);

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    if (activeTab === 0) {
      setIsActivityModalOpen(true);
    } else {
      setIsScholarshipModalOpen(true);
    }
  };

  const handleActivityModalClose = () => {
    setIsActivityModalOpen(false);
    setTimeout(() => {
      setSelectedStudent(null);
    }, 300);
  };

  const handleScholarshipModalClose = () => {
    setIsScholarshipModalClose(false);
    setTimeout(() => {
      setSelectedStudent(null);
    }, 300);
  };
  //  const handleFileUpload = (event) => {
  //   const uploadedFile = event.target.files[0];
  //   setFile(uploadedFile);

  //   const reader = new FileReader();
  //   reader.onload = async (e) => {
  //     const binaryStr = e.target.result;
  //     const workbook = XLSX.read(binaryStr, { type: 'binary' });
  //     const sheetName = workbook.SheetNames[0];
  //     const sheet = workbook.Sheets[sheetName];
  //     const data = XLSX.utils.sheet_to_json(sheet);

  //     // Insert data into Supabase
  //     const { error } = await supabase.from('student').insert(data);
  //     if (error) {
  //       console.error("Error uploading file:", error);
  //     } else {
  //       fetchStudents(); // Refresh list after upload
  //       onClose();
  //     }
  //   };
  //   reader.readAsBinaryString(uploadedFile);
  // };

  // Class verification function
  const verifyClassId = async () => {
    setLoading(true);
    setClassError("");
  
    try {
      // Verify class ID
      const { data, error } = await supabase
        .from("class_identifiers")
        .select("*")
        .eq("unique_id", classUniqueId)
        .single();
  
      if (error || !data) {
        setClassError("Invalid class ID. Please try again.");
        setLoading(false);
        return;
      }
  
      console.log("Verified class:", data);
  
      // Set current class
      setCurrentClass(data);
  
      console.log("All students before filtering:", allStudents);
  
      // Filter students by class
      const filteredStudents = allStudents.filter(
        (student) => student.class === data.class_name
      );
  
      console.log("Filtered Students:", filteredStudents);
      
      // We need to update this to make sure we only show students from the current class
      setStudents(filteredStudents);
      setShowClassPrompt(false);
    } catch (err) {
      console.error("Error verifying class ID:", err);
      setClassError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Reset class function
  const resetClass = () => {
    setCurrentClass(null);
    setStudents([]);
    setClassUniqueId("");
    setShowClassPrompt(true);
  };

  // Generate Excel report function
  const generateExcelReport = async () => {
    if (!currentClass || students.length === 0) return;
    
    setGeneratingReport(true);
    
    try {
        let reportData;
        let fileName;

        if (activeTab === 0) {
            // Create a mapping of student IDs to their certificate types
            const studentCertificatesMap = {};

            students.forEach(student => {
                studentCertificatesMap[student.id] = student.certificates 
                    ? student.certificates.map(cert => cert.Type).join(', ') 
                    : 'N/A';
            });

            // Generate report data for Activity Points
            reportData = students.map((student, index) => ({
                'SL No': index + 1,
                'KTU ID': student.formattedId || `KTU${String(student.id).padStart(4, '0')}`,
                'Name': student.name,
                'Total Activity Points': student.total_activity_point || 0,
                'Pending Certificates': student.unverifiedCertificates || 0,
                'Type': studentCertificatesMap[student.id] || 'N/A',  // Fetch type based on student_id
                'Email': student.email || '',
                'Phone': student.phone || ''
            }));

            fileName = `${currentClass.class_name}_ActivityPoints_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else {
            // Generate report data for Scholarships
            reportData = students.map((student, index) => ({
                'SL No': index + 1,
                'KTU ID': student.formattedId || `KTU${String(student.id).padStart(4, '0')}`,
                'Name': student.name,
                'Pending Applications': student.newApplications || 0,
                'Email': student.email || '',
                'Phone': student.phone || ''
            }));

            fileName = `${currentClass.class_name}_Scholarships_${new Date().toISOString().split('T')[0]}.xlsx`;
        }
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(reportData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, currentClass.class_name);
        
        // Save the workbook
        XLSX.writeFile(wb, fileName);
    } catch (err) {
        console.error("Error generating Excel report:", err);
        alert("Failed to generate report. Please try again.");
    } finally {
        setGeneratingReport(false);
    }
};



  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
          Teacher Dashboard
        </Typography>
        {currentClass && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <School sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary.main">
              Class: {currentClass.class_name}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={resetClass}
              sx={{ ml: 2 }}
            >
              Change Class
            </Button>
          </Box>
        )}
      </Box>

      {/* Class ID Prompt */}
      {showClassPrompt && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Enter Class ID
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please enter the unique ID for the class you want to view.
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <TextField
              label="Class Unique ID"
              value={classUniqueId}
              onChange={(e) => setClassUniqueId(e.target.value)}
              variant="outlined"
              fullWidth
              placeholder="e.g. csa123"
              error={!!classError}
              helperText={classError}
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              onClick={verifyClassId}
              disabled={loading || !classUniqueId}
              sx={{ 
                bgcolor: 'black',
                '&:hover': { bgcolor: '#333' },
                height: '56px'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Submit"}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Dashboard Content - Only show when class is selected */}
      {currentClass && (
        <>
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
            <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold">
                {currentClass.class_name} Students
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {students.length} student{students.length !== 1 ? 's' : ''} found
                </Typography>
                <Tooltip title="Generate Excel Report">
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<FileDownload />}
                    onClick={generateExcelReport}
                    disabled={generatingReport || students.length === 0}
                    size="small"
                    sx={{ 
                      bgcolor: 'black',
                      '&:hover': { bgcolor: '#333' }
                    }}
                  >
                    {generatingReport ? <CircularProgress size={20} color="inherit" /> : "Generate Report"}
                  </Button>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : students.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No students found in this class. Please verify the class ID.
                  </Typography>
                </Box>
              ) : (
                <Table>
                  <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                    <TableRow>
                      <TableCell>SL NO</TableCell>
                      <TableCell>KTU ID</TableCell>
                      <TableCell>NAME</TableCell>
                      {activeTab === 0 ? (
                        <>
                          <TableCell>TOTAL ACTIVITY POINTS</TableCell>
                          <TableCell>CERTIFICATE STATUS</TableCell>
                        </>
                      ) : (
                        <TableCell>SCHOLARSHIP APPLICATIONS</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student, index) => (
                      <TableRow 
                        key={student.id} 
                        onClick={() => handleStudentClick(student)} 
                        sx={{ cursor: "pointer", '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{student.formattedId || `KTU${String(student.id).padStart(4, '0')}`}</TableCell>
                        <TableCell sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                          {student.name}
                        </TableCell>
                        
                        {activeTab === 0 ? (
                          <>
                            <TableCell>{student.total_activity_point || 0}</TableCell>
                            <TableCell>
                              {student.unverifiedCertificates > 0 ? (
                                <Badge 
                                  color="error" 
                                  badgeContent={student.unverifiedCertificates}
                                  sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                                >
                                  <Box component="span" sx={{ pr: 2 }}>Pending</Box>
                                </Badge>
                              ) : (
                                "All Verified"
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <TableCell>
                            {student.newApplications > 0 ? (
                              <Badge 
                                color="error" 
                                badgeContent={student.newApplications}
                                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                              >
                                <Box component="span" sx={{ pr: 2 }}>Pending</Box>
                              </Badge>
                            ) : (
                              "No Pending Applications"
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* Student Activity Points Modal */}
      {isActivityModalOpen && selectedStudent && (
        <StudentModal
          open={isActivityModalOpen}
          onClose={handleActivityModalClose}
          student={selectedStudent}
        />
      )}

      {/* Student Scholarship Applications Modal */}
      {isScholarshipModalOpen && selectedStudent && (
        <StudentScholarshipModal
          open={isScholarshipModalOpen}
          onClose={handleScholarshipModalClose}
          student={selectedStudent}
        />
      )}
    </Container>
  );
}