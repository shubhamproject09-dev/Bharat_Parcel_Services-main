import axios from "axios";

const BASE_URL = "http://crmapp.whatsupapi.com/api/meta";
const PHONE_NUMBER_ID = "989739060882907";
const TOKEN = "ZdPhhaj8iDQawQeQcc745dsoikCYxHaSmiw5I0Thkdd8CWNhglXnDqVEHozY8OVqfZaWp6UpNhVU5ERVJTQ09SRQeCREFTSAZJpHMkGZJkjH2iApsZ7lh3ulF4F1L7VU5ERVJTQ09SRQmiG27MZ0RBPtMI";

export const sendWhatsappTemplate = async ({
  mobile,
  pdfUrl,
  bodyParams = [],
}) => {
  const payload = {
    to: mobile,
    recipient_type: "individual",
    type: "template",
    template: {
      name: "bharat_parcel_services",
      language: {
        policy: "deterministic",
        code: "en",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                link: pdfUrl,
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

  return axios.post(
    `${BASE_URL}/v19.0/${PHONE_NUMBER_ID}/messages`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );
};



export const sendQuotationTemplate = async ({
  mobile,
  pdfUrl,
  name,
  fromCity,
  toCity
}) => {
  const payload = {
    to: mobile,
    recipient_type: "individual",
    type: "template",
    template: {
      name: "bharat_parcel_services_quotations", // ✅ exact name
      language: {
        policy: "deterministic",
        code: "en",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                link: pdfUrl,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: name },
            { type: "text", text: fromCity },
            { type: "text", text: toCity },
          ],
        },
      ],
    },
  };

  return axios.post(
    `${BASE_URL}/v19.0/${PHONE_NUMBER_ID}/messages`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );
};


export const sendBookingCancelTemplate = async ({
  mobile,
  pdfUrl,
  biltyNo,
  bookingId,
  fromCity,
  toCity,
  reason
}) => {
  const payload = {
    to: mobile,
    recipient_type: "individual",
    type: "template",
    template: {
      name: "cancel_whatsapp", // ✅ tera template name
      language: {
        policy: "deterministic",
        code: "en",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                link: pdfUrl,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: biltyNo },      // {{1}}
            { type: "text", text: bookingId },    // {{2}}
            { type: "text", text: fromCity },     // {{3}}
            { type: "text", text: toCity },       // {{4}}
            { type: "text", text: reason },       // {{5}}
          ],
        },
      ],
    },
  };

  return axios.post(
    `${BASE_URL}/v19.0/${PHONE_NUMBER_ID}/messages`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );
};

export const sendQuotationCancelTemplate = async ({
  mobile,
  pdfUrl,
  biltyNo,
  bookingId,
  fromCity,
  toCity,
  reason
}) => {
  const payload = {
    to: mobile,
    recipient_type: "individual",
    type: "template",
    template: {
      name: "cancel_whatsapp", // ✅ same template
      language: {
        policy: "deterministic",
        code: "en",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                link: pdfUrl,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: biltyNo },
            { type: "text", text: bookingId },
            { type: "text", text: fromCity },
            { type: "text", text: toCity },
            { type: "text", text: reason },
          ],
        },
      ],
    },
  };

  return axios.post(
    `${BASE_URL}/v19.0/${PHONE_NUMBER_ID}/messages`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );
};
