import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
} from "@mui/material";

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
  const [selectedClass, setSelectedClass] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [openTeacherModal, setOpenTeacherModal] = useState(false);
  const [openStudentModal, setOpenStudentModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", dept: "", position: "", password: "", dob: "", id: "" });
  const [newStudent, setNewStudent] = useState({ id: "", name: "", password: "", total_activity_point: "", class: "", dob: "" });
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ id: "", password: "", confirmPassword: "", type: "" });
  const [openRemoveModal, setOpenRemoveModal] = useState(false);
  const [removeData, setRemoveData] = useState({ id: "", type: "" });
  const departments = [
    "Computer Science", "Electronics", "Electrical and Electronics", "Biomedical", "Applied Science", "Mechanical"
  ];
  
  const classes = ["CSA", "CSB", "CSC", "CSBS", "ECA", "ECB", "EEE", "EB", "MECH"];
  useEffect(() => {
    fetchTeachers();
    fetchStudents();
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
    const table = removeData.type === "teacher" ? "teacher" : "student";
    const { error } = await supabase.from(table).delete().eq("id", removeData.id);
    if (!error) {
      alert("Removed successfully!");
      removeData.type === "teacher" ? fetchTeachers() : fetchStudents();
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

  // Handle selecting/deselecting students
  const toggleStudentSelection = (student) => {
    setSelectedStudents((prevSelected) =>
      prevSelected.some((s) => s.id === student.id)
        ? prevSelected.filter((s) => s.id !== student.id)
        : [...prevSelected, student]
    );
  };

  // Print selected items to console
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

  return (
    <div style={{ padding: "24px" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Teachers Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">Teachers</Typography>
            <Button variant="contained" onClick={() => setOpenTeacherModal(true)}>Add Teacher</Button>
          </Stack>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teacher.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.id}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.dept}</TableCell>
                    <TableCell>{t.position}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setPasswordData({ id: t.id, type: "teacher", password: "", confirmPassword: "" }) || setOpenPasswordModal(true)}>Reset Password</Button>
                      <Button size="small" color="error" onClick={() => setRemoveData({ id: t.id, type: "teacher" }) || setOpenRemoveModal(true)}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Students Section */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Students
            </Typography>
            <Button variant="contained" onClick={() => setOpenStudentModal(true)}>Add Student</Button>
          </Stack>

          <Typography>Select Class:</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 3 }}>
            {classFolders.map((cls) => (
              <Button key={cls} variant={selectedClass === cls ? "contained" : "outlined"} onClick={() => setSelectedClass(cls)}>
                {cls}
              </Button>
            ))}
          </Stack>

          {selectedClass && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Activity Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow
                      key={s.id}
                      onClick={() => toggleStudentSelection(s)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: selectedStudents.some((st) => st.id === s.id) ? "#d3e3fc" : "inherit",
                      }}
                    >
                      <TableCell>{s.id}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.total_activity_point}</TableCell>
                      <TableCell>
                      <Button size="small" onClick={() => setPasswordData({ id: s.id, type: "student", password: "", confirmPassword: "" }) || setOpenPasswordModal(true)}>Reset Password</Button>
                      <Button size="small" color="error" onClick={() => setRemoveData({ id: s.id, type: "student" }) || setOpenRemoveModal(true)}>Remove</Button>
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>


      <Dialog open={openTeacherModal} onClose={() => setOpenTeacherModal(false)}>
        <DialogTitle>Add Teacher</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth margin="dense" onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })} />
          <TextField label="Department" select fullWidth margin="dense" onChange={(e) => setNewTeacher({ ...newTeacher, dept: e.target.value })}>
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
            ))}
          </TextField>
          <TextField label="Position" fullWidth margin="dense" onChange={(e) => setNewTeacher({ ...newTeacher, position: e.target.value })} />
          <TextField label="Password" type="password" fullWidth margin="dense" onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })} />
          <TextField label="Date of Birth" type="date" fullWidth margin="dense" InputLabelProps={{ shrink: true }} onChange={(e) => setNewTeacher({ ...newTeacher, dob: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTeacherModal(false)}>Cancel</Button>
          <Button onClick={handleAddTeacher} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Student Modal */}
      <Dialog open={openStudentModal} onClose={() => setOpenStudentModal(false)}>
        <DialogTitle>Add Student</DialogTitle>
        <DialogContent>
          <TextField label="ID" fullWidth margin="dense" onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })} />
          <TextField label="Name" fullWidth margin="dense" onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
          <TextField label="Class" select fullWidth margin="dense" onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}>
            {classes.map((cls) => (
              <MenuItem key={cls} value={cls}>{cls}</MenuItem>
            ))}
          </TextField>
          <TextField label="Password" type="password" fullWidth margin="dense" onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} />
          <TextField label="Total Activity Points" fullWidth margin="dense" onChange={(e) => setNewStudent({ ...newStudent, total_activity_point: e.target.value })} />
          <TextField label="Date of Birth" type="date" fullWidth margin="dense" InputLabelProps={{ shrink: true }} onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStudentModal(false)}>Cancel</Button>
          <Button onClick={handleAddStudent} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPasswordModal} onClose={() => setOpenPasswordModal(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField label="New Password" type="password" fullWidth margin="dense" onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })} />
          <TextField label="Confirm Password" type="password" fullWidth margin="dense" onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordModal(false)}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Remove Confirmation Modal */}
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
    </div>
  );
};


export default AdminDashboard;
