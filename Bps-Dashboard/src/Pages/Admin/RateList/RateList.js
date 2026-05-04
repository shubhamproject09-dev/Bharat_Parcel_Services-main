import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Pagination
} from "@mui/material";
import { TextField } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchRates, deleteRate } from "../../../features/RateListSlice/rateListSlice";

const RateList = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const { rates } = useSelector((state) => state.rateList);

    const [activeFilter, setActiveFilter] = useState("");
    const [page, setPage] = useState(1);

    const rowsPerPage = 5;

    useEffect(() => {
        dispatch(fetchRates());
    }, [dispatch]);

    const filteredRates = rates
        .filter(r => !activeFilter || r.partyType === activeFilter)
        .filter(r => {
            const fullName = `${r.party?.firstName || ""} ${r.party?.lastName || ""}`.toLowerCase();
            return fullName.includes(search.toLowerCase());
        });

    // 🔥 Count
    const gstCount = rates.filter(r => r.partyType === "gst").length;
    const nonGstCount = rates.filter(r => r.partyType === "non-gst").length;

    // 🔥 Pagination
    const startIndex = (page - 1) * rowsPerPage;
    const paginatedData = filteredRates.slice(startIndex, startIndex + rowsPerPage);

    const handleDelete = (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this rate?");
        if (confirmDelete) {
            dispatch(deleteRate(id));
        }
    };

    return (
        <Box p={2}>

            {/* 🔹 HEADER */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight="bold">
                    Rate List
                </Typography>

                <Button
                    variant="contained"
                    onClick={() => navigate("/rate-list/add")}
                >
                    Add Rate List
                </Button>
            </Box>

            {/* 🔹 CARDS */}
            <Grid container spacing={2} mb={3}>

                {/* GST CARD */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        onClick={() => {
                            setActiveFilter("gst");
                            setPage(1);
                        }}
                        sx={{
                            cursor: "pointer",
                            border: activeFilter === "gst" ? "2px solid #1976d2" : "1px solid #ddd",
                            borderRadius: 3,
                            transition: "0.3s",
                            "&:hover": {
                                transform: "translateY(-5px)",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
                            }
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                With GST Rate List
                            </Typography>
                            <Typography variant="h3">{gstCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* NON GST CARD */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        onClick={() => {
                            setActiveFilter("non-gst");
                            setPage(1);
                        }}
                        sx={{
                            cursor: "pointer",
                            border: activeFilter === "non-gst" ? "2px solid green" : "1px solid #ddd",
                            borderRadius: 3,
                            transition: "0.3s",
                            "&:hover": {
                                transform: "translateY(-5px)",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
                            }
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" color="success.main">
                                Without GST Rate List
                            </Typography>
                            <Typography variant="h3">{nonGstCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>
            <Box mb={2}>
                <TextField
                    fullWidth
                    placeholder="Search by customer name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </Box>
            {/* 🔹 TABLE */}
            <TableContainer component={Paper}>
                <Table>

                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>S.No</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Per KG</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>MM</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Insurance</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Silver</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Air</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paginatedData.map((row, index) => (
                            <TableRow key={row._id}>
                                <TableCell>{startIndex + index + 1}</TableCell>

                                <TableCell>
                                    {row.party?.firstName} {row.party?.lastName}
                                </TableCell>

                                <TableCell>{row.perKgPrice}</TableCell>
                                <TableCell>{row.mmPrice}</TableCell>
                                <TableCell>{row.insurancePrice}</TableCell>
                                <TableCell>{row.silverPrice}</TableCell>
                                <TableCell>{row.airPrice}</TableCell>

                                <TableCell>

                                    {/* VIEW */}
                                    <IconButton
                                        color="primary"
                                        onClick={() => navigate(`/rate-list/view/${row._id}`)}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>

                                    {/* EDIT */}
                                    <IconButton
                                        color="success"
                                        onClick={() => navigate(`/rate-list/edit/${row._id}`)}
                                    >
                                        <EditIcon />
                                    </IconButton>

                                    {/* DELETE */}
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDelete(row._id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                </Table>
            </TableContainer>

            {/* 🔹 PAGINATION */}
            <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                    count={Math.ceil(filteredRates.length / rowsPerPage)}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                />
            </Box>

        </Box>
    );
};

export default RateList;