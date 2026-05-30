import PDFDocument from "pdfkit";

// =========================
// 🔹 Station Master (Fallback Config)
// =========================
const STATION_MASTER = {
    DELHI: {
        name: "Bharat Parcel Services Pvt. Ltd.",
        address: "332, Kucha Ghasi Ram, Chandni Chowk, Fatehpuri, Delhi - 110006",
        phone: "011-23955385, 23830010",
        gst: "07AAECB6506F1ZY",
        pan: "AAECB6506F",
        sac: "9968",
        state: "Delhi"
    },
    MUMBAI: {
        name: "Bharat Parcel Services Pvt. Ltd.",
        address: "1 Malharrao Wadi, Ground Floor, Kalbadevi Rd., Mumbai - 400002",
        phone: "022-22411975, 22422812",
        gst: "27AAECB6506F1ZY",
        pan: "AAECB6506F",
        sac: "9968",
        state: "Maharashtra"
    }
};

// =========================
// 🔹 Utils
// =========================
const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const convertNumberToWords = (num) => {
    if (!num) return "";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const inWords = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + inWords(n % 100) : "");
        if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand " + inWords(n % 1000);
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh " + inWords(n % 100000);
        return "";
    };
    return inWords(Math.floor(num));
};

// =========================
// 🔹 Station Resolver
// =========================
const resolveStationHeader = (booking) => {
    const apiStation = booking?.startStation;

    if (apiStation?.stationName && apiStation?.address && apiStation?.gst) {
        return {
            name: "Bharat Parcel Services Pvt. Ltd.",
            address: `${apiStation.address}, ${apiStation.city} - ${apiStation.pincode}`,
            phone: apiStation.contact,
            gst: apiStation.gst,
            pan: "AAECB6506F",
            sac: "9968",
            state: apiStation.state
        };
    }

    const stationName = apiStation?.stationName?.toUpperCase();
    if (stationName && STATION_MASTER[stationName]) {
        return STATION_MASTER[stationName];
    }

    return STATION_MASTER.DELHI; // default fallback
};

// =========================
// 🔹 Table Row Height Calc
// =========================
const calculateRowHeight = (doc, row, widths) => {
    let h = 26; // base height increased
    row.forEach((t, i) => {
        const ht = doc.heightOfString(String(t), {
            width: widths[i] - 10,
            lineBreak: true
        });
        h = Math.max(h, ht + 14);
    });
    return h;
};


// =========================
// 🧾 Generate Invoice PDF (Clean Black & White Design)
// =========================
export const generateInvoicePDF = async (data) => {
    const { bookings = [], invoiceNo, billDate } = data;

    // ✅ Filter only paid bookings
    // ✅ Allow both PAID & TOPAY
    if (!bookings || bookings.length === 0) {
        throw new Error("No bookings available for invoice generation.");
    }
    const booking = bookings[0];
    const station = resolveStationHeader(booking);

    const doc = new PDFDocument({
        size: "A4",
        margin: 25,
        info: {
            Title: `Invoice ${invoiceNo}`,
            Author: 'Bharat Parcel Services',
            Subject: 'Tax Invoice'
        }
    });
    const buffers = [];

    return new Promise((resolve) => {
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        let y = 40;
        const PAGE_LEFT = 25;
        const PAGE_RIGHT = doc.page.width - 25;
        const PAGE_WIDTH = PAGE_RIGHT - PAGE_LEFT;

        // ================= HEADER =================

        y += 15;

        // Company name
        doc.font("Helvetica-Bold").fontSize(18).fillColor('black')
            .text(station.name, PAGE_LEFT, y, { width: PAGE_WIDTH, align: "center" });
        y += 25;

        // Address details
        doc.font("Helvetica").fontSize(10).fillColor('black')
            .text(station.address, PAGE_LEFT, y, { width: PAGE_WIDTH, align: "center" });
        y += 12;
        doc.text(`Phone: ${station.phone}`, { width: 520, align: "center" });
        y += 12;

        // GST/PAN details
        doc.font("Helvetica-Bold").fontSize(10).fillColor('black')
            .text(`GSTIN: ${station.gst} | PAN: ${station.pan} | SAC: ${station.sac}`, { width: 520, align: "center" });

        y += 25;

        // INVOICE title
        doc.font("Helvetica-Bold").fontSize(22).fillColor('black')
            .text("TAX INVOICE", PAGE_LEFT, y, { width: PAGE_WIDTH, align: "center" });


        y += 40;

        // ================= BILL TO & INVOICE DETAILS =================
        doc.rect(PAGE_LEFT, y, PAGE_WIDTH, 95).stroke();
        doc.moveTo(300, y).lineTo(300, y + 95).lineWidth(0.7).strokeColor('black').stroke();

        let leftY = y + 8;
        let rightY = y + 8;

        // ================= BILL TO =================
        doc.font("Helvetica-Bold").fontSize(10).text("BILL TO", 45, leftY);
        leftY += 16;

        // 🔥 Decide billing party based on toPay
        // 🔥 BILL TO LOGIC
        const payType = String(
            booking.items?.[0]?.toPay || ""
        ).toLowerCase().trim();

        // ✅ paid => sender
        // ✅ topay => receiver

        const isToPay =
            payType === "topay" ||
            payType === "toPay".toLowerCase();

        const billToName = isToPay
            ? booking.receiverName
            : booking.senderName;

        const billToAddress = isToPay
            ? booking.receiverLocality
            : booking.senderLocality;

        const billToGst = isToPay
            ? booking.receiverGgt
            : booking.senderGgt;

        console.log("PAY TYPE =>", payType);
        console.log("BILL TO =>", billToName);

        // Name (BOLD)
        doc.font("Helvetica-Bold").fontSize(9)
            .text(billToName, 45, leftY, { width: 240 });

        leftY += doc.heightOfString(billToName, { width: 240 }) + 4;
        doc.moveTo(45, leftY).lineTo(285, leftY).lineWidth(0.3).stroke();

        // Address
        leftY += 4;
        doc.font("Helvetica").fontSize(9)
            .text(billToAddress, 45, leftY, { width: 240 });

        leftY += doc.heightOfString(billToAddress, { width: 240 }) + 4;
        doc.moveTo(45, leftY).lineTo(285, leftY).lineWidth(0.3).stroke();

        // GSTIN
        leftY += 4;
        doc.font("Helvetica").fontSize(9)
            .text(`GSTIN: ${billToGst || "N/A"}`, 45, leftY, { width: 240 });

        leftY += 12;
        doc.moveTo(45, leftY).lineTo(285, leftY).lineWidth(0.3).stroke();

        // ================= INVOICE DETAILS =================
        doc.font("Helvetica-Bold").fontSize(10)
            .text("INVOICE DETAILS", 305, rightY);

        rightY += 16;

        // Invoice No (bold label + value)
        doc.font("Helvetica-Bold").fontSize(9)
            .text(`Invoice No: ${invoiceNo || "AUTO"}`, 305, rightY, { width: 240 });

        rightY += 12;
        doc.moveTo(305, rightY).lineTo(PAGE_RIGHT, rightY).lineWidth(0.3).stroke();

        // Invoice Date
        rightY += 4;
        doc.font("Helvetica").fontSize(9)
            .text(
                `Invoice Date: ${formatDate(billDate)}`,
                305,
                rightY,
                { width: 240 }
            );

        rightY += 12;
        doc.moveTo(305, rightY).lineTo(PAGE_RIGHT, rightY).lineWidth(0.3).stroke();

        // Place of Supply
        rightY += 4;
        doc.text(`Place of Supply: ${station.state}`, 305, rightY, { width: 240 });

        rightY += 12;
        doc.moveTo(305, rightY).lineTo(PAGE_RIGHT, rightY).lineWidth(0.3).stroke();

        // State Code
        rightY += 4;
        doc.text(`State Code: ${station.gst?.substring(0, 2) || '07'}`, 305, rightY, { width: 240 });

        rightY += 12;
        doc.moveTo(305, rightY).lineTo(PAGE_RIGHT, rightY).lineWidth(0.3).stroke();

        // Move Y after box
        y += 95;

        // ================= TABLE HEADER =================
        const headers = [
            { label: "SR", width: 22 },
            { label: "DATE", width: 45 },
            { label: "POD NO", width: 55 },
            { label: "SENDER", width: 70 },
            { label: "RECEIVER", width: 70 },
            { label: "NOS", width: 28 },
            { label: "WT", width: 32 },
            { label: "INS/VPP", width: 42 },
            { label: "AMOUNT", width: 45 },
            { label: "GST", width: 56 },
            { label: "BILTY", width: 30 },
            { label: "TOTAL", width: 45 }
        ];

        // Header with borders (white background, black text)
        const tableWidth = PAGE_WIDTH;
        const pageWidth = doc.page.width;   // 595
        const startX = PAGE_LEFT;
        doc.rect(startX, y, tableWidth, 30).lineWidth(1).strokeColor('black').stroke();
        let x = startX;
        doc.font("Helvetica-Bold").fontSize(9).fillColor('black');
        headers.forEach((h, i) => {
            doc.text(h.label, x + 2, y + 10, { width: h.width - 4, align: "center" });
            // Draw vertical lines between columns
            if (i < headers.length - 1) {
                doc.moveTo(x + h.width, y).lineTo(x + h.width, y + 30).lineWidth(0.5).strokeColor('black').stroke();
            }
            x += h.width;
        });

        y += 30;
        // ✅ FIX: BODY FONT RESET (VERY IMPORTANT)
        doc.font("Helvetica").fontSize(8).fillColor("black");

        // ================= TABLE BODY =================
        let totalAmount = 0, totalIgst = 0;

        bookings.forEach((b, i) => {
            const item = b.items?.[0] || {};

            const qty = Number(item.quantity || 0);
            const wt = Number(item.weight || 0);
            const insVpp = Number(b.ins_vpp || 0);

            const freight = Number(b.freight || 0);
            const biltyCharge = 20;

            // GST Base = Amount + INS/VPP
            const taxableAmount = freight + insVpp;

            // GST 18%
            const gstAmount = taxableAmount * 0.18;

            // Row Total
            const total =
                freight +
                insVpp +
                gstAmount +
                biltyCharge;

            // label
            const payType = item.toPay;
            let gstLabel = "";

            if (payType === "toPay") {
                gstLabel = `IGST 18%: ${gstAmount.toFixed(2)}`;
            } else {
                gstLabel = `CGST 9% + SGST 9%: ${gstAmount.toFixed(2)}`;
            }

            const row = [
                i + 1,
                formatDate(b.bookingDate),
                item.receiptNo || b.bookingId,
                b.senderName,
                b.receiverName,
                qty,                        // NOS
                `${wt} kg`,                 // WT
                insVpp.toFixed(2),          // INS/VPP
                freight.toFixed(2),         // FREIGHT
                gstLabel,  // GST
                biltyCharge.toFixed(2),
                total.toFixed(2)            // TOTAL
            ];

            const widths = headers.map(h => h.width);
            const hgt = calculateRowHeight(doc, row, widths);

            const pageBottom = doc.page.height - 120;

            if (y + hgt > doc.page.height - 120) {

                // close current page border
                doc.rect(PAGE_LEFT, 40, PAGE_WIDTH, y - 40).stroke();

                doc.addPage();
                y = 60;

                // ✅ RESET FONT (IMPORTANT)
                doc.font("Helvetica").fontSize(8).fillColor("black");

                // 👉 HEADER
                doc.font("Helvetica-Bold").fontSize(16)
                    .text(station.name, PAGE_LEFT, y, { width: PAGE_WIDTH, align: "center" });

                y += 20;

                doc.font("Helvetica-Bold").fontSize(12)
                    .text("TAX INVOICE", 40, y, { width: 520, align: "center" });

                y += 25;

                // ✅ FIX: TABLE HEADER FONT SET KARO
                doc.font("Helvetica-Bold").fontSize(9);

                // 👉 TABLE HEADER repeat
                doc.rect(startX, y, tableWidth, 30).stroke();

                let x = startX;
                headers.forEach((h, i) => {
                    doc.text(h.label, x + 2, y + 10, { width: h.width - 4, align: "center" });
                    if (i < headers.length - 1) {
                        doc.moveTo(x + h.width, y).lineTo(x + h.width, y + 30).stroke();
                    }
                    x += h.width;
                });

                y += 30;
                // ✅ AGAIN RESET BODY FONT
                doc.font("Helvetica").fontSize(8).fillColor("black");
            }

            // Draw row border
            doc.rect(startX, y, tableWidth, hgt).lineWidth(0.5).strokeColor('black').stroke();
            // Draw cell borders and text
            let xx = startX;
            row.forEach((t, j) => {
                let align = "center";

                // Left align for text-heavy columns
                if ([3, 4].includes(j)) align = "left";     // SENDER, RECEIVER
                if (j === 9 || j === 10) align = "center";              // GST

                doc.text(String(t), xx + 6, y + 6, {
                    width: widths[j] - 12,
                    align,
                    lineBreak: true,
                });
                // Draw vertical lines between columns
                if (j > 0) {
                    doc.moveTo(xx, y).lineTo(xx, y + hgt).lineWidth(0.3).strokeColor('black').stroke();
                }
                xx += widths[j];
            });

            totalAmount += (freight + insVpp);
            totalIgst += gstAmount;
            y += hgt;
        });

        // ================= ROUND OFF CALCULATION =================
        // ✅ TOTAL BILTY CHARGE
        const totalBiltyCharge = bookings.length * 20;
        const gross =
            totalAmount +
            totalIgst +
            totalBiltyCharge;
        const roundedGrand = Math.round(gross);       // nearest rupee
        const roundOff = (roundedGrand - gross).toFixed(2);  // + / - difference

        // ================= TOTAL SECTION =================

        const firstPayType = String(
            bookings?.[0]?.items?.[0]?.toPay || ""
        ).toLowerCase().trim();

        const isIGST = firstPayType === "topay";

        const totalBoxHeight = isIGST ? 120 : 140;

        if (y + 100 > doc.page.height - 40) {

            doc.rect(PAGE_LEFT, 40, PAGE_WIDTH, y - 40).stroke();

            doc.addPage();
            y = 60;
        }

        // Total box
        const totalBoxWidth = 220;
        const totalBoxX = PAGE_RIGHT - totalBoxWidth;

        doc.rect(totalBoxX, y, totalBoxWidth, totalBoxHeight).stroke();

        // divider
        doc.moveTo(totalBoxX + 110, y)
            .lineTo(totalBoxX + 110, y + totalBoxHeight)
            .stroke();

        // labels
        doc.text(`SUB TOTAL:`, totalBoxX + 5, y + 15);
        doc.text(`${totalAmount.toFixed(2)}`, totalBoxX + 110, y + 15, {
            width: 100,
            align: "right"
        });

        if (isIGST) {

            doc.text(`IGST 18%:`, totalBoxX + 5, y + 35);
            doc.text(`${totalIgst.toFixed(2)}`, totalBoxX + 110, y + 35, {
                width: 100,
                align: "right"
            });

            doc.text(`BILTY CHARGE:`, totalBoxX + 5, y + 55);
            doc.text(`${totalBiltyCharge.toFixed(2)}`, totalBoxX + 110, y + 55, {
                width: 100,
                align: "right"
            });

            doc.text(`ROUND OFF:`, totalBoxX + 5, y + 75);
            doc.text(`${roundOff}`, totalBoxX + 110, y + 75, {
                width: 100,
                align: "right"
            });

            doc.font("Helvetica-Bold").fontSize(12);

            doc.text(`GRAND TOTAL:`, totalBoxX + 5, y + 95);
            doc.text(`${roundedGrand.toFixed(2)}`, totalBoxX + 110, y + 95, {
                width: 100,
                align: "right"
            });

        } else {

            const cgst = totalIgst / 2;
            const sgst = totalIgst / 2;

            doc.text(`CGST 9%:`, totalBoxX + 5, y + 35);
            doc.text(`${cgst.toFixed(2)}`, totalBoxX + 110, y + 35, {
                width: 100,
                align: "right"
            });

            doc.text(`SGST 9%:`, totalBoxX + 5, y + 55);
            doc.text(`${sgst.toFixed(2)}`, totalBoxX + 110, y + 55, {
                width: 100,
                align: "right"
            });

            doc.text(`BILTY CHARGE:`, totalBoxX + 5, y + 75);
            doc.text(`${totalBiltyCharge.toFixed(2)}`, totalBoxX + 110, y + 75, {
                width: 100,
                align: "right"
            });

            doc.text(`ROUND OFF:`, totalBoxX + 5, y + 95);
            doc.text(`${roundOff}`, totalBoxX + 110, y + 95, {
                width: 100,
                align: "right"
            });

            doc.font("Helvetica-Bold").fontSize(12);

            doc.text(`GRAND TOTAL:`, totalBoxX + 5, y + 115);
            doc.text(`${roundedGrand.toFixed(2)}`, totalBoxX + 110, y + 115, {
                width: 100,
                align: "right"
            });
        }
        // ================= FOOTER =================
        y += totalBoxHeight;
        if (y + 150 > doc.page.height - 40) {

            // close current page border
            doc.rect(PAGE_LEFT, 40, PAGE_WIDTH, y - 40).stroke();

            doc.addPage();
            y = 60;
        }
        if (y > 650) {
            y = 650; // force footer inside page
        }

        const wordsText = `INR ${convertNumberToWords(roundedGrand).toUpperCase()} ONLY`;

        const wordsHeight = doc.heightOfString(wordsText, {
            width: PAGE_WIDTH - 10
        });

        doc.rect(PAGE_LEFT, y, PAGE_WIDTH, wordsHeight + 25).stroke();

        doc.font("Helvetica-Bold").fontSize(9)
            .text("Amount in Words:", 45, y + 10);

        doc.text(wordsText, 45, y + 22, { width: PAGE_WIDTH - 10 });

        y += wordsHeight + 30;

        // Authorized Signatory section

        y += 40;
        doc.moveTo(350, y).lineTo(PAGE_RIGHT, y).lineWidth(0.5).stroke();
        doc.font("Helvetica-Bold").fontSize(9)
            .text("For Bharat Parcel Services Pvt. Ltd.", 380, y + 10, {
                width: 170,
                align: "center"
            });

        y += 25;
        doc.moveTo(350, y).lineTo(PAGE_RIGHT, y).lineWidth(0.5).stroke();
        doc.text("AUTHORIZED SIGNATORY", 380, y + 10, {
            width: 170,
            align: "center"
        });

        // Footer line
        y += 30;

        doc.font("Helvetica").fontSize(7)
            .text(
                `Invoice ${invoiceNo} | Generated on: ${formatDate(billDate)}`,
                40,
                y + 10,
                { width: 520, align: "center" }
            );
        // 🔥 Close last page border
        doc.rect(PAGE_LEFT, 40, PAGE_WIDTH, y - 40).stroke();
        doc.end();
    });
};