import express from "express";
import {
    createRateList,
    getRateList,
    getSingleRate,
    updateRate,
    deleteRate
} from "../controller/rateList.controller.js"

const router = express.Router();

// CREATE
router.post("/", createRateList);

// GET ALL
router.get("/", getRateList);

// GET SINGLE (VIEW)
router.get("/:id", getSingleRate);

// UPDATE
router.put("/:id", updateRate);

// DELETE
router.delete("/:id", deleteRate);

export default router;