import React, { useState } from "react";
import { supabase } from "../supabase";
import { 
  Box, Button, TextField, Typography, Card, CardContent, 
  Radio, RadioGroup, FormControlLabel, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions 
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import bcrypt from 'bcryptjs';

const AuthPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStage, setResetStage] = useState("verify");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ id: "", name: "", password: "", dept: "", position: "", dob: "", class: "", total_activity_point: "" });
  const [resetData, setResetData] = useState({ id: "", dob: "", newPassword: "", confirmPassword: "" });

  const departments = ["Computer Science", "Electronics", "Electrical", "Biomedical", "Applied Science", "Mechanical"];
  const classes = ["CSA", "CSB", "CSC", "CSBS", "ECA", "ECB", "EEE", "EB", "MECH"];

  const handleUserTypeChange = (event) => setUserType(event.target.value);
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleResetChange = (e) => setResetData({ ...resetData, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    setLoading(true);
    const { id, password } = formData;
    if (!id || !password) {
      alert("Please enter both KTU ID and password.");
      setLoading(false);
      return;
    }

    const table = userType === "teacher" ? "teacher" : "student";
    const { data: user, error } = await supabase.from(table).select("password").eq("id", id).maybeSingle();

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
    const { data: existingUser } = await supabase.from(table).select("id").eq("id", id).maybeSingle();

    if (existingUser) {
      alert("User ID already exists. Please log in.");
      setLoading(false);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const entry = userType === "teacher"
      ? { id, name, dept, position, dob, password: hashedPassword }
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

  const handleForgotPassword = async () => {
    setLoading(true);
    const { id, dob } = resetData;
    if (!id || !dob) {
      alert("Please enter both KTU ID and Date of Birth.");
      setLoading(false);
      return;
    }

    const table = userType === "teacher" ? "teacher" : "student";
    const { data: user, error } = await supabase.from(table).select("dob").eq("id", id).maybeSingle();

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
    const { error } = await supabase.from(table).update({ password: hashedPassword }).eq("id", id);

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

        
        <Typography 
  variant="body2" 
  sx={{ mt: 1, cursor: "pointer", color: "blue" }} 
  onClick={() => setShowForgotPassword(true)} // ✅ Fixes the missing click event
>
  Forgot Password??
</Typography>
        
      </CardContent>
    </Card>

      )}
     

      

<Dialog open={showForgotPassword} onClose={() => setShowForgotPassword(false)}>
  
  <DialogContent>
    {resetStage === "verify" ? (
      <>
        <TextField fullWidth margin="normal" label="KTU ID" name="id" value={resetData.id} onChange={handleResetChange} />
        <TextField fullWidth margin="normal" type="date" label="Date of Birth" name="dob" value={resetData.dob} onChange={handleResetChange} />
        <Button onClick={handleForgotPassword} disabled={loading} sx={{ mt: 2 }}>Verify</Button>
      </>
    ) : (
      <>
        <TextField fullWidth margin="normal" type="password" label="New Password" name="newPassword" value={resetData.newPassword} onChange={handleResetChange} />
        <TextField fullWidth margin="normal" type="password" label="Confirm Password" name="confirmPassword" value={resetData.confirmPassword} onChange={handleResetChange} />
        <Button onClick={handleResetPassword} disabled={loading} sx={{ mt: 2 }}>Reset Password</Button>
      </>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowForgotPassword(false)} color="secondary">Close</Button>
  </DialogActions>
</Dialog>

    </Box>
  );
};

export default AuthPage;
