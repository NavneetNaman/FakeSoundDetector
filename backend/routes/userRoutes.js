const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// ✅ User Registration API
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "⚠️ All fields are required!" });
    }

    try {
        // Check if user already exists
        db.execute("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
            if (err) {
                console.error("❌ DB Error:", err);
                return res.status(500).json({ message: "❌ Registration failed" });
            }

            if (results.length > 0) {
                return res.status(409).json({ message: "⚠️ User already exists. Please login." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

            db.execute(sql, [name, email, hashedPassword], (err) => {
                if (err) {
                    console.error("❌ Registration Error:", err);
                    return res.status(500).json({ message: "❌ Registration failed" });
                }
                res.status(201).json({ message: "✅ User registered successfully!" });
            });
        });
    } catch (error) {
        console.error("❌ Hashing Error:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
});

// ✅ User Login API
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "⚠️ Email and Password are required!" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.execute(sql, [email], async (err, results) => {
        if (err) {
            console.error("❌ Login Error:", err);
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

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.status(200).json({ message: "✅ Login successful!", token });
    });
});

// ✅ JWT Middleware
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "❌ Access Denied. Token missing!" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "❌ Invalid or expired token!" });
        }
        req.user = user;
        next();
    });
};

module.exports = {
    router,
    authenticateToken
};
