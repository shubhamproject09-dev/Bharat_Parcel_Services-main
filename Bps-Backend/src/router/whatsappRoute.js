import express from "express";
import {
  sendBookingTemplate, sendQuotationWhatsapp, sendBookingCancelWhatsapp,
  sendQuotationCancelWhatsapp
} from "../controller/whatsappController.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { roleAccessFilter } from "../middleware/role.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post(
  "/send-template",
  verifyJwt,
  roleAccessFilter,
  upload.single("file"),
  sendBookingTemplate
);

router.post(
  "/send-quotation",
  verifyJwt,
  roleAccessFilter,
  upload.single("file"),
  sendQuotationWhatsapp
);

router.post(
  "/send-booking-cancel",
  verifyJwt,
  roleAccessFilter,
  upload.single("file"),
  sendBookingCancelWhatsapp
);

router.post(
  "/send-quotation-cancel",
  verifyJwt,
  roleAccessFilter,
  upload.single("file"),
  sendQuotationCancelWhatsapp
);

export default router;