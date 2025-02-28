import React, { useState } from "react";
import StudentModal from "./StudentModal";
import { Table, TableHead, TableRow, TableCell, TableBody, Badge, Dialog, DialogTitle, DialogContent, Button, Tabs, Tab } from "@mui/material";

export default function TeacherDashboard() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  

const [students, setStudents] = useState([
  {
    id: 1,
    ktuid: "K001",
    name: "John Doe",
    certificates: [
      { name: "Math Olympiad", points: 30, verified: false, img: "/assets/certificates/cert1.png" },
      { name: "Science Fair", points: 50, verified: true, img: "/assets/certificates/cert1.png" },
    ],
    scholarships: [
      { name: "Merit Scholarship", status: "Approved", details: "Scholarship for top 5% students" },
      { name: "Sports Scholarship", status: "Pending", details: "For students excelling in sports" },
    ],
    newApplications: 1,
  },
  {
    id: 2,
    ktuid: "K002",
    name: "Jane Smith",
    certificates: [
      { name: "Hackathon", points: 40, verified: false, img: "/assets/certificates/cert1.png" },
    ],
    scholarships: [
      { name: "Women in Tech", status: "Rejected", details: "For women excelling in technology" },
    ],
    newApplications: 0,
  },
]);

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

      {/* Tabs for switching between Activity Points & Scholarships */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
        <Tab label="Activity Points" />
        <Tab label="Scholarships" />
      </Tabs>

      {/* Activity Points Tab */}
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
            .filter(cert => cert.verified) 
            .reduce((sum, cert) => sum + cert.points, 0);
          
            return (
              <TableRow
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                style={{ cursor: "pointer" }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{student.ktuid}</TableCell>
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
                <TableCell>{student.ktuid}</TableCell>
                <TableCell style={{ color: "blue", textDecoration: "underline" }}>{student.name}</TableCell>
                <TableCell>
                  {student.newApplications > 0 ? <Badge color="error" badgeContent={student.newApplications} /> : "No New Applications"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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

      {/* Scholarship Details Modal */}
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
