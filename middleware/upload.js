const multer = require("multer");
const path = require("path");

// Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Accept only PDF
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "application/pdf"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

module.exports = multer({
    storage,
    fileFilter
});