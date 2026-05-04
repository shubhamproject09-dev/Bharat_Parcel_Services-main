import React, { useEffect, useState, useMemo } from "react";
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    Stack,
    TextField,
} from "@mui/material";
import { Select, MenuItem } from "@mui/material";
import TablePagination from "@mui/material/TablePagination";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestoreIcon from "@mui/icons-material/Restore";
import { useDispatch, useSelector } from "react-redux";
import { listDeletedBookings, restoreBooking } from "../../../features/booking/bookingSlice";
import { fetchDeletedQuotations, restoreQuotation }
    from "../../../features/quotation/quotationSlice";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const Bin = () => {
    const dispatch = useDispatch();
    const [type, setType] = useState("booking"); // default booking
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { deletedBookings, loading, error } = useSelector(
        (state) => state.bookings
    );
    const { deletedQuotations } = useSelector(
        (state) => state.quotations
    );

    const [sortConfig, setSortConfig] = useState({ key: "bookingDate", direction: "asc" });

    // Search states
    const [senderSearch, setSenderSearch] = useState("");
    const [receiverSearch, setReceiverSearch] = useState("");
    const [dateSearch, setDateSearch] = useState("");

    useEffect(() => {
        dispatch(listDeletedBookings());
        dispatch(fetchDeletedQuotations());
    }, [dispatch]);
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const sortedItems = useMemo(() => {
        let combinedData = [];

        if (type === "booking") {
            combinedData = deletedBookings || [];
        } else {
            combinedData = deletedQuotations || [];
        }

        if (!combinedData.length) return [];

        // Filtering
        let filtered = [...combinedData].filter((item) => {
            const senderMatch = (
                item.senderName || item.fromCustomerName || ""
            )
                .toLowerCase()
                .includes(senderSearch.toLowerCase());

            const receiverMatch = (
                item.receiverName || item.toCustomerName || ""
            )
                .toLowerCase()
                .includes(receiverSearch.toLowerCase());

            const dateValue = item.bookingDate || item.quotationDate;

            const dateMatch = dateSearch
                ? new Date(dateValue).toLocaleDateString("en-GB").includes(dateSearch)
                : true;
            return senderMatch && receiverMatch && dateMatch;
        });

        // Sorting
        return filtered.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (!aValue || !bValue) return 0;

            if (sortConfig.key.toLowerCase().includes("date")) {
                return sortConfig.direction === "asc"
                    ? new Date(aValue) - new Date(bValue)
                    : new Date(bValue) - new Date(aValue);
            }
            return sortConfig.direction === "asc"
                ? aValue.toString().localeCompare(bValue.toString())
                : bValue.toString().localeCompare(aValue.toString());
        });
    }, [type, deletedBookings, deletedQuotations, sortConfig, senderSearch, receiverSearch, dateSearch]);

    const handleRestore = (item) => {
        const confirmRestore = window.confirm("Are you sure you want to restore this item?");
        if (!confirmRestore) return;

        if (item.items) {
            dispatch(restoreBooking(item._id)); // booking
        } else {
            dispatch(restoreQuotation(item._id)); // quotation
        }
    };

    return (
        <Box sx={{ p: 4, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            <Paper elevation={4} sx={{ p: 4, borderRadius: 3, background: "linear-gradient(135deg, #fff, #fef5f5)" }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <DeleteOutlineIcon sx={{ fontSize: 55, color: "#e63946", mr: 2 }} />
                    <Typography variant="h4" fontWeight="bold" color="error.dark">
                        Recycle Bin
                    </Typography>
                </Box>

                {/* Search Fields */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
                    <TextField
                        label="Search Sender"
                        variant="outlined"
                        size="small"
                        value={senderSearch}
                        onChange={(e) => setSenderSearch(e.target.value)}
                    />
                    <TextField
                        label="Search Receiver"
                        variant="outlined"
                        size="small"
                        value={receiverSearch}
                        onChange={(e) => setReceiverSearch(e.target.value)}
                    />
                    <Select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        size="small"
                    >
                        <MenuItem value="booking">Delete Booking</MenuItem>
                        <MenuItem value="quotation">Delete Quotation</MenuItem>
                    </Select>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Search Booking Date"
                            value={dateSearch ? new Date(dateSearch) : null}
                            onChange={(newValue) => {
                                if (newValue) {
                                    // Format date as DD/MM/YYYY
                                    const day = String(newValue.getDate()).padStart(2, '0');
                                    const month = String(newValue.getMonth() + 1).padStart(2, '0');
                                    const year = newValue.getFullYear();
                                    setDateSearch(`${day}/${month}/${year}`);
                                } else {
                                    setDateSearch('');
                                }
                            }}
                            renderInput={(params) => <TextField {...params} size="small" />}
                        />
                    </LocalizationProvider>
                </Stack>

                {/* Loader */}
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* Error */}
                {error && (
                    <Typography color="error" align="center" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                {/* Table */}
                {!loading && (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: "#f1f1f1" }}>
                                <TableRow>
                                    {[
                                        "S.No",
                                        "Receipt No",
                                        "Sender Name",
                                        "Receiver Name",
                                        "Pick Up",
                                        "Drop",
                                        "Mobile",
                                        "Booking Date",
                                        "Action"
                                    ].map((head) => (
                                        <TableCell key={head} sx={{ fontWeight: "bold" }}>
                                            {head}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedItems.length ? (
                                    sortedItems
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((item, index) => (
                                            <TableRow key={item._id || index} sx={{ "&:hover": { backgroundColor: "#fff5f5" } }}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    {
                                                        item.items
                                                            ? [...new Set(item.items.map((it) => it.receiptNo))].join(", ")
                                                            : item.productDetails
                                                                ? [...new Set(item.productDetails.map((it) => it.receiptNo))].join(", ")
                                                                : "-"
                                                    }
                                                </TableCell>
                                                <TableCell>{item.senderName || item.fromCustomerName}</TableCell>
                                                <TableCell>{item.receiverName || item.toCustomerName}</TableCell>
                                                <TableCell>{item.fromCity}</TableCell>
                                                <TableCell>{item.toCity}</TableCell>
                                                <TableCell>{item.mobile}</TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const date = item.bookingDate || item.quotationDate;
                                                        return date
                                                            ? new Date(date).toLocaleDateString("en-GB")
                                                            : "-";
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction={'row'}>
                                                        <IconButton
                                                            color="success"
                                                            onClick={() => handleRestore(item)}
                                                            title="Restore"
                                                        >
                                                            <RestoreIcon />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                            <DeleteOutlineIcon sx={{ fontSize: 60, color: "#ccc" }} />
                                            <Typography variant="h6" color="textSecondary" mt={2}>
                                                No deleted items found.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={sortedItems.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};

export default Bin;