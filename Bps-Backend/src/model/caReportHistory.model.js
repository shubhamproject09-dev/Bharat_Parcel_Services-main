import mongoose from "mongoose";

const caReportHistorySchema = new mongoose.Schema(
    {
        fromDate: Date,
        toDate: Date,

        downloadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        totalRecords: Number,

        fileName: String,

        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

export default mongoose.model(
    "CAReportHistory",
    caReportHistorySchema
);