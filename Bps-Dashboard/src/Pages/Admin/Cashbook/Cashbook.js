import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchDailyIncome,
    saveCashBook,
    fetchCashBookList
} from "../../../features/caseBookSlice/caseBookSlice";
import { fetchStations } from "../../../features/stations/stationSlice";

const Cashbook = () => {
    const dispatch = useDispatch();
    const [type, setType] = useState("booking"); // default
    const { income, list } = useSelector((s) => s.cashbook);
    const { list: stations } = useSelector((s) => s.stations);
    const role = localStorage.getItem("userRole");
    const isAdmin = role === "admin";
    const urlToken = new URLSearchParams(window.location.search).get("token");
    const token = urlToken || localStorage.getItem("token");

    const today = new Date().toISOString().split("T")[0];

    const [expense, setExpense] = useState("");
    const [search, setSearch] = useState("");
    const [station, setStation] = useState("");
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState("");

    useEffect(() => {
        dispatch(fetchStations(token));

        dispatch(fetchCashBookList({
            from: fromDate,
            to: toDate || fromDate,
            station: station || undefined,
            type,
            token
        }));

        dispatch(fetchDailyIncome({
            date: fromDate,
            station: station || undefined,
            type,
            token
        }));
    }, [type, station, fromDate]); // ✅ IMPORTANT

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateDisplay = (date) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
    };

    const handleFilter = () => {
        dispatch(fetchCashBookList({
            from: fromDate,
            to: toDate || fromDate,
            station,
            type,
            token // ✅ ADD THIS
        }));

        dispatch(fetchDailyIncome({
            date: fromDate,
            station,
            type,
            token // ✅ ADD
        }));
    };

    const handleSave = () => {
        if (!expense) return alert("Enter expense");

        dispatch(saveCashBook({
            date: fromDate,
            expense: Number(expense),
            type // ✅ ADD
        })).then(() => {
            handleFilter();
        });

        setExpense("");
    };

    // ✅ SEARCH FILTER
    const filteredList = list.filter((item) =>
        item?.station?.stationName
            ?.toLowerCase()
            .includes(search.toLowerCase())
    );

    const selectedEntry = filteredList.find(
        (item) =>
            new Date(item.date).toDateString() === new Date(fromDate).toDateString() &&
            item.type === type
    );

    return (
        <Box p={3} sx={{ bgcolor: "#f4f6f8", minHeight: "100vh" }}>

            <Typography variant="h4" fontWeight="bold">
                📊 CashBook Dashboard
            </Typography>

            {/* 🔥 FILTERS */}
            <Card sx={{ mt: 3, p: 2 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            label="Select Type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <MenuItem value="booking">Booking (GST)</MenuItem>
                            <MenuItem value="quotation">Quotation (No GST)</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="From Date"
                            InputLabelProps={{ shrink: true }}
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />

                        {/* 👇 display format */}
                        <Typography variant="caption">
                            Selected: {formatDateDisplay(fromDate)}
                        </Typography>
                    </Grid>

                    {/* ✅ ADMIN ONLY DROPDOWN */}
                    {isAdmin && (
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                select
                                fullWidth
                                label="Select Station"
                                value={station || ""}
                                onChange={(e) => setStation(e.target.value)}
                            >
                                {stations?.map((s) => (
                                    <MenuItem key={s._id} value={s._id}>
                                        {s.stationName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Button fullWidth variant="contained" onClick={handleFilter}>
                            Apply Filter
                        </Button>
                    </Grid>

                </Grid>
            </Card>

            {/* 🔥 SEARCH */}
            <TextField
                fullWidth
                placeholder="Search by station..."
                value={search || ""}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mt: 3 }}
            />

            {/* 🔥 CARDS */}
            <Grid container spacing={3} mt={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography>Income</Typography>
                            <Typography variant="h4" color="green">
                                ₹ {income?.totalIncome || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography>Add Expense</Typography>

                            <TextField
                                fullWidth
                                type="number"
                                value={expense || ""}
                                onChange={(e) => setExpense(e.target.value)}
                                sx={{ mt: 1 }}
                            />

                            <Button fullWidth sx={{ mt: 2 }} onClick={handleSave}>
                                Save Expense
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography>Balance</Typography>
                            <Typography variant="h4" color="blue">
                                ₹ {selectedEntry?.balance || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 🔥 TABLE */}
            <Box mt={4}>
                <Typography variant="h6">📋 CashBook Records</Typography>

                <table style={{ width: "100%", marginTop: "10px" }}>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Station</th>
                            <th>Income</th>
                            <th>Expense</th>
                            <th>Balance</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredList.map((item) => (
                            <tr key={item._id}>
                                <td>{item.type}</td>
                                <td>{formatDate(item.date)}</td>
                                <td>{item?.station?.stationName || "-"}</td>
                                <td>₹ {item.totalIncome}</td>
                                <td>₹ {item.totalExpense}</td>
                                <td>₹ {item.balance}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Box>

        </Box>
    );
};

export default Cashbook;