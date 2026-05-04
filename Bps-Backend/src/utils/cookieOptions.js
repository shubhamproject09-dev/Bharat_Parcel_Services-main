export const getCookieOptions = (req) => {
    const origin = req.headers.origin || "";

    const isLocal =
        origin.includes("localhost") ||
        origin.includes("127.0.0.1");

    return {
        httpOnly: true,
        secure: !isLocal,                 // local = false, live = true
        sameSite: isLocal ? "lax" : "none",
        domain: isLocal ? undefined : ".bharatparcel.org",
        maxAge: 10 * 60 * 60 * 1000
    };
};
