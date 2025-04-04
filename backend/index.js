require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { spawn } = require("child_process");

const app = express();
app.use(express.json());

// ✅ CORS Configuration
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

// ✅ MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "your_password",
    database: process.env.DB_NAME || "fakesounddb"
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database Connection Failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL Database");
});

// ✅ Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ✅ Multer Storage Configuration (File Upload)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// ✅ JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ✅ Middleware: Verify JWT Token
function verifyToken(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "❌ Access Denied! No token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "❌ Invalid Token!" });
    }
}

// ✅ User Registration API
app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "⚠️ All fields are required!" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        db.execute(sql, [name, email, hashedPassword], (err) => {
            if (err) {
                console.error("❌ Registration Error: ", err);
                return res.status(500).json({ message: "❌ Registration failed" });
            }
            res.status(201).json({ message: "✅ User registered successfully!" });
        });
    } catch (error) {
        console.error("❌ Hashing Error: ", error);
        res.status(500).json({ message: "❌ Error processing request" });
    }
});

// ✅ User Login API (with JWT Token)
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "⚠️ Email and Password are required!" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.execute(sql, [email], async (err, results) => {
        if (err) {
            console.error("❌ Login Error: ", err);
            return res.status(500).json({ message: "❌ Login failed" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "❌ Invalid email or password" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "❌ Invalid email or password" });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });

        res.status(200).json({ message: "✅ Login successful!", token });
    });
});

// ✅ Upload Audio File API & Run AI Model (Protected Route)
app.post("/api/upload", verifyToken, upload.single("audio"), (req, res) => {
    console.log("✅ Upload request received!");

    if (!req.file) {
        console.error("❌ No file uploaded!");
        return res.status(400).json({ message: "⚠️ No file uploaded!" });
    }

    const filePath = path.join(__dirname, "uploads", req.file.filename);
    console.log(`📂 File uploaded: ${filePath}`);

    if (!req.file.filename.endsWith(".wav")) {
        console.error("❌ Only .wav files are allowed!");
        return res.status(400).json({ message: "⚠️ Only .wav files are allowed!" });
    }

    const pythonProcess = spawn("python", ["predict_audio.py", filePath]);

    let pythonOutput = "";
    pythonProcess.stdout.on("data", (data) => {
        pythonOutput += data.toString();
        console.log("📊 Python Output:", data.toString().trim());
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error("❌ Python Error:", data.toString());
    });

    pythonProcess.on("close", (code) => {
        console.log(`⚙️ Python script exited with code ${code}`);

        // Extract only the last valid JSON line
        const lines = pythonOutput.trim().split('\n');
        const jsonLine = lines.reverse().find(line => line.trim().startsWith("{") && line.trim().endsWith("}"));

        if (!jsonLine) {
            console.error("❌ No valid JSON output found in Python script output.");
            return res.status(500).json({ message: "❌ Prediction error: No JSON output." });
        }

        try {
            const parsedResult = JSON.parse(jsonLine);
            console.log("✅ Parsed Result:", parsedResult);

            const sql = "INSERT INTO audio_files (filename, filepath, user_id, result_label, confidence) VALUES (?, ?, ?, ?, ?)";
            db.execute(sql, [
                req.file.filename,
                `/uploads/${req.file.filename}`,
                req.user.userId,
                parsedResult.label,
                parsedResult.percentage
            ], (err) => {
                if (err) {
                    console.error("❌ Database Error:", err);
                    return res.status(500).json({ message: "❌ Failed to save file info" });
                }

                res.json({
                    message: "✅ File uploaded & analyzed successfully!",
                    filePath: `/uploads/${req.file.filename}`,
                    prediction: parsedResult
                });
            });

        } catch (error) {
            console.error("❌ Error parsing Python output:", error);
            res.status(500).json({ message: "❌ Failed to parse prediction result" });
        }
    });
});

// ✅ Fetch User's Uploaded Files (Protected Route)
app.get("/api/files", verifyToken, (req, res) => {
    const sql = "SELECT * FROM audio_files WHERE user_id = ?";
    db.execute(sql, [req.user.userId], (err, results) => {
        if (err) {
            console.error("❌ Fetch Error: ", err);
            return res.status(500).json({ message: "❌ Failed to fetch files" });
        }
        res.json(results);
    });
});

// ✅ Serve Uploaded Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
