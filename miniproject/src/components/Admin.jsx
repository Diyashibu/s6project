import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {Card,CardContent,Button,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Paper,Typography,Stack,
  Dialog,DialogActions,DialogContent,DialogTitle,TextField,MenuItem,Box,Grid,InputAdornment,IconButton,Tabs,Tab,Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import AddIcon from "@mui/icons-material/Add";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

const departmentOrder = [
  "Computer Science",
  "Electronics",
  "Electrical and Electronics",
  "Biomedical",
  "Applied Science",
  "Mechanical",
];

const classFolders = ["CSA", "CSB", "CSC", "CSBS", "ECA", "ECB", "EEE", "EB", "MECH"];

const AdminDashboard = () => {
  const [teacher, setTeachers] = useState([]);
  const [student, setStudents] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [openTeacherModal, setOpenTeacherModal] = useState(false);
  const [openStudentModal, setOpenStudentModal] = useState(false);
  const [openScholarshipModal, setOpenScholarshipModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", dept: "", position: "", password: "", dob: "", id: "" });
  const [newStudent, setNewStudent] = useState({ id: "", name: "", password: "", total_activity_point: "", class: "", dob: "" });
  const [newScholarship, setNewScholarship] = useState({ 
    name: "", 
    provider: "", 
    amount: "", 
    deadline: "", 
    eligibility: "", 
    description: "" 
  });
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ id: "", password: "", confirmPassword: "", type: "" });
  const [openRemoveModal, setOpenRemoveModal] = useState(false);
  const [removeData, setRemoveData] = useState({ id: "", type: "" });
  const [tabValue, setTabValue] = useState(0);
  
  const departments = [
    "Computer Science", "Electronics", "Electrical and Electronics", "Biomedical", "Applied Science", "Mechanical"
  ];
  
  const classes = ["CSA", "CSB", "CSC", "CSBS", "ECA", "ECB", "EEE", "EB", "MECH"];
  
  useEffect(() => {
    fetchTeachers();
    fetchStudents();
    fetchScholarships();
  }, []);

  useEffect(() => {
    setFilteredStudents(selectedClass ? student.filter((s) => s.class === selectedClass) : []);
  }, [selectedClass, student]);

  const fetchTeachers = async () => {
    const { data, error } = await supabase.from("teacher").select("id, name, dept, position");

    if (error) {
      console.error("Error fetching teachers:", error);
    } else {
      data.sort((a, b) => departmentOrder.indexOf(a.dept) - departmentOrder.indexOf(b.dept));
      setTeachers(data);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase.from("student").select("id, name, class, total_activity_point");

    if (error) {
      console.error("Error fetching students:", error);
    } else {
      setStudents(data);
    }
  };

  const fetchScholarships = async () => {
    const { data, error } = await supabase.from("scholarships").select("*");

    if (error) {
      console.error("Error fetching scholarships:", error);
    } else {
      setScholarships(data || []);
    }
  };

  const handleResetPassword = async () => {
    if (passwordData.password !== passwordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    const table = passwordData.type === "teacher" ? "teacher" : "student";
    const { error } = await supabase.from(table).update({ password: passwordData.password }).eq("id", passwordData.id);
    if (!error) {
      alert("Password updated successfully!");
      setOpenPasswordModal(false);
    }
  };

  const handleRemove = async () => {
    const table = removeData.type === "teacher" ? "teacher" : removeData.type === "student" ? "student" : "scholarships";
    const { error } = await supabase.from(table).delete().eq("id", removeData.id);
    if (!error) {
      alert("Removed successfully!");
      if (removeData.type === "teacher") {
        fetchTeachers();
      } else if (removeData.type === "student") {
        fetchStudents();
      } else {
        fetchScholarships();
      }
      setOpenRemoveModal(false);
    }
  };
  
  const toggleTeacherSelection = (teacher) => {
    setSelectedTeachers((prevSelected) =>
      prevSelected.some((t) => t.id === teacher.id)
        ? prevSelected.filter((t) => t.id !== teacher.id)
        : [...prevSelected, teacher]
    );
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudents((prevSelected) =>
      prevSelected.some((s) => s.id === student.id)
        ? prevSelected.filter((s) => s.id !== student.id)
        : [...prevSelected, student]
    );
  };

  const printSelectedItems = () => {
    console.log("Selected Teachers:", selectedTeachers);
    console.log("Selected Students:", selectedStudents);
  };

  const handleAddTeacher = async () => {
    const { error } = await supabase.from("teacher").insert([newTeacher]);
    if (error) console.error("Error adding teacher:", error);
    else fetchTeachers();
    setOpenTeacherModal(false);
  };

  const handleAddStudent = async () => {
    const { error } = await supabase.from("student").insert([newStudent]);
    if (error) console.error("Error adding student:", error);
    else fetchStudents();
    setOpenStudentModal(false);
  };

  const handleAddScholarship = async () => {
    const scholarshipToAdd = {
      ...newScholarship,
      id: Date.now(), // Generate a simple unique ID
      applied: false  // Default state for new scholarships
    };
    
    const { error } = await supabase.from("scholarships").insert([scholarshipToAdd]);
    if (error) {
      console.error("Error adding scholarship:", error);
      alert("Error adding scholarship. Please try again.");
    } else {
      // Create notification for all students about new scholarship
      const notification = {
        id: Date.now(),
        type: "scholarship",
        title: `New Scholarship Available: ${newScholarship.name}`,
        message: `A new scholarship from ${newScholarship.provider} worth ${newScholarship.amount} is now available. Deadline: ${newScholarship.deadline}`,
        created_at: new Date().toISOString(),
        read: false
      };
      
      const { error: notifError } = await supabase.from("notifications").insert([notification]);
      if (notifError) {
        console.error("Error creating notification:", notifError);
      }
      
      fetchScholarships();
      alert("Scholarship added successfully!");
      setOpenScholarshipModal(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ height: "100vh",  padding: "24px", maxWidth: "1800px", margin: "0 auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage your institution's teachers, students, and scholarships.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ padding: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Total Teachers</Typography>
                <PersonIcon />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {teacher.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active faculty members
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ padding: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Total Students</Typography>
                <SchoolIcon />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {student.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enrolled students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ padding: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Departments</Typography>
                <BusinessIcon />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {departments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Academic departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ padding: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Scholarships</Typography>
                <MonetizationOnIcon />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {scholarships.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available scholarships
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 100,
              padding: '12px 16px',
            },
            '& .Mui-selected': {
              color: '#000'
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            }
          }}
        >
          <Tab 
            label="Teachers" 
            sx={{ 
              borderTopLeftRadius: 8, 
              borderTopRightRadius: 8,
              border: tabValue === 0 ? '1px solid #e0e0e0' : 'none',
              borderBottom: tabValue === 0 ? 'none' : 'auto',
              backgroundColor: tabValue === 0 ? '#fff' : 'transparent',
              color: tabValue === 0 ? '#000' : '#777',
            }} 
          />
          <Tab 
            label="Students" 
            sx={{ 
              borderTopLeftRadius: 8, 
              borderTopRightRadius: 8,
              border: tabValue === 1 ? '1px solid #e0e0e0' : 'none',
              borderBottom: tabValue === 1 ? 'none' : 'auto',
              backgroundColor: tabValue === 1 ? '#fff' : 'transparent',
              color: tabValue === 1 ? '#000' : '#777',
            }} 
          />
          <Tab 
            label="Scholarships" 
            sx={{ 
              borderTopLeftRadius: 8, 
              borderTopRightRadius: 8,
              border: tabValue === 2 ? '1px solid #e0e0e0' : 'none',
              borderBottom: tabValue === 2 ? 'none' : 'auto',
              backgroundColor: tabValue === 2 ? '#fff' : 'transparent',
              color: tabValue === 2 ? '#000' : '#777',
            }} 
          />
        </Tabs>
      </Box>

      {/* Content based on selected tab */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Teacher Management
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setOpenTeacherModal(true)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                py: 1,
                px: 2
              }}
            >
              Add Teacher
            </Button>
          </Box>
          
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teacher
                  .sort((a, b) => {
                    if (a.dept < b.dept) return -1;
                    if (a.dept > b.dept) return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.id}</TableCell>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={t.dept} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#f0f7ff',
                            color: '#0066cc',
                            fontWeight: 500
                          }} 
                        />
                      </TableCell>
                      <TableCell>{t.position}</TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          variant="contained" 
                          sx={{ 
                            mr: 1, 
                            backgroundColor: '#333', 
                            '&:hover': { backgroundColor: '#555' },
                            textTransform: 'none'
                          }}
                          onClick={() => setPasswordData({ id: t.id, type: "teacher", password: "", confirmPassword: "" }) || setOpenPasswordModal(true)}
                        >
                          Reset Password
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="error"
                          sx={{ textTransform: 'none' }}
                          onClick={() => setRemoveData({ id: t.id, type: "teacher" }) || setOpenRemoveModal(true)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 0.3 }}>
            <Typography variant="h5" fontWeight="bold">
              Student Management
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setOpenStudentModal(true)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                py: 1,
                px: 2
              }}
            >
              Add Student
            </Button>
          </Box>

          <Typography>Select Class:</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 3 }}>
            {classFolders.map((cls) => (
              <Button 
                key={cls} 
                variant={selectedClass === cls ? "contained" : "outlined"} 
                onClick={() => setSelectedClass(cls)}
                sx={{ 
                  backgroundColor: selectedClass === cls ? '#f5f5f5' : 'white', 
                  color: 'black',
                  border: '1px solid #ccc',
                  boxShadow: selectedClass === cls ? '0 3px 5px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                {cls}
              </Button>
            ))}
          </Stack>

          {selectedClass && (
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Activity Points</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((s) => (
                      <TableRow 
                        key={s.id} 
                        onClick={() => toggleStudentSelection(s)}
                        style={{ cursor: "pointer", backgroundColor: selectedStudents.some((st) => st.id === s.id) ? "#d3e3fc" : "inherit" }}>
                        <TableCell>{s.id}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.total_activity_point}</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => setPasswordData({ id: s.id, type: "student", password: "", confirmPassword: "" }) || setOpenPasswordModal(true)}>
                            Reset Password
                          </Button>
                          <Button size="small" color="error" onClick={() => setRemoveData({ id: s.id, type: "student" }) || setOpenRemoveModal(true)}>
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Scholarship Management
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setOpenScholarshipModal(true)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                py: 1,
                px: 2
              }}
            >
              Add Scholarship
            </Button>
          </Box>
          
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Eligibility</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scholarships.map((scholarship) => (
                  <TableRow key={scholarship.id}>
                    <TableCell>{scholarship.name}</TableCell>
                    <TableCell>{scholarship.provider}</TableCell>
                    <TableCell>{scholarship.amount}</TableCell>
                    <TableCell>{scholarship.deadline}</TableCell>
                    <TableCell>{scholarship.eligibility}</TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="error"
                        sx={{ textTransform: 'none' }}
                        onClick={() => setRemoveData({ id: scholarship.id, type: "scholarship" }) || setOpenRemoveModal(true)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Modals */}
      <Dialog open={openTeacherModal} onClose={() => setOpenTeacherModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Teacher</DialogTitle>
        <DialogContent>
          <TextField label="ID" fullWidth margin="dense" onChange={(e) => setNewTeacher({ ...newTeacher, id: e.target.value })} />
          <TextField label="Name" fullWidth margin="dense" onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })} />
          <TextField 
            label="Department" 
            select 
            fullWidth 
            margin="dense" 
            onChange={(e) => setNewTeacher({ ...newTeacher, dept: e.target.value })}
          >
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
            ))}
          </TextField>
          <TextField label="Position" fullWidth margin="dense" onChange={(e) => setNewTeacher({ ...newTeacher, position: e.target.value })} />
          <TextField label="Password" type="password" fullWidth margin="dense" onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })} />
          <TextField 
            label="Date of Birth" 
            type="date" 
            fullWidth 
            margin="dense" 
            InputLabelProps={{ shrink: true }} 
            onChange={(e) => setNewTeacher({ ...newTeacher, dob: e.target.value })} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTeacherModal(false)}>Cancel</Button>
          <Button onClick={handleAddTeacher} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStudentModal} onClose={() => setOpenStudentModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Student</DialogTitle>
        <DialogContent>
          <TextField label="ID" fullWidth margin="dense" onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })} />
          <TextField label="Name" fullWidth margin="dense" onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
          <TextField 
            label="Class" 
            select 
            fullWidth 
            margin="dense" 
            onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
          >
            {classes.map((cls) => (
              <MenuItem key={cls} value={cls}>{cls}</MenuItem>
            ))}
          </TextField>
          <TextField label="Password" type="password" fullWidth margin="dense" onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} />
          <TextField label="Total Activity Points" fullWidth margin="dense" onChange={(e) => setNewStudent({ ...newStudent, total_activity_point: e.target.value })} />
          <TextField 
            label="Date of Birth" 
            type="date" 
            fullWidth 
            margin="dense" 
            InputLabelProps={{ shrink: true }} 
            onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStudentModal(false)}>Cancel</Button>
          <Button onClick={handleAddStudent} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Scholarship Modal */}
      <Dialog open={openScholarshipModal} onClose={() => setOpenScholarshipModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Scholarship</DialogTitle>
        <DialogContent>
          <TextField 
            label="Scholarship Name" 
            fullWidth 
            margin="dense" 
            onChange={(e) => setNewScholarship({ ...newScholarship, name: e.target.value })} 
          />
          <TextField 
            label="Provider" 
            fullWidth 
            margin="dense" 
            onChange={(e) => setNewScholarship({ ...newScholarship, provider: e.target.value })} 
          />
          <TextField 
            label="Amount" 
            fullWidth 
            margin="dense" 
            onChange={(e) => setNewScholarship({ ...newScholarship, amount: e.target.value })} 
          />
          <TextField 
            label="Deadline" 
            type="date" 
            fullWidth 
            margin="dense" 
            InputLabelProps={{ shrink: true }} 
            onChange={(e) => {
              // Format date for display (e.g., "March 30, 2025")
              const date = new Date(e.target.value);
              const formattedDate = date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              });
              setNewScholarship({ ...newScholarship, deadline: formattedDate });
            }} 
          />
          <TextField 
            label="Eligibility" 
            fullWidth 
            margin="dense" 
            onChange={(e) => setNewScholarship({ ...newScholarship, eligibility: e.target.value })} 
          />
          <TextField 
            label="Description" 
            fullWidth 
            margin="dense" 
            multiline
            rows={3}
            onChange={(e) => setNewScholarship({ ...newScholarship, description: e.target.value })} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScholarshipModal(false)}>Cancel</Button>
          <Button onClick={handleAddScholarship} variant="contained">Add Scholarship</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPasswordModal} onClose={() => setOpenPasswordModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField 
            label="New Password" 
            type="password" 
            fullWidth 
            margin="dense" 
            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })} 
          />
          <TextField 
            label="Confirm Password" 
            type="password" 
            fullWidth 
            margin="dense" 
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordModal(false)}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRemoveModal} onClose={() => setOpenRemoveModal(false)}>
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this {removeData.type}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRemoveModal(false)}>Cancel</Button>
          <Button onClick={handleRemove} color="error" variant="contained">Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;