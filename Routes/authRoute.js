const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();

// Import Admin and PendingAdmin models
const Admin = require("../Models/Admin");
const PendingAdmin = require("../Models/PendingAdmin");

// JWT Secret Token from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// =================================================================
// ADMIN SIGNUP ROUTE - Registers an admin request for approval
// =================================================================
router.post("/admin/signUp", async (req, res) => {
  try {
    const { emailId, userId, password, name } = req.body;

    // Validate input fields
    if (!emailId || !userId || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if admin email or userId already exists in approved or pending lists
    const existingAdmin = await Admin.findOne({ $or: [{ emailId }, { userId }] });
    const existingPendingAdmin = await PendingAdmin.findOne({ $or: [{ emailId }, { userId }] });

    if (existingAdmin || existingPendingAdmin) {
      return res.status(409).json({ message: "Email or User ID already exists" });
    }

    // Hash the password for security
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new pending admin request
    const newPendingAdmin = new PendingAdmin({
      name,
      emailId,
      userId,
      password: hashedPassword,
    });

    // Save the pending request to the database
    await newPendingAdmin.save();

    res.status(201).json({ message: "Admin request registered successfully!" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =================================================================
// ADMIN LOGIN ROUTE - Authenticates admin and provides JWT token
// =================================================================
router.post("/admin/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // Validate input fields
    if (!emailId || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the admin by email
    const admin = await Admin.findOne({ emailId });

    if (!admin) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    // Compare entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: admin.userId, emailId: admin.emailId, role: "admin" }, // Payload
      JWT_SECRET, // Secret Key
      { expiresIn: "1h" } // Expiration time
    );

    // Send the token in an HTTP-only cookie for security
    res
      .cookie("auth_token", token, {
        httpOnly: true, // Prevent access from JavaScript
        secure: process.env.NODE_ENV === "production", // Secure only in production
        sameSite: "None", // Required for cross-origin authentication
        maxAge: 3600000, // 1 hour expiration
      })
      .status(200)
      .json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
