import React, { useEffect, useState } from "react";
import {
    Box,
    TextField,
    Button,
    Grid,
    Paper,
    Typography
} from "@mui/material";

import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
    fetchSingleRate,
    updateRate
} from "../../../../features/RateListSlice/rateListSlice";

const EditRate = () => {

    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { singleRate } = useSelector((state) => state.rateList);

    const [form, setForm] = useState({
        perKgPrice: "",
        mmPrice: "",
        insurancePrice: "",
        silverPrice: "",
        airPrice: ""
    });

    useEffect(() => {
        dispatch(fetchSingleRate(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (singleRate) {
            setForm({
                perKgPrice: singleRate.perKgPrice,
                mmPrice: singleRate.mmPrice,
                insurancePrice: singleRate.insurancePrice,
                silverPrice: singleRate.silverPrice,
                airPrice: singleRate.airPrice
            });
        }
    }, [singleRate]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = () => {
        dispatch(updateRate({ id, updatedData: form }));
        navigate("/rate-list");
    };

    if (!singleRate) return <p>Loading...</p>;

    return (
        <Box p={3}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" mb={3} fontWeight="bold">
                    Edit Rate
                </Typography>

                <Grid container spacing={2}>

                    {/* 🔹 Party Name (DISABLED) */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Party Name"
                            fullWidth
                            value={`${singleRate.party?.firstName || ""} ${singleRate.party?.lastName || ""}`}
                            disabled
                        />
                    </Grid>

                    {/* 🔹 Party Type (DISABLED) */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Party Type"
                            fullWidth
                            value={singleRate.partyType === "gst" ? "With GST" : "Without GST"}
                            disabled
                        />
                    </Grid>

                    {/* 🔹 Editable Fields */}

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Per KG"
                            name="perKgPrice"
                            value={form.perKgPrice}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="MM"
                            name="mmPrice"
                            value={form.mmPrice}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Insurance"
                            name="insurancePrice"
                            value={form.insurancePrice}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Silver"
                            name="silverPrice"
                            value={form.silverPrice}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Air"
                            name="airPrice"
                            value={form.airPrice}
                            onChange={handleChange}
                        />
                    </Grid>

                </Grid>

                <Button
                    sx={{ mt: 3 }}
                    variant="contained"
                    onClick={handleUpdate}
                >
                    Update
                </Button>

            </Paper>
        </Box>
    );
};

export default EditRate;