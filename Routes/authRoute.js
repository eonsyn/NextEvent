const express = require("express");
const bcrypt = require("bcrypt");
const Admin = require("../Models/Admin");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const PendingAdmin = require("../Models/PendingAdmin");

//jwt secret token
const JWT_SECRET = process.env.JWT_SECRET;

// SignUp Route
router.post("/admin/signUp", async (req, res) => {
  try {
    const { emailId, userId, password, name } = req.body;

    // Validate input
    if (!emailId || !userId || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email or userId already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ emailId }, { userId }],
    });
    if (existingAdmin) {
      return res
        .status(409)
        .json({ message: "Email or User ID already exists" });
    }
    const existingRequestAdmin = await PendingAdmin.findOne({
      $or: [{ emailId }, { userId }],
    });
    if (existingRequestAdmin) {
      return res
        .status(409)
        .json({ message: "Email or User ID already exists" });
    }

    // Encrypt the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newRequest = new PendingAdmin({
      name,
      emailId,
      password: hashedPassword,
      userId,
    });
    await newRequest.save();

    // Create a new admin
    // const newAdmin = new Admin({
    //   name,
    //   emailId,
    //   password: hashedPassword,
    //   userId,
    // });

    // Save to the database
    // await newAdmin.save();

    res.status(201).json({ message: "Admin request registered successfully!" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/admin/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // Validate input
    if (!emailId || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check if the admin exists
    const admin = await Admin.findOne({ emailId });
    if (!admin) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: admin.userId, emailId: admin.emailId, role: "admin" }, // Payload
      JWT_SECRET, // Secret key
      { expiresIn: "1h" } // Token expiry
    );

    // Send token in a cookie
    res
      .cookie("auth_token", token, {
        httpOnly: true, // Prevent access from client-side JavaScript
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        sameSite: "Strict", // Prevent CSRF
        maxAge: 3600000, // 1 hour
      })
      .status(200)
      .json({ message: "Login successful", token: token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
