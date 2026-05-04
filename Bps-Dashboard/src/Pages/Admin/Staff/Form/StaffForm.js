import React, { useState, useEffect } from "react";
import {
    Box, Grid, TextField, Button, Typography, Paper,
    Stack, Alert, CircularProgress,
    Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { createStaff, clearStaffError } from "../../../../features/staff/staffSlice";
import { useNavigate } from "react-router-dom";

const officeAddresses = [
    "332, Kucha Ghasi Ram, Chandni Chowk, Fatehpuri, Delhi -110006 (7779993453)",
    "1, Malharrao Wadi, Gr. Flr., R. No. 4, D.A Lane Kalbadevi Rd., Mumbai-400002 (7779993454)",
    "33, Shiv Thakur Lane, Ground Floor, Behind Hari Ram Goenka Street, Kolkata-700007 (9163318515)",
    "1312/13/3, Sahyaba Chambers, Nr. Sharmlani Pole, Manek Complex Pedak Road, Rajkot AHMEDABAD (7802873827)",
    "House No. 875, Pink House, Ganga Mata Ki Gali, Gopal Ji Ka Rasta, Jaipur (09672101700)",
    "Shop No. 3, Shriji Plaza, Sainik Place, Kinari Bazar, Agra (8448554369)"
];

const designations = [
    "Director",
    "Manager",
    "Supervisior",
    "Driver",
    "Employer"
];


const StaffForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error } = useSelector(state => state.staff); // 👈 redux state

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        dob: "",
        joiningDate: "",
        expiryDate: "",
        designation: "",
        contactNumber: "",
        email: "",
        aadharNumber: "",
        officeAddress: "",
        addressLine: "",
        state: "",
        city: "",
        district: "",
        pincode: ""
    });

    const [files, setFiles] = useState({
        aadharCardPhoto: null,
        passportPhoto: null,
        digitalSignature: null
    });

    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        // cleanup error when unmount
        return () => {
            dispatch(clearStaffError());
        };
    }, [dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "joiningDate") {
            const d = new Date(value);
            d.setFullYear(d.getFullYear() + 1);

            setForm({
                ...form,
                joiningDate: value,
                expiryDate: d.toISOString().split("T")[0]
            });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")
            }/${d.getFullYear()}`;
    };


    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();

        Object.keys(form).forEach((key) => {
            formData.append(key, form[key]);
        });

        if (files.aadharCardPhoto)
            formData.append("aadharCardPhoto", files.aadharCardPhoto);

        if (files.passportPhoto)
            formData.append("passportPhoto", files.passportPhoto);

        if (files.digitalSignature)
            formData.append("digitalSignature", files.digitalSignature);

        const res = await dispatch(createStaff(formData));

        if (res.type.includes("fulfilled")) {
            setSuccessMsg("Staff created successfully 🎉");

            setTimeout(() => {
                navigate("/staff");
            }, 1200);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
                Create Staff
            </Typography>

            {/* Alerts */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error?.message || "Something went wrong"}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>

                        {/* Basic Info */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="First Name" name="firstName" fullWidth required onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Last Name" name="lastName" fullWidth onChange={handleChange} />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Contact Number" name="contactNumber" fullWidth required onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Email" name="email" fullWidth required onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Date of Birth"
                                name="dob"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Aadhar Number" name="aadharNumber" fullWidth required onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth required>
                                <InputLabel id="designation-label">Designation</InputLabel>
                                <Select
                                    labelId="designation-label"
                                    name="designation"
                                    label="Designation"
                                    value={form.designation}
                                    onChange={handleChange}
                                >
                                    {designations.map((role) => (
                                        <MenuItem key={role} value={role}>
                                            {role}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Address */}
                        <Grid size={{ xs: 12 }}>
                            <TextField label="Address Line" name="addressLine" fullWidth required onChange={handleChange} />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField label="State" name="state" fullWidth required onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField label="City" name="city" fullWidth required onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField label="District" name="district" fullWidth required onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField label="Pincode" name="pincode" fullWidth required onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth required>
                                <InputLabel id="office-address-label">Office Address</InputLabel>
                                <Select
                                    labelId="office-address-label"
                                    name="officeAddress"
                                    label="Office Address"
                                    value={form.officeAddress}
                                    onChange={handleChange}
                                >
                                    {officeAddresses.map((address, index) => (
                                        <MenuItem key={index} value={address}>
                                            {address}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Joining Date"
                                name="joiningDate"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Expiry Date"
                                name="expiryDate"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* Documents */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="subtitle2">Aadhar Card Photo</Typography>
                            <input type="file" name="aadharCardPhoto" onChange={handleFileChange} />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="subtitle2">Passport Size Photo</Typography>
                            <input type="file" name="passportPhoto" onChange={handleFileChange} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="subtitle2">Digital Signature</Typography>
                            <input
                                type="file"
                                name="digitalSignature"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </Grid>


                        {/* Buttons */}
                        <Grid size={{ xs: 12 }}>
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button variant="outlined" onClick={() => navigate("/staff")} disabled={loading}>
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}   // 👈 disable while API running
                                    startIcon={loading ? <CircularProgress size={18} /> : null}
                                >
                                    {loading ? "Creating..." : "Create Staff"}
                                </Button>
                            </Stack>
                        </Grid>

                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default StaffForm;
