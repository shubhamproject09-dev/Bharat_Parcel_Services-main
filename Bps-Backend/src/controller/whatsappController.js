import Booking from "../model/booking.model.js";
import Quotation from "../model/customerQuotation.model.js";
import {
  sendWhatsappTemplate,
  sendQuotationTemplate,
  sendBookingCancelTemplate,
  sendQuotationCancelTemplate
} from "../services/whatsappServices.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";

export const sendBookingTemplate = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const file = req.file;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    if (!file) {
      return res.status(400).json({ message: "PDF file required" });
    }

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const phone = booking.mobile || booking.receiverContact;

    if (!phone) {
      return res.status(400).json({ message: "Phone not found" });
    }

    const formattedPhone = phone.startsWith("91")
      ? phone
      : `91${phone}`;

    // ✅ Upload PDF
    const uploaded = await cloudinary.uploader.upload(file.path, {
      resource_type: "raw",
      public_id: `booking_${booking.bookingId}.pdf`,
    });

    fs.unlinkSync(file.path);

    const pdfUrl = uploaded.secure_url;

    const isPaid = booking.items?.[0]?.toPay === "paid";

    let taxValue = "";

    if (isPaid) {
      taxValue = `${booking.cgst + booking.sgst}`; // 9+9 = 18
    } else {
      taxValue = `${booking.igst}`; // 18
    }

    // ✅ EXACT TEMPLATE PARAMS (13 only)
    const bodyParams = [
      String(booking.bookingId || "-"),
      String(booking.items?.[0]?.receiptNo || "-"),
      String(booking.senderName || "-"),
      String(booking.mobile || "-"),
      String(booking.receiverName || "-"),
      String(booking.receiverContact || "-"),
      String(booking.fromCity || "-"),
      String(booking.toCity || "-"),
      String(booking.bookingDate || "-"),
      String(booking.items?.[0]?.quantity || 0),
      String(booking.items?.[0]?.weight || 0),
      String(booking.freight || 0),
      String(taxValue || 0),
      String(booking.grandTotal || 0),
    ];

    const response = await sendWhatsappTemplate({
      mobile: formattedPhone,
      pdfUrl,
      bodyParams,
    });

    console.log("WHATSAPP RESPONSE:", JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      message: "WhatsApp Template sent successfully",
    });
  } catch (error) {
    console.log("ERROR:", error.response?.data || error.message);
    next(error);
  }
};


export const sendQuotationWhatsapp = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const file = req.file;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    if (!file) {
      return res.status(400).json({ message: "PDF required" });
    }

    const booking = await Quotation.findOne({
      bookingId: String(bookingId).trim()
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const phone = booking.mobile || booking.toContactNumber;

    const formattedPhone = phone.startsWith("91")
      ? phone
      : `91${phone}`;

    // ✅ upload pdf
    const uploaded = await cloudinary.uploader.upload(file.path, {
      resource_type: "raw",
      public_id: `quotation_${booking.bookingId}.pdf`,
    });

    fs.unlinkSync(file.path);

    const pdfUrl = uploaded.secure_url;

    // ✅ send template
    await sendQuotationTemplate({
      mobile: formattedPhone,
      pdfUrl,
      name: booking.firstName,
      fromCity: booking.startStationName,
      toCity: booking.endStation,
    });

    res.json({
      success: true,
      message: "Quotation WhatsApp sent successfully",
    });
  } catch (error) {
    console.log(error.response?.data || error.message);
    next(error);
  }
};

export const sendBookingCancelWhatsapp = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const file = req.file;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    if (!file) {
      return res.status(400).json({ message: "PDF required" });
    }

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const phone = booking.mobile || booking.receiverContact;

    const formattedPhone = phone.startsWith("91")
      ? phone
      : `91${phone}`;

    // ✅ upload pdf
    const uploaded = await cloudinary.uploader.upload(file.path, {
      resource_type: "raw",
      public_id: `booking_cancel_${booking.bookingId}.pdf`,
    });

    fs.unlinkSync(file.path);

    const pdfUrl = uploaded.secure_url;

    // ✅ SEND CANCEL TEMPLATE
    await sendBookingCancelTemplate({
      mobile: formattedPhone,
      pdfUrl,
      biltyNo: booking.items?.[0]?.receiptNo || "-",
      bookingId: booking.bookingId,
      fromCity: booking.fromCity,
      toCity: booking.toCity,
      reason: booking.cancelReason || "Not specified",
    });

    res.json({
      success: true,
      message: "Booking Cancel WhatsApp sent",
    });

  } catch (error) {
    console.log(error.response?.data || error.message);
    next(error);
  }
};

export const sendQuotationCancelWhatsapp = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const file = req.file;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    if (!file) {
      return res.status(400).json({ message: "PDF required" });
    }

    const booking = await Quotation.findOne({
      bookingId: String(bookingId).trim()
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const phone = booking.mobile || booking.toContactNumber;

    const formattedPhone = phone.startsWith("91")
      ? phone
      : `91${phone}`;

    // ✅ upload pdf
    const uploaded = await cloudinary.uploader.upload(file.path, {
      resource_type: "raw",
      public_id: `quotation_cancel_${booking.bookingId}.pdf`,
    });

    fs.unlinkSync(file.path);

    const pdfUrl = uploaded.secure_url;

    // ✅ SEND CANCEL TEMPLATE
    await sendQuotationCancelTemplate({
      mobile: formattedPhone,
      pdfUrl,
      biltyNo: booking.productDetails?.[0]?.receiptNo || "-",
      bookingId: booking.bookingId,
      fromCity: booking.startStationName,
      toCity: booking.endStation,
      reason: booking.cancelReason || "Not specified",
    });

    res.json({
      success: true,
      message: "Quotation Cancel WhatsApp sent",
    });

  } catch (error) {
    console.log(error.response?.data || error.message);
    next(error);
  }
};