import React, { useState } from "react";
import { supabase } from "../supabase";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogContent,
  DialogActions,
  Paper,
  Container,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { School, Person } from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import bcrypt from 'bcryptjs';

const AuthPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStage, setResetStage] = useState("verify");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ 
    id: "", 
    name: "", 
    password: "", 
    dept: "", 
    position: "", 
    dob: "", 
    class: "", 
    total_activity_point: "",
    unique_id: "", // This will be used for teacher login only
    gender: "", // New field for gender
    income: "" // New field for annual income
  });
  const [resetData, setResetData] = useState({ id: "", dob: "", newPassword: "", confirmPassword: "" });

  const departments = ["Computer Science", "Electronics", "Electrical", "Biomedical", "Applied Science", "Mechanical"];
  const classes = ["CSA", "CSB", "CSC", "CSBS", "ECA", "ECB", "EEE", "EB", "MECH"];
  const genders = ["F", "M", "Other"]; // Options for gender dropdown

  const handleUserTypeChange = (event) => setUserType(event.target.value);
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleResetChange = (e) => setResetData({ ...resetData, [e.target.name]: e.target.value });
  
  // Verify if string is a bcrypt hash
  const isBcryptHash = (str) => {
    return typeof str === 'string' && str.startsWith('$2') && str.length >= 50;
  };

  // Flexible password verification that tries both direct comparison and bcrypt
  const verifyPassword = async (inputPassword, storedPassword) => {
    // First check if it's a direct match (plaintext passwords)
    if (inputPassword === storedPassword) {
      return true;
    }
    
    // Check if stored password looks like a bcrypt hash
    if (isBcryptHash(storedPassword)) {
      // Try to verify with bcrypt
      try {
        return await bcrypt.compare(inputPassword, storedPassword);
      } catch (err) {
        console.error("Error comparing passwords:", err);
        return false;
      }
    }
    
    return false; // No match found
  };
  
  const handleLogin = async () => {
    setLoading(true);
    const { id, password, unique_id } = formData;

    // Admin shortcut - just type "123" as unique_id to access admin page
    if (userType === "teacher" && unique_id === "123") {
      // Store admin information in localStorage
      localStorage.setItem('userId', 'MDLAD001');
      localStorage.setItem('userType', 'admin');
      
      alert("Admin login successful!");
      navigate("/Admin");
      setLoading(false);
      return;
    }

    // Teacher login with class identifier verification
    if (userType === "teacher") {
      if (!id || !password || !unique_id) {
        alert("Please enter KTU ID, password, and class unique ID.");
        setLoading(false);
        return;
      }

      // First, verify the teacher exists
      const { data: teacher, error: teacherError } = await supabase
        .from("teacher")
        .select("*")
        .eq("id", id.trim())
        .maybeSingle();

      if (teacherError || !teacher) {
        alert("Teacher ID not found.");
        setLoading(false);
        return;
      }
      
      const passwordMatch = await verifyPassword(password, teacher.password);
      if (!passwordMatch) {
        alert("Invalid password!");
        setLoading(false);
        return;
      }
      
      // Then verify the class unique_id
      const { data: classData, error: classError } = await supabase
        .from("class_identifiers")
        .select("*")
        .eq("unique_id", unique_id)
        .maybeSingle();

      if (classError || !classData) {
        alert("Invalid class unique ID.");
        setLoading(false);
        return;
      }

      // Store user information and redirect
      localStorage.setItem('userId', teacher.id);
      localStorage.setItem('userType', 'teacher');
      localStorage.setItem('classId', classData.id);
      
      alert("Login successful!");
      navigate("/teachers");
      setLoading(false);
      return;
    }

    // Student login - now using the same verification approach as teachers
    if (userType === "student") {
      if (!id || !password) {
        alert("Please enter both KTU ID and password.");
        setLoading(false);
        return;
      }

      const { data: student, error } = await supabase
        .from("student")
        .select("*")
        .eq("id", id.trim())
        .maybeSingle();

      if (error) {
        console.error("Database error:", error);
        alert("Error accessing database. Please try again later.");
        setLoading(false);
        return;
      }
      
      if (!student) {
        alert("Student not found. Please check your ID.");
        setLoading(false);
        return;
      }

      const passwordMatch = await verifyPassword(password, student.password);
      if (passwordMatch) {
        localStorage.setItem('userId', student.id);
        localStorage.setItem('userType', 'student');
        
        alert("Login successful!");
        navigate("/dashboard");
      } else {
        alert("Invalid password!");
      }
    }

    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { id, name, password, dob, dept, position, class: studentClass, total_activity_point, gender, income } = formData;
    
    if (!id || !name || !password || !dob) {
      alert("Please fill all required fields.");
      setLoading(false);
      return;
    }

    // For student signup, make sure gender is selected
    if (userType === "student" && !gender) {
      alert("Please select your gender.");
      setLoading(false);
      return;
    }

    // Prevent signup with the reserved admin ID
    if (id === "MDLAD001") {
      alert("This ID is reserved. Please use a different ID.");
      setLoading(false);
      return;
    }

    const table = userType === "teacher" ? "teacher" : "student";
    const { data: existingUser } = await supabase.from(table).select("id").eq("id", id).maybeSingle();

    if (existingUser) {
      alert("User ID already exists. Please log in.");
      setLoading(false);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const entry = userType === "teacher"
      ? { id, name, dept, position, dob, password: hashedPassword }
      : { 
          id, 
          name, 
          class: studentClass, 
          total_activity_point, 
          dob, 
          password: hashedPassword, 
          gender, // Add gender to the student entry
          income: income ? parseFloat(income) : null // Add income to the student entry
        };

    const { error: insertError } = await supabase.from(table).insert([entry]);

    if (insertError) {
      alert(insertError.message);
    } else {
      alert("Account created successfully! Please log in.");
      setShowSignUp(false);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    const { id, dob } = resetData;
    if (!id || !dob) {
      alert("Please enter both KTU ID and Date of Birth.");
      setLoading(false);
      return;
    }

    // Special case for admin
    if (id === "MDLAD001") {
      alert("Please contact the system administrator to reset admin password.");
      setLoading(false);
      return;
    }

    const table = userType === "teacher" ? "teacher" : "student";
    const { data: user, error } = await supabase.from(table).select("dob").eq("id", id.trim()).maybeSingle();

    if (error || !user || user.dob !== dob) {
      alert("Incorrect ID or Date of Birth.");
      setLoading(false);
      return;
    }

    setResetStage("reset");
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setLoading(true);
    const { id, newPassword, confirmPassword } = resetData;
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      setLoading(false);
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const table = userType === "teacher" ? "teacher" : "student";
    const { error } = await supabase.from(table).update({ password: hashedPassword }).eq("id", id.trim());

    if (error) {
      alert("Error updating password.");
    } else {
      alert("Password reset successfully!");
      setShowForgotPassword(false);
      setResetStage("verify");
    }
    setLoading(false);
  };

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        py: 4
      }}
    >
      {!userType ? (
        // User Type Selection
        <Paper 
          elevation={1} 
          sx={{ 
            width: "100%", 
            borderRadius: 2,
            p: isMobile ? 3 : 5,
            border: "1px solid #eaeaea"
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Welcome
            </Typography>
            <Typography color="text.secondary">
              Please select your user type to continue
            </Typography>
          </Box>

          <RadioGroup
            value={userType}
            onChange={handleUserTypeChange}
            sx={{ mb: 3 }}
          >
            <Paper 
              variant="outlined"
              sx={{ 
                mb: 2, 
                borderRadius: 2,
                borderColor: userType === "teacher" ? theme.palette.primary.main : "#eaeaea",
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: 'rgba(0, 0, 0, 0.01)'
                }
              }}
            >
              <FormControlLabel
                value="teacher"
                control={<Radio />}
                sx={{ 
                  width: "100%", 
                  m: 0,
                  p: 2,
                  '& .MuiFormControlLabel-label': {
                    width: '100%'
                  }
                }}
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box 
                      sx={{ 
                        p: 1, 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        mr: 2 
                      }}
                    >
                      <Person fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="medium">
                        Teacher
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Access your teaching dashboard
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Paper>

            <Paper 
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                borderColor: userType === "student" ? theme.palette.primary.main : "#eaeaea",
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: 'rgba(0, 0, 0, 0.01)'
                }
              }}
            >
              <FormControlLabel
                value="student"
                control={<Radio />}
                sx={{ 
                  width: "100%", 
                  m: 0,
                  p: 2,
                  '& .MuiFormControlLabel-label': {
                    width: '100%'
                  }
                }}
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box 
                      sx={{ 
                        p: 1, 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        mr: 2 
                      }}
                    >
                      <School fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="medium">
                        Student
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Access your learning portal
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Paper>
          </RadioGroup>

          <Button 
            variant="contained" 
            fullWidth 
            onClick={() => setUserType(userType || "student")} // Use selected value or default to student
            sx={{ 
              mt: 2, 
              py: 1.5,
              bgcolor: 'black',
              '&:hover': {
                bgcolor: '#333'
              },
              borderRadius: 1,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Continue
          </Button>
        </Paper>
      ) : (
        // Login/Signup Form
        <Paper 
          elevation={1} 
          sx={{ 
            width: "100%", 
            borderRadius: 2,
            border: "1px solid #eaeaea",
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            p: 3, 
            borderBottom: "1px solid #eaeaea", 
            backgroundColor: '#fafafa' 
          }}>
            <Typography variant="h5" fontWeight="medium">
              {showSignUp ? "Sign Up" : "Login"}
            </Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <TextField 
              fullWidth 
              margin="normal" 
              label="KTU ID" 
              name="id" 
              value={formData.id} 
              onChange={handleInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            
            <TextField 
              fullWidth 
              margin="normal" 
              type="password" 
              label="Password" 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            {/* Class Unique ID field only for teacher login - not in signup */}
            {!showSignUp && userType === "teacher" && (
              <TextField 
                fullWidth 
                margin="normal" 
                label="Class Unique ID" 
                name="unique_id" 
                value={formData.unique_id} 
                onChange={handleInputChange}
                variant="outlined"
                sx={{ mb: 2 }}
                helperText="Enter class unique ID or '123' for admin access"
              />
            )}

            {showSignUp && (
              <>
                <TextField 
                  fullWidth 
                  margin="normal" 
                  label="Name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                <TextField 
                  fullWidth 
                  margin="normal" 
                  type="date" 
                  label="Date of Birth" 
                  name="dob" 
                  value={formData.dob} 
                  onChange={handleInputChange}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                
                {userType === "teacher" ? (
                  <>
                    <FormControl fullWidth margin="normal" variant="outlined" sx={{ mb: 2 }}>
                      <InputLabel>Department</InputLabel>
                      <Select 
                        name="dept" 
                        value={formData.dept} 
                        onChange={handleInputChange}
                        label="Department"
                      >
                        {departments.map((dept) => (
                          <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField 
                      fullWidth 
                      margin="normal" 
                      label="Position" 
                      name="position" 
                      value={formData.position} 
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </>
                ) : (
                  <>
                    <FormControl fullWidth margin="normal" variant="outlined" sx={{ mb: 2 }}>
                      <InputLabel>Class</InputLabel>
                      <Select 
                        name="class" 
                        value={formData.class} 
                        onChange={handleInputChange}
                        label="Class"
                      >
                        {classes.map((cls) => (
                          <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {/* New Gender dropdown for students */}
                    <FormControl fullWidth margin="normal" variant="outlined" sx={{ mb: 2 }}>
                      <InputLabel>Gender</InputLabel>
                      <Select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleInputChange}
                        label="Gender"
                      >
                        {genders.map((gender) => (
                          <MenuItem key={gender} value={gender}>{gender}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* New Annual Income field for students */}
                    <TextField 
                      fullWidth 
                      margin="normal" 
                      label="Annual Income" 
                      name="income" 
                      type="number"
                      value={formData.income} 
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField 
                      fullWidth 
                      margin="normal" 
                      label="Total Activity Points" 
                      name="total_activity_point" 
                      type="number"
                      value={formData.total_activity_point} 
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </>
                )}
              </>
            )}

            <Button
              variant="contained"
              fullWidth
              sx={{ 
                mt: 2, 
                py: 1.5,
                bgcolor: 'black',
                '&:hover': {
                  bgcolor: '#333'
                },
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '1rem'
              }}
              onClick={showSignUp ? handleSignUp : handleLogin}
              disabled={loading}
            >
              {loading ? "Processing..." : showSignUp ? "Sign Up" : "Login"}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ cursor: "pointer", display: 'block', mb: 1 }} 
                onClick={() => setShowSignUp(!showSignUp)}
              >
                {showSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ cursor: "pointer", color: theme.palette.primary.main }} 
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Forgot Password Dialog */}
      <Dialog 
        open={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          p: 3, 
          borderBottom: "1px solid #eaeaea", 
          backgroundColor: '#fafafa' 
        }}>
          <Typography variant="h6">
            {resetStage === "verify" ? "Verify Account" : "Reset Password"}
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 3 }}>
          {resetStage === "verify" ? (
            <>
              <TextField 
                fullWidth 
                margin="normal" 
                label="KTU ID" 
                name="id" 
                value={resetData.id} 
                onChange={handleResetChange}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField 
                fullWidth 
                margin="normal" 
                type="date" 
                label="Date of Birth" 
                name="dob" 
                value={resetData.dob} 
                onChange={handleResetChange}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </>
          ) : (
            <>
              <TextField 
                fullWidth 
                margin="normal" 
                type="password" 
                label="New Password" 
                name="newPassword" 
                value={resetData.newPassword} 
                onChange={handleResetChange}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField 
                fullWidth 
                margin="normal" 
                type="password" 
                label="Confirm Password" 
                name="confirmPassword" 
                value={resetData.confirmPassword} 
                onChange={handleResetChange}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setShowForgotPassword(false)} 
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={resetStage === "verify" ? handleForgotPassword : handleResetPassword} 
            variant="contained"
            disabled={loading}
            sx={{ 
              bgcolor: 'black',
              '&:hover': {
                bgcolor: '#333'
              },
              borderRadius: 1
            }}
          >
            {loading ? "Processing..." : resetStage === "verify" ? "Verify" : "Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AuthPage;