const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const PendingAdmin = require("../Models/PendingAdmin");
const Admin = require("../Models/Admin");
const SuperAdmin = require("../Models/superAdmin");
const authenticateSuperadmin = require("../Middleware/superAuth.middleware");

// Super Admin Login Page (Render HTML if applicable)
router.get("/login", (req, res) => {
  return res.render("superadmin");
});

// 🔹 **Super Admin Login**
router.post("/login", async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: "User ID and password are required" });
    }

    const adminSuper = await SuperAdmin.findOne({ userId });
    if (!adminSuper) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, adminSuper.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ role: "superadmin", userId }, process.env.JWT_SECRET, {
      expiresIn: "2h", // Extended expiration time
    });

    res
      .cookie("auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7200000, // 2 hours
      })
      .status(200)
      .json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 🔹 **Super Admin Signup (Enable only when needed)**
// router.post("/signup", async (req, res) => {
//   try {
//     const { userId, password } = req.body;
//     if (!userId || !password) {
//       return res.status(400).json({ message: "User ID and password are required" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newSuperAdmin = new SuperAdmin({ userId, password: hashedPassword });
//     await newSuperAdmin.save();

//     res.status(201).json({ message: "Super admin registered successfully!" });
//   } catch (error) {
//     console.error("Signup error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// 🔹 **Fetch All Pending Admin Requests**
router.get("/pending", authenticateSuperadmin, async (req, res) => {
  try {
    const pendingAdmins = await PendingAdmin.find().select("-password"); // Exclude passwords
    
    res.status(200).json({ message: "Pending admin requests retrieved successfully.", data: pendingAdmins });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 **Approve Admin Request**
router.post("/approve/:id", authenticateSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pendingAdmin = await PendingAdmin.findById(id);
    if (!pendingAdmin) {
      return res.status(404).json({ message: "Pending admin not found." });
    }

    // Move to Admin collection
    const newAdmin = new Admin({
      name: pendingAdmin.name,
      emailId: pendingAdmin.emailId,
      password: pendingAdmin.password,
      userId: pendingAdmin.userId,
    });
    await newAdmin.save();
    await PendingAdmin.findByIdAndDelete(id); // Remove from pending list

    res.status(200).json({ message: "Admin approved successfully." });
  } catch (error) {
    console.error("Error approving admin:", error);
    res.status(500).json({ message: "Failed to approve admin." });
  }
});

// 🔹 **Decline Admin Request**
router.delete("/decline/:id", authenticateSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAdmin = await PendingAdmin.findByIdAndDelete(id);
    if (!deletedAdmin) {
      return res.status(404).json({ message: "Pending admin not found." });
    }

    res.status(200).json({ message: "Admin request declined successfully." });
  } catch (error) {
    console.error("Error declining admin request:", error);
    res.status(500).json({ message: "Failed to decline admin request." });
  }
});

module.exports = router;
