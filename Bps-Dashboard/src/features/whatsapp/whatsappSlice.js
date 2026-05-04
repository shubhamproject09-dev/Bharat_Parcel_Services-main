import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { WHATSAPP_API } from "../../utils/api";

// ✅ ONLY TEMPLATE API
export const sendBookingWhatsapp = createAsyncThunk(
    "whatsapp/sendBooking",
    async (formData, { rejectWithValue, getState }) => {
        try {
            const token = getState().users?.token;

            const res = await axios.post(
                `${WHATSAPP_API}/send-template`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const sendQuotationWhatsapp = createAsyncThunk(
    "whatsapp/sendQuotation",
    async (formData, { rejectWithValue, getState }) => {
        try {
            const token = getState().users?.token;

            const res = await axios.post(
                `${WHATSAPP_API}/send-quotation`, // ✅ new route
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const sendBookingCancelWhatsapp = createAsyncThunk(
    "whatsapp/sendBookingCancel",
    async (formData, { rejectWithValue, getState }) => {
        try {
            const token = getState().users?.token;

            const res = await axios.post(
                `${WHATSAPP_API}/send-booking-cancel`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const sendQuotationCancelWhatsapp = createAsyncThunk(
    "whatsapp/sendQuotationCancel",
    async (formData, { rejectWithValue, getState }) => {
        try {
            const token = getState().users?.token;

            const res = await axios.post(
                `${WHATSAPP_API}/send-quotation-cancel`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

const whatsappSlice = createSlice({
    name: "whatsapp",
    initialState: {
        loading: false,
        success: false,
        error: null,
        response: null,

        quotationLoading: false,
        quotationSuccess: false,
        quotationError: null,

        cancelLoading: false,
        cancelSuccess: false,
        cancelError: null,

        quotationCancelLoading: false,
        quotationCancelSuccess: false,
        quotationCancelError: null,
    },
    reducers: {
        resetWhatsappState: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.response = null;

            state.quotationLoading = false;
            state.quotationSuccess = false;
            state.quotationError = null;

            state.cancelLoading = false;
            state.cancelSuccess = false;
            state.cancelError = null;

            state.quotationCancelLoading = false;
            state.quotationCancelSuccess = false;
            state.quotationCancelError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendBookingWhatsapp.pending, (state) => {
                state.loading = true;
                state.success = false;
                state.error = null;
            })
            .addCase(sendBookingWhatsapp.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.response = action.payload;
            })
            .addCase(sendBookingWhatsapp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })
            .addCase(sendQuotationWhatsapp.pending, (state) => {
                state.quotationLoading = true;
                state.quotationSuccess = false;
                state.quotationError = null;
            })
            .addCase(sendQuotationWhatsapp.fulfilled, (state, action) => {
                state.quotationLoading = false;
                state.quotationSuccess = true;
            })
            .addCase(sendQuotationWhatsapp.rejected, (state, action) => {
                state.quotationLoading = false;
                state.quotationError = action.payload;
                state.quotationSuccess = false;
            })
            .addCase(sendBookingCancelWhatsapp.pending, (state) => {
                state.cancelLoading = true;
                state.cancelSuccess = false;
                state.cancelError = null;
            })
            .addCase(sendBookingCancelWhatsapp.fulfilled, (state) => {
                state.cancelLoading = false;
                state.cancelSuccess = true;
            })
            .addCase(sendBookingCancelWhatsapp.rejected, (state, action) => {
                state.cancelLoading = false;
                state.cancelError = action.payload;
                state.cancelSuccess = false;
            })

            .addCase(sendQuotationCancelWhatsapp.pending, (state) => {
                state.quotationCancelLoading = true;
                state.quotationCancelSuccess = false;
                state.quotationCancelError = null;
            })
            .addCase(sendQuotationCancelWhatsapp.fulfilled, (state) => {
                state.quotationCancelLoading = false;
                state.quotationCancelSuccess = true;
            })
            .addCase(sendQuotationCancelWhatsapp.rejected, (state, action) => {
                state.quotationCancelLoading = false;
                state.quotationCancelError = action.payload;
                state.quotationCancelSuccess = false;
            })
    }
});

export const { resetWhatsappState } = whatsappSlice.actions;
export default whatsappSlice.reducer;