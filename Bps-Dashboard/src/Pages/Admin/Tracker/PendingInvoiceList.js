import React, {
    useEffect,
    useState
} from "react";

import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    TablePagination,
    InputAdornment,
    Stack
} from "@mui/material";

import ArrowBackIcon
    from "@mui/icons-material/ArrowBack";
import SearchIcon
    from "@mui/icons-material/Search";

import {
    useDispatch,
    useSelector
} from "react-redux";

import {
    useNavigate
} from "react-router-dom";

import {
    pendingInvoiceDeliveries
} from "../../../features/delivery/deliverySlice";

const PendingInvoiceList = () => {

    const dispatch =
        useDispatch();

    const navigate =
        useNavigate();

    const [search, setSearch] =
        useState("");

    const [page, setPage] =
        useState(0);

    const [rowsPerPage] =
        useState(10);

    const {
        pendingInvoiceList,
        pendingCount,
        loading
    } = useSelector(
        state => state.deliveries
    );

    useEffect(() => {

        dispatch(
            pendingInvoiceDeliveries({

                fromDate:
                    "2026-04-01",

                toDate:
                    "2026-12-31"
            })
        );

    }, [dispatch]);

    // 🔥 search filter

    const filteredData =
        pendingInvoiceList?.filter(
            (row) => {

                const searchText =
                    search.toLowerCase();

                return (

                    row?.biltyNo
                        ?.toLowerCase()
                        .includes(searchText)

                    ||

                    row?.senderName
                        ?.toLowerCase()
                        .includes(searchText)

                    ||

                    row?.receiverName
                        ?.toLowerCase()
                        .includes(searchText)
                );
            }
        ) || [];

    // 🔥 pagination

    const paginatedData =
        filteredData.slice(
            page * rowsPerPage,

            page * rowsPerPage +
            rowsPerPage
        );

    return (

        <Box p={3}>

            {/* HEADER */}

            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
            >

                <Box>

                    <Typography
                        variant="h4"
                        fontWeight="bold"
                    >
                        Pending Invoice Bilty
                    </Typography>

                    <Typography
                        color="text.secondary"
                    >
                        Total Pending:
                        {pendingCount}
                    </Typography>

                </Box>

                <Button
                    variant="contained"
                    startIcon={
                        <ArrowBackIcon />
                    }
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    Back
                </Button>

            </Stack>

            <Box mb={2}>

                <TextField

                    fullWidth

                    placeholder="
Search Bilty No,
Sender,
Receiver
"

                    value={search}

                    onChange={(e) => {

                        setSearch(
                            e.target.value
                        );

                        setPage(0);
                    }}

                    InputProps={{

                        startAdornment: (

                            <InputAdornment
                                position="start"
                            >

                                <SearchIcon />

                            </InputAdornment>
                        )
                    }}

                />

            </Box>

            <Paper elevation={3}>

                {
                    loading ?

                        <Box
                            display="flex"
                            justifyContent="center"
                            py={5}
                        >
                            <CircularProgress />
                        </Box>

                        :

                        <TableContainer>

                            <Table>

                                <TableHead>

                                    <TableRow>

                                        <TableCell>
                                            S.No
                                        </TableCell>

                                        <TableCell>
                                            Bilty No
                                        </TableCell>

                                        <TableCell>
                                            Date
                                        </TableCell>

                                        <TableCell>
                                            Sender Name
                                        </TableCell>

                                        <TableCell>
                                            Receiver Name
                                        </TableCell>

                                        <TableCell>
                                            Pick Up
                                        </TableCell>

                                        <TableCell>
                                            Drop
                                        </TableCell>

                                        <TableCell>
                                            Type
                                        </TableCell>

                                    </TableRow>

                                </TableHead>

                                <TableBody>

                                    {
                                        paginatedData
                                            ?.map((row) => (

                                                <TableRow
                                                    key={row.SNo}
                                                >

                                                    <TableCell>
                                                        {row.SNo}
                                                    </TableCell>

                                                    <TableCell>
                                                        {row.biltyNo}
                                                    </TableCell>

                                                    <TableCell>
                                                        {row.bookingDate}
                                                    </TableCell>

                                                    <TableCell>
                                                        {row.senderName}
                                                    </TableCell>

                                                    <TableCell>
                                                        {row.receiverName}
                                                    </TableCell>

                                                    <TableCell>
                                                        {row.pickup}
                                                    </TableCell>

                                                    <TableCell>
                                                        {row.drop}
                                                    </TableCell>

                                                    <TableCell>

                                                        <Box

                                                            sx={{

                                                                backgroundColor:

                                                                    row.invoiceType === "paid"

                                                                        ? "#4caf50"

                                                                        : "#f44336",

                                                                color: "#fff",

                                                                px: 1.5,

                                                                py: 0.5,

                                                                borderRadius: "20px",

                                                                textAlign: "center",

                                                                width: "fit-content",

                                                                fontWeight: "bold",

                                                                textTransform: "uppercase"

                                                            }}

                                                        >

                                                            {row.invoiceType}

                                                        </Box>

                                                    </TableCell>

                                                </TableRow>
                                            ))
                                    }

                                </TableBody>

                            </Table>

                        </TableContainer>
                }
                <TablePagination

                    component="div"

                    count={filteredData.length}

                    page={page}

                    onPageChange={(e, newPage) =>
                        setPage(newPage)
                    }

                    rowsPerPage={rowsPerPage}

                    rowsPerPageOptions={[10]}

                />

            </Paper>

        </Box>
    );
};

export default PendingInvoiceList;