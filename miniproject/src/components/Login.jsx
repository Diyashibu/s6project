import React, { useState } from "react";
import { supabase } from "../supabase";
import { 
  Box, Button, TextField, Typography, Card, CardContent, 
  Radio, RadioGroup, FormControlLabel, Select, MenuItem, FormControl, InputLabel 
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import bcrypt from 'bcryptjs';

const AuthPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [formData, setFormData] = useState({
    id: "", name: "", password: "", dept: "", position: "", dob: "", class: "", total_activity_point: ""
  });
  const [loading, setLoading] = useState(false);
  const departments = [
    "Computer Science", "Electronics", "Electrical and Electronics", "Biomedical", "Applied Science", "Mechanical"
  ];
  
  const classes = ["CSA", "CSB", "CSC", "CSBS", "ECA", "ECB", "EEE", "EB", "MECH"];
  const handleUserTypeChange = (event) => setUserType(event.target.value);
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    setLoading(true);

    const { id, password } = formData;
    if (!id || !password) {
      alert("Please enter both ID (KTU ID) and password.");
      setLoading(false);
      return;
    }

    const table = userType === "teacher" ? "teacher" : "student";

    const { data: user, error } = await supabase
      .from(table)
      .select("password")
      .eq("id", id)
      .maybeSingle();

    if (error || !user) {
      alert("User not found or incorrect credentials.");
      setLoading(false);
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      alert("Login successful!");
      navigate("/"); 
    } else {
      alert("Invalid password!");
    }

    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);

    const { id, name, password, dob, dept, position, class: studentClass, total_activity_point } = formData;

    if (!id || !name || !password || !dob) {
      alert("Please fill all required fields.");
      setLoading(false);
      return;
    }

    const table = userType === "teacher" ? "teacher" : "student";

    const { data: existingUser } = await supabase
      .from(table)
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existingUser) {
      alert("User ID already exists. Please log in.");
      setLoading(false);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const entry = userType === "teacher"
      ? { id, dept, position, dob, password: hashedPassword }
      : { id, name, class: studentClass, total_activity_point, dob, password: hashedPassword };

    const { error: insertError } = await supabase.from(table).insert([entry]);

    if (insertError) {
      alert(insertError.message);
    } else {
      alert("Account created successfully! Please log in.");
      setShowSignUp(false);
    }

    setLoading(false);
  };

  return (
    <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {!userType ? (
        <Card sx={{ width: 400, p: 3 }}>
          <CardContent>
            <Typography variant="h6">Select User Type</Typography>
            <RadioGroup row value={userType} onChange={handleUserTypeChange}>
              <FormControlLabel value="teacher" control={<Radio />} label="Teacher" />
              <FormControlLabel value="student" control={<Radio />} label="Student" />
            </RadioGroup>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ width: 400, p: 3 }}>
          <CardContent>
            <Typography variant="h6">{showSignUp ? "Sign Up" : "Login"}</Typography>
            <TextField fullWidth margin="normal" label="KTU ID" name="id" value={formData.id} onChange={handleInputChange} />
            <TextField fullWidth margin="normal" type="password" label="Password" name="password" value={formData.password} onChange={handleInputChange} />

            {showSignUp && (
              <>
                <TextField fullWidth margin="normal" label="Name" name="name" value={formData.name} onChange={handleInputChange} />
                <TextField fullWidth margin="normal" type="date" label="Date of Birth" name="dob" value={formData.dob} onChange={handleInputChange} />
                {userType === "teacher" ? (
                  <>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Department</InputLabel>
                      <Select name="dept" value={formData.dept} onChange={handleInputChange}>
                        {departments.map((dept) => (
                          <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField fullWidth margin="normal" label="Position" name="position" value={formData.position} onChange={handleInputChange} />
                  </>
                ) : (
                  <>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Class</InputLabel>
                      <Select name="class" value={formData.class} onChange={handleInputChange}>
                        {classes.map((cls) => (
                          <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField fullWidth margin="normal" label="Total Activity Points" name="total_activity_point" value={formData.total_activity_point} onChange={handleInputChange} />
                  </>
                )}
              </>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={showSignUp ? handleSignUp : handleLogin}
              disabled={loading}
            >
              {loading ? "Processing..." : showSignUp ? "Sign Up" : "Login"}
            </Button>

            <Typography variant="body2" sx={{ mt: 2, cursor: "pointer" }} onClick={() => setShowSignUp(!showSignUp)}>
              {showSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </Typography>

            {!showSignUp && (
              <Typography variant="body2" sx={{ mt: 1, cursor: "pointer", color: "blue" }}>
                Forgot Password?
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AuthPage;
