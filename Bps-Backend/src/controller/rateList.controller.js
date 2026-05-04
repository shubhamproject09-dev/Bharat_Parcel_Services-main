import { RateList } from "../model/rateList.model.js";
import { Customer } from "../model/customer.model.js";
import { QCustomer } from "../model/Qcustomer.model.js";

// ✅ CREATE
export const createRateList = async (req, res) => {
    try {
        const {
            partyType,
            party, // 👈 this is customerId now
            perKgPrice,
            mmPrice,
            insurancePrice,
            silverPrice,
            airPrice
        } = req.body;

        console.log("REQ BODY:", req.body);

        const partyModel = partyType === "gst" ? "Customer" : "QCustomer";

        let partyDoc;

        if (partyType === "gst") {
            partyDoc = await Customer.findOne({ customerId: party });
        } else {
            partyDoc = await QCustomer.findOne({ customerId: party });
        }

        console.log("FOUND CUSTOMER:", partyDoc);

        if (!partyDoc) {
            return res.status(400).json({
                message: "Invalid party selected"
            });
        }

        const exist = await RateList.findOne({ party: partyDoc._id });

        if (exist) {
            return res.status(400).json({
                message: "Rate already exists for this party"
            });
        }

        const data = await RateList.create({
            partyType,
            party: partyDoc._id, // ✅ store ObjectId internally
            partyModel,
            perKgPrice,
            mmPrice,
            insurancePrice,
            silverPrice,
            airPrice
        });

        res.status(201).json(data);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ✅ GET ALL
export const getRateList = async (req, res) => {
    try {
        const data = await RateList.find().populate("party");
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ✅ GET SINGLE (VIEW)
export const getSingleRate = async (req, res) => {
    try {
        const data = await RateList.findById(req.params.id).populate("party");

        if (!data) {
            return res.status(404).json({ message: "Rate not found" });
        }

        res.json(data);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ✅ UPDATE
export const updateRate = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await RateList.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Rate not found" });
        }

        res.json({
            message: "Updated Successfully",
            data: updated
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ✅ DELETE
export const deleteRate = async (req, res) => {
    try {
        const deleted = await RateList.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Rate not found" });
        }

        res.json({ message: "Deleted Successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};