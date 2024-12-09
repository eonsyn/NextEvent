const express = require("express");
const bcrypt = require("bcrypt");
const Admin = require("../Models/Admin");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const PendingAdmin = require("../Models/PendingAdmin");
const superAdmin = require("../Models/superAdmin");
const authenticateSuperadmin = require("../Middleware/superAuth.middleware");

router.get("/login", async (req, res) => {
  return res.render("superadmin");
});
router.post("/login", async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Validate input
    if (!userId || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check if the admin exists
    const adminSuper = await superAdmin.findOne({ userId });
    if (!adminSuper) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, adminSuper.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { role: "superadmin", userId: adminSuper.userId }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: "1h" } // Token expiry
    );
    // Send token in a cookie
    res
      .cookie("auth_token", token, {
        httpOnly: true, // Prevent access from client-side JavaScript
        secure: true, // Use secure cookies in production
        sameSite: "None", // Required for cross-origin cookies
        maxAge: 3600000, // 1 hour
      })
      .status(200)
      .json({ message: "Login successful", token: token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// router.post("/signup", async (req, res) => {
//   try {
//     const { userId, password } = req.body;

//     // Validate input
//     if (!userId || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);
//     const newAdmin = new superAdmin({
//       password: hashedPassword,
//       userId,
//     });
//     await newAdmin.save();
//     res.status(201).json({ message: "Admin request registered successfully!" });
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

router.get("/pending", authenticateSuperadmin, async (req, res) => {
  try {
    // Fetch all pending admin requests, excluding the password field
    const pendingAdmins = await PendingAdmin.find({}, { password: 0 });

    // Respond with the fetched data

    res.status(200).json({
      message: "Pending admin requests retrieved successfully.",
      data: pendingAdmins,
    });
  } catch (error) {
    console.error("Error fetching pending admin requests:", error);
    res.status(500).json({
      error: "Internal server error while fetching pending admin requests.",
    });
  }
});

router.post("/approve/:id", authenticateSuperadmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Find the pending admin request
    const pendingAdmin = await PendingAdmin.findById(id);
    if (!pendingAdmin) {
      return res.status(404).json({ error: "Pending admin not found." });
    }

    // Move to Admin collection
    const newAdmin = new Admin({
      name: pendingAdmin.name,
      emailId: pendingAdmin.emailId,
      password: pendingAdmin.password,
      userId: pendingAdmin.userId,
    });
    await newAdmin.save();

    // Remove from Pending collection
    await PendingAdmin.findByIdAndDelete(id);

    return res.status(200).json({ message: "Admin approved successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to approve admin." });
  }
});

router.delete("/decline/:id", authenticateSuperadmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete the pending admin request
    const pendingAdmin = await PendingAdmin.findByIdAndDelete(id);

    if (!pendingAdmin) {
      return res.status(404).json({ error: "Pending admin not found." });
    }

    return res
      .status(200)
      .json({ message: "Admin request declined successfully." });
  } catch (error) {
    console.error("Error declining admin request:", error);
    return res.status(500).json({ error: "Failed to decline admin request." });
  }
});

module.exports = router;
