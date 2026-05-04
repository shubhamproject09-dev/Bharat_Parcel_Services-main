import mongoose from "mongoose";

const CashBookSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["booking", "quotation"],
        required: true
    },
    date: {
        type: Date,
        required: true
    },

    station: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "manageStation",
        required: true
    },

    totalIncome: {
        type: Number,
        default: 0
    },

    totalExpense: {
        type: Number,
        default: 0
    },

    balance: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

// 🔥 UNIQUE (same date + same station)
CashBookSchema.index({ date: 1, station: 1, type: 1 }, { unique: true });

export default mongoose.model("CashBook", CashBookSchema);