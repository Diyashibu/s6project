import React, { useState } from "react";
import { Box, Button, TextField, Typography, Card, CardContent, Radio, RadioGroup, FormControlLabel } from "@mui/material";

const LoginPage = () => {
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    department: "",
    position: "",
    password: "",
    dob: "",
    class: "",
    activityPoints: "",
  });

  const handleUserTypeChange = (event) => {
    setUserType(event.target.value);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = () => {
    console.log("Logging in as", userType, formData);
    alert(`Logging in as ${userType} - Name: ${formData.name}`);
  };

  return (
    <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Login Page
      </Typography>
      <Card sx={{ width: 400, p: 3 }}>
        <CardContent>
          {!userType ? (
            <>
              <Typography variant="h6" gutterBottom>
                Select User Type
              </Typography>
              <RadioGroup row value={userType} onChange={handleUserTypeChange}>
                <FormControlLabel value="teacher" control={<Radio />} label="Teacher" />
                <FormControlLabel value="student" control={<Radio />} label="Student" />
              </RadioGroup>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                {userType === "teacher" ? "Teacher Login" : "Student Login"}
              </Typography>
              
              {/* Common Fields */}
              <TextField fullWidth margin="normal" label="ID" name="id" value={formData.id} onChange={handleInputChange} />
              <TextField fullWidth margin="normal" label="Name" name="name" value={formData.name} onChange={handleInputChange} />
              <TextField fullWidth margin="normal" type="date" label="Date of Birth" name="dob" InputLabelProps={{ shrink: true }} value={formData.dob} onChange={handleInputChange} />
              <TextField fullWidth margin="normal" type="password" label="Password" name="password" value={formData.password} onChange={handleInputChange} />

              {/* Teacher-Specific Fields */}
              {userType === "teacher" ? (
                <>
                  <TextField fullWidth margin="normal" label="Department" name="department" value={formData.department} onChange={handleInputChange} />
                  <TextField fullWidth margin="normal" label="Position" name="position" value={formData.position} onChange={handleInputChange} />
                </>
              ) : (
                /* Student-Specific Fields */
                <>
                  <TextField fullWidth margin="normal" label="Class" name="class" value={formData.class} onChange={handleInputChange} />
                  <TextField fullWidth margin="normal" label="Activity Points" name="activityPoints" value={formData.activityPoints} onChange={handleInputChange} />
                </>
              )}

              <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleLogin}>
                Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
