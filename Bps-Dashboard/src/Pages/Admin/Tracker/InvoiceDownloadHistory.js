import React,
{ useEffect, useState }
    from "react";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Stack,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination
}
    from "@mui/material";
import DownloadIcon
    from "@mui/icons-material/Download";

import axios from "axios";

import { BOOKINGS_API, FILES_BASE_URL }
    from "../../../utils/api";

export default function InvoiceDownloadHistory() {

    const [type, setType] =
        useState("paid");

    const [data, setData] =
        useState([]);
    const [page, setPage] =
        useState(0);

    const [rowsPerPage, setRowsPerPage] =
        useState(10);

    useEffect(() => {

        fetchHistory(type);

    }, [type]);

    const handleDownloadInvoice =
        async (row) => {

            try {

                if (row.pdfPath) {

                    window.open(

                        `${FILES_BASE_URL}${row.pdfPath}`,

                        "_blank"
                    );

                    return;
                }

                alert(
                    "PDF not found"
                );

            }
            catch (err) {

                alert(
                    "Download failed"
                );
            }
        };

    const handleChangePage =
        (event, newPage) => {

            setPage(newPage);

        };

    const handleRowsPerPageChange =
        (event) => {

            setRowsPerPage(
                parseInt(
                    event.target.value,
                    10
                )
            );

            setPage(0);

        };

    const fetchHistory =
        async (selectedType) => {

            const res = await axios.get(

                selectedType === "paid"

                    ? `${BOOKINGS_API}/invoice-history-paid`

                    : `${BOOKINGS_API}/invoice-history-topay`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("authToken")}`
                    }
                }

            );

            setData(
                res.data.data || []
            );

        };


    return (

        <div style={{
            padding: "30px"
        }}>

            <DialogTitle>

                Invoice Download History

            </DialogTitle>

            <DialogContent>

                <Stack
                    direction="row"
                    spacing={2}
                    mb={2}
                >

                    <Button
                        variant={
                            type === "paid"
                                ? "contained"
                                : "outlined"
                        }

                        onClick={() =>
                            setType("paid")
                        }
                    >

                        Paid

                    </Button>

                    <Button
                        variant={
                            type === "toPay"
                                ? "contained"
                                : "outlined"
                        }

                        onClick={() =>
                            setType("toPay")
                        }
                    >

                        ToPay

                    </Button>

                </Stack>

                <Table>

                    <TableHead>

                        <TableRow>

                            <TableCell sx={{ fontWeight: 700 }}>
                                S.No
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                                Invoice No
                            </TableCell>

                            <TableCell sx={{ fontWeight: 700 }}>
                                Customer Name
                            </TableCell>

                            <TableCell sx={{ fontWeight: 700 }}>
                                Station
                            </TableCell>

                            <TableCell sx={{ fontWeight: 700 }}>
                                Date Range
                            </TableCell>

                            <TableCell sx={{ fontWeight: 700 }}>
                                Type
                            </TableCell>

                            <TableCell sx={{ fontWeight: 700 }}>
                                Amount
                            </TableCell>

                            <TableCell sx={{ fontWeight: 700 }}>
                                Download
                            </TableCell>

                        </TableRow>

                    </TableHead>

                    <TableBody>

                        {data
                            .slice(

                                page * rowsPerPage,

                                page * rowsPerPage
                                +
                                rowsPerPage

                            )

                            .map((row, index) => (

                                <TableRow key={row._id}>
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
                                        {row.invoiceNumber}
                                    </TableCell>

                                    <TableCell>

                                        {
                                            row.invoiceType === "toPay"

                                                ? row.receiverName

                                                : [
                                                    row.customerId?.firstName,
                                                    row.customerId?.middleName,
                                                    row.customerId?.lastName
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ")
                                        }

                                    </TableCell>

                                    <TableCell>
                                        {row.stationCode}
                                    </TableCell>

                                    <TableCell>

                                        {
                                            new Date(
                                                row.fromDate
                                            ).toLocaleDateString()
                                        }

                                        -

                                        {
                                            new Date(
                                                row.toDate
                                            ).toLocaleDateString()
                                        }

                                    </TableCell>

                                    <TableCell>
                                        {row.invoiceType}
                                    </TableCell>

                                    <TableCell>

                                        ₹{
                                            row.totals?.grandTotal
                                        }

                                    </TableCell>

                                    <TableCell>

                                        <Button

                                            size="small"

                                            variant="outlined"

                                            startIcon={
                                                <DownloadIcon />
                                            }

                                            onClick={() =>
                                                handleDownloadInvoice(
                                                    row
                                                )
                                            }

                                        >

                                            Download

                                        </Button>

                                    </TableCell>

                                </TableRow>

                            ))}

                    </TableBody>

                </Table>
                <TablePagination

                    component="div"

                    count={data.length}

                    page={page}

                    onPageChange={
                        handleChangePage
                    }

                    rowsPerPage={
                        rowsPerPage
                    }

                    onRowsPerPageChange={
                        handleRowsPerPageChange
                    }

                    rowsPerPageOptions={[
                        10,
                        25,
                        50
                    ]}

                />
            </DialogContent>

        </div>

    );

}