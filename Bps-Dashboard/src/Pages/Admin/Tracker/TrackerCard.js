import React, { useState } from "react";
import {
    Typography,
    Button,
    Paper,
    CircularProgress,
    Stack,
    Grid,
    Box,
    alpha,
    Fade,
    Zoom,
    Chip,
    Divider
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CustomerSearch from "../../../Components/CustomerSearch";
import { BOOKINGS_API } from "../../../utils/api";
import InvoiceDownloadHistory
    from "./InvoiceDownloadHistory";
import { useNavigate }
    from "react-router-dom";
import {
    Receipt as ReceiptIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as PaidIcon,
    PendingActions as ToPayIcon,
    Error as ErrorIcon,
    Download as DownloadIcon,
    Person as PersonIcon,
    DateRange as DateRangeIcon
} from "@mui/icons-material";

const TrackerCard = () => {
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [invoiceType, setInvoiceType] = useState("paid");
    const [success, setSuccess] = useState(false);
    const [
        historyOpen,
        setHistoryOpen
    ] = useState(false);
    const navigate = useNavigate();

    const formatLocalDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const handleGenerateInvoice = async () => {
        if (!selectedCustomer || !fromDate || !toDate) {
            setErrorMsg("Please fill in all fields");
            return;
        }

        setErrorMsg("");
        setLoading(true);
        setSuccess(false);

        try {
            const response = await fetch(`${BOOKINGS_API}/invoice`, {
                method: "POST",
                headers: {

                    "Content-Type": "application/json",

                    Authorization:
                        `Bearer ${localStorage.getItem("authToken")}`

                },
                body: JSON.stringify({
                    customerName: selectedCustomer.name,
                    fromDate: formatLocalDate(fromDate),
                    toDate: formatLocalDate(toDate),
                    invoiceType,
                }),
            });

            if (response.ok && response.headers.get("content-type")?.includes("pdf")) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedCustomer.name}_${invoiceType}_Invoice.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const data = await response.json();
                setErrorMsg(data.message || "Failed to generate invoice");
            }
        } catch (error) {
            setErrorMsg(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Button

                variant="contained"

                size="small"

                color="error"

                onClick={() =>
                    navigate(
                        "/pending-invoice-bilty"
                    )
                }

                sx={{
                    whiteSpace: "nowrap",
                    minWidth: "180px",
                    borderRadius: 2
                }}

            >

                Invoice Pending Bilty

            </Button>
            <Fade in={true} timeout={800}>
                <Paper
                    elevation={0}
                    sx={{
                        maxWidth: 550,
                        mx: "auto",
                        mt: 6,
                        borderRadius: 4,
                        background: "#ffffff",
                        border: "1px solid",
                        borderColor: "grey.100",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                            boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
                        }
                    }}
                >
                    <Box sx={{ p: 4 }}>
                        {/* Header */}
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                                <Box
                                    sx={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: 2,
                                        background: "linear-gradient(145deg, #f8f9ff, #eef0f7)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                    }}
                                >
                                    <ReceiptIcon sx={{ fontSize: 28, color: "#2563eb" }} />
                                </Box>
                            </Zoom>

                            <Box>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: "#1e293b",
                                        letterSpacing: "-0.5px",
                                    }}
                                >
                                    Invoice Generator
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: "#64748b",
                                        fontWeight: 400,
                                    }}
                                >
                                    Create and download customer invoices
                                </Typography>
                            </Box>
                            <Button

                                variant="outlined"

                                size="small"

                                onClick={() =>
                                    navigate(
                                        "/invoice-download-history"
                                    )
                                }

                                sx={{
                                    whiteSpace: "nowrap",
                                    minWidth: "140px"
                                }}

                            >

                                Download List

                            </Button>
                        </Stack>

                        {/* Invoice Type Selector */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 0.5,
                                mb: 4,
                                borderRadius: 3,
                                backgroundColor: "#f8fafc",
                                border: "1px solid",
                                borderColor: "grey.200",
                            }}
                        >
                            <Stack direction="row" spacing={0.5}>
                                <Button
                                    fullWidth
                                    variant={invoiceType === "paid" ? "contained" : "text"}
                                    onClick={() => setInvoiceType("paid")}
                                    startIcon={<PaidIcon />}
                                    disableRipple={invoiceType === "paid"}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2.5,
                                        fontWeight: 600,
                                        textTransform: "none",
                                        fontSize: "0.95rem",
                                        backgroundColor: invoiceType === "paid" ? "#2563eb" : "transparent",
                                        color: invoiceType === "paid" ? "#ffffff" : "#475569",
                                        boxShadow: invoiceType === "paid" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none",
                                        "&:hover": {
                                            backgroundColor: invoiceType === "paid" ? "#2563eb" : "#f1f5f9",
                                        }
                                    }}
                                >
                                    Paid Invoice
                                </Button>

                                <Button
                                    fullWidth
                                    variant={invoiceType === "toPay" ? "contained" : "text"}
                                    onClick={() => setInvoiceType("toPay")}
                                    startIcon={<ToPayIcon />}
                                    disableRipple={invoiceType === "toPay"}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2.5,
                                        fontWeight: 600,
                                        textTransform: "none",
                                        fontSize: "0.95rem",
                                        backgroundColor: invoiceType === "toPay" ? "#e11d48" : "transparent",
                                        color: invoiceType === "toPay" ? "#ffffff" : "#475569",
                                        boxShadow: invoiceType === "toPay" ? "0 4px 12px rgba(225, 29, 72, 0.3)" : "none",
                                        "&:hover": {
                                            backgroundColor: invoiceType === "toPay" ? "#e11d48" : "#f1f5f9",
                                        }
                                    }}
                                >
                                    To Pay Invoice
                                </Button>
                            </Stack>
                        </Paper>

                        {/* Form */}
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, mb: 0.5, display: "block" }}>
                                    Customer Details
                                </Typography>
                                <CustomerSearch
                                    onCustomerSelect={setSelectedCustomer}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: "outlined",
                                            placeholder: "Search customer...",
                                            sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    backgroundColor: "#ffffff",
                                                    borderRadius: 2,
                                                    "& fieldset": {
                                                        borderColor: "#e2e8f0",
                                                    },
                                                    "&:hover fieldset": {
                                                        borderColor: "#94a3b8",
                                                    },
                                                    "&.Mui-focused fieldset": {
                                                        borderColor: "#2563eb",
                                                        borderWidth: "2px",
                                                    }
                                                }
                                            }
                                        },
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, mb: 0.5, display: "block" }}>
                                    Date Range
                                </Typography>
                            </Grid>

                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <Grid size={{ xs: 6 }}>
                                    <DatePicker
                                        label="From Date"
                                        value={fromDate}
                                        format="dd/MM/yyyy"
                                        onChange={setFromDate}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                variant: "outlined",
                                                size: "small",
                                                sx: {
                                                    "& .MuiOutlinedInput-root": {
                                                        backgroundColor: "#ffffff",
                                                        borderRadius: 2,
                                                        "& fieldset": {
                                                            borderColor: "#e2e8f0",
                                                        },
                                                        "&:hover fieldset": {
                                                            borderColor: "#94a3b8",
                                                        },
                                                        "&.Mui-focused fieldset": {
                                                            borderColor: "#2563eb",
                                                            borderWidth: "2px",
                                                        }
                                                    },
                                                    "& .MuiInputLabel-root": {
                                                        color: "#64748b",
                                                        fontSize: "0.95rem",
                                                    }
                                                }
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <DatePicker
                                        label="To Date"
                                        value={toDate}
                                        format="dd/MM/yyyy"
                                        onChange={setToDate}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                variant: "outlined",
                                                size: "small",
                                                sx: {
                                                    "& .MuiOutlinedInput-root": {
                                                        backgroundColor: "#ffffff",
                                                        borderRadius: 2,
                                                        "& fieldset": {
                                                            borderColor: "#e2e8f0",
                                                        },
                                                        "&:hover fieldset": {
                                                            borderColor: "#94a3b8",
                                                        },
                                                        "&.Mui-focused fieldset": {
                                                            borderColor: "#2563eb",
                                                            borderWidth: "2px",
                                                        }
                                                    },
                                                    "& .MuiInputLabel-root": {
                                                        color: "#64748b",
                                                        fontSize: "0.95rem",
                                                    }
                                                }
                                            },
                                        }}
                                    />
                                </Grid>
                            </LocalizationProvider>

                            {errorMsg && (
                                <Grid size={{ xs: 12 }}>
                                    <Fade in={true}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                backgroundColor: "#fef2f2",
                                                border: "1px solid",
                                                borderColor: "#fee2e2",
                                                borderRadius: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <ErrorIcon sx={{ color: "#dc2626", fontSize: 20 }} />
                                            <Typography color="#dc2626" variant="body2" sx={{ fontWeight: 500 }}>
                                                {errorMsg}
                                            </Typography>
                                        </Box>
                                    </Fade>
                                </Grid>
                            )}

                            {success && (
                                <Grid size={{ xs: 12 }}>
                                    <Fade in={true}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                backgroundColor: "#f0fdf4",
                                                border: "1px solid",
                                                borderColor: "#dcfce7",
                                                borderRadius: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <PaidIcon sx={{ color: "#16a34a", fontSize: 20 }} />
                                            <Typography color="#16a34a" variant="body2" sx={{ fontWeight: 500 }}>
                                                Invoice generated successfully!
                                            </Typography>
                                        </Box>
                                    </Fade>
                                </Grid>
                            )}

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={handleGenerateInvoice}
                                    disabled={loading}
                                    startIcon={!loading && <DownloadIcon />}
                                    sx={{
                                        py: 1.8,
                                        background: "linear-gradient(145deg, #2563eb, #1d4ed8)",
                                        fontWeight: 600,
                                        fontSize: "1rem",
                                        textTransform: "none",
                                        borderRadius: 2.5,
                                        boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            background: "linear-gradient(145deg, #1d4ed8, #1e40af)",
                                            boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
                                        },
                                        "&:disabled": {
                                            background: "#e2e8f0",
                                            color: "#94a3b8",
                                        }
                                    }}
                                >
                                    {loading ? (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <CircularProgress size={22} sx={{ color: "#ffffff" }} />
                                            <Typography>Generating Invoice...</Typography>
                                        </Stack>
                                    ) : (
                                        "Generate Invoice"
                                    )}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Fade>
        </Box>
    );
};

export default TrackerCard;