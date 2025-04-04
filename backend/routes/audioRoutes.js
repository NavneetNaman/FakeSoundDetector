const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config");
const { authenticateToken } = require("./userRoutes");

const router = express.Router();

// ✅ Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ✅ Configure Multer (File Uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [".wav", ".mp3"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedTypes.includes(ext)) {
            return cb(new Error("❌ Only .wav and .mp3 files are allowed!"), false);
        }
        cb(null, true);
    },
});

// ✅ Upload Audio File API (Protected)
router.post("/upload", authenticateToken, upload.single("audio"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "⚠️ No file uploaded!" });
    }

    // ✅ Only process .wav files
    const ext = path.extname(req.file.filename).toLowerCase();
    if (ext !== ".wav") {
        return res.status(400).json({ message: "⚠️ Only .wav files are allowed for processing!" });
    }

    // ✅ Store file details in MySQL
    const sql = "INSERT INTO audio_files (filename, filepath, user_id) VALUES (?, ?, ?)";
    db.execute(sql, [req.file.filename, `/uploads/${req.file.filename}`, req.user.userId], (err) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ message: "❌ Failed to save file info" });
        }

        res.json({
            message: "✅ File uploaded successfully!",
            filePath: `/uploads/${req.file.filename}`,
        });
    });
});

// ✅ Serve Uploaded Files
router.use("/files", express.static(uploadDir));

module.exports = router;
