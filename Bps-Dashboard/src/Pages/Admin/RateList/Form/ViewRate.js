import React, { useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    TextField
} from "@mui/material";

import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchSingleRate } from "../../../../features/RateListSlice/rateListSlice";

const ViewRate = () => {

    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { singleRate } = useSelector((state) => state.rateList);

    useEffect(() => {
        dispatch(fetchSingleRate(id));
    }, [dispatch, id]);

    if (!singleRate) return <p>Loading...</p>;

    return (
        <Box p={3}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" mb={3} fontWeight="bold">
                    View Rate
                </Typography>

                <Grid container spacing={2}>

                    {/* 🔹 Party Name */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Party Name"
                            fullWidth
                            value={`${singleRate.party?.firstName || ""} ${singleRate.party?.lastName || ""}`}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                    {/* 🔹 Party Type */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Party Type"
                            fullWidth
                            value={singleRate.partyType === "gst" ? "With GST" : "Without GST"}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                    {/* 🔹 Per KG */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Per KG Price"
                            fullWidth
                            value={singleRate.perKgPrice}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                    {/* 🔹 MM */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="MM Price"
                            fullWidth
                            value={singleRate.mmPrice}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                    {/* 🔹 Insurance */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Insurance Price"
                            fullWidth
                            value={singleRate.insurancePrice}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                    {/* 🔹 Silver */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Silver Price"
                            fullWidth
                            value={singleRate.silverPrice}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                    {/* 🔹 Air */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Air Price"
                            fullWidth
                            value={singleRate.airPrice}
                            InputProps={{ readOnly: true }}
                        />
                    </Grid>

                </Grid>

                <Button
                    sx={{ mt: 3 }}
                    variant="contained"
                    onClick={() => navigate("/rate-list")}
                >
                    Back
                </Button>

            </Paper>
        </Box>
    );
};

export default ViewRate;