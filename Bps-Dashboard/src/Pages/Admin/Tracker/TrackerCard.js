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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip
} from "@mui/material";

import {
    History as HistoryIcon,
    Assessment as AssessmentIcon,
    Close as CloseIcon
} from "@mui/icons-material";

const TrackerCard = () => {
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [invoiceType, setInvoiceType] = useState("paid");
    const [success, setSuccess] = useState(false);
    const [invoiceDate, setInvoiceDate] = useState(null);
    const [caModalOpen, setCaModalOpen] = useState(false);
    const [caFromDate, setCaFromDate] = useState(null);
    const [caToDate, setCaToDate] = useState(null);
    const [caLoading, setCaLoading] = useState(false);
    const [caHistoryOpen, setCaHistoryOpen] = useState(false);
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

    const getMonthsBetween = (fromDate, toDate) => {

        const months = [];
        const current = new Date(fromDate);

        current.setDate(1);

        while (current <= new Date(toDate)) {

            months.push(
                current.toLocaleString("en-IN", {
                    month: "long"
                })
            );

            current.setMonth(
                current.getMonth() + 1
            );
        }

        return [...new Set(months)].join(", ");
    };

    const handleGenerateInvoice = async () => {
        if (
            !selectedCustomer ||
            !fromDate ||
            !toDate ||
            !invoiceDate
        ) {
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
                    invoiceDate:
                        formatLocalDate(invoiceDate),
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

    const handleGenerateCAReport = async () => {

        if (!caFromDate || !caToDate) {

            setErrorMsg("Please select from and to date");

            return;
        }

        try {

            setCaLoading(true);

            const response = await fetch(
                `${BOOKINGS_API}/ca-report`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        Authorization:
                            `Bearer ${localStorage.getItem("authToken")}`
                    },

                    body: JSON.stringify({

                        fromDate: formatLocalDate(caFromDate),

                        toDate: formatLocalDate(caToDate)

                    })
                }
            );

            if (!response.ok) {

                const err = await response.json();

                throw new Error(err.message);
            }

            const data = await response.json();

            // PDF Generate Frontend Side

            const rows = data.data || [];

            const totalInvoices = rows.length;

            const totalAmount = rows.reduce(
                (sum, r) => sum + Number(r.totalAmount || 0),
                0
            );

            const totalCGST = rows.reduce(
                (sum, r) =>
                    sum + Number(r.cgstAmount || 0),
                0
            );

            const totalSGST = rows.reduce(
                (sum, r) =>
                    sum + Number(r.sgstAmount || 0),
                0
            );

            const totalIGST = rows.reduce(
                (sum, r) =>
                    sum + Number(r.igstAmount || 0),
                0
            );

            const totalBilty = rows.reduce(
                (sum, r) => sum + Number(r.biltyAmount || 0),
                0
            );

            const totalGrand = rows.reduce(
                (sum, r) => sum + Number(r.grandTotal || 0),
                0
            );

            const monthText =
                getMonthsBetween(
                    caFromDate,
                    caToDate
                );
            const formatDisplayDate = (date) => {

                const d = new Date(date);

                const day =
                    String(d.getDate())
                        .padStart(2, "0");

                const month =
                    String(d.getMonth() + 1)
                        .padStart(2, "0");

                const year =
                    d.getFullYear();

                return `${day}-${month}-${year}`;
            };

            const doc = new jsPDF("p", "mm", "a4");

            // Header
            doc.setFillColor(21, 101, 192);
            doc.rect(0, 0, 210, 35, "F");

            doc.setTextColor(255, 255, 255); // White Text

            doc.setFont("helvetica", "bold");

            doc.setFontSize(22);

            doc.text(
                "Bharat Parcel Services Pvt. Ltd.",
                105,
                11,
                { align: "center" }
            );

            doc.setFontSize(12);

            doc.text(
                "CA REPORT",
                105,
                19,
                { align: "center" }
            );

            doc.setFontSize(8);

            doc.text(
                data.stationAddress || "",
                105,
                25,
                { align: "center" }
            );

            doc.text(
                `GSTIN : ${data.stationGST || ""}`,
                105,
                30,
                { align: "center" }
            );

            doc.setTextColor(0, 0, 0);

            doc.setFontSize(10);

            doc.text(
                `Period : ${formatDisplayDate(caFromDate)} To ${formatDisplayDate(caToDate)}`,
                105,
                40,
                { align: "center" }
            );

            doc.text(
                `Months : ${monthText}`,
                105,
                45,
                { align: "center" }
            );
            doc.setFont("helvetica", "bold");

            doc.text(
                "SAC Code : 9968",
                105,
                50,
                { align: "center" }
            );

            doc.setFont("helvetica", "normal");

            // Table

            autoTable(doc, {
                startY: 60,

                margin: {
                    left: 8,
                    right: 8
                },

                head: [[
                    "S No",
                    "Invoice No",
                    "Invoice Date",
                    "Bill Name",
                    "GST No",
                    "Amount",
                    "CGST 9%",
                    "SGST 9%",
                    "IGST 18%",
                    "Bilty",
                    "Grand Total",
                ]],

                body: rows.map(r => [
                    r.sNo,
                    r.invoiceNumber,
                    r.invoiceDate,
                    r.billName,
                    r.gstNo,
                    Math.round(r.totalAmount || 0),
                    Math.round(r.cgstAmount || 0),
                    Math.round(r.sgstAmount || 0),
                    Math.round(r.igstAmount || 0),
                    Math.round(r.biltyAmount || 0),
                    Math.round(r.grandTotal || 0)
                ]),

                styles: {
                    fontSize: 8
                },

                headStyles: {
                    fillColor: [21, 101, 192]
                },

                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                }
            });

            // Footer Summary
            let finalY = doc.lastAutoTable.finalY + 8;

            // Agar summary ke liye jagah nahi hai to naya page add karo
            if (finalY + 80 > 280) {
                doc.addPage();
                finalY = 20;
            }

            // Shadow Effect
            doc.setFillColor(220, 220, 220);
            doc.roundedRect(
                110,
                finalY + 2,
                90,
                75,
                4,
                4,
                "F"
            );

            // Main Card
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(
                108,
                finalY,
                90,
                75,
                4,
                4,
                "F"
            );

            // Header
            doc.setFillColor(25, 118, 210);
            doc.roundedRect(
                108,
                finalY,
                90,
                12,
                4,
                4,
                "F"
            );

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");

            doc.text(
                "REPORT SUMMARY",
                153,
                finalY + 8,
                { align: "center" }
            );

            doc.setTextColor(0, 0, 0);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            let sy = finalY + 18;

            doc.text(
                `Invoices`,
                114,
                sy
            );

            doc.text(
                `${totalInvoices}`,
                190,
                sy,
                { align: "right" }
            );

            sy += 10;

            doc.text(
                `Amount`,
                114,
                sy
            );

            doc.text(
                `Rs. ${Math.round(totalAmount)}`,
                190,
                sy,
                { align: "right" }
            );

            sy += 10;

            doc.text(
                `CGST`,
                114,
                sy
            );

            doc.text(
                `Rs. ${Math.round(totalCGST)}`,
                190,
                sy,
                { align: "right" }
            );

            sy += 10;

            doc.text(
                `SGST`,
                114,
                sy
            );

            doc.text(
                `Rs. ${Math.round(totalSGST)}`,
                190,
                sy,
                { align: "right" }
            );

            sy += 10;

            doc.text(
                `IGST`,
                114,
                sy
            );

            doc.text(
                `Rs. ${Math.round(totalIGST)}`,
                190,
                sy,
                { align: "right" }
            );

            sy += 10;

            doc.text(
                `Bilty`,
                114,
                sy
            );

            doc.text(
                `Rs. ${Math.round(totalBilty)}`,
                190,
                sy,
                { align: "right" }
            );

            sy += 8;

            doc.setDrawColor(25, 118, 210);
            doc.line(
                114,
                sy - 5,
                192,
                sy - 5
            );

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(46, 125, 50);

            doc.text(
                `Grand Total`,
                114,
                sy
            );

            doc.text(
                `Rs. ${Math.round(totalGrand)}`,
                190,
                sy,
                { align: "right" }
            );

            doc.save(
                `CA_Report_${Date.now()}.pdf`
            );

            setCaModalOpen(false);

        } catch (err) {

            setErrorMsg(err.message);

        } finally {

            setCaLoading(false);
        }
    };

    return (
        <Box>

            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                    mb: 2
                }}
            >

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

                <Stack
                    direction="row"
                    spacing={1}
                >

                    <Button
                        variant="contained"
                        color="success"

                        startIcon={<AssessmentIcon />}

                        onClick={() =>
                            setCaModalOpen(true)
                        }

                        sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600
                        }}
                    >
                        CA Report
                    </Button>

                    <Button
                        variant="outlined"

                        startIcon={<HistoryIcon />}

                        onClick={() =>
                            navigate("/ca-report-history")
                        }

                        sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600
                        }}
                    >
                        CA History
                    </Button>

                </Stack>

            </Stack>
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

                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <Grid size={{ xs: 12, md: 6 }}>

                                    <DatePicker
                                        label="Invoice Date"
                                        value={invoiceDate}

                                        format="dd-MM-yyyy"

                                        onChange={setInvoiceDate}

                                        slotProps={{

                                            field: {
                                                clearable: true,
                                            },

                                            textField: {

                                                fullWidth: true,

                                                variant: "outlined",

                                                size: "small",

                                                placeholder:
                                                    "Select invoice date",

                                                sx: {

                                                    "& .MuiOutlinedInput-root": {

                                                        backgroundColor:
                                                            "#ffffff",

                                                        borderRadius: 2,
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
            <Dialog
                open={caModalOpen}

                onClose={() =>
                    setCaModalOpen(false)
                }

                maxWidth="sm"

                fullWidth
            >

                <DialogTitle
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontWeight: 700
                    }}
                >

                    Generate CA Report

                    <IconButton
                        onClick={() =>
                            setCaModalOpen(false)
                        }
                    >
                        <CloseIcon />
                    </IconButton>

                </DialogTitle>

                <DialogContent>

                    <LocalizationProvider
                        dateAdapter={AdapterDateFns}
                    >

                        <Stack spacing={3} mt={1}>

                            <DatePicker
                                label="From Date"

                                value={caFromDate}

                                onChange={setCaFromDate}

                                slotProps={{
                                    textField: {
                                        fullWidth: true
                                    }
                                }}
                            />

                            <DatePicker
                                label="To Date"

                                value={caToDate}

                                onChange={setCaToDate}

                                slotProps={{
                                    textField: {
                                        fullWidth: true
                                    }
                                }}
                            />

                        </Stack>

                    </LocalizationProvider>

                </DialogContent>

                <DialogActions sx={{ p: 3 }}>

                    <Button
                        onClick={() =>
                            setCaModalOpen(false)
                        }
                    >
                        Cancel
                    </Button>

                    <Button

                        variant="contained"

                        color="success"

                        onClick={
                            handleGenerateCAReport
                        }

                        disabled={caLoading}
                    >

                        {
                            caLoading
                                ? "Generating..."
                                : "Download PDF"
                        }

                    </Button>

                </DialogActions>

            </Dialog>
        </Box>
    );
};

export default TrackerCard;