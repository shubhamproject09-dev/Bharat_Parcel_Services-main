import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    Typography,
    Paper,
    Button,
    CircularProgress,
    TextField,
    Avatar,
    Divider
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffById } from "../../../../features/staff/staffSlice";
import { useParams, useNavigate } from "react-router-dom";
import IDCardModal from "../../../../Components/IDCardModal";
import headerImg from "../../../../assets/logo.png";
import directorSignImg from "../../../../assets/digital.jpeg"

const StaffView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { staffId } = useParams();
    const [openIdCard, setOpenIdCard] = useState(false);
    const { current, loading } = useSelector((state) => state.staff);

    useEffect(() => {
        dispatch(fetchStaffById(staffId));
    }, [dispatch, staffId]);

    if (loading || !current) {
        return (
            <Box display="flex" justifyContent="center" mt={5}>
                <CircularProgress />
            </Box>
        );
    }

    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")
            }/${d.getFullYear()}`;
    };

    const staff = current?.data?.[0] || current; // API safe handling

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
                Staff Profile
            </Typography>

            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 4 }}>
                {/* Header */}
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar
                        src={staff?.documents?.passportPhoto?.url}
                        sx={{ width: 80, height: 80 }}
                    />
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            {staff.firstName} {staff.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Staff ID : {staff.staffId}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="First Name" value={staff.firstName} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Last Name" value={staff.lastName} InputProps={{ readOnly: true }} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Contact Number" value={staff.contactNumber} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Date of Birth"
                            value={formatDate(staff.dob)}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Email" value={staff.email} InputProps={{ readOnly: true }} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Aadhar Number" value={staff.aadharNumber} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Designation"
                            value={staff.designation}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Status" value={staff.status} InputProps={{ readOnly: true }} />
                    </Grid>

                    {/* Address */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Address"
                            value={staff.address?.addressLine}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="State" value={staff.address?.state} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="City" value={staff.address?.city} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="District" value={staff.address?.district} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Pincode" value={staff.address?.pincode} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Office Address"
                            value={staff.officeAddress}
                            InputProps={{ readOnly: true }}
                            multiline
                            rows={2}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Joining Date"
                            value={formatDate(staff.joiningDate)}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Expiry Date"
                            value={formatDate(staff.expiryDate)}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                    {/* Images */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography fontWeight="bold" mb={1}>Aadhar Card</Typography>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: "center" }}>
                            <img
                                src={staff?.documents?.aadharCardPhoto?.url}
                                alt="Aadhar"
                                style={{ width: "100%", maxHeight: 250, objectFit: "contain" }}
                            />
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography fontWeight="bold" mb={1}>Passport Photo</Typography>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: "center" }}>
                            <img
                                src={staff?.documents?.passportPhoto?.url}
                                alt="Passport"
                                style={{ width: "100%", maxHeight: 250, objectFit: "contain" }}
                            />
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography fontWeight="bold" mb={1}>Digital Signature</Typography>

                        {staff?.documents?.digitalSignature?.url ? (
                            <Paper variant="outlined" sx={{ p: 1, textAlign: "center" }}>
                                <img
                                    src={staff.documents.digitalSignature.url}
                                    alt="Digital Signature"
                                    style={{ width: "100%", maxHeight: 200, objectFit: "contain" }}
                                />
                            </Paper>
                        ) : (
                            <Typography color="text.secondary">
                                No digital signature uploaded
                            </Typography>
                        )}
                    </Grid>
                </Grid>

                <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenIdCard(true)}
                    >
                        Preview ID Card
                    </Button>

                    <Button variant="outlined" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </Box>
            </Paper>
            <IDCardModal
                open={openIdCard}
                onClose={() => setOpenIdCard(false)}
                staff={staff}
                headerImage={headerImg}
                directorSignature={directorSignImg}
            />
        </Box>
    );
};

export default StaffView;