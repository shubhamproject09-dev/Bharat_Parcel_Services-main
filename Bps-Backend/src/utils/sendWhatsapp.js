import axios from "axios";

const BASE_URL =
    "https://adminapis.backendprod.com/chat_and_campaign/whatsapp_graph/api/69297109635f919dd5aeaf91/Test/v19.0";

const PHONE_NUMBER_ID = "986328151220411";
const API_KEY = "w8bag3KDXdM9T1AYe6h07S2k";

export const sendWhatsappMessage = async ({
    mobile,
    pdfUrl,
    bodyParams = [],
}) => {
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: mobile,
        type: "template",
        template: {
            name: "bharat_parcel_services", // ✅ YOUR TEMPLATE
            language: { code: "en" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "document",
                            document: {
                                link: pdfUrl, // ✅ PUBLIC LINK
                            },
                        },
                    ],
                },
                {
                    type: "body",
                    parameters: bodyParams.map((val) => ({
                        type: "text",
                        text: String(val),
                    })),
                },
            ],
        },
    };

    const response = await axios.post(
        `${BASE_URL}/${PHONE_NUMBER_ID}/messages`,
        payload,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": API_KEY,
            },
        }
    );

    return response.data;
};