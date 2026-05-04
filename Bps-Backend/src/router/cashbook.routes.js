import express from "express";
import {
    getDailyIncome,
    saveCashBook,
    getCashBookList
} from "../controller/cashbook.controller.js";

import { verifyJwt } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔥 IMPORTANT
router.get("/income", verifyJwt, getDailyIncome);
router.post("/", verifyJwt, saveCashBook);
router.get("/", verifyJwt, getCashBookList);

export default router;