import React, { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, RadioGroup, FormControlLabel, Radio, Card, CardContent } from "@mui/material";

const SignUpPage = () => {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({ id: "", name: "", dept: "", position: "", class: "", activitypoint: "", password: "", dob: "" });
  const navigate = useNavigate();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSignUp = async () => {
    const { id, password } = formData;
    if (!id || !password) return alert("ID and Password required");
    
    const { count } = await supabase.from(userType === "teacher" ? "teachers" : "students").select("*").eq("id", id).single();
    if (count) return alert("ID already exists");
    
    const { error } = await supabase.from(userType === "teacher" ? "teachers" : "students").insert([{ ...formData, slno: Math.floor(Math.random() * 1000) }]);
    if (error) return alert(error.message);
    
    alert("Account created successfully");
    navigate("/");
  };

  return (
    <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="h4" gutterBottom>Sign Up</Typography>
      <Card sx={{ width: 400, p: 3 }}>
        <CardContent>
          <RadioGroup row value={userType} onChange={(e) => setUserType(e.target.value)}>
            <FormControlLabel value="teacher" control={<Radio />} label="Teacher" />
            <FormControlLabel value="student" control={<Radio />} label="Student" />
          </RadioGroup>
          <TextField fullWidth label="ID" name="id" onChange={handleInputChange} margin="normal" />
          <TextField fullWidth label="Name" name="name" onChange={handleInputChange} margin="normal" />
          {userType === "teacher" ? (
            <>
              <TextField fullWidth label="Department" name="dept" onChange={handleInputChange} margin="normal" />
              <TextField fullWidth label="Position" name="position" onChange={handleInputChange} margin="normal" />
            </>
          ) : (
            <>
              <TextField fullWidth label="Class" name="class" onChange={handleInputChange} margin="normal" />
              <TextField fullWidth label="Activity Points" name="activitypoint" onChange={handleInputChange} margin="normal" />
            </>
          )}
          <TextField fullWidth type="password" label="Password" name="password" onChange={handleInputChange} margin="normal" />
          <TextField fullWidth type="date" name="dob" onChange={handleInputChange} margin="normal" />
          <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSignUp}>Sign Up</Button>
        </CardContent>
      </Card>
    </Box>
  );
};
export default SignUpPage;
