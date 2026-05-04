import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// 🔥 absolute path resolve
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 uploads folder (src ke bahar)
const uploadPath = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); // ✅ absolute path
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF & Images allowed"), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter
});