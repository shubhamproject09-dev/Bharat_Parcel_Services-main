import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RATELIST_API } from "../../utils/api";


// ✅ CREATE
export const createRate = createAsyncThunk(
    "rateList/create",
    async (data, { rejectWithValue }) => {
        try {
            const res = await axios.post(RATELIST_API, data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data);
        }
    }
);


// ✅ GET ALL
export const fetchRates = createAsyncThunk(
    "rateList/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(RATELIST_API);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data);
        }
    }
);


// ✅ GET SINGLE
export const fetchSingleRate = createAsyncThunk(
    "rateList/fetchOne",
    async (id, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${RATELIST_API}/${id}`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data);
        }
    }
);


// ✅ UPDATE
export const updateRate = createAsyncThunk(
    "rateList/update",
    async ({ id, updatedData }, { rejectWithValue }) => {
        try {
            const res = await axios.put(
                `${RATELIST_API}/${id}`,
                updatedData
            );
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data);
        }
    }
);


// ✅ DELETE
export const deleteRate = createAsyncThunk(
    "rateList/delete",
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`${RATELIST_API}/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data);
        }
    }
);



// 🔥 SLICE
const rateListSlice = createSlice({
    name: "rateList",
    initialState: {
        rates: [],
        singleRate: null,
        loading: false,
        error: null,
    },
    reducers: {},

    extraReducers: (builder) => {
        builder

            // CREATE
            .addCase(createRate.pending, (state) => {
                state.loading = true;
            })
            .addCase(createRate.fulfilled, (state, action) => {
                state.loading = false;
                state.rates.push(action.payload);
            })
            .addCase(createRate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message;
            })

            // GET ALL
            .addCase(fetchRates.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRates.fulfilled, (state, action) => {
                state.loading = false;
                state.rates = action.payload;
            })
            .addCase(fetchRates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message;
            })

            // GET SINGLE
            .addCase(fetchSingleRate.fulfilled, (state, action) => {
                state.singleRate = action.payload;
            })

            // UPDATE
            .addCase(updateRate.fulfilled, (state, action) => {
                const index = state.rates.findIndex(
                    (r) => r._id === action.payload._id
                );
                if (index !== -1) {
                    state.rates[index] = action.payload;
                }
            })

            // DELETE
            .addCase(deleteRate.fulfilled, (state, action) => {
                state.rates = state.rates.filter(
                    (r) => r._id !== action.payload
                );
            });
    },
});

export default rateListSlice.reducer;