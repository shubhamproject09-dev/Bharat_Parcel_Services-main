import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Paper,
    Autocomplete
} from "@mui/material";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { createRate } from "../../../../features/RateListSlice/rateListSlice";

// ✅ GST slice
import { fetchActiveCustomer } from "../../../../features/customers/customerSlice";

// ✅ NON-GST slice
import { fetchActiveCustomer as fetchQCustomer } from "../../../../features/qcustomers/qcustomerSlice";

const AddRateList = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    // 🔥 STATES
    const [partyType, setPartyType] = useState("");
    const [party, setParty] = useState(null);

    const [form, setForm] = useState({
        perKgPrice: "",
        mmPrice: "",
        insurancePrice: "",
        silverPrice: "",
        airPrice: ""
    });

    // 🔥 REDUX DATA
    const gstCustomers = useSelector((state) => state.customers.list);
    const nonGstCustomers = useSelector((state) => state.qcustomers.list);

    // 🔥 LOAD DATA BASED ON TYPE
    useEffect(() => {
        if (partyType === "gst") {
            dispatch(fetchActiveCustomer());
        } else if (partyType === "non-gst") {
            dispatch(fetchQCustomer());
        }
    }, [partyType, dispatch]);

    // 🔥 FINAL LIST
    const partyList =
        partyType === "gst" ? gstCustomers : nonGstCustomers;

    // 🔥 HANDLE INPUT
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // 🔥 SUBMIT
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!partyType) {
            alert("Please select party type");
            return;
        }

        if (!party) {
            alert("Please select party");
            return;
        }

        dispatch(createRate({
            partyType,
            party: party?.customerId,
            ...form
        }));

        navigate("/rate-list");
    };

    return (
        <Box p={3}>

            <Paper sx={{ p: 3, borderRadius: 3 }}>

                <Typography variant="h5" mb={3} fontWeight="bold">
                    Add Rate List
                </Typography>

                <Grid container spacing={2}>

                    {/* 🔹 PARTY TYPE */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Party Type"
                            value={partyType}
                            onChange={(e) => {
                                setPartyType(e.target.value);
                                setParty(null);
                            }}
                        >
                            <MenuItem value="gst">With GST</MenuItem>
                            <MenuItem value="non-gst">Without GST</MenuItem>
                        </TextField>
                    </Grid>

                    {/* 🔹 PARTY SEARCH DROPDOWN */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Autocomplete
                            options={partyList || []}
                            value={party}
                            getOptionLabel={(option) =>
                                option
                                    ? `${option.firstName} ${option.lastName} (${option.customerId})`
                                    : ""
                            }
                            onChange={(e, value) => setParty(value || null)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Party"
                                    fullWidth
                                />
                            )}
                        />
                    </Grid>

                    {/* 🔹 PRICE FIELDS */}

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Per KG Price"
                            name="perKgPrice"
                            type="number"
                            value={form.perKgPrice}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="MM Price"
                            name="mmPrice"
                            type="number"
                            value={form.mmPrice}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Insurance Price"
                            name="insurancePrice"
                            type="number"
                            value={form.insurancePrice}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Silver Price"
                            name="silverPrice"
                            type="number"
                            value={form.silverPrice}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Air Price"
                            name="airPrice"
                            type="number"
                            value={form.airPrice}
                            onChange={handleChange}
                        />
                    </Grid>

                </Grid>

                {/* 🔹 BUTTONS */}
                <Box mt={4} display="flex" gap={2}>

                    <Button
                        variant="contained"
                        disabled={!partyType || !party}
                        onClick={handleSubmit}
                    >
                        Save
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => navigate("/rate-list")}
                    >
                        Cancel
                    </Button>

                </Box>

            </Paper>

        </Box>
    );
};

export default AddRateList;