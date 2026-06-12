import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
    Paper, Container, CircularProgress, Grid, TextField,
    InputAdornment, Chip, Alert, Card, CardContent,
    TableContainer, IconButton, Tooltip, Stack, TablePagination,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStations } from '../features/stations/stationSlice';
import { BOOKINGS_API } from "../utils/api";
import Autocomplete from '@mui/material/Autocomplete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PaidIcon from '@mui/icons-material/Paid';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ScaleIcon from '@mui/icons-material/Scale';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ClearIcon from '@mui/icons-material/Clear';
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";



const ViewBookingByDate = () => {
    const [fromCity, setFromCity] = useState('');
    const [toCity, setToCity] = useState('');
    const [searchText, setSearchText] = useState('');
    const dispatch = useDispatch();
    const { fromDate, toDate } = useParams();
    const [page, setPage] = useState(0);
    const [rowsPerPage] = useState(10);
    const [bookings, setBookings] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [sortConfig, setSortConfig] = useState({
        key: null,   // "bilty" | "sender" | "receiver"
        direction: "asc"
    });

    const { list: stations } = useSelector((state) => state.stations);

    useEffect(() => {
        dispatch(fetchStations());
    }, [dispatch]);

    const oneLineCell = {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 180
    };

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key === key) {
                return {
                    key,
                    direction: prev.direction === "asc" ? "desc" : "asc"
                };
            }
            return { key, direction: "asc" };
        });
    };

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await axios.post(
                    `${BOOKINGS_API}/booking-summary`,
                    { fromDate, toDate },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                        },
                    }
                );
                setBookings(res.data.bookings || []);
                setSummary(res.data.summary);
                const bookingsData = res.data.bookings || [];

                setBookings(bookingsData);

                setSummary(res.data.summary);

            } catch (err) {
                console.error('Error fetching bookings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [fromDate, toDate]);

    /* 🔍 SEARCH + FILTER LOGIC */
    const filteredBookings = useMemo(() => {
        return bookings.filter((booking) => {
            const text = searchText.toLowerCase();
            const item = booking.items?.[0] || {};

            const matchesSearch =
                booking.bookingId?.toLowerCase().includes(text) ||
                booking.senderName?.toLowerCase().includes(text) ||
                booking.receiverName?.toLowerCase().includes(text) ||
                booking.startStation?.stationName?.toLowerCase().includes(text) ||
                booking.endStation?.stationName?.toLowerCase().includes(text) ||
                item.receiptNo?.toLowerCase().includes(text);

            const matchesFromCity = fromCity
                ? booking.startStation?.stationName?.toLowerCase() === fromCity.toLowerCase()
                : true;

            const matchesToCity = toCity
                ? booking.endStation?.stationName?.toLowerCase() === toCity.toLowerCase()
                : true;

            return matchesSearch && matchesFromCity && matchesToCity;
        });
    }, [bookings, searchText, fromCity, toCity]);

    const filteredSummary = useMemo(() => {

        let totalPaid = 0;
        let totalToPay = 0;

        filteredBookings.forEach((booking) => {

            const paidItems =
                booking.items?.filter(
                    i => i.toPay?.toLowerCase() === "paid"
                ) || [];

            const topayItems =
                booking.items?.filter(
                    i => i.toPay?.toLowerCase() === "topay"
                ) || [];

            // Mixed Booking
            if (
                paidItems.length > 0 &&
                topayItems.length > 0
            ) {

                totalPaid += paidItems.reduce(
                    (sum, item) =>
                        sum + Number(item.insuranceTotalWithGST || 0),
                    0
                );

                totalToPay += Number(
                    booking.deliveryPendingAmount ||
                    booking.grandTotal ||
                    0
                );

            }

            // Fully Paid
            else if (
                booking.paymentStatus === "Paid"
            ) {

                totalPaid +=
                    Number(booking.grandTotal || 0);

            }

            // Fully ToPay
            else {

                totalToPay +=
                    Number(booking.grandTotal || 0);

            }

        });

        return {

            totalBookings:
                filteredBookings.length,

            totalPaid,

            totalToPay,

            grandTotal:
                totalPaid + totalToPay

        };

    }, [filteredBookings]);


    const getInsVppAmount = (booking) => {
        return booking.items?.reduce(
            (sum, item) => sum + Number(item.insuranceAmount || 0),
            0
        ) || 0;
    };

    const sortedBookings = useMemo(() => {

        if (!sortConfig.key) {
            return [...filteredBookings].sort((a, b) => {
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
        }

        return [...filteredBookings].sort((a, b) => {
            let aVal = "";
            let bVal = "";

            if (sortConfig.key === "bilty") {
                aVal = a.items?.[0]?.receiptNo || "";
                bVal = b.items?.[0]?.receiptNo || "";
            }

            if (sortConfig.key === "sender") {
                aVal = a.senderName || "";
                bVal = b.senderName || "";
            }

            if (sortConfig.key === "receiver") {
                aVal = a.receiverName || "";
                bVal = b.receiverName || "";
            }

            return sortConfig.direction === "asc"
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        });
    }, [filteredBookings, sortConfig]);

    const paginatedBookings = useMemo(() => {
        return sortedBookings.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [sortedBookings, page, rowsPerPage]);

    const getPayLabels = (booking) => {
        const item = booking.items?.[0] || {};
        const payType = (item.toPay || "").toLowerCase();

        return {
            paid: payType === "paid" ? "Paid" : "-",
            toPay: payType === "topay" ? "To Pay" : "-"
        };
    };

    const handleReceiveClick = (booking) => {

        setSelectedBooking(booking);

        setConfirmOpen(true);

    };

    const confirmReceive = async () => {

        if (
            selectedBooking?.deliveryPendingAmount <= 0
        ) {
            return;
        }

        try {

            const res = await axios.patch(

                `${BOOKINGS_API}/receive-payment/${selectedBooking.bookingId}`,

                {
                    amount: selectedBooking.deliveryPendingAmount
                },

                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("authToken")}`
                    }
                }

            );

            const freshData =
                bookings.map(b =>

                    b.bookingId === selectedBooking.bookingId

                        ? res.data.data

                        : b

                );

            setBookings(freshData);

            setConfirmOpen(false);

        }
        catch (err) {

            alert(
                err?.response?.data?.message
                || "Payment failed"
            );

        }

    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const downloadBookingPDF = () => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = doc.internal.pageSize.getWidth();

        // ===== HEADER =====
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Booking Report", pageWidth / 2, 12, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`From ${fromDate} to ${toDate}`, pageWidth / 2, 18, { align: "center" });

        // ===== TABLE HEAD =====
        const head = [[
            "S.No",
            "Booking ID",
            "Booking Date",
            "Bilty No",
            "Ref No",
            "Sender",
            "Receiver",
            "Route",
            "QT",
            "Wt",
            "INS/VPP",
            "Bilty",
            "GST",
            "Paid",
            "To Pay",
            "Receive ToPay",
            "Total"
        ]];

        // ===== TABLE BODY =====
        const body = sortedBookings.map((b, index) => {
            const item = b.items?.[0] || {};

            let paidAmount = 0;
            let toPayAmount = 0;

            const paidItems =
                b.items?.filter(
                    x => x.toPay?.toLowerCase() === "paid"
                ) || [];

            const topayItems =
                b.items?.filter(
                    x => x.toPay?.toLowerCase() === "topay"
                ) || [];

            // Mixed booking
            // Mixed booking
            if (
                paidItems.length > 0 &&
                topayItems.length > 0
            ) {

                paidAmount = paidItems.reduce(
                    (sum, item) =>
                        sum +
                        Number(item.insuranceTotalWithGST || 0),
                    0
                );

                toPayAmount = Number(
                    b.deliveryPendingAmount ||
                    b.grandTotal ||
                    0
                );

            }
            // Fully Paid
            else if (b.paymentStatus === "Paid") {

                paidAmount =
                    Number(b.grandTotal || 0);

            }
            // Fully ToPay
            else {

                toPayAmount =
                    Number(b.grandTotal || 0);

            }

            const insVpp =
                Number(b.ins_vpp || 0);

            const totalAmount =
                Number(b.grandTotal || 0);
            const gst =
                (b.cgst || 0) +
                (b.sgst || 0) +
                (b.igst || 0);

            const bilty = 20;

            return [
                index + 1,
                b.bookingId || "-",
                new Date(b.bookingDate).toLocaleDateString("en-GB"),
                item.receiptNo || "-",
                item.refNo || "-",
                b.senderName || "-",
                b.receiverName || "-",
                `${b.startStationName} - ${b.endStationName}`,
                item.quantity || 0,
                item.weight || 0,
                insVpp,
                bilty,
                `${gst}%`,
                paidAmount,
                toPayAmount,
                b.deliveryPendingAmount > 0
                    ? "Pending"
                    : "Received",
                totalAmount
            ];

        });

        doc.autoTable({
            head,
            body,
            startY: 22,
            theme: "grid",

            styles: {
                fontSize: 7.5,
                cellPadding: 1.5,
                fontStyle: "bold",
                textColor: [0, 0, 0],
                lineWidth: 0.5,
                lineColor: [0, 0, 0],
                valign: "middle",
                overflow: "linebreak"
            },

            headStyles: {
                fillColor: [200, 200, 200],
                textColor: 0,
                fontStyle: "bold",
                fontSize: 8,
                halign: "center",

            },

            bodyStyles: {
                halign: "left"
            },


            columnStyles: {
                0: { cellWidth: 8, halign: "center" },
                1: { cellWidth: 20 },
                2: { cellWidth: 16 },
                3: { cellWidth: 20 },
                4: { cellWidth: 14 },
                5: { cellWidth: 32 },
                6: { cellWidth: 32 },
                7: { cellWidth: 28 },
                8: { cellWidth: 10, halign: "center" },
                9: { cellWidth: 10, halign: "right" }, // INS/VPP
                10: { cellWidth: 12, halign: "right" },
                11: { cellWidth: 12, halign: "right" },
                12: { cellWidth: 12, halign: "right" },
                13: { cellWidth: 12, halign: "right" },
                14: { cellWidth: 12 },
                15: { cellWidth: 16 },
                16: { cellWidth: 14 }
            }
        });

        // ===== SUMMARY SECTION (PDF) =====
        const summaryStartY = doc.lastAutoTable.finalY + 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Summary", 14, summaryStartY);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        const summaryData = [
            ["Total Bookings", filteredSummary.totalBookings],
            ["Total Paid Amount", filteredSummary.totalPaid],
            ["Total To Pay Amount", filteredSummary.totalToPay],
            ["Grand Total", filteredSummary.grandTotal],
            ["Fully Paid Count", summary.paymentBreakdown.fullyPaid],
            ["ToPay Received", summary.paymentBreakdown.partiallyPaid],
            ["To Pay Count", summary.paymentBreakdown.unpaid],
        ];

        doc.autoTable({
            startY: summaryStartY + 4,
            body: summaryData,
            theme: "grid",
            styles: {
                fontSize: 9,
                cellPadding: 2,
                textColor: [0, 0, 0],
                lineWidth: 0.5,
                lineColor: [0, 0, 0],
            },
            columnStyles: {
                0: { fontStyle: "bold" },
                1: {
                    halign: "right",
                    cellHook: function (cell) {
                        if (typeof cell.raw === "number") {
                            cell.text = [`₹ ${cell.raw}`];
                        }
                    }
                }
            }
        });

        // ===== FOOTER =====
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 200, { align: "center" });
        }

        doc.save(`Booking_Report_${fromDate}_to_${toDate}.pdf`);
    };

    const downloadBookingExcel = () => {
        const data = sortedBookings.map((b, index) => {
            const item = b.items?.[0] || {};

            let paidAmount = 0;
            let toPayAmount = 0;

            const paidItems =
                b.items?.filter(
                    x => x.toPay?.toLowerCase() === "paid"
                ) || [];

            const topayItems =
                b.items?.filter(
                    x => x.toPay?.toLowerCase() === "topay"
                ) || [];

            // Mixed booking
            if (
                paidItems.length > 0 &&
                topayItems.length > 0
            ) {

                paidAmount = paidItems.reduce(
                    (sum, item) =>
                        sum +
                        Number(item.insuranceTotalWithGST || 0),
                    0
                );

                toPayAmount = Number(
                    b.deliveryPendingAmount ||
                    b.grandTotal ||
                    0
                );

            }
            // Fully Paid
            else if (b.paymentStatus === "Paid") {

                paidAmount =
                    Number(b.grandTotal || 0);

            }
            // Fully ToPay
            else {

                toPayAmount =
                    Number(b.grandTotal || 0);

            }

            const insVpp =
                Number(b.ins_vpp || 0);

            const totalAmount =
                Number(b.grandTotal || 0);
            const gst =
                (b.cgst || 0) +
                (b.sgst || 0) +
                (b.igst || 0);

            const bilty = 20;

            return {
                "S.No": index + 1,
                "Booking ID": b.bookingId,
                "Booking Date": new Date(b.bookingDate).toLocaleDateString("en-GB"),
                "Bilty No": item.receiptNo || "",
                "Ref No": item.refNo || "",
                "Sender": b.senderName,
                "Receiver": b.receiverName,
                "Route": `${b.startStationName} - ${b.endStationName}`,
                "QT": item.quantity || 0,
                "Weight": item.weight || 0,
                "INS / VPP": insVpp,
                "Bilty": bilty,
                "GST (%)": gst,
                "Paid": paidAmount,
                "To Pay": toPayAmount,
                "Receive ToPay":
                    b.deliveryPendingAmount > 0
                        ? "Pending"
                        : "Received",
                "Total": totalAmount
            };

        });
        // ===== SUMMARY ROWS (EXCEL) =====
        data.push({});
        data.push({ "Booking ID": "SUMMARY" });

        data.push({ "Booking ID": "Total Bookings", "Total": filteredSummary.totalBookings });
        data.push({ "Booking ID": "Total Paid Amount", "Total": Number(filteredSummary.totalPaid) });
        data.push({ "Booking ID": "Total To Pay Amount", "Total": Number(filteredSummary.totalToPay) });
        data.push({ "Booking ID": "Grand Total", "Total": Number(filteredSummary.grandTotal) });
        data.push({ "Booking ID": "Fully Paid Count", "Total": summary.paymentBreakdown.fullyPaid });
        data.push({
            "Booking ID": "ToPay Received",
            "Total": summary.paymentBreakdown.partiallyPaid
        });
        data.push({ "Booking ID": "To Pay Count", "Total": summary.paymentBreakdown.unpaid });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Booking Report");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const fileData = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        saveAs(fileData, `Booking_Report_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                {/* Header with Date Range */}
                <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight={600} gutterBottom>
                        📋 Booking Report
                    </Typography>
                    <Typography variant="h6">
                        📅 From: {fromDate} to {toDate}
                    </Typography>
                </Paper>

                {/* Summary Cards */}
                {summary && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box>
                                        <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Total Bookings
                                        </Typography>
                                        <Typography variant="h4" fontWeight={700}>
                                            {summary.totalBookings}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box>
                                        <AccountBalanceWalletIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Grand Total
                                        </Typography>
                                        <Typography variant="h4" fontWeight={700}>
                                            ₹{filteredSummary.grandTotal.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box>
                                        <PaidIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Amount Paid
                                        </Typography>
                                        <Typography variant="h4" fontWeight={700}>
                                            ₹{filteredSummary.totalPaid.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box>
                                        <PendingActionsIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Balance Due
                                        </Typography>
                                        <Typography variant="h4" fontWeight={700}>
                                            ₹{filteredSummary.totalToPay.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Filters Section */}
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Filters & Search
                            </Typography>
                        </Grid>

                        {/* Search Bar */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                placeholder="Search Booking ID, Name, City..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchText && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchText('')}>
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        {/* From City Dropdown */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Autocomplete
                                options={stations.map((s) => s.stationName)}
                                value={fromCity}
                                onChange={(e, value) => setFromCity(value || '')}
                                renderInput={(params) => (
                                    <TextField {...params} label="From City" />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Typography variant="body2">{option}</Typography>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* To City Dropdown */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Autocomplete
                                options={stations.map((s) => s.stationName)}
                                value={toCity}
                                onChange={(e, value) => setToCity(value || '')}
                                renderInput={(params) => (
                                    <TextField {...params} label="To City" />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Typography variant="body2">{option}</Typography>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* Active Filters Info */}
                        {(fromCity || toCity || searchText) && (
                            <Grid size={{ xs: 12 }}>
                                <Alert
                                    severity="info"
                                    sx={{ mt: 1 }}
                                    action={
                                        <IconButton
                                            aria-label="clear"
                                            color="inherit"
                                            size="small"
                                            onClick={() => {
                                                setFromCity('');
                                                setToCity('');
                                                setSearchText('');
                                            }}
                                        >
                                            <ClearIcon fontSize="inherit" />
                                        </IconButton>
                                    }
                                >
                                    Active Filters:
                                    {fromCity && ` From: ${fromCity}`}
                                    {toCity && ` To: ${toCity}`}
                                    {searchText && ` Search: "${searchText}"`}
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Bookings Table */}
                <Paper elevation={3} sx={{ p: 3 }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" my={4}>
                            <CircularProgress />
                        </Box>
                    ) : filteredBookings.length === 0 ? (
                        <Alert severity="info">
                            No bookings found for the selected filters.
                        </Alert>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Bookings ({filteredBookings.length} found)
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <IconButton color="error" onClick={downloadBookingPDF}>
                                        <PictureAsPdfIcon />
                                    </IconButton>
                                    <IconButton color="success" onClick={downloadBookingExcel}>
                                        <TableChartIcon />
                                    </IconButton>
                                </Box>
                            </Box>

                            <TableContainer sx={{ maxHeight: 600 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "primary.main" }}>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>S.No</TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>Booking ID</TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>Booking Date</TableCell>
                                            <TableCell
                                                sx={{ cursor: "pointer" }}
                                                onClick={() => handleSort("bilty")}
                                            >
                                                Receipt No {sortConfig.key === "bilty" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                                            </TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>Ref No</TableCell>
                                            <TableCell
                                                sx={{ cursor: "pointer" }}
                                                onClick={() => handleSort("sender")}
                                            >
                                                Sender {sortConfig.key === "sender" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                                            </TableCell>
                                            <TableCell
                                                sx={{ cursor: "pointer" }}
                                                onClick={() => handleSort("receiver")}
                                            >
                                                Receiver {sortConfig.key === "receiver" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                                            </TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>Route</TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>QT</TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>Weight</TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>Amount Details</TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>Paid</TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>To Pay</TableCell>
                                            <TableCell sx={{ ...oneLineCell, fontWeight: "bold", fontSize: "13px" }}>Receive ToPay</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {paginatedBookings.map((booking, index) => {

                                            const item = booking.items?.[0] || {};

                                            const paidItem = booking.items?.find(
                                                x => x.toPay?.toLowerCase() === "paid"
                                            );

                                            const topayItem = booking.items?.find(
                                                x => x.toPay?.toLowerCase() === "topay"
                                            );

                                            const payType = (topayItem?.toPay || "").toLowerCase();

                                            const grandTotal = booking.grandTotal || 0;

                                            const paidValue =
                                                paidItem
                                                    ? (
                                                        Number(paidItem.amount || 0) +
                                                        Number(paidItem.insuranceTotalWithGST || 0)
                                                    )
                                                    : (
                                                        booking.paymentStatus === "Paid"
                                                            ? Number(booking.paidAmount || booking.pickupCollectedAmount || 0)
                                                            : 0
                                                    );

                                            const toPayValue =
                                                topayItem
                                                    ? Number(
                                                        booking.deliveryPendingAmount ||
                                                        booking.grandTotal ||
                                                        0
                                                    )
                                                    : 0;

                                            const amount =
                                                Number(topayItem?.amount) ||
                                                Number(paidItem?.amount) ||
                                                Number(booking.freight) ||
                                                0;

                                            const insVpp =
                                                Number(paidItem?.insuranceAmount) ||
                                                Number(topayItem?.insuranceAmount) ||
                                                Number(booking.ins_vpp) ||
                                                0;

                                            const bilty = 20;

                                            const gst =
                                                (booking.cgst || 0) +
                                                (booking.sgst || 0) +
                                                (booking.igst || 0);

                                            return (
                                                <TableRow
                                                    key={booking._id}
                                                    hover
                                                    sx={{
                                                        "& td": {
                                                            padding: "4px 8px",   // 🔥 MAIN FIX
                                                            fontSize: "12px"
                                                        },
                                                        "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                                                        "&:hover": { bgcolor: "action.selected" }
                                                    }}
                                                >
                                                    {/* S.No */}
                                                    <TableCell sx={oneLineCell}>
                                                        {page * rowsPerPage + index + 1}
                                                    </TableCell>

                                                    {/* Booking ID */}
                                                    <TableCell sx={oneLineCell}>
                                                        <Typography fontWeight="bold" color="primary">
                                                            {booking.bookingId}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={oneLineCell}>
                                                        {new Date(booking.bookingDate).toLocaleDateString("en-GB")}
                                                    </TableCell>

                                                    {/* Receipt No */}
                                                    <TableCell sx={oneLineCell}>
                                                        {booking.items?.[0]?.receiptNo || "-"}
                                                    </TableCell>

                                                    {/* Ref No */}
                                                    <TableCell sx={oneLineCell}>
                                                        {booking.items?.[0]?.refNo || "-"}
                                                    </TableCell>

                                                    {/* Sender */}
                                                    <TableCell sx={{ ...oneLineCell, maxWidth: 220 }}>
                                                        {booking.senderName}
                                                    </TableCell>

                                                    {/* Receiver */}
                                                    <TableCell sx={{ ...oneLineCell, maxWidth: 220 }}>
                                                        {booking.receiverName}
                                                    </TableCell>

                                                    {/* Route */}
                                                    <TableCell sx={oneLineCell}>
                                                        {booking.startStationName} - {booking.endStationName}
                                                    </TableCell>

                                                    <TableCell sx={oneLineCell}>
                                                        {booking.items?.[0]?.quantity || 0}
                                                    </TableCell>

                                                    {/* Weight */}
                                                    <TableCell sx={oneLineCell}>
                                                        {booking.items?.[0]?.weight || 0} kg
                                                    </TableCell>

                                                    {/* Amount (ONLY MULTI-LINE COLUMN) */}
                                                    <TableCell>
                                                        <Stack spacing={0.5}>
                                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                                <Typography variant="caption">Amount:</Typography>
                                                                <Typography color="success.main">
                                                                    ₹{amount}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                                <Typography variant="caption">INS / VPP:</Typography>
                                                                <Typography color="info.main">
                                                                    ₹{insVpp}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                                <Typography variant="caption">Bilty:</Typography>
                                                                <Typography color="error.main">
                                                                    ₹{bilty}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                                <Typography variant="caption">GST:</Typography>
                                                                <Typography color="warning.main">{gst}%</Typography>
                                                            </Box>
                                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                                <Typography variant="caption">Total:</Typography>
                                                                <Typography color="error.main">₹{grandTotal}</Typography>
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>

                                                    <TableCell sx={oneLineCell}>
                                                        {paidValue > 0 ? `₹${paidValue}` : "-"}
                                                    </TableCell>

                                                    <TableCell sx={oneLineCell}>
                                                        {toPayValue > 0 ? `₹${toPayValue}` : "-"}
                                                    </TableCell>
                                                    <TableCell>

                                                        {payType === "topay" ? (

                                                            booking.deliveryPendingAmount > 0 ? (

                                                                <Button
                                                                    variant="contained"
                                                                    color="error"
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleReceiveClick(
                                                                            booking
                                                                        )
                                                                    }
                                                                >

                                                                    Pending

                                                                </Button>

                                                            ) : (

                                                                <Chip
                                                                    label="Received"
                                                                    color="success"
                                                                />

                                                            )

                                                        ) : "-"}

                                                    </TableCell>

                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            <TablePagination
                                component="div"
                                count={filteredBookings.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                rowsPerPageOptions={[10]}
                                showFirstButton
                                showLastButton
                                sx={{
                                    borderTop: '1px solid #e0e0e0',
                                    mt: 2,
                                    '.MuiTablePagination-toolbar': {
                                        justifyContent: 'flex-end',
                                        minHeight: '52px'
                                    }
                                }}
                            />
                        </>
                    )}
                </Paper>

                {/* Detailed Summary */}
                {summary && filteredBookings.length > 0 && (
                    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            📊 Booking Summary
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><strong>Total Bookings</strong></TableCell>
                                            <TableCell align="right">{filteredSummary.totalBookings}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Paid Amount</strong></TableCell>
                                            <TableCell align="right">₹{filteredSummary.totalPaid.toLocaleString()}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>ToPay Amount</strong></TableCell>
                                            <TableCell align="right">₹{filteredSummary.totalToPay.toLocaleString()}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Grand Total</strong></TableCell>
                                            <TableCell align="right">₹{filteredSummary.grandTotal.toLocaleString()}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>
                                                <Chip icon={<PaidIcon />} label="Fully Paid" color="success" size="small" />
                                            </TableCell>
                                            <TableCell align="right">{summary.paymentBreakdown.fullyPaid}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                <Chip icon={<PendingActionsIcon />} label="ToPay Received" color="warning" size="small" />
                                            </TableCell>
                                            <TableCell align="right">{summary.paymentBreakdown.partiallyPaid}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                <Chip icon={<MoneyOffIcon />} label="To Pay" color="error" size="small" />
                                            </TableCell>
                                            <TableCell align="right">{summary.paymentBreakdown.unpaid}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </Container>
            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
            >

                <DialogTitle>
                    Confirm Payment
                </DialogTitle>

                <DialogContent>

                    Amount received confirm?

                    ₹{
                        selectedBooking?.deliveryPendingAmount
                    }

                </DialogContent>

                <DialogActions>

                    <Button
                        onClick={() => setConfirmOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={confirmReceive}
                        color="success"
                        variant="contained"
                        disabled={
                            selectedBooking?.deliveryPendingAmount <= 0
                        }
                    >
                        Confirm
                    </Button>

                </DialogActions>

            </Dialog>
        </>
    );
};

export default ViewBookingByDate;