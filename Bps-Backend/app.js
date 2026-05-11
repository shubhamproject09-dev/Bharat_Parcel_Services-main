import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { verifyJwt } from "./src/middleware/auth.middleware.js";
import { vehicleAccessFilter } from "./src/middleware/vehicle.middleware.js"
import { roleAccessFilter } from "./src/middleware/role.middleware.js"
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.set("trust proxy", 1);
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://bharatparcel.cloud",
    "https://www.bharatparcel.cloud",
    "https://admin.bharatparcel.cloud"
];

app.use(cors({
    origin: function (origin, callback) {

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization"
    ]
}));

app.options(/.*/, cors());

app.use(express.json(
    {
        limit: "20mb"
    }

))
app.use(express.urlencoded(
    {
        extended: true,
        limit: "20mb"
    }
))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(
    "/invoices",
    express.static(
        path.join(process.cwd(), "public", "invoices")
    )
);

app.use(cookieParser());

import manageStation from "./src/router/manageStation.router.js"
app.use("/api/v2/stations", manageStation);
import driverRouter from "./src/router/driver.route.js"
app.use("/api/v2/driver", verifyJwt, roleAccessFilter, driverRouter);
import CustomerRouter from "./src/router/customer.route.js"
app.use("/api/v2/customers", verifyJwt, CustomerRouter);
import QCustomerRouter from "./src/router/qcustomer.router.js"
app.use("/api/v2/qcustomers", verifyJwt, QCustomerRouter);
import userRouter from "./src/router/user.route.js"
app.use("/api/v2/users", userRouter)
import vehicleRouter from "./src/router/vehicle.router.js"
app.use("/api/v2/vehicles", verifyJwt, vehicleAccessFilter, vehicleRouter)
import customerQuotation from "./src/router/customerQuotation.router.js"
app.use("/api/v2/quotation", customerQuotation);
import contactRouter from "./src/router/contact.router.js"
app.use("/api/v2/contact", verifyJwt, roleAccessFilter, contactRouter);
import expenseRouter from "./src/router/expense.router.js"
app.use("/api/v2/expenses", verifyJwt, roleAccessFilter, expenseRouter);


import bookingRouter from "./src/router/booking.router.js"
app.use("/api/v2/bookings", bookingRouter);


import deliveryRouter from "./src/router/delivery.router.js"
app.use("/api/v2/delivery", verifyJwt, roleAccessFilter, deliveryRouter);

import staffRouter from "./src/router/staff.routes.js";
app.use("/api/v2/staff", verifyJwt, roleAccessFilter, staffRouter);

import trackerRouter from "./src/router/tracker.router.js"
app.use("/api/v2/tracking", trackerRouter);


import customerLedgerRouter from "./src/router/customerLedgerHistory.router.js"
app.use("/api/v2/ledger", customerLedgerRouter);

import statesAndCitiesRouter from "./src/router/stateAndCity.router.js";
app.use("/api/v2/state", statesAndCitiesRouter);

import whatsappRoutes from './src/router/whatsappRoute.js';
app.use('/api/whatsapp', whatsappRoutes);

import addOptions from './src/router/addRouter.js';
app.use('/api/v2', addOptions);

import rateListRoutes from "./src/router/rateList.routes.js";
app.use("/api/v2/rate-list", rateListRoutes);

import cashbookRoutes from "./src/router/cashbook.routes.js";
app.use("/api/v2/cashbook", cashbookRoutes);

app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Log error in dev mode
    console.error(`[${statusCode}] ${message}`);

    return res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
});

export { app }