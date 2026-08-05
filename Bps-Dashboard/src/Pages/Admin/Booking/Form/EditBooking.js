import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { Formik, Form, FieldArray } from "formik";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { ArrowBack } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CustomerSearch from "../../../../Components/CustomerSearch";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux'
import { viewBookingById, updateBookingById } from "../../../../features/booking/bookingSlice";
import { fetchStations } from '../../../../features/stations/stationSlice'
import { fetchStates, fetchCities, clearCities } from '../../../../features/Location/locationSlice';

const toPay = [
  { value: "toPay", label: "To Pay" },
  { value: "paid", label: "Paid" },
  { value: "none", label: "None" },
];

const initialValues = {
  startStation: "",
  endStation: "",
  bookingDate: null,
  deliveryDate: null,
  customerSearch: "",
  firstName: "",
  middleName: "",
  lastName: "",
  mobile: "",
  email: "",
  senderName: "",
  senderLocality: "",
  fromCity: "",
  senderGgt: "",
  fromState: "",
  senderPincode: "",
  receiverName: "",
  receiverLocality: "",
  receiverGgt: "",
  toState: "",
  toCity: "",
  toPincode: "",
  contactNumber: "",
  receiverContact: "",
  receiverEmail: "",
  items: [
    {
      receiptNo: "",
      refNo: "",
      quantity: "",
      insurance: "",
      vppAmount: "",
      toPay: "",
      weight: "",
      perKg: "",        // ✅
      amount: "",
    },
  ],
  addComment: "",
  freight: "",
  ins_vpp: "",
  billTotal: "",
  biltyCharge: "",
  cgst: "",
  sgst: "",
  igst: "",
  grandTotal: "",
  roundOff: "0.00",
};

const totalFields = [
  { name: "freight", label: "FREIGHT", readOnly: false },
  { name: "ins_vpp", label: "INS/VPP", readOnly: false },
  { name: "biltyCharge", label: "BILTY CHARGE", readOnly: false },
  { name: "billTotal", label: "Bill Total", readOnly: true },
  { name: "cgst", label: "CGST%", readOnly: false },
  { name: "sgst", label: "SGST%", readOnly: false },
  { name: "igst", label: "IGST%", readOnly: false },
  { name: "grandTotal", label: "Grand Total", readOnly: true },
  { name: "roundOff", label: "Round Off", readOnly: true },
];

const calculateTotals = (values) => {
  const items = values.items || [];
  const biltyCharge = Number(values.biltyCharge || 0);

  // Freight Total
  const itemTotal = items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const freight = Number(values.freight || itemTotal);
  const ins_vpp = Number(values.ins_vpp || 0);

  // ✅ GST on Freight + INS/VPP
  const taxableAmount = freight + ins_vpp;

  // Bill Total before GST
  const billTotal = taxableAmount + biltyCharge;

  // GST
  const cgst = (taxableAmount * Number(values.cgst || 0)) / 100;
  const sgst = (taxableAmount * Number(values.sgst || 0)) / 100;
  const igst = (taxableAmount * Number(values.igst || 0)) / 100;

  // Final Total
  const totalBeforeRound =
    billTotal + cgst + sgst + igst;

  const rounded = Math.round(totalBeforeRound);

  const roundOff = (
    rounded - totalBeforeRound
  ).toFixed(2);

  return {
    billTotal: billTotal.toFixed(2),
    grandTotal: rounded.toFixed(2),
    roundOff,
    biltyCharge: biltyCharge.toFixed(2),
    autoFreight: itemTotal.toFixed(2),
  };
};

const validationSchema = Yup.object().shape({
  startStation: Yup.string().required("Start Station is required"),
  endStation: Yup.string().required("End Station is required"),
  bookingDate: Yup.date().nullable().required("Booking Date is required"),
  deliveryDate: Yup.date().nullable().required("Delivery Date is required"),
  customerSearch: Yup.string(),
  senderName: Yup.string().required("Sender Name is required"),
  senderLocality: Yup.string().required("Sender Locality is required"),
  fromCity: Yup.string().required("From City is required"),
  senderGgt: Yup.string().required("Sender GGT is required"),
  fromState: Yup.string().required("From State is required"),
  senderPincode: Yup.string()
    .matches(/^\d{6}$/, "Sender Pincode must be 6 digits")
    .required("Sender Pincode is required"),
  receiverName: Yup.string().required("Receiver Name is required"),
  receiverLocality: Yup.string().required("Receiver Locality is required"),
  receiverGgt: Yup.string().required("Receiver GGT is required"),
  toState: Yup.string().required("To State is required"),
  toCity: Yup.string().required("To City is required"),
  toPincode: Yup.string()
    .matches(/^\d{6}$/, "Receiver Pincode must be 6 digits")
    .required("Receiver Pincode is required"),
  items: Yup.array().of(
    Yup.object().shape({
      receiptNo: Yup.string().required("Receipt No is required"),
      refNo: Yup.string().required("Reference No is required"),
      quantity: Yup.number().min(1).required(),
      insurance: Yup.number()
        .typeError("Insurance must be a number")
        .min(0, "Cannot be negative"),
      vppAmount: Yup.number()
        .typeError("VPP Amount must be a number")
        .min(0, "Cannot be negative"),
      toPay: Yup.string().required("Payment status is required"),
      weight: Yup.number()
        .typeError("Weight must be a number")
        .min(0, "Cannot be negative"),
      amount: Yup.number()
        .typeError("Amount must be a number")
        .min(0, "Cannot be negative"),
    })
  ),
  addComment: Yup.string(),
  freight: Yup.number()
    .typeError("Freight must be a number")
    .min(0, "Cannot be negative"),
  ins_vpp: Yup.number()
    .typeError("Insurance/VPP must be a number")
    .min(0, "Cannot be negative"),
  billTotal: Yup.number()
    .typeError("Bill Total must be a number")
    .min(0, "Cannot be negative"),
  biltyCharge: Yup.number()
    .typeError("Bilty Charge must be a number")
    .min(0, "Cannot be negative"),
  cgst: Yup.number()
    .typeError("CGST must be a number")
    .min(0, "Cannot be negative"),
  sgst: Yup.number()
    .typeError("SGST must be a number")
    .min(0, "Cannot be negative"),
  igst: Yup.number()
    .typeError("IGST must be a number")
    .min(0, "Cannot be negative"),
  grandTotal: Yup.number()
    .typeError("Grand Total must be a number")
    .min(0, "Cannot be negative"),
  roundOff: Yup.number()
    .typeError("Round Off must be a number"),
});

const parseBackendDate = (dateStr) => {
  if (!dateStr) return null;

  // Case 1: ISO format (2026-01-27T18:30:00.000Z)
  if (dateStr.includes("T")) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // Case 2: DD-MM-YYYY format (27-01-2026)
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }
  }

  return null;
};

const EditBooking = () => {
  const [senderCities, setSenderCities] = React.useState([]);
  const [receiverCities, setReceiverCities] = React.useState([]);
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: stations } = useSelector((state) => state.stations);
  const { loading, error, viewedBooking } = useSelector(state => state.bookings);
  const { states, cities } = useSelector((state) => state.location);

  useEffect(() => {
    dispatch(fetchStations());
    dispatch(fetchStates());
  }, [dispatch]);

  useEffect(() => {
    if (bookingId) {
      dispatch(viewBookingById(bookingId));
    }
  }, [bookingId, dispatch]);

  const EffectSyncPaymentGST = ({ values, setFieldValue }) => {
    useEffect(() => {
      const payments = values.items.map(i => i.toPay);

      // toPay → IGST 18%
      if (payments.includes("toPay")) {
        setFieldValue("igst", "18");
        setFieldValue("cgst", "0");
        setFieldValue("sgst", "0");
        return;
      }

      // paid → CGST 9 + SGST 9
      if (payments.includes("paid")) {
        setFieldValue("igst", "0");
        setFieldValue("cgst", "9");
        setFieldValue("sgst", "9");
        return;
      }

      // none
      setFieldValue("igst", "0");
      setFieldValue("cgst", "0");
      setFieldValue("sgst", "0");

    }, [values.items, setFieldValue]);

    return null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Formik
        initialValues={{
          ...initialValues,
          ...viewedBooking,
          bookingDate: parseBackendDate(viewedBooking?.bookingDate),
          deliveryDate: parseBackendDate(viewedBooking?.deliveryDate),
          startStation: viewedBooking?.startStation?.stationName || "",
          endStation: viewedBooking?.endStation?.stationName || "",
          biltyCharge: viewedBooking?.biltyCharge || "0",
          roundOff: viewedBooking?.roundOff || "0.00",
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          setSubmitting(true);
          const payload = {
            ...values,

            mobile: values.contactNumber,

            items: values.items.map(({ perKg, ...rest }) => rest),
          };

          dispatch(updateBookingById({ bookingId, data: payload }))
            .unwrap()
            .then(() => {
              alert("Booking updated successfully!");
              navigate("/booking");
            })
            .catch((error) => {
              console.error("Failed to update", error);
              alert("Failed to update booking");
            })
            .finally(() => {
              setSubmitting(false);
            });
        }}
        enableReinitialize
      >
        {({ values, handleChange, setFieldValue, isSubmitting, errors, touched }) => (
          <Form>
            <EffectSyncCities
              values={values}
              dispatch={dispatch}
              setSenderCities={setSenderCities}
              setReceiverCities={setReceiverCities}
            />

            <EffectSyncPaymentGST values={values} setFieldValue={setFieldValue} />

            <EffectSyncTotals
              values={values}
              setFieldValue={setFieldValue}
            />
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ mr: 2, mb: 2 }}
            >
              Back
            </Button>

            <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
              <Grid container spacing={2}>
                {/* Station Details */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Start Station"
                    name="startStation"
                    value={values.startStation}
                    onChange={handleChange}
                    error={touched.startStation && Boolean(errors.startStation)}
                    helperText={touched.startStation && errors.startStation}
                  >
                    {stations.map((station) => (
                      <MenuItem key={station.stationId || station.sNo} value={station.stationName}>
                        {station.stationName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Destination Station"
                    name="endStation"
                    value={values.endStation}
                    onChange={handleChange}
                    error={touched.endStation && Boolean(errors.endStation)}
                    helperText={touched.endStation && errors.endStation}
                  >
                    {stations.map((station) => (
                      <MenuItem key={station.stationId || station.sNo} value={station.stationName}>
                        {station.stationName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Date Details */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Booking Date"
                    value={values.bookingDate}
                    onChange={(val) => setFieldValue("bookingDate", val)}
                    format="dd-MM-yyyy"
                    renderInput={(params) => (
                      <TextField
                        fullWidth
                        {...params}
                        error={touched.bookingDate && Boolean(errors.bookingDate)}
                        helperText={touched.bookingDate && errors.bookingDate}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Proposed Delivery Date"
                    value={values.deliveryDate}
                    onChange={(val) => setFieldValue("deliveryDate", val)}
                    format="dd-MM-yyyy"
                    renderInput={(params) => (
                      <TextField
                        fullWidth
                        {...params}
                        error={touched.deliveryDate && Boolean(errors.deliveryDate)}
                        helperText={touched.deliveryDate && errors.deliveryDate}
                      />
                    )}
                  />
                </Grid>


                {/* Sender Address */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>From (Address)</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <CustomerSearch
                    type="sender"
                    onCustomerSelect={(customer) => {
                      if (customer) {
                        setFieldValue("senderName", customer.name || "");
                        setFieldValue("senderGgt", customer.gstNumber || "");
                        setFieldValue("senderLocality", customer.address || "");
                        setFieldValue("fromState", customer.state || "");
                        setFieldValue("fromCity", customer.city || "");
                        setFieldValue("senderPincode", customer.pincode || "");
                        setFieldValue("contactNumber", customer.contactNumber || "");
                        setFieldValue("email", customer.emailId || "");
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="senderName"
                    value={values.senderName}
                    onChange={handleChange}
                    error={touched.senderName && Boolean(errors.senderName)}
                    helperText={touched.senderName && errors.senderName}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="GST Number"
                    name="senderGgt"
                    value={values.senderGgt}
                    onChange={handleChange}
                    error={touched.senderGgt && Boolean(errors.senderGgt)}
                    helperText={touched.senderGgt && errors.senderGgt}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Locality / Street"
                    name="senderLocality"
                    value={values.senderLocality}
                    onChange={handleChange}
                    error={touched.senderLocality && Boolean(errors.senderLocality)}
                    helperText={touched.senderLocality && errors.senderLocality}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="State"
                    name="fromState"
                    value={values.fromState}
                    onChange={handleChange}
                    error={touched.fromState && Boolean(errors.fromState)}
                    helperText={touched.fromState && errors.fromState}
                  >
                    {states.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="City"
                    name="fromCity"
                    value={values.fromCity}
                    onChange={handleChange}
                    error={touched.fromCity && Boolean(errors.fromCity)}
                    helperText={touched.fromCity && errors.fromCity}
                  >
                    {senderCities.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Pin Code"
                    name="senderPincode"
                    value={values.senderPincode}
                    onChange={handleChange}
                    error={touched.senderPincode && Boolean(errors.senderPincode)}
                    helperText={touched.senderPincode && errors.senderPincode}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    name="contactNumber"
                    value={values.mobile || ""}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={values.email || ""}
                    onChange={handleChange}
                  />
                </Grid>

                {/* Receiver Address */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>To (Address)</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <CustomerSearch
                    type="receiver"
                    onCustomerSelect={(customer) => {
                      if (customer) {
                        setFieldValue("receiverName", customer.name || "");
                        setFieldValue("receiverGgt", customer.gstNumber || "");
                        setFieldValue("receiverLocality", customer.address || "");
                        setFieldValue("toState", customer.state || "");
                        setFieldValue("toCity", customer.city || "");
                        setFieldValue("toPincode", customer.pincode || "");
                        setFieldValue("receiverContact", customer.contactNumber || "");
                        setFieldValue("receiverEmail", customer.emailId || "");
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="receiverName"
                    value={values.receiverName}
                    onChange={handleChange}
                    error={touched.receiverName && Boolean(errors.receiverName)}
                    helperText={touched.receiverName && errors.receiverName}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="GST Number"
                    name="receiverGgt"
                    value={values.receiverGgt}
                    onChange={handleChange}
                    error={touched.receiverGgt && Boolean(errors.receiverGgt)}
                    helperText={touched.receiverGgt && errors.receiverGgt}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Locality / Street"
                    name="receiverLocality"
                    value={values.receiverLocality}
                    onChange={handleChange}
                    error={touched.receiverLocality && Boolean(errors.receiverLocality)}
                    helperText={touched.receiverLocality && errors.receiverLocality}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="State"
                    name="toState"
                    value={values.toState}
                    onChange={handleChange}
                    error={touched.toState && Boolean(errors.toState)}
                    helperText={touched.toState && errors.toState}
                  >
                    {states.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="City"
                    name="toCity"
                    value={values.toCity}
                    onChange={handleChange}
                    error={touched.toCity && Boolean(errors.toCity)}
                    helperText={touched.toCity && errors.toCity}
                  >
                    {receiverCities.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Pin Code"
                    name="toPincode"
                    value={values.toPincode}
                    onChange={handleChange}
                    error={touched.toPincode && Boolean(errors.toPincode)}
                    helperText={touched.toPincode && errors.toPincode}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    name="receiverContact"
                    value={values.receiverContact || ""}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="receiverEmail"
                    value={values.receiverEmail || ""}
                    onChange={handleChange}
                  />
                </Grid>

                {/* Product Details */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Product Details</Typography>
                </Grid>
                <FieldArray name="items">
                  {({ push, remove }) => (
                    <>
                      {values.items.map((item, index) => (
                        <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>

                          {/* Receipt */}
                          <Grid size={{ xs: 12, md: 1.4 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Receipt No"
                              name={`items[${index}].receiptNo`}
                              value={item.receiptNo}
                              onChange={handleChange}
                            />
                          </Grid>

                          {/* Ref */}
                          <Grid size={{ xs: 12, md: 1.4 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Ref No"
                              name={`items[${index}].refNo`}
                              value={item.refNo}
                              onChange={handleChange}
                            />
                          </Grid>

                          {/* ================= DEFAULT ITEM ================= */}
                          {index === 0 && (
                            <>
                              <Grid size={{ xs: 12, md: 1.2 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Quantity"
                                  name={`items[${index}].quantity`}
                                  value={item.quantity}
                                  onChange={handleChange}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Insurance"
                                  name={`items[${index}].insurance`}
                                  value={item.insurance}
                                  onChange={handleChange}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="VPP Amount"
                                  name={`items[${index}].vppAmount`}
                                  value={item.vppAmount}
                                  onChange={handleChange}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Weight"
                                  value={values.items[index].weight}
                                  onChange={(e) => {
                                    const weight = Number(e.target.value || 0);
                                    const perKg = Number(values.items[index].perKg || 0);

                                    setFieldValue(`items[${index}].weight`, e.target.value);
                                    setFieldValue(`items[${index}].amount`, (weight * perKg).toFixed(2));
                                  }}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Per Kg"
                                  value={values.items[index].perKg}
                                  onChange={(e) => {
                                    const perKg = Number(e.target.value || 0);
                                    const weight = Number(values.items[index].weight || 0);

                                    setFieldValue(`items[${index}].perKg`, e.target.value);
                                    setFieldValue(`items[${index}].amount`, (weight * perKg).toFixed(2));
                                  }}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Amount"
                                  value={values.items[index].amount}
                                  InputProps={{ readOnly: true }}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.5 }}>
                                <TextField
                                  select
                                  fullWidth
                                  size="small"
                                  label="To Pay / Paid"
                                  name={`items[${index}].toPay`}
                                  value={item.toPay}
                                  onChange={handleChange}
                                >
                                  {toPay.map((p) => (
                                    <MenuItem key={p.value} value={p.value}>
                                      {p.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                            </>
                          )}

                          {/* ================= ADD ITEM ================= */}
                          {index > 0 && (
                            <>
                              <Grid size={{ xs: 12, md: 1.2 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Quantity"
                                  name={`items[${index}].quantity`}
                                  value={item.quantity}
                                  onChange={handleChange}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Insurance"
                                  name={`items[${index}].insurance`}
                                  value={item.insurance}
                                  onChange={handleChange}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.4 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Insurance Amount"
                                  value={item.insuranceAmount || ""}
                                  onChange={(e) => {
                                    const base = Number(e.target.value || 0);

                                    const cgst = base * 0.09;
                                    const sgst = base * 0.09;
                                    const total = base + cgst + sgst;

                                    setFieldValue(`items[${index}].insuranceAmount`, base);
                                    setFieldValue(`items[${index}].insuranceCgst`, "9");
                                    setFieldValue(`items[${index}].insuranceSgst`, "9");
                                    setFieldValue(`items[${index}].insuranceTotalWithGST`, total.toFixed(2));
                                    setFieldValue(`items[${index}].toPay`, "paid");
                                  }}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.2 }}>
                                <TextField label="CGST %" value="9%" size="small" fullWidth InputProps={{ readOnly: true }} />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.2 }}>
                                <TextField label="SGST %" value="9%" size="small" fullWidth InputProps={{ readOnly: true }} />
                              </Grid>

                              <Grid size={{ xs: 12, md: 1.6 }}>
                                <TextField
                                  label="Total Insurance"
                                  value={item.insuranceTotalWithGST || ""}
                                  size="small"
                                  fullWidth
                                  InputProps={{ readOnly: true }}
                                />
                              </Grid>
                            </>
                          )}

                          {/* ✅ REMOVE BUTTON (FIXED) */}
                          <Grid size={{ xs: 12, md: 1 }}>
                            <Button
                              color="error"
                              variant="outlined"
                              onClick={() => remove(index)}
                              disabled={values.items.length === 1}
                              fullWidth
                            >
                              Remove
                            </Button>
                          </Grid>

                        </Grid>
                      ))}

                      {/* ADD BUTTON */}
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() =>
                          push({
                            receiptNo: "",
                            refNo: "",
                            quantity: "",
                            insurance: "",
                            insuranceAmount: "",
                            insuranceCgst: "9",
                            insuranceSgst: "9",
                            insuranceTotalWithGST: "",
                            vppAmount: "",
                            toPay: "paid",
                            weight: "",
                            perKg: "",
                            amount: "",
                          })
                        }
                        sx={{ mt: 2 }}
                      >
                        + Add Item
                      </Button>
                    </>
                  )}
                </FieldArray>
                {/* Comments and Totals */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    name="addComment"
                    label="Additional Comments"
                    multiline
                    minRows={10}
                    fullWidth
                    value={values.addComment}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{ mt: 2 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {totalFields.map(({ name, label, readOnly }) => (
                      <Grid size={{ xs: 12, md: 6 }} key={name}>
                        <TextField
                          name={name}
                          label={label}
                          value={values[name]}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                          InputProps={{
                            readOnly: readOnly,
                            ...(label.includes("%") && {
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }),
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                {/* Submit Button */}
                <Grid size={{ xs: 12 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    sx={{ mt: 3, py: 1.5 }}
                  >
                    {isSubmitting ? "Updating..." : "Update Booking"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Form>
        )}
      </Formik>
    </LocalizationProvider>
  );
};

const EffectSyncCities = ({ values, dispatch, setSenderCities, setReceiverCities }) => {
  useEffect(() => {
    if (values.fromState) {
      dispatch(fetchCities(values.fromState))
        .unwrap()
        .then((res) => setSenderCities(res))
        .catch(console.error);
    } else {
      setSenderCities([]);
    }
  }, [values.fromState, dispatch]);

  useEffect(() => {
    if (values.toState) {
      dispatch(fetchCities(values.toState))
        .unwrap()
        .then((res) => setReceiverCities(res))
        .catch(console.error);
    } else {
      setReceiverCities([]);
    }
  }, [values.toState, dispatch]);

  return null;
};

const EffectSyncTotals = ({ values, setFieldValue }) => {
  useEffect(() => {
    const totals = calculateTotals(values);

    const itemTotal = values.items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    setFieldValue("freight", totals.autoFreight);
    setFieldValue("billTotal", totals.billTotal);
    setFieldValue("grandTotal", totals.grandTotal);
    setFieldValue("roundOff", totals.roundOff);
  }, [
    values.items,
    values.freight,
    values.ins_vpp,
    values.biltyCharge,
    values.cgst,
    values.sgst,
    values.igst,
    setFieldValue
  ]);

  return null;
};

export default EditBooking;