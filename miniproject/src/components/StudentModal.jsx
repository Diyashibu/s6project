import React from "react";
import { Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField } from "@mui/material";

const StudentModal = ({ open, onClose, student, updateCertificatePoints, toggleVerification }) => {
  if (!student) return null;
  console.log(student.action);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{student.name}'s Certificates</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sl No</TableCell>
              <TableCell>Certificate</TableCell>
              <TableCell>Activity Points</TableCell>
              <TableCell>Certificate Image</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {student.certificates.map((cert, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{cert.name}</TableCell>

                {/* Editable Input Field for Points (Disabled if Verified) */}
                <TableCell>
                  <TextField
                    type="number"
                    value={cert.points}
                    onChange={(e) => updateCertificatePoints(student.id, index, Number(e.target.value))}
                    inputProps={{ min: 0 }}
                    variant="outlined"
                    size="small"
                    disabled={cert.verified}
                    style={{
                      color: cert.verified ? "black" : "inherit",
                      fontWeight: cert.verified ? "bold" : "normal",
                    }}
                  />
                </TableCell>

                {/* Click to View Certificate */}
                <TableCell>
                  <img
                    src={cert.img}
                    alt={cert.name}
                    width="100"
                    height="50"
                    style={{ borderRadius: "5px", cursor: "pointer" }}
                    onClick={() => window.open(cert.img, "_blank")}
                  />
                </TableCell>

                {/* Verify Button - Turns Green When Verified */}
                <TableCell>
                  <Button
                    variant="contained"
                    style={{
                      backgroundColor: cert.verified ? "green" : "red",
                      color: "white",
                    }}
                    onClick={() => toggleVerification(student.id, index)}
                  >
                    {cert.verified ? "VERIFIED" : "VERIFY"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>

      <Button onClick={onClose} style={{ margin: "10px" }} variant="contained" color="secondary">
        CLOSE
      </Button>
    </Dialog>
  );
};

export default StudentModal;
