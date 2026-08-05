import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import nodemailer from 'nodemailer';
import Quotation from "../model/customerQuotation.model.js";
import { previewNextReceiptNo } from "../utils/generateReceiptNo.js";
import { sendWhatsappMessage } from "../utils/sendWhatsapp.js";
import { Customer } from "../model/customer.model.js";
import manageStation from "../model/manageStation.model.js";
import { QCustomer } from "../model/Qcustomer.model.js";
import { parse } from 'date-fns';
import { uploadToCloudinary } from "../utils/uploadPdfToCloudinary.js";
import { generateAndCommitReceiptNo } from "../utils/generateReceiptNo.js";

const normalizeDate = (inputDate) => {
  if (!inputDate) return null;

  const [y, m, d] = inputDate.split("-");

  return new Date(Date.UTC(y, m - 1, d));
};

const formatDateOnly = (date) =>
  date ? new Date(date).toISOString().slice(0, 10) : null;

const formatQuotations = (quotations) => {
  return quotations.map((q, index) => ({
    "orderId": q.orderId || 'N/A',
    "S.No.": index + 1,
    "biltyNo": q.productDetails?.[0]?.receiptNo || "-",
    "Booking ID": q.bookingId,
    "quotationPdf": q.quotationPdf || null,
    "orderBy": q.createdByRole === "admin"
      ? "Admin"
      : `Supervisor ${q.startStationName || ''}`,
    "Date": formatDateOnly(q.quotationDate),
    "Name": q.fromCustomerName
      || (q.customerId
        ? `${q.customerId.firstName} ${q.customerId.lastName}`
        : `${q.firstName || ""} ${q.lastName || ""}`.trim()),
    "pickup": q.startStationName || q.startStation?.stationName || 'N/A',
    "Name (Drop)": q.toCustomerName || "",
    "drop": q.endStation || "",
    "Contact": q.mobile || "",
    "Bilty Charge": q.biltyCharge || 0,
    "cancelReason": q.cancelReason || "-",
    "Action": [
      { name: "View", icon: "view-icon", action: `/api/quotations/${q._id}` },
      { name: "Edit", icon: "edit-icon", action: `/api/quotations/edit/${q._id}` },
      { name: "Delete", icon: "delete-icon", action: `/api/quotations/delete/${q._id}` },
    ],
  }));
};
//base condition
const getBookingFilterByType = (type, user) => {
  let baseFilter = { isDeleted: false };  // 🔥 ADD THIS

  if (type === 'active') {
    baseFilter = { activeDelivery: true, isDeleted: false };
  } else if (type === 'cancelled') {
    baseFilter = { totalCancelled: { $gt: 0 }, isDeleted: false };
  } else {
    baseFilter = {
      activeDelivery: false,
      isDelivered: { $ne: true },
      totalCancelled: 0,
      isDeleted: false,
      $or: [
        { createdByRole: { $in: ['admin', 'supervisor'] } },
        { requestedByRole: 'public', isApproved: true }
      ]
    };
  }

  if (user?.role === 'supervisor') {
    return {
      $and: [
        baseFilter,
        { createdByUser: user._id }
      ]
    };
  }

  return baseFilter;
};

const parseDDMMYYYY = (dateStr, endOfDay = false) => {
  const [dd, mm, yyyy] = dateStr.split("-");

  if (!dd || !mm || !yyyy) return null;

  const date = new Date(
    Date.UTC(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    )
  );

  return isNaN(date.getTime()) ? null : date;
};

// Create Quotation Controller
export const createQuotation = asyncHandler(async (req, res, next) => {
  const user = req.user;
  let {
    firstName,
    lastName,
    middleName,
    startStationName,
    endStation,
    quotationDate,
    proposedDeliveryDate,
    fromCustomerName,
    fromAddress,
    fromCity,
    fromState,
    fromPincode,
    toCustomerName,
    toContactNumber,
    toAddress,
    toCity,
    toState,
    toPincode,
    additionalCmt,
    sTax,
    sgst,
    amount,
    productDetails,
    locality,
    grandTotal,
    biltyCharge,
    insVppAmount,
    contactNumber,
    email
  } = req.body;

  // Auto-extract name if missing
  if ((!firstName || !lastName) && fromCustomerName) {
    const parts = fromCustomerName.trim().split(" ");
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  } else if ((!firstName || !lastName) && toCustomerName) {
    const parts = toCustomerName.trim().split(" ");
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  // Validate required fields
  if (!firstName || !lastName) {
    return next(new ApiError(400, "Customer first and last name are required"));
  }

  if (!startStationName) {
    return next(new ApiError(400, "Start station name is required"));
  }

  if (!endStation) {
    return next(new ApiError(400, "End station is required"));
  }

  // Validate dates
  if (!quotationDate || !proposedDeliveryDate) {
    return next(new ApiError(400, "Quotation date and proposed delivery date are required"));
  }

  // 1. Find or Create Customer
  let customer = await QCustomer.findOne({
    $or: [
      { contactNumber: req.body.contactNumber },
      { emailId: req.body.email },
      { firstName, lastName }
    ]
  });

  if (!customer) {
    // Create new customer if not found
    customer = new QCustomer({
      firstName,
      middleName: middleName || "",
      lastName,
      contactNumber: req.body.contactNumber || "",
      emailId: req.body.email || "",
      locality: locality || ""
    });
    await customer.save();
  }

  // 2. Find Start Station
  const station = await manageStation.findOne({ stationName: startStationName });
  if (!station) return next(new ApiError(404, "Start station not found"));

  // 3. Validate product details (including insurance)
  if (!Array.isArray(productDetails) || productDetails.length === 0) {
    return next(new ApiError(400, "At least one product must be provided"));
  }

  for (const product of productDetails) {
    if (
      !product.name ||
      typeof product.quantity !== 'number' ||
      product.quantity <= 0 ||
      typeof product.price !== 'number' ||
      product.price < 0 ||
      typeof product.weight !== 'number' ||
      product.weight < 0 ||
      !product.topay ||
      (product.insurance !== undefined && (typeof product.insurance !== 'number' || product.insurance < 0))
    ) {
      return next(new ApiError(400, "Invalid product details. Please check name, quantity, price, weight, topay, and insurance fields."));
    }
  }

  // Calculate grandTotal if not provided
  let calculatedGrandTotal = grandTotal;
  const receiptNo = await generateAndCommitReceiptNo(
    station.stationCode || station.stationName
  );

  // 4. Create and Save Quotation
  const quotation = new Quotation({
    customerId: customer._id,
    startStation: station._id,
    startStationName: station.stationName,
    endStation,
    firstName: customer.firstName,
    middleName: customer.middleName || middleName || "",
    lastName: customer.lastName,
    mobile: customer.contactNumber || req.body.contactNumber,
    email: customer.emailId || req.body.email,
    locality: locality || customer.locality || "",
    quotationDate: normalizeDate(quotationDate),
    proposedDeliveryDate: normalizeDate(proposedDeliveryDate),
    fromCustomerName: fromCustomerName || `${firstName} ${lastName}`.trim(),
    fromAddress,
    fromCity,
    fromState,
    fromPincode,
    toCustomerName: toCustomerName || fromCustomerName || `${firstName} ${lastName}`.trim(),
    toContactNumber: toContactNumber || contactNumber,
    toAddress: toAddress || fromAddress,
    toCity: toCity || fromCity,
    toState: toState || fromState,
    toPincode: toPincode || fromPincode,
    additionalCmt,
    sTax: Number(sTax) || 0,
    sgst: Number(sgst) || 0,
    amount: Number(amount) || 0,
    biltyCharge: Number(biltyCharge) || 0,
    insVppAmount: Number(insVppAmount) || 0,
    createdByUser: user._id,
    createdByRole: user.role,
    productDetails: productDetails.map(item => ({
      ...item,
      insurance: item.insurance || 0,
      vppAmount: item.vppAmount || 0,
      receiptNo,
      refNo: item.refNo || ""
    })),
    grandTotal: calculatedGrandTotal,
  });

  await quotation.save();

  const formattedQuotation = {
    ...quotation.toObject(),
    quotationDate: formatDateOnly(quotation.quotationDate),
    proposedDeliveryDate: formatDateOnly(quotation.proposedDeliveryDate),
    totalInsurance: quotation.totalInsurance, // Include total insurance in response
    computedTotalRevenue: quotation.computedTotalRevenue, // Include computed total
    biltyCharge: quotation.biltyCharge,
    insVppAmount: quotation.insVppAmount
  };

  res.status(201).json(new ApiResponse(201, formattedQuotation, "Quotation created successfully"));
});

export const getBookingSummaryByDate = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    const user = req.user;

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "Both fromDate and toDate are required" });
    }

    // ✅ DD-MM-YYYY parsing
    const from = parseDDMMYYYY(fromDate);
    const to = parseDDMMYYYY(toDate, true);

    if (!from || !to) {
      return res.status(400).json({ message: "Invalid date format. Use DD-MM-YYYY" });
    }

    const query = {
      quotationDate: { $gte: from, $lte: to },
      totalCancelled: { $eq: 0 },
      isDeleted: false
    };

    if (user.role === "supervisor") {
      query.createdByUser = user._id;
    }

    // ❌ lean() hata diya
    const bookings = await Quotation.find(query)
      .sort({ quotationDate: -1 });
    let totalPaid = 0;
    let totalToPay = 0;

    bookings.forEach((booking) => {

      const revenue =
        Number(booking.grandTotal || 0);

      const isPaid =
        booking.productDetails?.every(
          p => p.topay?.toLowerCase() === "paid"
        );

      if (isPaid) {

        totalPaid += revenue;

      } else {

        totalToPay += revenue;

      }

    });
    const bookingSummaries = bookings.map((booking) => {

      const topayReceived =
        booking.topayHistory?.reduce(
          (sum, item) =>
            sum + Number(item.amount || 0),
          0
        ) || 0;

      return {

        ...booking.toObject(),

        biltyCharge: booking.biltyCharge || 0,
        paid: booking.paidAmount || 0,

        toPayReceived: topayReceived,

        dueBalance:
          booking.paymentStatus === "Paid"
            ? 0
            : Number(
              booking.deliveryPendingAmount ||
              booking.grandTotal ||
              0
            ),

        paymentStatus:
          booking.paymentStatus,

        itemsCount:
          booking.productDetails?.length || 0

      };

    });
    const summary = {
      totalPaid,
      totalToPay,
      grandTotal: totalPaid + totalToPay,
      totalBookings: bookingSummaries.length
    };

    res.status(200).json({
      message: `Bookings from ${fromDate} to ${toDate}`,
      total: bookingSummaries.length,
      bookings: bookingSummaries,
      summary
    });

  } catch (error) {
    console.error("Error fetching bookings by date:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get All Quotations Controller
export const getAllQuotations = asyncHandler(async (req, res) => {
  const quotations = await Quotation.find({ isDeleted: false })
    .populate("startStation", "stationName")
    .populate("customerId", "firstName lastName");
  console.log(quotations)
  const formatted = formatQuotations(quotations);


  res.status(200).json(new ApiResponse(200, formatted));
});

// Get Quotation by ID Controller
export const getQuotationById = asyncHandler(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate("startStation", "stationName")
    .populate("customerId", "firstName lastName");

  if (!quotation) return next(new ApiError(404, "Quotation not found"));

  // Add virtual fields to response
  const quotationWithVirtuals = {
    ...quotation.toObject(),
    toContactNumber: quotation.toContactNumber || quotation.mobile,
    insVppAmount: quotation.insVppAmount,
    biltyCharge: quotation.biltyCharge,
    productTotal: quotation.productTotal,
    computedTotalRevenue: quotation.computedTotalRevenue
  };

  res.status(200).json(new ApiResponse(200, quotationWithVirtuals));
});

// Update Quotation Controller
export const updateQuotation = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.params;

  // ✅ ALWAYS destructure from req.body
  const {
    productDetails = [],
    sTax = 0,
    sgst = 0,
    biltyCharge = 0,
  } = req.body;

  // ✅ Start Station Change Fix

  if (req.body.startStationName) {

    const station =
      await manageStation.findOne({
        stationName: req.body.startStationName
      });

    if (!station) {
      return next(
        new ApiError(
          404,
          "Start Station not found"
        )
      );
    }

    req.body.startStation = station._id;
    req.body.startStationName = station.stationName;
  }

  let calculatedGrandTotal = 0;
  let productValueTotal = 0;
  let insuranceTotal = 0;
  let vppTotal = 0;
  let insVppTotal = 0;

  // ✅ If productDetails updated → recalc totals
  if (Array.isArray(productDetails) && productDetails.length > 0) {

    // Validate insurance & vpp
    for (const product of productDetails) {
      if (
        (product.insurance !== undefined && product.insurance < 0) ||
        (product.vppAmount !== undefined && product.vppAmount < 0)
      ) {
        return next(
          new ApiError(400, "Insurance and vppAmount must be non-negative numbers")
        );
      }
    }

    // Base product total
    productValueTotal = productDetails.reduce(
      (acc, item) => acc + Number(item.price || 0),
      0
    );

    insVppTotal =
      Number(req.body.insVppAmount || 0);

    // Tax only on product price
    const taxableAmount =
      productValueTotal;

    const sTaxAmount =
      (taxableAmount * Number(sTax || 0)) / 100;

    const sgstAmount =
      (taxableAmount * Number(sgst || 0)) / 100;

    calculatedGrandTotal =
      productValueTotal +
      insVppTotal +
      Number(biltyCharge || 0) +
      sTaxAmount +
      sgstAmount;
  }

  // ✅ Merge calculatedGrandTotal safely
  const updatedQuotation = await Quotation.findOneAndUpdate(
    { bookingId },
    {
      ...req.body,

      amount: productValueTotal, // only parcel value

      biltyCharge: Number(biltyCharge || 0),

      insVppAmount: insVppTotal,

      grandTotal: calculatedGrandTotal,

      deliveryPendingAmount:
        calculatedGrandTotal,

      paidAmount:
        req.body.paymentStatus === "Paid"
          ? calculatedGrandTotal
          : 0
    },
    { new: true }
  );

  if (!updatedQuotation) {
    return next(new ApiError(404, "Quotation not found"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedQuotation, "Quotation updated successfully"));
});

// Delete Quotation Controller
export const deleteQuotation = asyncHandler(async (req, res, next) => {
  let quotation;

  const id = req.params.bookingId;

  // 🔥 SAME AS BOOKING LOGIC
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    quotation = await Quotation.findById(id);
  } else {
    quotation = await Quotation.findOne({ bookingId: id });
  }

  if (!quotation) {
    return next(new ApiError(404, "Quotation not found"));
  }

  quotation.isDeleted = true;
  quotation.deletedAt = new Date();

  await quotation.save();

  res.status(200).json(
    new ApiResponse(200, quotation, "Quotation moved to recycle bin")
  );
});

export const listDeletedQuotations = asyncHandler(async (req, res) => {
  const quotations = await Quotation.find({ isDeleted: true });

  res.status(200).json({
    count: quotations.length,
    quotations
  });
});

export const restoreQuotation = asyncHandler(async (req, res) => {
  const id = req.params.id;

  let quotation;

  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    quotation = await Quotation.findById(id);
  } else {
    quotation = await Quotation.findOne({ bookingId: id });
  }

  if (!quotation || !quotation.isDeleted) {
    return res.status(404).json({
      success: false,
      message: "Quotation not found in recycle bin"
    });
  }

  quotation.isDeleted = false;
  quotation.deletedAt = null;

  await quotation.save();

  res.json({
    success: true,
    message: "Quotation restored successfully",
    data: quotation
  });
});

// Get Total Booking Requests Controller
export const getTotalBookingRequests = asyncHandler(async (req, res) => {
  const filter = getBookingFilterByType('request', req.user); // 'request' means non-active, non-cancelled

  const total = await Quotation.countDocuments(filter);

  res.status(200).json(new ApiResponse(200, { totalBookingRequests: total }));
});

// Get Total Active Deliveries Controller
export const getTotalActiveDeliveries = asyncHandler(async (req, res) => {
  const filter = getBookingFilterByType('active', req.user);
  const total = await Quotation.countDocuments(filter);
  res.status(200).json(new ApiResponse(200, { totalActiveDeliveries: total }));
});

// Get Total Cancelled Quotations Controller
export const getTotalCancelled = asyncHandler(async (req, res) => {
  const filter = getBookingFilterByType('request', req.user);
  const total = await Quotation.countDocuments(filter);
  res.status(200).json(new ApiResponse(200, { totalCancelled: total }));
});

export const getTotalRevenue = asyncHandler(async (req, res) => {
  const quotations = await Quotation.find();

  const totalRevenue = quotations.reduce(
    (sum, q) => sum + (q.paidAmount || 0),
    0
  );

  console.log("Total Revenue:", totalRevenue);
  res.status(200).json(new ApiResponse(200, { totalRevenue }));
});

export const searchQuotationByBookingId = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.params;

  if (!bookingId) {
    return next(new ApiError(400, "Booking ID is required"));
  }

  const quotation = await Quotation.findOne({ bookingId })
    .populate("startStation", "stationName gst address contact")
    .populate("customerId", "firstName lastName")
    .lean();

  if (!quotation) {
    return next(new ApiError(404, "Quotation not found with the provided Booking ID"));
  }

  const formatDate = (date) =>
    date ? new Date(date).toISOString().slice(0, 10) : null;


  if (quotation.quotationDate) {
    quotation.quotationDate = formatDate(quotation.quotationDate);
  }

  if (quotation.proposedDeliveryDate) {
    quotation.proposedDeliveryDate = formatDate(quotation.proposedDeliveryDate);
  }

  // Calculate insurance total for the response
  const totalInsurance = quotation.productDetails.reduce((acc, item) =>
    acc + (item.insurance || 0), 0
  );

  res.status(200).json(new ApiResponse(200, {
    ...quotation,
    toContactNumber: quotation.toContactNumber || quotation.mobile,
    totalInsurance,
    biltyCharge: quotation.biltyCharge,
    productTotal: quotation.productTotal,
    computedTotalRevenue: quotation.computedTotalRevenue
  }));
});

export const getActiveList = asyncHandler(async (req, res) => {

  const filter = getBookingFilterByType('active', req.user);

  const activeQuotations = await Quotation.find(filter)
    .populate("startStation", "stationName")
    .populate("customerId", "firstName lastName");

  const formatted = formatQuotations(activeQuotations);

  res.status(200).json(new ApiResponse(200, {
    totalActiveDeliveries: activeQuotations.length,
    deliveries: formatted
  }));
});

export const getCancelledList = asyncHandler(async (req, res) => {
  const filter = getBookingFilterByType('cancelled', req.user);
  const cancelledQuotations = await Quotation.find(filter)
    .populate("startStation", "stationName")
    .populate("customerId", "firstName lastName");

  const formatted = formatQuotations(cancelledQuotations);

  res.status(200).json(new ApiResponse(200, {
    totalCancelledDeliveries: cancelledQuotations.length,
    deliveries: formatted
  }));
});
const getRevenueBookingFilter = (type, user) => {
  const base = getBookingFilterByType(type, user);
  if (base.$and) {
    base.$and.unshift({ isDelivered: true });
    return base;
  }
  return { ...base, isDelivered: true };
};

// Controller to get revenue details from quotations
export const getRevenue = asyncHandler(async (req, res) => {
  // 🔥 Base filter
  const filter = getRevenueBookingFilter(req.query.type, req.user);

  // 🔥 Cancelled remove (MAIN FIX)
  const finalFilter = {
    ...filter,
    totalCancelled: { $eq: 0 }   // ✅ IMPORTANT
  };

  // 🔥 Fetch data
  const quotations = await Quotation.find(finalFilter)
    .select(`
      bookingId
      quotationDate
      startStationName
      endStation
      grandTotal
      paidAmount
      deliveryPendingAmount
      paymentStatus
    `)
    .lean();

  /* ===============================
     TOTAL REVENUE (ONLY PAID)
  =============================== */
  const totalRevenue = quotations.reduce(
    (sum, q) => sum + (q.paidAmount || 0),
    0
  );

  /* ===============================
     TABLE DATA
  =============================== */
  const data = quotations.map((q, index) => ({
    SNo: index + 1,
    bookingId: q.bookingId,
    date: q.quotationDate
      ? new Date(q.quotationDate).toISOString().slice(0, 10)
      : "N/A",
    pickup: q.startStationName || "Unknown",
    drop: q.endStation || "Unknown",

    grandTotal: Number(q.grandTotal || 0).toFixed(2),
    paidAmount: Number(q.paidAmount || 0).toFixed(2),
    toPayAmount: Number(q.deliveryPendingAmount || 0).toFixed(2),
    paymentStatus: q.paymentStatus || "Unpaid",
  }));

  // 🔥 Final response
  res.status(200).json({
    totalRevenue: totalRevenue.toFixed(2),
    count: data.length,
    data,
  });
});

// Update Quotation Status Controller (query only, no cancel reason)
export const updateQuotationStatus = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.params;
  const { activeDelivery } = req.query;
  const { cancelReason } = req.body;

  if (activeDelivery !== 'true' && activeDelivery !== 'false') {
    return next(new ApiError(400, "activeDelivery must be 'true' or 'false'"));
  }

  const isActive = activeDelivery === 'true';

  // ❗ अगर cancel कर रहे हो तो reason mandatory
  if (!isActive && !cancelReason) {
    return next(new ApiError(400, "Cancel reason is required"));
  }

  const updateFields = {
    activeDelivery: isActive,
    totalCancelled: isActive ? 0 : 1,
    cancelReason: isActive ? null : cancelReason, // ✅ STORE
  };

  const updatedQuotation = await Quotation.findOneAndUpdate(
    { bookingId },
    { $set: updateFields },
    { new: true }
  );

  if (!updatedQuotation) {
    return next(new ApiError(404, "Quotation not found"));
  }

  res.status(200).json(
    new ApiResponse(
      200,
      updatedQuotation,
      isActive ? "Quotation activated" : "Quotation cancelled with reason"
    )
  );
});

// Get List of Booking Requests (Not active, not cancelled)
export const RequestBookingList = asyncHandler(async (req, res) => {
  const filter = getBookingFilterByType('request', req.user);
  const quotations = await Quotation.find(filter)
    .populate("startStation", "stationName")
    .populate("customerId", "firstName lastName");


  const formatted = formatQuotations(quotations);

  // Return the formatted list
  res.status(200).json(new ApiResponse(200, {
    totalNonActiveNonCancelled: quotations.length,
    deliveries: formatted
  }));
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.gmail,
    pass: process.env.app_pass
  }
});

export const sendBookingEmail = async (email, booking) => {
  const {
    firstName,
    lastName,
    fromAddress,
    fromCity,
    fromState,
    fromPincode,
    toAddress,
    toState,
    toCity,
    toPincode,
    productDetails,
    amount,
    grandTotal,
    totalInsurance
  } = booking;

  let productDetailsText = '';
  productDetails.forEach(product => {
    productDetailsText += `\nName: ${product.name}, Weight: ${product.weight}, Quantity: ${product.quantity}, Price: ${product.price}, Insurance: ₹${product.insurance || 0}`;
  });

  const mailOptions = {
    from: process.env.gmail,
    to: email,
    subject: `Quotation Details - ${booking.bookingId}`,
    html: `
        <h2><b>Quotation Details</b></h2>
        <p>Dear ${firstName} ${lastName},</p>
        <p>Your booking with Booking ID: <strong>${booking.bookingId}</strong> has been successfully created.</p>
        <p><strong>From Address:</strong> ${fromAddress}, ${fromCity}, ${fromState}, ${fromPincode}</p>
        <p><strong>To Address:</strong> ${toAddress}, ${toCity}, ${toState}, ${toPincode}</p>
        <h3>Product Details:</h3>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr>
              <th>Name</th>
              <th>Weight</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Insurance</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${productDetails.map(product => `
              <tr>
                <td>${product.name}</td>
                <td>${product.weight}</td>
                <td>${product.quantity}</td>
                <td>₹${product.price}</td>
                <td>₹${product.insurance || 0}</td>
                <td>₹${(product.price * product.quantity) + (product.insurance || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${totalInsurance > 0 ? `<p><strong>Total Insurance:</strong> ₹${totalInsurance}</p>` : ''}
        <p><strong>Grand Total:</strong> ₹${grandTotal || amount}</p>
        <p>Thank you for choosing our service.</p>
        <p>Best regards,<br>BharatParcel Team</p>
      `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
  }
};
export const sendBookingEmailById = async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Populate the 'customerId' field with email and name
    const booking = await Quotation.findOne({ bookingId }).populate('customerId', 'emailId firstName lastName');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check populated customer data
    const customer = booking.customerId;

    if (!customer?.emailId) {
      return res.status(400).json({ message: 'Customer email not available' });
    }

    // Send the email
    await sendBookingEmail(customer.emailId, {
      ...booking.toObject(),
      firstName: customer.firstName,
      lastName: customer.lastName
    });

    res.status(200).json({ message: 'Booking confirmation email sent successfully' });
  } catch (error) {
    console.error('Error sending booking email by ID:', bookingId, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getIncomingQuotations = asyncHandler(async (req, res) => {
  const user = req.user; // logged-in user
  const { fromDate, toDate } = req.body;

  if (!fromDate || !toDate) {
    return res.status(400).json({ message: "fromDate and toDate are required" });
  }

  // Parse dates
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);   // ✅ start date fix

  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999); // ✅ end date full include

  let quotationFilter = {
    quotationDate: { $gte: from, $lte: to },
    isDelivered: false,
    activeDelivery: false,
    totalCancelled: { $eq: 0 }
  };

  if (user.role === "supervisor") {
    if (!user.startStation) {
      return res.status(400).json({ message: "Supervisor must have a startStation assigned" });
    }

    const supervisorStation = await manageStation.findOne({
      stationName: user.startStation,
    });

    if (!supervisorStation) {
      return res.status(404).json({ message: "Supervisor's station not found" });
    }

    quotationFilter.endStation = supervisorStation.stationName;
  }

  // Fetch quotations
  const quotations = await Quotation.find(quotationFilter)
    .populate("startStation", "stationName")
    .populate("endStation", "stationName")
    .populate("customerId", "firstName lastName emailId")
    .lean();

  res.status(200).json({
    success: true,
    count: quotations.length,
    data: quotations,
  });
});

export const previewReceiptNo = async (req, res) => {
  const stationCode = req.user.stationCode;

  if (!stationCode) {
    return res.status(400).json({ message: "StationCode missing" });
  }

  const receiptNo = await previewNextReceiptNo(stationCode);

  res.status(200).json({
    success: true,
    receiptNo,
  });
};

export const sendQuotationWhatsapp = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const body = req.body || {};
  const { pdfUrl, mobile } = body;

  if (!pdfUrl) {
    throw new ApiError(400, "pdfUrl is required in request body");
  }

  let quotation = null;
  if (bookingId) {
    quotation = await Quotation.findOne({ bookingId });
  }

  const finalMobile =
    mobile ||
    quotation?.mobile ||
    quotation?.toContactNumber;

  if (!finalMobile) {
    throw new ApiError(400, "Customer mobile not available");
  }

  await sendWhatsappMessage({
    mobile: finalMobile.startsWith("91")
      ? finalMobile
      : `91${finalMobile}`,
    templateName: "bharatparcel_quotation_slip",
    pdfUrl,
    bodyParams: [
      quotation
        ? `${quotation.firstName} ${quotation.lastName}`
        : "Customer",
      bookingId || "N/A",
      quotation?.startStationName || "N/A",
      quotation?.endStation || "N/A",
      quotation?.fromCustomerName || "N/A",
      finalMobile,
      quotation?.toCustomerName || "N/A",
      quotation?.toContactNumber || finalMobile,
      quotation?.quotationDate
        ? quotation.quotationDate.toISOString().slice(0, 10)
        : "",
      quotation?.proposedDeliveryDate
        ? quotation.proposedDeliveryDate.toISOString().slice(0, 10)
        : "",
      quotation?.grandTotal?.toFixed(2) || "0.00",
    ],
  });

  res.status(200).json({
    success: true,
    message: "WhatsApp quotation sent successfully",
  });
});

export const uploadQuotationPdf = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  if (!req.file) {
    throw new ApiError(400, "File is required");
  }

  const quotation = await Quotation.findOne({ bookingId });

  if (!quotation) {
    throw new ApiError(404, "Quotation not found");
  }

  // Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(
    req.file.path,
    "bharatparcel/quotations"
  );

  // ✅ Only update PDF
  quotation.quotationPdf = uploadResult.secure_url;

  // 🔥 IMPORTANT FIX
  await quotation.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, {
    pdfUrl: uploadResult.secure_url,
    bookingId
  }, "Quotation PDF uploaded successfully"));
});

export const receiveToPayAmount =
  asyncHandler(async (req, res) => {

    const { bookingId } = req.params;

    const { amount } = req.body;

    const quotation =
      await Quotation.findOne({ bookingId });

    if (!quotation) {
      throw new ApiError(
        404,
        "Quotation not found"
      );
    }

    //////// HARD STOP DUPLICATE ////////

    if (
      quotation.deliveryPendingAmount <= 0
    ) {
      throw new ApiError(
        400,
        "Payment already received"
      );
    }

    if (
      amount > quotation.deliveryPendingAmount
    ) {
      throw new ApiError(
        400,
        "Amount exceeds pending"
      );
    }

    //////// FIX ////////

    quotation.deliveryPendingAmount =
      quotation.deliveryPendingAmount
      - Number(amount);

    quotation.topayHistory.push({
      amount: Number(amount),
      date: new Date()
    });

    if (
      quotation.deliveryPendingAmount <= 0
    ) {
      quotation.deliveryPendingAmount = 0;
      quotation.paymentStatus = "Paid";
    }
    else {
      quotation.paymentStatus = "Partial";
    }

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "ToPay received successfully",
      data: quotation
    });

  });



