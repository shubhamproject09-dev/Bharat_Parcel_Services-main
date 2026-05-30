import fs from "fs";
import path from "path";
import { Invoice } from "../model/Invoice.js";
import Booking from "../model/booking.model.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";

export const regenerateInvoicePdf = async (req, res) => {

    try {

        const { id } = req.params;

        const invoice = await Invoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        // GET BOOKINGS
        const bookings = await Booking.find({
            _id: { $in: invoice.bookingIds }
        }).populate("startStation");

        if (!bookings.length) {
            return res.status(404).json({
                success: false,
                message: "Bookings not found"
            });
        }

        // GENERATE PDF BUFFER
        const pdfBuffer = await generateInvoicePDF({
            bookings,
            invoiceNo: invoice.invoiceNumber,
            billDate:
                invoice.invoiceDate ||
                invoice.createdAt,
        });

        // FILE PATH
        const relativePath =
            `/invoices/${invoice.invoiceNumber}.pdf`;

        const fullPath = path.join(
            process.cwd(),
            "public",
            relativePath
        );

        // CREATE FOLDER
        fs.mkdirSync(
            path.dirname(fullPath),
            { recursive: true }
        );

        // SAVE PDF
        fs.writeFileSync(fullPath, pdfBuffer);

        // UPDATE PATH
        invoice.pdfPath = relativePath;
        await invoice.save();

        return res.status(200).json({
            success: true,
            message: "PDF regenerated successfully",
            pdfPath: relativePath
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};