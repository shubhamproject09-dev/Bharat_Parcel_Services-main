import mongoose from "mongoose";

const rateListSchema = new mongoose.Schema({
    partyType: {
        type: String,
        enum: ["gst", "non-gst"],
        required: true
    },

    party: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "partyModel"
    },

    partyModel: {
        type: String,
        enum: ["Customer", "QCustomer"],
        required: true
    },

    perKgPrice: { type: Number, required: true },
    mmPrice: { type: Number, required: true },
    insurancePrice: { type: Number, required: true },
    silverPrice: { type: Number, required: true },
    airPrice: { type: Number, required: true },

}, { timestamps: true });

export const RateList = mongoose.model("RateList", rateListSchema);