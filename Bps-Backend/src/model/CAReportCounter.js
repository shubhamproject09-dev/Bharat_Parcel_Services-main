import mongoose from "mongoose";

const caReportCounterSchema =
    new mongoose.Schema({

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        counter: {
            type: Number,
            default: 0
        }
    });

export default mongoose.model(
    "CAReportCounter",
    caReportCounterSchema
);