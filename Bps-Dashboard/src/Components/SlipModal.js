import React, { useRef } from 'react';
import {
    Modal, Box, Typography, Divider, Button, Table, TableHead,
    TableBody, TableRow, TableCell, Paper, Grid, ButtonGroup
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PrintIcon from '@mui/icons-material/Print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CompanyLogo from '../assets/logo2.png';
import companySignature from '../assets/BpsSignature.png';
import moment from "moment-timezone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useDispatch } from "react-redux";
import { sendBookingWhatsapp, sendBookingCancelWhatsapp } from "../features/whatsapp/whatsappSlice";
import { createRoot } from "react-dom/client";
import html2pdf from "html2pdf.js";


const SlipModal = ({ open, handleClose, bookingData }) => {
    const printRef = useRef();
    const dispatch = useDispatch();
    const originalRef = useRef();
    const whatsappRef = useRef();

    const loadImageAsBase64 = (src) =>
        new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });

    if (!bookingData) return null;

    const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";

        if (typeof dateStr === "string" && /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateStr)) {
            return dateStr.replace(/\//g, "-");
        }

        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "N/A";

        const istTime = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));

        const day = String(istTime.getUTCDate()).padStart(2, "0");
        const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
        const year = istTime.getUTCFullYear();

        return `${day}-${month}-${year}`;
    };

    const addresses = [
        { city: "H.O. DELHI", address: "332, Kucha Ghasi Ram, Chandni Chowk, Fatehpuri, Delhi -110006", phone: "011-45138699, 7779993453" },
        { city: "MUMBAI", address: "1, Malharrao Wadi, Gr. Flr., R. No. 4, D.A Lane Kalbadevi Rd., Mumbai-400002", phone: "022-49711975, 7779993454" },
        { city: "KOLKATA", address: "33, Shiv Thakur Lane, Ground Floor, Behind Hari Ram Goenka Street, Kolkata-700007", phone: "9163318515" },
        { city: "AHMEDABAD", address: "1312/13/3,Sahyaba Chambers, Nr. Sharmlani Pole, Manek Complex Pedak Road Rajkot", phone: "7802873827" },
        { city: "JAIPUR", address: "House No. 875, Pink House, Ganga Mata Ki Gali, Gopal Ji Ka Rasta, Jaipur", phone: "09672101700, 9672078005" },
        { city: "AGRA", address: "Shop No. 3, Shriji Plaza, Sainik Place, Kinari Bazar, Agra", phone: "8448554369" }
    ];

    const topAddresses = addresses.slice(0, 2); // Delhi & Mumbai
    const bottomAddresses = addresses.slice(2); // Kolkata, Ahmedabad, Jaipur, Agra

    const biltyAmount = Number(bookingData?.biltyCharge || 0);

    const taxableAmount =
        Number(bookingData?.freight || 0) +
        Number(bookingData?.ins_vpp || 0);

    // Calculate values from API data
    const cgstRate = Number(bookingData?.cgst || 0);
    const sgstRate = Number(bookingData?.sgst || 0);
    const igstRate = Number(bookingData?.igst || 0);

    const cgstAmount = (taxableAmount * cgstRate) / 100;
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const igstAmount = (taxableAmount * igstRate) / 100;

    const billTotal = taxableAmount + biltyAmount;

    const totalBeforeRound = billTotal + cgstAmount + sgstAmount + igstAmount;
    const roundedGrandTotal = Math.round(totalBeforeRound);
    const roundOff = (roundedGrandTotal - totalBeforeRound).toFixed(2);

    const mainItem = bookingData?.items?.find(
        item => Number(item.weight) > 0 || Number(item.amount) > 0
    );

    const totalQuantity = mainItem?.quantity || 0;
    const totalWeight = mainItem?.weight || 0;
    const itemsTotal = mainItem?.amount || 0;

    const Invoice = ({ copyType = "Original" }) => (
        <Paper elevation={0} sx={{
            border: '2px solid #000',
            m: 1,
            p: 1.5,
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            background: copyType === "Duplicate" ? '#f9f9f9' : '#fff',
            height: '100%'
        }}>
            {/* 🔴 CANCEL WATERMARK */}
            {bookingData?.cancelReason && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%) rotate(-35deg)",
                        fontSize: "140px", // 🔥 bada
                        fontWeight: "900",
                        color: "rgba(255, 0, 0, 0.18)", // 🔥 dark kiya
                        zIndex: 0,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        width: "100%",
                        textAlign: "center",
                    }}
                >
                    CANCEL
                    <Typography
                        sx={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: "rgba(255, 0, 0, 0.25)",
                        }}
                    >
                        {bookingData.cancelReason}
                    </Typography>
                </Box>
            )}
            {/* Company Header with Colors */}
            <Grid container alignItems="center" justifyContent="space-between" sx={{
                mb: 1.5,
                pb: 1,
                borderBottom: '2px solid #1a237e'
            }}>
                <Box sx={{ width: '50px' }}>
                    <img
                        src={CompanyLogo}
                        alt="Bharat Parcel Logo"
                        style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'contain'
                        }}
                    />
                </Box>
                <Box textAlign="center" flex={1}>
                    <Typography variant="h6" sx={{
                        fontSize: '16px',
                        lineHeight: 1.2,
                        fontWeight: 'bold',
                        fontFamily: 'Arial, sans-serif',
                        color: '#1a237e',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        BHARAT PARCEL SERVICES PVT. LTD.
                    </Typography>
                    <Typography sx={{
                        fontSize: '10px',
                        lineHeight: 1.2,
                        mt: 0.5,
                        fontFamily: 'Arial, sans-serif',
                        color: '#d32f2f',
                        fontWeight: 'bold'
                    }}>
                        SUBJECT TO {bookingData?.startStation?.stationName} JURISDICTION
                    </Typography>
                    <Box sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 2,
                        mt: 0.5
                    }}>
                        <Typography sx={{
                            fontSize: '9px',
                            fontWeight: "bold",
                            color: '#1a237e'
                        }}>
                            GSTIN : {bookingData?.startStation?.gst}
                        </Typography>

                        <Typography sx={{
                            fontSize: '9px',
                            fontWeight: "bold",
                            color: '#1a237e'
                        }}>
                            PAN : AAECB6506F
                        </Typography>
                    </Box>
                </Box>
                <Box textAlign="right" sx={{
                    backgroundColor: '#f5f5f5',
                    p: 0.5,
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                }}>
                    <Typography sx={{
                        fontSize: '11px',
                        fontWeight: '900',
                        letterSpacing: '1px'
                    }}>
                        BILTY NO: {bookingData?.items?.[0]?.receiptNo || "-"}
                    </Typography>
                    <Typography sx={{
                        fontSize: '11px',
                        fontWeight: '900',
                        fontFamily: 'Arial, sans-serif',
                        mt: 0.5,
                        letterSpacing: '1px'
                    }}>
                        PAYMENT: {bookingData?.items?.[0]?.toPay?.toUpperCase()}
                    </Typography>
                    {bookingData?.cancelReason && (
                        <Typography
                            sx={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                color: "red",
                                mt: 0.5,
                            }}
                        >
                            CANCELLED
                        </Typography>
                    )}
                </Box>
            </Grid>

            {/* Top Addresses (Delhi & Mumbai) */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px dashed #ccc',
                pb: 1,
                mb: 1.5
            }}>
                {topAddresses.map((addr, index) => (
                    <Box key={addr.city} sx={{
                        width: '48%',
                        p: 0.5,
                        backgroundColor: index === 0 ? '#e8f5e9' : '#e3f2fd',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                    }}>
                        <Typography variant="subtitle2" sx={{
                            fontSize: '9px',
                            fontWeight: 600,
                            fontFamily: 'Arial, sans-serif',
                            color: index === 0 ? '#2e7d32' : '#1565c0'
                        }}>
                            {addr.city}:
                        </Typography>
                        <Typography variant="body2" sx={{
                            fontSize: '8px',
                            fontWeight: 500,
                            fontFamily: 'Arial, sans-serif',
                            lineHeight: 1.2,
                            mt: 0.5
                        }}>
                            {addr.address}
                        </Typography>
                        <Typography variant="body2" sx={{
                            fontSize: '8px',
                            fontWeight: 600,
                            fontFamily: 'Arial, sans-serif',
                            color: index === 0 ? '#388e3c' : '#1976d2',
                            mt: 0.5
                        }}>
                            📞 {addr.phone}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Main Content Grid - Left and Right Sections */}
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                {/* Left Column - Booking Details, Route, Sender/Receiver */}
                <Grid size={{ xs: 12, md: 7 }}>
                    {/* Booking ID and Date Row - Compact Design */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1.5,
                        p: 1,
                        backgroundColor: '#f5f5f5',
                        borderRadius: '6px',
                        border: '2px solid #1a237e'
                    }}>
                        <Box>
                            <Typography sx={{
                                fontSize: '10px',
                                color: '#666',
                                fontWeight: 'bold',
                                mb: 0.5
                            }}>
                                BOOKING ID
                            </Typography>
                            <Typography sx={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#1a237e',
                                letterSpacing: '1px'
                            }}>
                                {bookingData?.bookingId}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{
                                fontSize: '10px',
                                color: '#666',
                                fontWeight: 'bold',
                                textAlign: 'right',
                                mb: 0.5
                            }}>
                                Booking DATE
                            </Typography>
                            <Typography sx={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#d32f2f',
                                textAlign: 'right'
                            }}>
                                {formatDate(bookingData?.bookingDate)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Route Section - Colorful Design */}
                    <Box sx={{
                        px: 2,
                        py: 1,
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        background: 'linear-gradient(45deg, #1a237e 0%, #283593 100%)',
                        color: 'white',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}>
                            ROUTE :
                        </Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 'bold' }}>
                            {bookingData?.startStation?.stationName}
                        </Typography>
                        <Typography sx={{ fontSize: '16px', color: '#ffeb3b' }}>
                            ➝
                        </Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 'bold' }}>
                            {bookingData?.endStation?.stationName}
                        </Typography>
                    </Box>

                    {/* Sender and Receiver Section - Modern Design */}
                    <Box sx={{
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                    }}>
                        <Grid container spacing={0}>
                            {/* Sender Details - Blue Theme */}
                            <Grid size={{ xs: 6 }} sx={{
                                borderRight: '2px dashed #ccc',
                                pr: 1.5
                            }}>
                                <Box sx={{
                                    p: 1,
                                    backgroundColor: '#e3f2fd',
                                    borderRadius: '4px',
                                    border: '1px solid #bbdefb'
                                }}>
                                    <Typography sx={{
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: '#1976d2',
                                        mb: 1,
                                        textAlign: 'center'
                                    }}>
                                        SENDER
                                    </Typography>
                                    <Typography sx={{ fontSize: '10px', mb: 0.5 }}>
                                        <strong>Name:</strong> {bookingData?.senderName}
                                    </Typography>
                                    <Typography sx={{ fontSize: '10px', mb: 0.5 }}>
                                        <strong>Contact:</strong> {bookingData?.mobile || 'N/A'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '10px', mb: 0.5 }}>
                                        <strong>City:</strong> {bookingData?.fromCity}
                                    </Typography>
                                    <Typography sx={{ fontSize: '9px' }}>
                                        <strong>GSTIN:</strong> {bookingData?.senderGgt || 'N/A'}
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* Receiver Details - Green Theme */}
                            <Grid size={{ xs: 6 }} sx={{ pl: 1.5 }}>
                                <Box sx={{
                                    p: 1,
                                    backgroundColor: '#e8f5e9',
                                    borderRadius: '4px',
                                    border: '1px solid #c8e6c9'
                                }}>
                                    <Typography sx={{
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: '#388e3c',
                                        mb: 1,
                                        textAlign: 'center'
                                    }}>
                                        RECEIVER
                                    </Typography>
                                    <Typography sx={{ fontSize: '10px', mb: 0.5 }}>
                                        <strong>Name:</strong> {bookingData?.receiverName}
                                    </Typography>
                                    <Typography sx={{ fontSize: '10px', mb: 0.5 }}>
                                        <strong>Contact:</strong> {bookingData?.receiverContact || 'N/A'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '10px', mb: 0.5 }}>
                                        <strong>City:</strong> {bookingData?.toCity}
                                    </Typography>
                                    <Typography sx={{ fontSize: '9px' }}>
                                        <strong>GSTIN:</strong> {bookingData?.receiverGgt || 'N/A'}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>

                {/* Right Column - 4 Addresses (Kolkata, Ahmedabad, Jaipur, Agra) */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{
                        border: '2px solid #5d4037',
                        p: 1,
                        borderRadius: '6px',
                        backgroundColor: '#efebe9',
                        height: '90%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>

                        <Grid container spacing={0.8}>
                            {bottomAddresses.map((addr, index) => (
                                <Grid key={index} size={{ xs: 6 }}>
                                    <Box sx={{
                                        border: '1px solid #d7ccc8',
                                        p: 0.8,
                                        borderRadius: '4px',
                                        backgroundColor: '#fff',
                                        height: '100%',
                                        minHeight: '75px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        <Typography sx={{
                                            fontSize: '9px',
                                            fontWeight: 'bold',
                                            color: '#d84315',
                                            mb: 0.3
                                        }}>
                                            {addr.city}
                                        </Typography>
                                        <Typography sx={{
                                            fontSize: '8px',
                                            lineHeight: 1.2,
                                            color: '#424242'
                                        }}>
                                            {addr.address}
                                        </Typography>
                                        <Typography sx={{
                                            fontSize: '8px',
                                            fontWeight: 600,
                                            color: '#1565c0',
                                            mt: 0.3
                                        }}>
                                            📞 {addr.phone}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Grid>
            </Grid>

            {/* Items Table with Colorful Header */}

            {bookingData?.items?.length === 1 ? (

                <Table size="small" sx={{
                    border: '2px solid #1a237e',
                    mb: 1.5,
                    '& .MuiTableCell-root': {
                        padding: '3px 4px',
                        fontSize: '10px',
                        lineHeight: 1,
                        fontFamily: 'Arial, sans-serif'
                    }
                }}>
                    <TableHead>
                        <TableRow sx={{
                            background: 'linear-gradient(45deg, #1a237e 0%, #283593 100%)'
                        }}>
                            <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Sr.</TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Receipt No.</TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Ref No.</TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Qty</TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Weight</TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Insurance</TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>VPP</TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Payment</TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Amount</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {bookingData?.items?.map((item, idx) => (
                            <TableRow key={idx} sx={{
                                backgroundColor: idx % 2 === 0 ? '#f5f5f5' : '#fff'
                            }}>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{idx + 1}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{item.receiptNo}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{item.refNo}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{item.quantity || 1}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                                    {item.weight ? `${item.weight} kg` : ""}
                                </TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                                    {formatCurrency(item.insurance)}
                                </TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                                    {formatCurrency(item.vppAmount)}
                                </TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                                    {item.toPay?.toUpperCase()}
                                </TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>
                                    {formatCurrency(
                                        item.amount && Number(item.amount) > 0
                                            ? item.amount
                                            : item.insuranceAmount || 0
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}

                        <TableRow sx={{
                            backgroundColor: '#e8eaf6',
                            borderTop: '2px solid #1a237e'
                        }}>
                            <TableCell colSpan={3} align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>
                                TOTAL
                            </TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>
                                {totalQuantity}
                            </TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>
                                {totalWeight} kg
                            </TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>
                                {formatCurrency(
                                    bookingData?.items?.reduce((sum, item) => sum + (Number(item.insurance) || 0), 0)
                                )}
                            </TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>
                                {formatCurrency(
                                    bookingData?.items?.reduce((sum, item) => sum + (Number(item.vppAmount) || 0), 0)
                                )}
                            </TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>
                                -
                            </TableCell>
                            <TableCell align="center" sx={{ border: "1px solid #ddd", fontWeight: "bold" }}>
                                {formatCurrency(itemsTotal)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

            ) : (

                /* ================= TWO TABLES ================= */

                <>

                    {/* ================= TABLE 1 (MAIN ITEM) ================= */}
                    <Table size="small" sx={{
                        border: '2px solid #1a237e',
                        mb: 1.5,
                        '& .MuiTableCell-root': {
                            padding: '3px 4px',
                            fontSize: '10px',
                            lineHeight: 1,
                            fontFamily: 'Arial, sans-serif'
                        }
                    }}>
                        <TableHead>
                            <TableRow sx={{
                                background: 'linear-gradient(45deg, #1a237e 0%, #283593 100%)'
                            }}>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Sr.</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Receipt No.</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Ref No.</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Qty</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Weight</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Insurance</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>VPP</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Payment</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Amount</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>1</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{bookingData.items[0].receiptNo}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{bookingData.items[0].refNo}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{bookingData.items[0].quantity}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{bookingData.items[0].weight} kg</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{formatCurrency(bookingData.items[0].insurance)}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{formatCurrency(bookingData.items[0].vppAmount)}</TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        border: "1px solid #ddd",
                                        fontSize: "12px",
                                        fontWeight: 900,
                                        letterSpacing: "1px",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    {bookingData.items[0].toPay}
                                </TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{formatCurrency(bookingData.items[0].amount)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>


                    {/* ================= TABLE 2 (INSURANCE BREAKDOWN) ================= */}
                    <Table size="small" sx={{
                        border: '2px solid #1a237e',
                        mb: 1.5,
                        '& .MuiTableCell-root': {
                            padding: '3px 4px',
                            fontSize: '10px',
                            lineHeight: 1,
                            fontFamily: 'Arial, sans-serif'
                        }
                    }}>
                        <TableHead>
                            <TableRow sx={{
                                background: 'linear-gradient(45deg, #1a237e 0%, #283593 100%)'
                            }}>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Sr.</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Receipt No.</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Ref No.</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Insurance</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Ins Amt</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>
                                    To Pay
                                </TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>CGST(9%)</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>SGST(9%)</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #fff", fontWeight: "bold", color: 'white' }}>Total</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>2</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{bookingData.items[1].receiptNo}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{bookingData.items[1].refNo}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{formatCurrency(bookingData.items[1].insurance)}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{formatCurrency(bookingData.items[1].insuranceAmount)}</TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        border: "1px solid #ddd",
                                        fontSize: "12px",
                                        fontWeight: 900,
                                        letterSpacing: "1px",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    {bookingData.items[1].toPay}
                                </TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{formatCurrency(bookingData.items[1].insuranceCgst)}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{formatCurrency(bookingData.items[1].insuranceSgst)}</TableCell>
                                <TableCell align="center" sx={{ border: "1px solid #ddd" }}>{formatCurrency(bookingData.items[1].insuranceTotalWithGST)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                </>
            )}

            {/* Summary Section with Colorful Design */}
            <Box sx={{
                border: '2px solid #1a237e',
                p: 1.2,
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                mb: 1.5
            }}>
                <Grid container spacing={1.5}>
                    {/* Left Side - Items and Bilty */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{
                            p: 1,
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0'
                        }}>
                            <Table size="small" sx={{
                                '& .MuiTableCell-root': {
                                    padding: '1px 2px',
                                    fontSize: '10px',
                                    border: 'none'
                                }
                            }}>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Items Total:</TableCell>
                                        <TableCell align="right">{formatCurrency(itemsTotal)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Insurance / VPP:</TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(bookingData?.ins_vpp)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Bilty Amount:</TableCell>
                                        <TableCell align="right">{formatCurrency(biltyAmount)}</TableCell>
                                    </TableRow>
                                    <TableRow sx={{
                                        borderTop: '2px solid #ccc',
                                        borderBottom: '2px solid #ccc',
                                        backgroundColor: '#f5f5f5'
                                    }}>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#000' }}>Bill Total:</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '11px', color: '#000' }}>
                                            {formatCurrency(billTotal)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    </Grid>

                    {/* Right Side - GST and Grand Total */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{
                            p: 1,
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0'
                        }}>
                            <Table size="small" sx={{
                                '& .MuiTableCell-root': {
                                    padding: '1px 2px',
                                    fontSize: '10px',
                                    border: 'none'
                                }
                            }}>
                                <TableBody>
                                    {cgstRate > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>CGST ({cgstRate}%):</TableCell>
                                            <TableCell align="right">{formatCurrency(cgstAmount)}</TableCell>
                                        </TableRow>
                                    )}
                                    {sgstRate > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>SGST ({sgstRate}%):</TableCell>
                                            <TableCell align="right">{formatCurrency(sgstAmount)}</TableCell>
                                        </TableRow>
                                    )}
                                    {igstRate > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>IGST ({igstRate}%):</TableCell>
                                            <TableCell align="right">{formatCurrency(igstAmount)}</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Round Off:</TableCell>
                                        <TableCell align="right">{formatCurrency(roundOff)}</TableCell>
                                    </TableRow>
                                    <TableRow sx={{
                                        borderTop: '2px solid #d32f2f',
                                        backgroundColor: '#ffebee'
                                    }}>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#d32f2f' }}>GRAND TOTAL:</TableCell>
                                        <TableCell align="right" sx={{
                                            fontWeight: 'bold',
                                            fontSize: '12px',
                                            color: '#d32f2f'
                                        }}>
                                            {formatCurrency(roundedGrandTotal)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Signature Section with Modern Design */}
            <Box sx={{
                mt: 2,
                pt: 1.5,
                borderTop: '2px dashed #5d4037',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
            }}>
                {/* Left Signature - Customer */}
                <Box sx={{ width: '45%', textAlign: 'center' }}>
                    <Typography sx={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#5d4037',
                        borderTop: '2px solid #5d4037',
                        paddingTop: '10px',
                        marginTop: '20px',
                        backgroundColor: '#f5f5f5',
                        p: 0.5,
                        borderRadius: '4px'
                    }}>
                        CUSTOMER SIGNATURE
                    </Typography>
                    <Typography sx={{
                        fontSize: '9px',
                        color: '#666',
                        marginTop: '3px'
                    }}>
                        (With Company Stamp)
                    </Typography>
                </Box>

                {/* Right Signature - Company */}
                <Box sx={{ width: '45%', textAlign: 'center' }}>
                    <Box sx={{
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        p: 0.5
                    }}>
                        <img
                            src={companySignature}
                            alt="Authorized Signature"
                            style={{
                                maxHeight: '40px',
                                maxWidth: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    </Box>

                    <Typography sx={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#1a237e',
                        borderTop: '2px solid #1a237e',
                        paddingTop: '8px',
                        backgroundColor: '#f5f5f5',
                        p: 0.5,
                        borderRadius: '4px'
                    }}>
                        FOR BHARAT PARCEL SERVICES PVT. LTD.
                    </Typography>

                    <Typography sx={{
                        fontSize: '9px',
                        color: '#666',
                        marginTop: '3px'
                    }}>
                        Authorized Signatory
                    </Typography>
                </Box>
            </Box>

        </Paper>
    );

    const generatePdfBlob = async () => {
        const element = whatsappRef.current;

        const opt = {
            margin: 0,   // 🔥 remove margin
            filename: "booking.pdf",
            image: { type: "jpeg", quality: 1 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                dpi: 300
            },
            jsPDF: {
                unit: "mm",
                format: "a4",
                orientation: "portrait"
            },
            pagebreak: {
                mode: ["avoid-all", "css", "legacy"]  // 🔥 ADD
            }
        };

        const worker = html2pdf()
            .set(opt)
            .from(element)
            .toPdf()
            .get('pdf')
            .then((pdf) => {

                const totalPages = pdf.internal.getNumberOfPages();

                // 🔥 REMOVE BLANK PAGE
                if (totalPages > 1) {
                    pdf.deletePage(totalPages);
                }
            });

        const pdfBlob = await worker.outputPdf("blob");

        return pdfBlob;
    };

    const handleSendWhatsapp = async () => {
        try {
            const pdfBlob = await generatePdfBlob();

            const formData = new FormData();
            formData.append("bookingId", bookingData.bookingId);
            formData.append("file", pdfBlob, "booking-slip.pdf");

            let res;

            // 🔥 CONDITION
            if (bookingData?.cancelReason) {
                // ❌ CANCEL CASE
                res = await dispatch(sendBookingCancelWhatsapp(formData));
            } else {
                // ✅ NORMAL CASE
                res = await dispatch(sendBookingWhatsapp(formData));
            }

            if (res?.meta?.requestStatus === "fulfilled") {
                alert(
                    bookingData?.cancelReason
                        ? "✅ Cancel WhatsApp sent"
                        : "✅ WhatsApp sent successfully"
                );
            } else {
                alert("❌ Failed to send WhatsApp");
            }

        } catch (err) {
            console.error(err);
            alert("❌ Failed");
        }
    };

    const handleDownloadPDF = async () => {
        await loadImageAsBase64(companySignature);

        const element = originalRef.current;

        if (!element) return;

        await new Promise((r) => setTimeout(r, 500));

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let y = 0;

        if (imgHeight > pageHeight) {
            let heightLeft = imgHeight;

            while (heightLeft > 0) {
                pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                if (heightLeft > 0) {
                    pdf.addPage();
                    y = -(imgHeight - heightLeft);
                }
            }
        } else {
            const yOffset = (pageHeight - imgHeight) / 2;
            pdf.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight);
        }

        pdf.save(`BPS_Slip_${bookingData?.bookingId}.pdf`);
    };

    // Direct Print Function - Single Page
    const handleDirectPrint = async () => {
        const signatureData = await loadImageAsBase64(companySignature);
        const printWindow = window.open('', '_blank', 'width=900,height=700');

        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    @media print {

                    
    * {
        color: #000 !important;
        font-weight: bold !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
                        @page {
                            margin: 5mm !important;
                            size: A4 portrait !important;
                        }
                        
                        body {
                            margin: 0 !important;
                            padding: 0 !important;
                            font-family: Arial, sans-serif !important;
                            font-size: 12px !important;
                             zoom: 0.82; 
                        }
                        
                        .slip-container {
                            width: 100% !important;
                            max-width: 100% !important;
                            margin: 0 auto !important;
                            padding: 2mm !important;
                            box-sizing: border-box !important;
                        }
                        
                        .slip-paper {
                            width: 100% !important;
                            box-sizing: border-box !important;
                            border: 2px solid #000 !important;
                            padding: 3mm !important;
                            padding-bottom: 8mm !important;
                            min-height: 145mm !important; 
                             height: auto !important;
                            overflow: hidden !important;
                            background: #fff !important;
                        }
                        
                        .duplicate-slip {
                            background-color: #f9f9f9 !important;
                        }
                        
                        /* Company Header */
                        .company-header {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: space-between !important;
                            margin-bottom: 2mm !important;
                            padding-bottom: 1mm !important;
                            border-bottom: 2px solid #1a237e !important;
                            font-weight: bold !important;
                             color: #000 !important;
                        }
                        
                        .logo-img {
                            width: 15mm !important;
                            height: 15mm !important;
                            object-fit: contain !important;
                        }
                        
                        .company-name {
                            font-size: 15px !important;
                            font-weight: bold !important;
                            text-align: center !important;
                            color: #000 !important;
                            flex-grow: 1 !important;
                        }
                        
                        .jurisdiction {
                            font-size: 9px !important;
                            color: #d32f2f !important;
                            font-weight: bold !important;
                            margin-top: 0.5mm !important;
    color: #000 !important;
     text-align: center !important; 
        width: 100% !important;
                        }
                        
                        .gst-info {
                            text-align: right !important;
                            font-size: 8px !important;
                           font-weight: bold !important;
    color: #000 !important;
                            background-color: #f5f5f5 !important;
                            padding: 1mm !important;
                            border-radius: 2mm !important;
                            border: 1px solid #ddd !important;
                        }
                        
                        /* Top Addresses */
                        .top-addresses {
                            display: flex !important;
                            justify-content: space-between !important;
                            border-bottom: 1px dashed #ccc !important;
                            padding-bottom: 1mm !important;
                            margin-bottom: 2mm !important;
                        }
                        
                        .top-address-box {
                            width: 48% !important;
                            padding: 1mm !important;
                            border-radius: 2mm !important;
                            border: 1px solid #000 !important;
                        }
                        
                        .address-1 {
                            background-color: #e8f5e9 !important;
                        }
                        
                        .address-2 {
                            background-color: #e3f2fd !important;
                        }
                        
                        .address-city {
                            font-size: 10px !important;
                            font-weight: bold !important;
                            color: #000 !important;
                        }
                        
                       .address-text {
    font-size: 10px !important;
    font-weight: bold !important;
    line-height: 1.3 !important;
    color: #000 !important;
}

.address-phone {
    font-size: 10px !important;
    font-weight: bold !important;
    color: #000 !important;
}
                        
                        /* Main Grid Layout */
                        .main-grid {
                            display: grid !important;
                            grid-template-columns: 1.4fr 1fr !important;
                            gap: 2mm !important;
                            margin-bottom: 2mm !important;
                        }
                        
                        .left-column {
                            display: flex !important;
                            flex-direction: column !important;
                            gap: 1.5mm !important;
                        }
                        
                        .right-column {
                            display: flex !important;
                            flex-direction: column !important;
                            gap: 1.5mm !important;
                        }
                        
                        /* Booking Info */
                        .booking-info {
                            display: flex !important;
                            justify-content: space-between !important;
                            align-items: center !important;
                            padding: 1.5mm !important;
                            background-color: #f5f5f5 !important;
                            border-radius: 2mm !important;
                            border: 2px solid #1a237e !important;
                            
                        }
                        
                        .booking-id {
                            font-size: 13px !important;
                           font-weight: bold !important;
    color: #000 !important;
                        }
                        
                        .booking-date {
                            font-size: 11px !important;
                           font-weight: bold !important;
    color: #000 !important;
                        }
                        
                        /* Route Section */
                        .route-section {
                            padding: 1.5mm !important;
                            background: linear-gradient(45deg, #1a237e 0%, #283593 100%) !important;
                            color: white !important;
                            text-align: center !important;
                            border-radius: 2mm !important;
                            font-weight: bold !important;
                        }
                        
                        .customer-title {
                            font-size: 11px !important;
                            font-weight: bold !important;
                            color: #5d4037 !important;
                            text-align: center !important;
                            margin-bottom: 1mm !important;
                            padding-bottom: 0.5mm !important;
                            border-bottom: 2px dashed #ccc !important;
                        }
                        
                        .sender-receiver-grid {
                            display: grid !important;
                            grid-template-columns: 1fr 1fr !important;
                            gap: 1.5mm !important;
                        }
                        
                        .sender-box {
                            padding: 1mm !important;
                            background-color: #e3f2fd !important;
                            border-radius: 2mm !important;
                            border: 1px solid #000 !important;
                        }
                        
                        .receiver-box {
                            padding: 1mm !important;
                            background-color: #e8f5e9 !important;
                            border-radius: 2mm !important;
                            border: 1px solid #000 !important;
                        }
                        
                        .sender-title {
                            font-size: 10px !important;
                            font-weight: bold !important;
                            color: #1976d2 !important;
                            text-align: center !important;
                            margin-bottom: 0.5mm !important;
                        }
                        
                        .receiver-title {
                            font-size: 10px !important;
                            font-weight: bold !important;
                            color: #388e3c !important;
                            text-align: center !important;
                            margin-bottom: 0.5mm !important;
                        }
                        
                        .detail-line {
                            font-size: 9px !important;
                            margin-bottom: 0.3mm !important;
                        }
                        
                        .branch-title {
                            font-size: 11px !important;
                            font-weight: bold !important;
                            color: #5d4037 !important;
                            text-align: center !important;
                            margin-bottom: 1mm !important;
                            border-bottom: 2px solid #5d4037 !important;
                        }
                        
                        .branch-grid {
                            display: grid !important;
                            grid-template-columns: 1fr 1fr !important;
                            gap: 1mm !important;
                        }
                        
                        .branch-box {
                            border: 1px solid #000 !important;
                            padding: 1mm !important;
                            background-color: #fff !important;
                            border-radius: 2mm !important;
                            min-height: 15mm !important;
                        }
                        
                        .branch-city {
    font-size: 10px !important;
    font-weight: bold !important;
    color: #000 !important;
}

.branch-text {
    font-size: 10px !important;
    font-weight: bold !important;
    line-height: 1.3 !important;
    color: #000 !important;
}

.branch-phone {
    font-size: 10px !important;
    font-weight: bold !important;
    color: #000 !important;
}
                        
                        /* Items Table */
                        table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            margin: 2mm 0 !important;
                            font-size: 9px !important;
                            table-layout: fixed !important;
                        }

                         table, th, td {
        color: #000 !important;
        font-weight: bold !important;
    }
        h1, h2, h3, h4, h5, h6,
    .company-name,
    .jurisdiction,
    .booking-id,
    .booking-date,
    .sender-title,
    .receiver-title,
    .address-city,
    .address-text,
    .address-phone,
    .branch-city,
    .branch-text,
    .branch-phone,
    .customer-signature,
    .company-signature,
    .signature-note,
    .copy-label {
        color: #000 !important;
        font-weight: bold !important;
    }

                        
                        th, td {
                            border: 1px solid #000 !important;
                            padding: 0.5mm 0.8mm !important;
                            text-align: center !important;
                        }
                        
                        th {
                            font-weight: bold !important;
                            background: background: #000 !important;
                             color: #000 !important; 
                            border: 1px solid #fff !important;
                        }

                        thead th {
        color: #000 !important;
        font-weight: bold !important;
    }
                        
                        .total-row {
                            background-color: #e8eaf6 !important;
                            font-weight: bold !important;
                            color: #1a237e !important;
                            border-top: 2px solid #1a237e !important;
                        }
                        
                        /* Summary Section */
                        .summary-section {
                            padding: 1.5mm !important;
                            background-color: #f8f9fa !important;
                            border-radius: 2mm !important;
                            margin: 1mm 0 !important;
                        }
                        
                        .summary-grid {
                            display: grid !important;
                            grid-template-columns: 1fr 1fr !important;
                            gap: 1.5mm !important;
                        }
                        
                        .summary-box {
                            background-color: #fff !important;
                            padding: 1mm !important;
                            border-radius: 2mm !important;
                            border: 1px solid #000 !important;
                        }
                        
                        .summary-table {
                            width: 80% !important;
                            border: none !important;
                        }
                        
                        .summary-table td {
    border: none !important;
    padding: 1mm 1.5mm !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #000 !important;
}

.bill-total-row td {
    border-top: 2px solid #000 !important;
    border-bottom: 2px solid #000 !important;
    background: #f5f5f5 !important;

    font-size: 16px !important;
    font-weight: 600 !important;
    color: #000 !important;
}

.grand-total-row td {
    border-top: 3px solid #d32f2f !important;
    background: #ffebee !important;

    font-size: 18px !important;
    font-weight: 600 !important;
    color: #d32f2f !important;
}
                        
                        .bill-total-row {
                            border-top: 2px solid #ccc !important;
                            border-bottom: 2px solid #ccc !important;
                            background-color: #f5f5f5 !important;
                            font-weight: bold !important;
                              color: #000 !important;
                        }
                        
                        .grand-total-row {
                            border-top: 2px solid #d32f2f !important;
                            background-color: #ffebee !important;
                            font-weight: bold !important;
                            color: #d32f2f !important;
                        }
                        
                        /* Signature Section */
                        .signature-section {
                            margin-top: 1.5mm !important;
                            padding-top: 1mm !important;
                            border-top: 1px dashed #5d4037 !important;
                            display: flex !important;
                            justify-content: space-between !important;
                        }
                        
                        .signature-box {
                            width: 45% !important;
                            text-align: center !important;
                            padding-top: 4mm !important;
                             page-break-inside: avoid !important;
                        }
                        
                        .customer-signature {
                            border-top: 1px solid #000 !important;
                            margin-top: 11mm !important;
                            font-size: 9px !important;
                            font-weight: bold !important;
                            color: #5d4037 !important;
                            background-color: #f5f5f5 !important;
                            padding: 0.8mm !important;
                            border-radius: 2mm !important;
                        }
                        
                        .company-signature {
                            border-top: 1px solid #000 !important;
                            padding-top: 0.8mm !important;
                            font-size: 9px !important;
                            font-weight: bold !important;
                            color: #000 !important;
                            background-color: #f5f5f5 !important;
                            padding: 0.8mm !important;
                            border-radius: 2mm !important;
                        }
                        
                        .signature-note {
                            font-size: 8px !important;
                            color: #666 !important;
                        }
                        
                        .signature-image {
                            max-height: 10mm !important;
                            margin-bottom: 0.5mm !important;
                            background-color: #f5f5f5 !important;
                            padding: 1mm !important;
                            border-radius: 2mm !important;
                        }
                        
                        .copy-label {
                            text-align: center !important;
                            font-size: 11px !important;
                            font-weight: bold !important;
                            color: #666 !important;
                            margin: 1mm 0 !important;
                            padding: 0.5mm !important;
                            background: #f5f5f5 !important;
                            border-radius: 2mm !important;
                        }
                    }
                    
                    @media screen {
                        body {
                            background: #f0f0f0 !important;
                            padding: 5mm !important;
                        }
                        
                        .slip-container {
                            background: white !important;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1) !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="slip-container">
                    <!-- Original Copy -->
                    <div class="copy-label">ORIGINAL COPY</div>
                    <div class="slip-paper">
                        <div class="company-header">
                            <div>
                                <img 
                                    src="${CompanyLogo}" 
                                    alt="Logo" 
                                    class="logo-img"
                                    onerror="this.style.display='none'"
                                />
                            </div>
                            <div>
                                <div class="company-name">BHARAT PARCEL SERVICES PVT. LTD.</div>
                                <div class="jurisdiction">SUBJECT TO ${bookingData?.startStation?.stationName} JURISDICTION</div>
                                <div style="
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 9px;
    font-weight: bold;
    margin-top: 2px;
">
    <div>GSTIN : ${bookingData?.startStation?.gst}</div>
    <div>PAN : AAECB6506F</div>
</div>
                            </div>
                            <div class="gst-info">
                                 <div style="
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 1px;
    ">
        BILTY NO: ${bookingData?.items?.[0]?.receiptNo || "-"}
    </div>
                                 <div style="
    font-size: 11px;
    font-weight: 900;
    margin-top: 2px;
    letter-spacing: 1px;
">
   PAYMENT: ${bookingData?.items?.[0]?.toPay?.toUpperCase()}
</div>
                            </div>
                        </div>
                        
                        <div class="top-addresses">
                            ${topAddresses.map((addr, index) => `
                                <div class="top-address-box address-${index + 1}">
                                    <div class="address-city">${addr.city}:</div>
                                    <div class="address-text">${addr.address}</div>
                                    <div class="address-phone">📞 ${addr.phone}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="main-grid">
                            <div class="left-column">
                                <div class="booking-info">
                                    <div>
                                        <div style="font-size:9px;color:#666;font-weight:bold;">BOOKING ID</div>
                                        <div class="booking-id">${bookingData?.bookingId}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size:9px;color:#666;font-weight:bold;">Booking DATE</div>
                                        <div class="booking-date">${formatDate(bookingData?.bookingDate)}</div>
                                    </div>
                                </div>
                                
                                <div class="route-section">
                                    ROUTE : ${bookingData?.startStation?.stationName} → ${bookingData?.endStation?.stationName}
                                </div>
                                
                                <div class="customer-details">
                                    <div class="sender-receiver-grid">
                                        <div class="sender-box">
                                            <div class="sender-title">SENDER</div>
                                            <div class="detail-line"><strong>Name:</strong> ${bookingData?.senderName}</div>
                                            <div class="detail-line"><strong>Contact:</strong> ${bookingData?.mobile || 'N/A'}</div>
                                            <div class="detail-line"><strong>City:</strong> ${bookingData?.fromCity}</div>
                                            <div class="detail-line"><strong>GSTIN:</strong> ${bookingData?.senderGgt || 'N/A'}</div>
                                        </div>
                                        <div class="receiver-box">
                                            <div class="receiver-title">RECEIVER</div>
                                            <div class="detail-line"><strong>Name:</strong> ${bookingData?.receiverName}</div>
                                            <div class="detail-line"><strong>Contact:</strong> ${bookingData?.receiverContact || 'N/A'}</div>
                                            <div class="detail-line"><strong>City:</strong> ${bookingData?.toCity}</div>
                                            <div class="detail-line"><strong>GSTIN:</strong> ${bookingData?.receiverGgt || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="right-column">
                                <div class="branch-addresses">
                                    <div class="branch-grid">
                                        ${bottomAddresses.map((addr) => `
                                            <div class="branch-box">
                                                <div class="branch-city">${addr.city}</div>
                                                <div class="branch-text">${addr.address}</div>
                                                <div class="branch-phone">📞 ${addr.phone}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                      ${bookingData?.items?.length === 1 ? `

<table>
    <thead>
        <tr>
            <th>Sr.</th>
            <th>Receipt No.</th>
            <th>Ref No.</th>
            <th>Qty</th>
            <th>Weight</th>
            <th>Insurance</th>
            <th>VPP</th>
            <th>Payment</th>
            <th>Amount</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td>${bookingData.items[0].receiptNo}</td>
            <td>${bookingData.items[0].refNo}</td>
            <td>${bookingData.items[0].quantity}</td>
            <td>${bookingData.items[0].weight} kg</td>
            <td>${formatCurrency(bookingData.items[0].insurance)}</td>
            <td>${formatCurrency(bookingData.items[0].vppAmount)}</td>
          <td style="  font-size: 14px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;">
 ${bookingData.items[0].toPay?.toUpperCase()}
</td>
            <td>${formatCurrency(bookingData.items[0].amount)}</td>
        </tr>
    </tbody>
</table>

` : `

<!-- TABLE 1 (MAIN ITEM) -->
<table>
    <thead>
        <tr>
            <th>Sr.</th>
            <th>Receipt No.</th>
            <th>Ref No.</th>
            <th>Qty</th>
            <th>Weight</th>
            <th>Insurance</th>
            <th>VPP</th>
            <th>Payment</th>
            <th>Amount</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td>${bookingData.items[0].receiptNo}</td>
            <td>${bookingData.items[0].refNo}</td>
            <td>${bookingData.items[0].quantity}</td>
            <td>${bookingData.items[0].weight} kg</td>
            <td>${formatCurrency(bookingData.items[0].insurance)}</td>
            <td>${formatCurrency(bookingData.items[0].vppAmount)}</td>
           <td style="
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
">
  ${bookingData.items[0].toPay?.toUpperCase()}
</td>
            <td>${formatCurrency(bookingData.items[0].amount)}</td>
        </tr>
    </tbody>
</table>

<!-- TABLE 2 (INSURANCE BREAKDOWN) -->
<table>
    <thead>
        <tr>
            <th>Sr.</th>
            <th>Receipt No.</th>
            <th>Ref No.</th>
            <th>Insurance</th>
            <th>Ins Amt</th>
            <th>Payment</th>
            <th>CGST(9%)</th>
            <th>SGST(9%)</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>2</td>
            <td>${bookingData.items[1].receiptNo}</td>
            <td>${bookingData.items[1].refNo}</td>
            <td>${formatCurrency(bookingData.items[1].insurance)}</td>
            <td>${formatCurrency(bookingData.items[1].insuranceAmount)}</td>
            <td>${bookingData.items[1].toPay}</td>
            <td>${formatCurrency(bookingData.items[1].insuranceCgst)}</td>
            <td>${formatCurrency(bookingData.items[1].insuranceSgst)}</td>
            <td>${formatCurrency(bookingData.items[1].insuranceTotalWithGST)}</td>
        </tr>
    </tbody>
</table>

`}
                        
                        <div class="summary-section">
                            <div class="summary-grid">
                                <div class="summary-box">
                                    <table class="summary-table">
                                        <tr>
                                            <td>Items Total:</td>
                                            <td align="right">${formatCurrency(itemsTotal)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Insurance / VPP:</strong></td>
                                            <td align="right">${formatCurrency(bookingData?.ins_vpp)}</td>
                                        </tr>
                                        <tr>
                                            <td>Bilty Amount:</td>
                                            <td align="right">${formatCurrency(biltyAmount)}</td>
                                        </tr>
                                        <tr class="bill-total-row">
                                            <td><strong>Bill Total:</strong></td>
                                            <td align="right"><strong>${formatCurrency(bookingData?.billTotal)}</strong></td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="summary-box">
                                    <table class="summary-table">
                                        ${cgstRate > 0 ? `
                                        <tr>
                                            <td>CGST (${cgstRate}%):</td>
                                            <td align="right">${formatCurrency(cgstAmount)}</td>
                                        </tr>
                                        ` : ''}
                                        ${sgstRate > 0 ? `
                                        <tr>
                                            <td>SGST (${sgstRate}%):</td>
                                            <td align="right">${formatCurrency(sgstAmount)}</td>
                                        </tr>
                                        ` : ''}
                                        ${igstRate > 0 ? `
                                        <tr>
                                            <td>IGST (${igstRate}%):</td>
                                            <td align="right">${formatCurrency(igstAmount)}</td>
                                        </tr>
                                        ` : ''}
                                        <tr>
                                            <td>Round Off:</td>
                                            <td align="right">${formatCurrency(roundOff)}</td>
                                        </tr>
                                        <tr class="grand-total-row">
                                            <td><strong>GRAND TOTAL:</strong></td>
                                            <td align="right"><strong>${formatCurrency(roundedGrandTotal)}</strong></td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div class="signature-section">
                            <div class="signature-box">
                                <div class="customer-signature">
                                    CUSTOMER SIGNATURE
                                </div>
                                <div class="signature-note">
                                    (With Company Stamp)
                                </div>
                            </div>
                            
                            <div class="signature-box">
                                ${signatureData ? `
                                    <div class="signature-image">
                                        <img src="${signatureData}" style="max-height:10mm;" />
                                    </div>
                                ` : ''}
                                <div class="company-signature">
                                    FOR BHARAT PARCEL SERVICES PVT. LTD.
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Duplicate Copy -->
                    <div class="copy-label">DUPLICATE COPY</div>
                    <div class="slip-paper duplicate-slip">
                        <div class="company-header">
                            <div>
                                <img 
                                    src="${CompanyLogo}" 
                                    alt="Logo" 
                                    class="logo-img"
                                    onerror="this.style.display='none'"
                                />
                            </div>
                            <div>
                                <div class="company-name">BHARAT PARCEL SERVICES PVT. LTD.</div>
                                <div class="jurisdiction">SUBJECT TO ${bookingData?.startStation?.stationName} JURISDICTION</div>
                                <div style="
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 9px;
    font-weight: bold;
    margin-top: 2px;
">
    <div>GSTIN : ${bookingData?.startStation?.gst}</div>
    <div>PAN : AAECB6506F</div>
</div>
                            </div>
                            <div class="gst-info">
                                 <div style="
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 1px;
    ">
        BILTY NO: ${bookingData?.items?.[0]?.receiptNo || "-"}
    </div>
                                 <div style="
    font-size: 11px;
    font-weight: 900;
    margin-top: 2px;
    letter-spacing: 1px;
">
 PAYMENT: ${bookingData?.items?.[0]?.toPay?.toUpperCase()}
</div>
                            </div>
                        </div>
                        
                        <div class="top-addresses">
                            ${topAddresses.map((addr, index) => `
                                <div class="top-address-box address-${index + 1}">
                                    <div class="address-city">${addr.city}:</div>
                                    <div class="address-text">${addr.address}</div>
                                    <div class="address-phone">📞 ${addr.phone}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="main-grid">
                            <div class="left-column">
                                <div class="booking-info">
                                    <div>
                                        <div style="font-size:9px;color:#666;font-weight:bold;">BOOKING ID</div>
                                        <div class="booking-id">${bookingData?.bookingId}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size:9px;color:#666;font-weight:bold;">Booking DATE</div>
                                        <div class="booking-date">${formatDate(bookingData?.bookingDate)}</div>
                                    </div>
                                </div>
                                
                                <div class="route-section">
                                    ROUTE : ${bookingData?.startStation?.stationName} → ${bookingData?.endStation?.stationName}
                                </div>
                                
                                <div class="customer-details">
                                    <div class="sender-receiver-grid">
                                        <div class="sender-box">
                                            <div class="sender-title">SENDER</div>
                                            <div class="detail-line"><strong>Name:</strong> ${bookingData?.senderName}</div>
                                            <div class="detail-line"><strong>Contact:</strong> ${bookingData?.mobile || 'N/A'}</div>
                                            <div class="detail-line"><strong>City:</strong> ${bookingData?.fromCity}</div>
                                            <div class="detail-line"><strong>GSTIN:</strong> ${bookingData?.senderGgt || 'N/A'}</div>
                                        </div>
                                        <div class="receiver-box">
                                            <div class="receiver-title">RECEIVER</div>
                                            <div class="detail-line"><strong>Name:</strong> ${bookingData?.receiverName}</div>
                                            <div class="detail-line"><strong>Contact:</strong> ${bookingData?.receiverContact || 'N/A'}</div>
                                            <div class="detail-line"><strong>City:</strong> ${bookingData?.toCity}</div>
                                            <div class="detail-line"><strong>GSTIN:</strong> ${bookingData?.receiverGgt || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="right-column">
                                <div class="branch-addresses">
                                    <div class="branch-grid">
                                        ${bottomAddresses.map((addr) => `
                                            <div class="branch-box">
                                                <div class="branch-city">${addr.city}</div>
                                                <div class="branch-text">${addr.address}</div>
                                                <div class="branch-phone">📞 ${addr.phone}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        ${bookingData?.items?.length === 1 ? `

<table>
    <thead>
        <tr>
            <th>Sr.</th>
            <th>Receipt No.</th>
            <th>Ref No.</th>
            <th>Qty</th>
            <th>Weight</th>
            <th>Insurance</th>
            <th>VPP</th>
            <th>Payment</th>
            <th>Amount</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td>${bookingData.items[0].receiptNo}</td>
            <td>${bookingData.items[0].refNo}</td>
            <td>${bookingData.items[0].quantity}</td>
            <td>${bookingData.items[0].weight} kg</td>
            <td>${formatCurrency(bookingData.items[0].insurance)}</td>
            <td>${formatCurrency(bookingData.items[0].vppAmount)}</td>
          <td style="
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
">
   ${bookingData.items[0].toPay?.toUpperCase()}
</td>
            <td>${formatCurrency(bookingData.items[0].amount)}</td>
        </tr>
    </tbody>
</table>

` : `

<!-- TABLE 1 (MAIN ITEM) -->
<table>
    <thead>
        <tr>
            <th>Sr.</th>
            <th>Receipt No.</th>
            <th>Ref No.</th>
            <th>Qty</th>
            <th>Weight</th>
            <th>Insurance</th>
            <th>VPP</th>
            <th>Payment</th>
            <th>Amount</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td>${bookingData.items[0].receiptNo}</td>
            <td>${bookingData.items[0].refNo}</td>
            <td>${bookingData.items[0].quantity}</td>
            <td>${bookingData.items[0].weight} kg</td>
            <td>${formatCurrency(bookingData.items[0].insurance)}</td>
            <td>${formatCurrency(bookingData.items[0].vppAmount)}</td>
          <td style="
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
">
  ${bookingData.items[0].toPay?.toUpperCase()}
</td>
            <td>${formatCurrency(bookingData.items[0].amount)}</td>
        </tr>
    </tbody>
</table>

<!-- TABLE 2 (INSURANCE BREAKDOWN) -->
<table>
    <thead>
        <tr>
            <th>Sr.</th>
            <th>Receipt No.</th>
            <th>Ref No.</th>
            <th>Insurance</th>
            <th>Ins Amt</th>
            <th>Payment</th>
            <th>CGST(9%)</th>
            <th>SGST(9%)</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>2</td>
            <td>${bookingData.items[1].receiptNo}</td>
            <td>${bookingData.items[1].refNo}</td>
            <td>${formatCurrency(bookingData.items[1].insurance)}</td>
            <td>${formatCurrency(bookingData.items[1].insuranceAmount)}</td>
            <td>${bookingData.items[1].toPay}</td>
            <td>${formatCurrency(bookingData.items[1].insuranceCgst)}</td>
            <td>${formatCurrency(bookingData.items[1].insuranceSgst)}</td>
            <td>${formatCurrency(bookingData.items[1].insuranceTotalWithGST)}</td>
        </tr>
    </tbody>
</table>

`}
                        
                        <div class="summary-section">
                            <div class="summary-grid">
                                <div class="summary-box">
                                    <table class="summary-table">
                                        <tr>
                                            <td>Items Total:</td>
                                            <td align="right">${formatCurrency(itemsTotal)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Insurance / VPP:</strong></td>
                                            <td align="right">${formatCurrency(bookingData?.ins_vpp)}</td>
                                        </tr>
                                        <tr>
                                            <td>Bilty Amount:</td>
                                            <td align="right">${formatCurrency(biltyAmount)}</td>
                                        </tr>
                                        <tr class="bill-total-row">
                                            <td><strong>Bill Total:</strong></td>
                                            <td align="right"><strong>${formatCurrency(bookingData?.billTotal)}</strong></td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="summary-box">
                                    <table class="summary-table">
                                        ${cgstRate > 0 ? `
                                        <tr>
                                            <td>CGST (${cgstRate}%):</td>
                                            <td align="right">${formatCurrency(cgstAmount)}</td>
                                        </tr>
                                        ` : ''}
                                        ${sgstRate > 0 ? `
                                        <tr>
                                            <td>SGST (${sgstRate}%):</td>
                                            <td align="right">${formatCurrency(sgstAmount)}</td>
                                        </tr>
                                        ` : ''}
                                        ${igstRate > 0 ? `
                                        <tr>
                                            <td>IGST (${igstRate}%):</td>
                                            <td align="right">${formatCurrency(igstAmount)}</td>
                                        </tr>
                                        ` : ''}
                                        <tr>
                                            <td>Round Off:</td>
                                            <td align="right">${formatCurrency(roundOff)}</td>
                                        </tr>
                                        <tr class="grand-total-row">
                                            <td><strong>GRAND TOTAL:</strong></td>
                                            <td align="right"><strong>${formatCurrency(roundedGrandTotal)}</strong></td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div class="signature-section">
                            <div class="signature-box">
                                <div class="customer-signature">
                                    CUSTOMER SIGNATURE
                                </div>
                                <div class="signature-note">
                                    (With Company Stamp)
                                </div>
                            </div>
                            
                            <div class="signature-box">
                                ${signatureData ? `
                                    <div class="signature-image">
                                        <img src="${signatureData}" style="max-height:10mm;" />
                                    </div>
                                ` : ''}
                                <div class="company-signature">
                                    FOR BHARAT PARCEL SERVICES PVT. LTD.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printHtml);
        printWindow.document.close();
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: '#fff',
                width: '210mm',
                p: 2,
                border: '1px solid black',
                maxHeight: '90vh',
                overflowY: 'auto',
                fontSize: '12px'
            }}>
                <Box ref={printRef}>
                    <Invoice copyType="Original" />

                    {!bookingData?.cancelReason && (
                        <>
                            <Divider
                                sx={{
                                    borderColor: 'black',
                                    borderStyle: 'dashed',
                                    my: 2,
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    py: 1,
                                    backgroundColor: '#f5f5f5'
                                }}
                            >
                                --- DUPLICATE COPY ---
                            </Divider>

                            <Invoice copyType="Duplicate" />
                        </>
                    )}
                </Box>
                {/* <Box ref={originalRef}>
                    <Invoice copyType="Original" />
                </Box> */}
                {/* WhatsApp only original */}
                <div style={{ position: "absolute", left: "-9999px" }}>
                    <div
                        ref={whatsappRef}
                        style={{
                            width: "210mm",
                            minHeight: "297mm",
                            padding: "10mm",
                            background: "#fff",
                            overflow: "hidden",
                        }}
                    >
                        <Invoice />
                    </div>
                </div>
                <Box textAlign="center" mt={2}>
                    <ButtonGroup variant="contained" aria-label="slip actions">
                        {!bookingData?.cancelReason && (
                            <>
                                <Button
                                    startIcon={<ReceiptIcon />}
                                    onClick={handleDownloadPDF}
                                    sx={{
                                        px: 3,
                                        mr: 2,
                                        backgroundColor: '#1a237e',
                                        '&:hover': { backgroundColor: '#283593' }
                                    }}
                                >
                                    Download PDF
                                </Button>
                                <Button
                                    startIcon={<PrintIcon />}
                                    onClick={handleDirectPrint}
                                    sx={{
                                        px: 3,
                                        ml: 2,
                                        backgroundColor: '#388e3c',
                                        '&:hover': { backgroundColor: '#2e7d32' }
                                    }}
                                >
                                    Print
                                </Button>
                            </>
                        )}
                        <Button
                            startIcon={<WhatsAppIcon />}
                            onClick={handleSendWhatsapp}
                            sx={{
                                backgroundColor: "#25D366",
                                ml: 2,
                                "&:hover": { backgroundColor: "#1ebe5d" }
                            }}
                        >
                            Send WhatsApp Bilty
                        </Button>
                    </ButtonGroup>
                </Box>
            </Box>
        </Modal>
    );
};

export default SlipModal;