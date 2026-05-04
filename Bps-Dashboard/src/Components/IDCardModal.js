import React, { useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    Stack
} from "@mui/material";
import html2canvas from "html2canvas";

// 🔹 date formatter
const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
};

const CARD_STYLE = {
    width: 350,
    height: 500,
    backgroundColor: "#fff",
    boxShadow: 3,
    position: "relative",
    overflow: "hidden"
};

const IDCardModal = ({
    open,
    onClose,
    staff,
    headerImage,
    directorSignature
}) => {

    const [showBack, setShowBack] = useState(false);

    // 🔒 hidden refs for download
    const frontDownloadRef = useRef(null);
    const backDownloadRef = useRef(null);

    // 🔥 DOWNLOAD FRONT + BACK (EXACT SAME DESIGN)
    const handleDownload = async () => {
        const safeName = `${staff.firstName}_${staff.lastName}`.replace(/\s+/g, "_");

        // FRONT
        const frontCanvas = await html2canvas(frontDownloadRef.current, {
            scale: 3,
            useCORS: true
        });

        const frontLink = document.createElement("a");
        frontLink.href = frontCanvas.toDataURL("image/jpeg", 1.0);
        frontLink.download = `${safeName}_front.jpg`;
        frontLink.click();

        // BACK
        const backCanvas = await html2canvas(backDownloadRef.current, {
            scale: 3,
            useCORS: true
        });

        const backLink = document.createElement("a");
        backLink.href = backCanvas.toDataURL("image/jpeg", 1.0);
        backLink.download = `${safeName}_back.jpg`;
        backLink.click();
    };

    /* ===================== FRONT JSX ===================== */
    const FrontCard = () => (
        <>
            {/* HEADER */}
            <Box
                sx={{
                    height: 150,
                    position: "relative",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #0A66C2, #0D47A1)"
                }}
            >
                <Box
                    sx={{
                        height: "60%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        color: "#fff"
                    }}
                >
                    <img src={headerImage} alt="Logo" style={{ height: 60, width: 60 }} />
                    <Box>
                        <Typography fontWeight="bold" fontSize={12}>
                            BHARAT PARCEL
                        </Typography>
                        <Typography fontWeight="bold" fontSize={12}>
                            SERVICES PVT. LTD.
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        width: "100%",
                        height: 50,
                        background: "linear-gradient(135deg, #0A66C2, #0D47A1)", // 🔥 SAME AS HEADER
                        overflow: "hidden"
                    }}
                >
                    <svg
                        viewBox="0 0 500 150"
                        preserveAspectRatio="none"
                        width="100%"
                        height="100%"
                    >
                        <path
                            d="M0,60 C150,0 350,120 500,40 L500,150 L0,150 Z"
                            fill="#ffffff"
                        />
                    </svg>
                </Box>
            </Box>

            {/* PHOTO */}
            <Box
                sx={{
                    position: "absolute",
                    top: 80,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 5
                }}
            >
                <img
                    src={staff?.documents?.passportPhoto?.url}
                    alt="Profile"
                    style={{
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        border: "5px solid white",
                        objectFit: "cover"
                    }}
                />
            </Box>

            <Box textAlign="center" mt={5}>
                <Typography fontWeight="bold" fontSize={18}>
                    {staff.firstName} {staff.lastName}
                </Typography>
                <Typography fontSize={14} sx={{ letterSpacing: 2 }} color="text.secondary">
                    {staff.designation?.toUpperCase()}
                </Typography>
            </Box>

            <Box px={3} mt={2} ml={2}>
                <Typography><b>DOB :</b> {formatDate(staff.dob)}</Typography>
                <Typography><b>Email :</b> {staff.email}</Typography>
                <Typography><b>Phone :</b> +91 {staff.contactNumber}</Typography>
            </Box>

            <Box px={3} mt={2} ml={3}>
                <Typography fontWeight="bold">ID Holder Signature</Typography>
                {staff?.documents?.digitalSignature?.url && (
                    <Box
                        sx={{
                            width: "100%",
                            maxHeight: 60,
                            overflow: "hidden",
                            textAlign: 'right'
                        }}
                    >
                        <img
                            src={staff.documents.digitalSignature.url}
                            alt="Signature"
                            style={{
                                width: "40%",
                                height: "auto",
                                objectFit: "contain",
                                display: "inline-block",
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* FOOTER */}
            <Box sx={{ position: "absolute", bottom: 0, width: "100%", height: 60 }}>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none"
                    style={{ width: "100%", height: "100%" }}>
                    <path
                        d="M0,0 C150,100 350,0 500,60 L500,150 L0,150 Z"
                        fill="#0A66C2"
                    />
                </svg>
            </Box>
        </>
    );

    /* ===================== BACK JSX ===================== */
    const BackCard = () => (
        <>
            {/* HEADER */}
            <Box
                sx={{
                    height: 100,
                    background: "linear-gradient(135deg, #0A66C2, #0D47A1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    color: "#fff",
                    position: "relative"
                }}
            >
                <img src={headerImage} alt="Logo" style={{ width: 60, height: 60 }} />
                <Box>
                    <Typography fontWeight="bold" fontSize={12}>
                        BHARAT PARCEL
                    </Typography>
                    <Typography fontWeight="bold" fontSize={12}>
                        SERVICES PVT. LTD.
                    </Typography>
                </Box>

                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        width: "100%",
                        height: 20,
                        background: "linear-gradient(135deg, #0A66C2, #0D47A1)", // 🔥 SAME
                        overflow: "hidden"
                    }}
                >
                    <svg
                        viewBox="0 0 500 150"
                        preserveAspectRatio="none"
                        width="100%"
                        height="100%"
                    >
                        <path
                            d="M0,60 C150,0 350,120 500,40 L500,150 L0,150 Z"
                            fill="#ffffff"
                        />
                    </svg>
                </Box>
            </Box>

            <Box p={3} pt={0}>
                <Typography fontWeight="bold" align="center" mb={1}>
                    TERMS & CONDITIONS
                </Typography>

                <Typography fontSize={12} lineHeight={1.6}>
                    • This identity card must be carried during duty hours.<br />
                    • Produce this card on demand by security staff.<br />
                    • Loss or damage must be reported immediately.<br />
                    • Replacement will be chargeable.<br />
                    • If found, please return to the address below.
                </Typography>

                <Box mt={1}>
                    <Typography fontSize={12}>
                        <b>Address :</b><br />
                        {staff.officeAddress}
                    </Typography>
                </Box>

                <Box mt={1}>
                    <Typography fontSize={12}>
                        <b>Join :</b> {formatDate(staff.joiningDate)} <br />
                        <b>Expire :</b> {formatDate(staff.expiryDate)}
                    </Typography>
                </Box>

                <Box mt={2}>
                    <Typography fontSize={12}>
                        <b>Issued By :</b> Satya Prakash Somani<br />
                        (Director)
                    </Typography>

                    <img
                        src={directorSignature}
                        alt="Director Sign"
                        style={{ width: 120, marginTop: -8, marginLeft: 60 }}
                    />
                </Box>
            </Box>

            {/* FOOTER */}
            <Box sx={{ position: "absolute", bottom: 0, width: "100%", height: 60 }}>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none"
                    style={{ width: "100%", height: "100%" }}>
                    <path
                        d="M0,0 C150,100 350,0 500,60 L500,150 L0,150 Z"
                        fill="#0A66C2"
                    />
                </svg>
            </Box>
        </>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm">
            <DialogContent>

                <Stack direction="row" spacing={2} mb={2} justifyContent="space-between">
                    <Button variant="outlined" onClick={() => setShowBack(!showBack)}>
                        {showBack ? "Show Front" : "Show Back"}
                    </Button>
                    <Button variant="contained" onClick={handleDownload}>
                        Download Front & Back
                    </Button>
                </Stack>

                {/* PREVIEW */}
                <Box sx={CARD_STYLE}>
                    {showBack ? <BackCard /> : <FrontCard />}
                </Box>

                {/* 🔒 HIDDEN DOWNLOAD CARDS */}
                <Box sx={{ position: "absolute", left: -9999, top: 0 }}>
                    <Box ref={frontDownloadRef} sx={CARD_STYLE}>
                        <FrontCard />
                    </Box>
                    <Box ref={backDownloadRef} sx={CARD_STYLE}>
                        <BackCard />
                    </Box>
                </Box>

            </DialogContent>
        </Dialog>
    );
};

export default IDCardModal;
