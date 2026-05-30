import React,
{
    useEffect,
    useState
}
    from "react";

import {

    Box,
    Typography,
    Paper,
    IconButton,
    Tooltip,
    Chip,
    CircularProgress,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Stack,
    Button

}
    from "@mui/material";

import RestoreFromTrashIcon
    from "@mui/icons-material/RestoreFromTrash";

import DeleteForeverIcon
    from "@mui/icons-material/DeleteForever";

import ArrowBackIcon
    from "@mui/icons-material/ArrowBack";

import SearchIcon
    from "@mui/icons-material/Search";

import {
    useDispatch,
    useSelector
}
    from "react-redux";

import {
    useNavigate
}
    from "react-router-dom";

import {

    fetchDeletedInvoices,

    restoreInvoice

}
    from "../../../features/booking/bookingSlice";

export default function DeletedInvoices() {

    const dispatch =
        useDispatch();

    const navigate =
        useNavigate();

    const {

        deletedInvoices = [],

        invoiceActionLoading = false

    } = useSelector(
        state => state.bookings || {}
    );

    const [search, setSearch] =
        useState("");

    const [page, setPage] =
        useState(0);

    const [rowsPerPage, setRowsPerPage] =
        useState(10);

    useEffect(() => {

        dispatch(
            fetchDeletedInvoices()
        );

    }, [dispatch]);

    const handleRestore =
        async (
            invoiceId,
            invoiceNumber
        ) => {

            const confirmRestore =
                window.confirm(

                    `Are you sure you want to restore invoice ${invoiceNumber} ?`
                );

            if (!confirmRestore)
                return;

            try {

                await dispatch(

                    restoreInvoice(
                        invoiceId
                    )
                ).unwrap();

                alert(
                    "Invoice restored successfully"
                );

                dispatch(
                    fetchDeletedInvoices()
                );

            } catch (err) {

                alert(
                    err ||
                    "Restore failed"
                );
            }
        };

    // SEARCH FILTER

    const filteredData =
        deletedInvoices.filter(
            (invoice) => {

                const customer =
                    invoice.customerId
                        ?.firstName || "";

                return (

                    invoice.invoiceNumber
                        ?.toLowerCase()
                        .includes(
                            search.toLowerCase()
                        )

                    ||

                    customer
                        ?.toLowerCase()
                        .includes(
                            search.toLowerCase()
                        )
                );
            }
        );

    return (

        <Box p={3}>

            {/* HEADER */}

            <Paper

                elevation={2}

                sx={{

                    p: 3,

                    borderRadius: 4,

                    mb: 3
                }}
            >

                <Stack

                    direction="row"

                    justifyContent="space-between"

                    alignItems="center"

                    flexWrap="wrap"

                    gap={2}
                >

                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                    >

                        <IconButton

                            color="primary"

                            onClick={() =>
                                navigate(-1)
                            }
                        >

                            <ArrowBackIcon />

                        </IconButton>

                        <DeleteForeverIcon

                            color="error"

                            sx={{
                                fontSize: 35
                            }}
                        />

                        <Box>

                            <Typography
                                variant="h5"
                                fontWeight={700}
                            >

                                Deleted Invoices

                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >

                                Restore deleted invoices anytime

                            </Typography>

                        </Box>

                    </Stack>

                    {/* SEARCH */}

                    <TextField

                        size="small"

                        placeholder="Search invoice..."

                        value={search}

                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }

                        InputProps={{

                            startAdornment:
                                <SearchIcon
                                    sx={{
                                        mr: 1,
                                        color: "#999"
                                    }}
                                />
                        }}

                        sx={{
                            minWidth: 250
                        }}
                    />

                </Stack>

            </Paper>

            {/* LOADING */}

            {
                invoiceActionLoading && (

                    <Box
                        display="flex"
                        justifyContent="center"
                        py={5}
                    >

                        <CircularProgress />

                    </Box>
                )
            }

            {/* EMPTY */}

            {
                !invoiceActionLoading
                &&
                filteredData.length === 0
                &&
                (

                    <Paper

                        sx={{

                            p: 5,

                            textAlign: "center",

                            borderRadius: 4
                        }}
                    >

                        <DeleteForeverIcon

                            sx={{

                                fontSize: 60,

                                color: "#ccc"
                            }}
                        />

                        <Typography
                            mt={2}
                            variant="h6"
                        >

                            No Deleted Invoices

                        </Typography>

                    </Paper>
                )
            }

            {/* TABLE */}

            {
                filteredData.length > 0
                &&
                (

                    <Paper
                        sx={{
                            borderRadius: 4,
                            overflow: "hidden"
                        }}
                    >

                        <TableContainer>

                            <Table>

                                <TableHead>

                                    <TableRow>

                                        <TableCell>
                                            S.No
                                        </TableCell>

                                        <TableCell>
                                            Invoice No
                                        </TableCell>

                                        <TableCell>
                                            Customer
                                        </TableCell>

                                        <TableCell>
                                            Type
                                        </TableCell>

                                        <TableCell>
                                            Amount
                                        </TableCell>

                                        <TableCell>
                                            Deleted Date
                                        </TableCell>

                                        <TableCell>
                                            Reason
                                        </TableCell>

                                        <TableCell align="center">
                                            Action
                                        </TableCell>

                                    </TableRow>

                                </TableHead>

                                <TableBody>

                                    {
                                        filteredData

                                            .slice(

                                                page * rowsPerPage,

                                                page * rowsPerPage
                                                +
                                                rowsPerPage
                                            )

                                            .map(

                                                (
                                                    invoice,
                                                    index
                                                ) => (

                                                    <TableRow
                                                        key={invoice._id}
                                                        hover
                                                    >

                                                        <TableCell>

                                                            {
                                                                page * rowsPerPage
                                                                +
                                                                index
                                                                +
                                                                1
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            {
                                                                invoice.invoiceNumber
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            {
                                                                invoice.customerId
                                                                    ?.firstName
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            <Chip

                                                                label={
                                                                    invoice.invoiceType
                                                                }

                                                                color={
                                                                    invoice.invoiceType
                                                                        === "paid"

                                                                        ? "success"

                                                                        : "warning"
                                                                }

                                                                size="small"
                                                            />

                                                        </TableCell>

                                                        <TableCell>

                                                            ₹{
                                                                invoice.totals
                                                                    ?.grandTotal
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            {
                                                                new Date(
                                                                    invoice.deletedAt
                                                                ).toLocaleDateString()
                                                            }

                                                        </TableCell>

                                                        <TableCell>

                                                            {
                                                                invoice.deleteReason
                                                            }

                                                        </TableCell>

                                                        <TableCell align="center">

                                                            <Tooltip title="Restore Invoice">

                                                                <Button

                                                                    variant="contained"

                                                                    color="success"

                                                                    size="small"

                                                                    startIcon={
                                                                        <RestoreFromTrashIcon />
                                                                    }

                                                                    onClick={() =>
                                                                        handleRestore(

                                                                            invoice._id,

                                                                            invoice.invoiceNumber
                                                                        )
                                                                    }
                                                                >

                                                                    Restore

                                                                </Button>

                                                            </Tooltip>

                                                        </TableCell>

                                                    </TableRow>
                                                )
                                            )
                                    }

                                </TableBody>

                            </Table>

                        </TableContainer>

                        {/* PAGINATION */}

                        <TablePagination

                            component="div"

                            count={
                                filteredData.length
                            }

                            page={page}

                            onPageChange={
                                (e, newPage) =>
                                    setPage(newPage)
                            }

                            rowsPerPage={
                                rowsPerPage
                            }

                            onRowsPerPageChange={
                                (e) => {

                                    setRowsPerPage(
                                        parseInt(
                                            e.target.value,
                                            10
                                        )
                                    );

                                    setPage(0);
                                }
                            }

                            rowsPerPageOptions={[
                                10,
                                25,
                                50
                            ]}
                        />

                    </Paper>
                )
            }

        </Box>
    );
}