import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { QUOTATION_API, WHATSAPP_API } from '../../utils/api';

const BASE_URL = QUOTATION_API;

export const createBooking = createAsyncThunk(

  'bookings/createBooking', async (data, { rejectWithValue }) => {

    try {
      const res = await axios.post(`${BASE_URL}`, data)
      return res.data.data
    }
    catch (err) {
      console.log('Error creating booking:', err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
)

export const fetchQuotations = createAsyncThunk(
  "quotation/fetchQuotations",
  async ({ page = 1, limit = 50, search = "" }, thunkAPI) => {
    try {
      const res = await axios.get(
        `${BASE_URL}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return res.data.data;

    } catch (err) {
      console.error(
        "Error fetching quotations:",
        err.response?.data?.message || err.message
      );

      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch quotations"
      );
    }
  }
);

// quotationsSlice.js
export const deleteBooking = createAsyncThunk(
  'booking/deleteBooking',
  async (bookingId, thunkApi) => {
    try {
      await axios.delete(`${BASE_URL}/${bookingId}`);
      return bookingId; // This should be used to remove it from the state
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to delete the booking"
      );
    }
  }
);

export const fetchDeletedQuotations = createAsyncThunk(
  "quotation/fetchDeleted",
  async (_, thunkApi) => {
    try {
      const res = await axios.get(`${BASE_URL}/deleted`);
      return res.data.quotations; // backend se {count, quotations}
    } catch (err) {
      return thunkApi.rejectWithValue(
        err.response?.data?.message || "Failed to fetch deleted quotations"
      );
    }
  }
);

export const restoreQuotation = createAsyncThunk(
  "quotation/restore",
  async (id, thunkApi) => {
    try {
      await axios.patch(`${BASE_URL}/restore/${id}`);
      return id;
    } catch (err) {
      return thunkApi.rejectWithValue(
        err.response?.data?.message || "Failed to restore quotation"
      );
    }
  }
);

export const fetchBookingRequestCount = createAsyncThunk(
  "booking/bookingRequestCount",
  async (_, thunkApi) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/total-booking-requests`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return res.data.data.totalBookingRequests;
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch booking request count"
      );
    }
  }
);

//booking request.
export const fetchBookingRequest = createAsyncThunk(
  'booking/bookingRequest',
  async (_, thunkApi) => {
    try {
      const res = await axios.get(`${BASE_URL}/booking-request-list`);
      return res.data.data.deliveries;
    } catch (error) {
      console.error("Error in fetchBookingRequest:", error);
      return thunkApi.rejectWithValue(error.response?.data?.message || "Error fetching bookings");
    }
  }
);

//active booking.
export const fetchActiveBooking = createAsyncThunk(
  'booking/activeBooking', async (_, thunkApi) => {
    try {
      const res = await axios.get(`${BASE_URL}/active-list`)
      return {
        activeDeliveries: res.data.data.totalActiveDeliveries,
        deliveries: res.data.data.deliveries,
      };
    }
    catch (error) {
      return thunkApi.rejectWithValue(error.response?.data?.message || "Failed To fetch Active Deliveries ");
    }
  }
)
//cancelled booking
export const fetchCancelledBooking = createAsyncThunk(
  'booking.cancelledCount',
  async (_, thunkApi) => {
    try {
      const res = await axios.get(`${BASE_URL}/cancelled-list`);

      return {
        cancelledCount: res.data.data.totalCancelledDeliveries,
        deliveries: res.data.data.deliveries   // ✅ ADD THIS
      };

    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed To fetch Cancelled Booking"
      );
    }
  }
);

export const viewBookingById = createAsyncThunk(
  '/booking/viewBookingById', async (bookingId, thunkApi) => {
    try {
      const res = await axios.get(`${BASE_URL}/search/${bookingId}`)
      return res?.data?.data;
    }
    catch (err) {
      return thunkApi.rejectWithValue(err.response?.data?.message || 'f');
    }

  }
)

export const updateBookingById = createAsyncThunk(
  'booking/update',
  async ({ bookingId, data }, thunkApi) => {
    try {
      const res = await axios.put(`${BASE_URL}/${bookingId}`, data);
      return res?.data?.data;
    } catch (err) {
      return thunkApi.rejectWithValue(
        err.response?.data?.message || 'Failed to update booking'
      );
    }
  }
);

export const revenueList = createAsyncThunk(
  'revenueList/booking', async (_, thunkApi) => {
    try {
      const res = await axios.get(`${BASE_URL}/revenue-list`);
      return {
        totalRevenue: res.data.totalRevenue,
        revenueList: res.data.data
      }
    }
    catch (err) {
      return thunkApi.rejectWithValue(err.response?.data?.message || 'failed to view totalReveunue')
    }
  }

)
export const sendBookingEmail = createAsyncThunk(
  'sendBooking/mail', async (bookingId, thunkApi) => {
    try {
      const res = await axios.get(`${BASE_URL}/send-Booking-Email/${bookingId}`);
      return res.data;
    }
    catch (err) {
      return thunkApi.rejectWithValue(err.response?.data?.message || 'Failed to send booking Id');
    }
  }
)

export const sendWhatsAppMsg = createAsyncThunk(
  "quotation/sendWhatsapp",
  async (bookingId, thunkApi) => {
    try {
      const res = await axios.post(
        `${QUOTATION_API}/send-whatsapp/${bookingId}`
      );
      return res.data;
    } catch (err) {
      return thunkApi.rejectWithValue(
        err.response?.data?.message || "Failed to send WhatsApp"
      );
    }
  }
);

export const getQuotationBookingSummaryByDate = createAsyncThunk(
  'booking/getBookingSummary', async ({ fromDate, toDate }, thunkApi) => {
    try {
      const res = await axios.post(`${BASE_URL}/booking-summary-date`, { fromDate, toDate });
      return res.data.bookings;
    }
    catch (err) {
      return thunkApi.rejectWithValue(err.response?.data?.message || 'Failed to fetch data');
    }

  }
)
export const fetchIncomingQuotations = createAsyncThunk(
  'quotation/fetchIncomingQuotations',
  async ({ fromDate, toDate }, thunkApi) => {
    try {
      const res = await axios.post(`${BASE_URL}/qincoming`, { fromDate, toDate });
      return res.data.data; // backend sends { success, count, data }
    } catch (err) {
      return thunkApi.rejectWithValue(
        err.response?.data?.message || 'Failed to fetch incoming quotations'
      );
    }
  }
);

export const fetchReceiptPreview = createAsyncThunk(
  "quotation/fetchReceiptPreview",
  async (_, thunkApi) => {
    try {
      const res = await axios.get(`${BASE_URL}/receipt/preview`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      return res.data.receiptNo;
    } catch (err) {
      return thunkApi.rejectWithValue(
        err.response?.data?.message || "Failed to fetch receipt preview"
      );
    }
  }
);

export const uploadQuotationPdf = createAsyncThunk(
  "quotation/uploadPdf",
  async ({ bookingId, file }, thunkApi) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${QUOTATION_API}/upload-pdf/${bookingId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return {
        bookingId,
        pdfUrl: res.data.data.pdfUrl
      };
    } catch (err) {
      return thunkApi.rejectWithValue(
        err.response?.data?.message || "PDF upload failed"
      );
    }
  }
);

export const cancelQuotation = createAsyncThunk(
  "quotation/cancelQuotation",
  async ({ bookingId, reason }, thunkApi) => {
    try {
      const res = await axios.patch(
        `${BASE_URL}/status/${bookingId}?activeDelivery=false`,
        {
          cancelReason: reason   // ✅ IMPORTANT
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      return { bookingId };

    } catch (err) {
      return thunkApi.rejectWithValue(
        err.response?.data?.message || "Cancel failed"
      );
    }
  }
);

export const receivePayment = createAsyncThunk(
  "quotation/receivePayment",
  async ({ bookingId, amount }, thunkApi) => {
    try {
      const res = await axios.patch(
        `${BASE_URL}/receive-payment/${bookingId}`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      return {
        bookingId,
        data: res.data.data
      };

    } catch (err) {
      return thunkApi.rejectWithValue(
        err.response?.data?.message || "Payment failed"
      );
    }
  }
);


const initialState = {
  list: [],
  list2: [],
  quotationsList: [],
  quotations: [],
  activeList: [],
  cancelledList: [],
  quotationPagination: {
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  deletedQuotations: [],
  receiptPreview: "",
  requestCount: 0,
  activeDeliveriesCount: 0,
  cancelledDeliveriesCount: 0,
  totalRevenue: 0,
  loading: false,
  viewedBooking: null,
  status: 'idle',
  error: null,
  uploadedPdfUrl: null,
  pdfUploadLoading: false,
  form: {
    firstName: "",
    lastName: "",
    startStationName: null,
    endStation: null,
    locality: "",
    quotationDate: "",
    proposedDeliveryDate: "",
    fromCustomerName: "",
    fromAddress: "",
    fromState: "",
    fromCity: "",
    fromPincode: "",
    toCustomerName: "",
    toAddress: "",
    toState: "",
    toCity: "",
    toPincode: "",
    amount: "",
    sgst: "",
    additionalCmt: "",
    productDetails: [
      {
        name: "",
        quantity: "",
        price: "",
        weight: "",
      },
    ],
    addComment: "",
    billTotal: "",
    sgst: "",
    grandTotal: "",
  },
};
const quotationSlice = createSlice({
  name: 'quotation',
  initialState,
  reducers: {
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    resetForm: (state) => {
      state.form = initialState.form;
    },
    addBooking: (state, action) => {
      const safeList = Array.isArray(state.list) ? state.list : [];
      state.list = [...safeList, action.payload];
    },
    setBooking: (state, action) => {
      state.list = action.payload;
    },
    clearViewedBooking: (state) => {
      state.viewedBooking = null;
    }
  },

  extraReducers: (builder) => {
    builder
      //for booking.
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;

        const safeList = Array.isArray(state.list) ? state.list : [];
        state.list = [...safeList, action.payload];
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.loading = false;

        state.quotationsList = action.payload?.data || [];

        state.quotationPagination = action.payload?.pagination || {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        };
      })

      .addCase(fetchQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchBookingRequestCount.fulfilled, (state, action) => {
        state.requestCount =
          typeof action.payload === "object"
            ? (
              action.payload?.totalBookingRequests ??
              action.payload?.requestCount ??
              0
            )
            : Number(action.payload) || 0;
      })

      .addCase(fetchBookingRequestCount.rejected, (state, action) => {
        state.error = action.payload;
      })

      //for deleting
      .addCase(deleteBooking.fulfilled, (state, action) => {
        state.loading = false;

        const deletedItem = state.list.find(
          (item) =>
            item.bookingId === action.payload ||
            item["Booking ID"] === action.payload
        );
        // remove from main list
        state.list = state.list.filter(
          (item) =>
            item.bookingId !== action.payload &&
            item["Booking ID"] !== action.payload
        );

        // 👉 ADD TO BIN
        if (deletedItem) {
          state.deletedQuotations.push({
            ...deletedItem,
            isDeleted: true,
          });
        }
      })
      .addCase(fetchDeletedQuotations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDeletedQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.deletedQuotations = action.payload;
      })
      .addCase(fetchDeletedQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(restoreQuotation.fulfilled, (state, action) => {
        state.deletedQuotations = state.deletedQuotations.filter(
          (item) => item._id !== action.payload
        );
      })

      .addCase(fetchBookingRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookingRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload; // ✅ Make sure payload is an array
        state.requestCount = action.payload?.length || 0;
      })
      .addCase(fetchBookingRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchActiveBooking.fulfilled, (state, action) => {
        state.activeDeliveriesCount = action.payload.activeDeliveries;
        state.activeList = action.payload.deliveries || [];
      })
      .addCase(fetchCancelledBooking.fulfilled, (state, action) => {
        state.cancelledDeliveriesCount = action.payload.cancelledCount;
        state.cancelledList = action.payload.deliveries || [];
      })
      //view booking
      .addCase(viewBookingById.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(viewBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.viewedBooking = action.payload;
        state.form = {
          ...state.form,
          ...action.payload
        };
      })
      .addCase(viewBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateBookingById.pending, (state) => {
        state.loading = true;
        state.error = null
      })
      .addCase(updateBookingById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;

        const updatedBooking = action.payload;

        // ✅ Ensure list is array
        if (!Array.isArray(state.list)) {
          state.list = [];
        }

        const index = state.list.findIndex(
          booking => booking.bookingId === updatedBooking.bookingId
        );

        if (index !== -1) {
          state.list[index] = updatedBooking;
        }

        state.form = initialState.form;
      })
      .addCase(revenueList.pending, (state) => {
        state.loading = true;
        state.error = null
      })
      .addCase(revenueList.fulfilled, (state, action) => {
        state.loading = false;
        state.totalRevenue = action.payload.totalRevenue;
        state.revenueList = action.payload.revenueList;
      })
      .addCase(revenueList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendBookingEmail.pending, (state) => {
        state.loading = true;
        state.error = null
      })
      .addCase(sendBookingEmail.fulfilled, (state) => {
        state.loading = false;
        state.error = null
      })
      .addCase(sendBookingEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload
      })
      .addCase(sendWhatsAppMsg.pending, (state) => {
        state.loading = true;
        state.error = null
      })
      .addCase(sendWhatsAppMsg.fulfilled, (state) => {
        state.loading = false;
        state.error = null
      })
      .addCase(sendWhatsAppMsg.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload
      })
      .addCase(getQuotationBookingSummaryByDate.fulfilled, (state, action) => {
        state.loading = false;
        state.list2 = action.payload;
      })
      .addCase(fetchIncomingQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomingQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.quotationsList = action.payload;
      })
      .addCase(fetchIncomingQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchReceiptPreview.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchReceiptPreview.fulfilled, (state, action) => {
        state.loading = false;
        state.receiptPreview = action.payload;
      })

      .addCase(fetchReceiptPreview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // PDF Upload
      .addCase(uploadQuotationPdf.pending, (state) => {
        state.pdfUploadLoading = true;
        state.error = null;
      })

      .addCase(uploadQuotationPdf.fulfilled, (state, action) => {
        state.pdfUploadLoading = false;
        state.uploadedPdfUrl = action.payload.pdfUrl;

        // 🔁 Update booking in list (if exists)
        const index = state.list.findIndex(
          q => q.bookingId === action.payload.bookingId
        );

        if (index !== -1) {
          state.list[index].quotationPdf = action.payload.pdfUrl;
        }

        // 🔁 Update viewed booking also
        if (
          state.viewedBooking &&
          state.viewedBooking.bookingId === action.payload.bookingId
        ) {
          state.viewedBooking.quotationPdf = action.payload.pdfUrl;
        }
      })

      .addCase(uploadQuotationPdf.rejected, (state, action) => {
        state.pdfUploadLoading = false;
        state.error = action.payload;
      })
      .addCase(cancelQuotation.fulfilled, (state, action) => {
        state.list = state.list.filter(
          (item) => item.bookingId !== action.payload.bookingId
        )
      })
      .addCase(receivePayment.fulfilled, (state, action) => {
        const updated = action.payload.data;

        const index = state.list.findIndex(
          item =>
            item.bookingId === action.payload.bookingId ||
            item["Booking ID"] === action.payload.bookingId
        );

        if (index !== -1) {
          state.list[index] = {
            ...state.list[index],
            paidAmount: updated.paidAmount,
            deliveryPendingAmount: updated.deliveryPendingAmount,
            paymentStatus: updated.paymentStatus,
          };
        }
      })

  }
})
export const { setFormField, resetForm, addBooking, setBooking, clearViewedBooking } = quotationSlice.actions;
export default quotationSlice.reducer;