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
  Modal,
  Box,
  TextField,
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
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    position: "",
    class: "",
    activityPoints: "",
  });

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
    const { data, error } = await supabase
  .from("teacher")
  .select("id,name, dept, position");


    if (error) {
      console.error("Error fetching students:", error);
    } else {
      setStudents(data);
    }
  };

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

  const handleAdd = async () => {
    const table = modalType === "teacher" ? "teacher" : "student";
    const { error } = await supabase.from(table).insert([formData]);
    if (error) {
      console.error("Error adding data:", error);
    } else {
      if (modalType === "teacher") fetchTeachers();
      else fetchStudents();
      handleCloseModal();
    }
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
                {teacher.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.id}</TableCell>
                    <TableCell>{teacher.name}</TableCell>
                    <TableCell>{teacher.department}</TableCell>
                    <TableCell>{teacher.position}</TableCell>
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
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.activityPoints}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
