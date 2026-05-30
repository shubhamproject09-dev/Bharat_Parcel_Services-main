module.exports = {
    apps: [
        {
            name: "newBharatParcel-Api",
            script: "index.js",
            cwd: "/var/www/NewBharatparcel/backend",
            env: {
                NODE_ENV: "production",
                CLOUDINARY_CLOUD_NAME: "dcagfm5w0",
                CLOUDINARY_API_KEY: "474621158735136",
                CLOUDINARY_API_SECRET: "x2kg4IN7H9anCDqG4_UlUysr8WQ",
            }
        }
    ]
};
