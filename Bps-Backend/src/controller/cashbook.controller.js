import mongoose from "mongoose";
import Booking from "../model/booking.model.js";
import Quotation from "../model/customerQuotation.model.js";
import CashBook from "../model/cashbook.model.js";
import manageStation from "../model/manageStation.model.js";

export const saveCashBook = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { date, expense, type } = req.body;
        const user = req.user;

        const stationData = await manageStation.findById(user.startStation);

        const stationObjectId = stationData?._id;

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);

        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        let totalIncome = 0;

        // 🔥 BOOKING INCOME
        if (type === "booking") {
            const incomeData = await Booking.aggregate([
                {
                    $match: {
                        bookingDate: { $gte: start, $lte: end },
                        startStation: new mongoose.Types.ObjectId(stationObjectId)
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: "$pickupCollectedAmount" }
                    }
                }
            ]);

            totalIncome = incomeData[0]?.totalIncome || 0;
        }

        if (type === "quotation") {
            const incomeData = await Quotation.aggregate([
                {
                    $match: {
                        quotationDate: { $gte: start, $lte: end },
                        startStation: new mongoose.Types.ObjectId(stationObjectId) // ✅ FIX
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: "$paidAmount" }
                    }
                }
            ]);

            totalIncome = incomeData[0]?.totalIncome || 0;
        }

        const balance = totalIncome - expense;

        const data = await CashBook.findOneAndUpdate(
            { date: start, station: stationObjectId, type }, // 🔥 ADD TYPE
            {
                station: stationObjectId,
                totalIncome,
                totalExpense: expense,
                balance,
                type // 🔥 IMPORTANT
            },
            { upsert: true, new: true }
        );

        res.json({
            message: "CashBook saved",
            data
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getCashBookList = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = req.user;
        const { from, to, station, type } = req.query;

        const start = new Date(from);
        start.setHours(0, 0, 0, 0);

        const end = new Date(to || from);
        end.setHours(23, 59, 59, 999);

        let filter = {
            date: { $gte: start, $lte: end }
        };

        if (type) {
            filter.type = type;
        }

        // 👑 ADMIN
        if (user.role === "admin") {
            if (station) {
                filter.station = new mongoose.Types.ObjectId(station);
            }
        }

        // 👤 SUPERVISOR
        if (user.role === "supervisor") {
            filter.station = new mongoose.Types.ObjectId(user.startStation);
        }

        const data = await CashBook.find(filter)
            .populate("station", "stationName")
            .sort({ date: 1 });

        res.json(data);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getDailyIncome = async (req, res) => {
    try {
        const { date, station, type } = req.query;
        const user = req.user;

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);

        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        let match = {};

        if (user.role === "supervisor") {
            match.startStation = new mongoose.Types.ObjectId(user.startStation);
        }

        if (user.role === "admin" && station && station !== "") {
            match.startStation = new mongoose.Types.ObjectId(station);
        }

        let totalIncome = 0;

        if (type === "booking") {
            const result = await Booking.aggregate([
                { $match: { ...match, bookingDate: { $gte: start, $lte: end } } },
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: "$pickupCollectedAmount" }
                    }
                }
            ]);

            totalIncome = result[0]?.totalIncome || 0;
        }

        if (type === "quotation") {
            const result = await Quotation.aggregate([
                { $match: { ...match, quotationDate: { $gte: start, $lte: end } } },
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: "$paidAmount" }
                    }
                }
            ]);

            totalIncome = result[0]?.totalIncome || 0;
        }

        res.json({ totalIncome });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};