import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { CASHBOOK_API } from "../../utils/api";

// 🔥 1. Get Daily Income
export const fetchDailyIncome = createAsyncThunk(
    "cashbook/fetchIncome",
    async ({ date, station, type, token }, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${CASHBOOK_API}/income`, {
                params: { date, station, type }, // ✅ ADD TYPE
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// 🔥 2. Save CashBook (expense)
export const saveCashBook = createAsyncThunk(
    "cashbook/save",
    async ({ date, expense, type, token }, { rejectWithValue }) => {
        try {
            const res = await axios.post(
                `${CASHBOOK_API}`,
                {
                    date,
                    expense,
                    type // ✅ ADD TYPE
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}` // ⚠️ MISSING THA
                    }
                }
            );
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchCashBookList = createAsyncThunk(
    "cashbook/fetchList",
    async ({ from, to, station, type, token }, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${CASHBOOK_API}`, {
                params: { from, to, station, type }, // ✅ ADD TYPE
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

const cashbookSlice = createSlice({
    name: "cashbook",
    initialState: {
        income: null,
        list: [],
        loading: false,
        error: null,
        success: false
    },
    reducers: {
        clearCashbookState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        }
    },

    extraReducers: (builder) => {
        builder

            // 🔹 INCOME
            .addCase(fetchDailyIncome.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDailyIncome.fulfilled, (state, action) => {
                state.loading = false;
                state.income = action.payload;
            })
            .addCase(fetchDailyIncome.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // 🔹 SAVE
            .addCase(saveCashBook.pending, (state) => {
                state.loading = true;
            })
            .addCase(saveCashBook.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(saveCashBook.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // 🔹 LIST
            .addCase(fetchCashBookList.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCashBookList.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchCashBookList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearCashbookState } = cashbookSlice.actions;
export default cashbookSlice.reducer;