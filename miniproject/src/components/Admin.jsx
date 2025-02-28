import React, { useState, useEffect } from "react";
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
  Modal,
  Box,
  TextField
} from "@mui/material";

const mockTeachers = [
  { id: 1, name: "John Doe", department: "Computer Science", position: "Professor" },
  { id: 2, name: "Jane Smith", department: "Mathematics", position: "Assistant Professor" },
];

const mockStudents = [
  { id: 101, name: "Alice Johnson", class: "CSA", activityPoints: 85 },
  { id: 102, name: "Bob Williams", class: "CSB", activityPoints: 90 },
];

const AdminDashboard = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [teachers, setTeachers] = useState(mockTeachers);
  const [students, setStudents] = useState(mockStudents);
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [formData, setFormData] = useState({ name: "", department: "", position: "", class: "", activityPoints: "" });

  useEffect(() => {
    setFilteredStudents(selectedClass ? students.filter((s) => s.class === selectedClass) : []);
  }, [selectedClass, students]);

  const handleOpenModal = (type) => {
    setModalType(type);
    setOpenModal(true);
    setFormData({ name: "", department: "", position: "", class: "", activityPoints: "" });
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    if (modalType === "teacher") {
      setTeachers([...teachers, { id: teachers.length + 1, name: formData.name, department: formData.department, position: formData.position }]);
    } else {
      setStudents([...students, { id: students.length + 101, name: formData.name, class: formData.class, activityPoints: Number(formData.activityPoints) }]);
    }
    handleCloseModal();
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
            <Typography variant="h6" fontWeight="bold">
              Teachers
            </Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpenModal("teacher")}>
              Add Teacher
            </Button>
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
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.id}</TableCell>
                    <TableCell>{teacher.name}</TableCell>
                    <TableCell>{teacher.department}</TableCell>
                    <TableCell>{teacher.position}</TableCell>
                    <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button variant="contained" color="primary" onClick={() => alert(`Reset password for ${teacher.name}`)}
                              >
                                Reset Password
                              </Button>
                              <Button variant="outlined" color="error" onClick={() => alert('Remove ${teacher.name}')}>
                                Remove
                              </Button>
                            </Stack>
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
            <Button variant="contained" color="primary" onClick={() => handleOpenModal("student")}>
              Add Student
            </Button>
          </Stack>

          <Typography>Select Class:</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 3 }}>
            {[...new Set(students.map((s) => s.class))].map((cls) => (
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
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.activityPoints}</TableCell>
                      <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button variant="contained" color="primary" onClick={() => alert('Reset password for ${student.name}')}>
                                Reset Password
                              </Button>
                              <Button variant="outlined" color="error" onClick={() => alert('Remove ${student.name}')}>
                                Remove
                              </Button>
                            </Stack>
                          </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "background.paper", p: 4, boxShadow: 24, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Add {modalType === "teacher" ? "Teacher" : "Student"}
          </Typography>
          <TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleInputChange} sx={{ mb: 2 }} />
          {modalType === "teacher" ? (
            <>
              <TextField fullWidth label="Department" name="department" value={formData.department} onChange={handleInputChange} sx={{ mb: 2 }} />
              <TextField fullWidth label="Position" name="position" value={formData.position} onChange={handleInputChange} sx={{ mb: 2 }} />
            </>
          ) : (
            <>
              <TextField fullWidth label="Class" name="class" value={formData.class} onChange={handleInputChange} sx={{ mb: 2 }} />
              <TextField fullWidth label="Activity Points" name="activityPoints" value={formData.activityPoints} onChange={handleInputChange} sx={{ mb: 2 }} />
            </>
          )}
          <Button variant="contained" color="primary" onClick={handleAdd}>
            Add
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
