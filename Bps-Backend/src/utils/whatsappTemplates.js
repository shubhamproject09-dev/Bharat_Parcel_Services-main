export const sendBookingTemplate = async (req, res, next) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findOne({ bookingId });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const phone = booking.mobile || booking.receiverContact;

        if (!phone) {
            return res.status(400).json({ message: "Phone not found" });
        }

        // ✅ PUBLIC PDF LINK (IMPORTANT)
        const pdfUrl = `${process.env.API_BASE_URL}/booking-slip/${bookingId}`;

        // ✅ TEMPLATE VARIABLES (13 hone chahiye)
        const bodyParams = [
            booking.bookingId,
            booking.senderName,
            booking.mobile,
            booking.receiverName,
            booking.receiverContact,
            booking.fromCity,
            booking.toCity,
            booking.bookingDate,
            booking.items?.[0]?.quantity,
            booking.items?.[0]?.weight,
            booking.freight,
            booking.grandTotal,
            "Thank you"
        ];

        const result = await sendWhatsappMessage({
            mobile: `91${phone}`,
            pdfUrl,
            bodyParams
        });

        res.json({
            success: true,
            message: "Template message sent",
            data: result
        });

    } catch (error) {
        next(error);
    }
};