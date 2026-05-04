import mongoose from "mongoose";

const invoiceHistorySchema = new mongoose.Schema({
    downloadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    role: String,
    customerName: String,
    invoiceNo: String,
    bookingIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking"
    }],
    bookingRefIds: [String],
    downloadedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("InvoiceHistory", invoiceHistorySchema);