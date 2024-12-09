const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Models/User"); // Assuming the User schema is in models/User.js
const router = express.Router();

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET; // Replace with a secure key in production

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { name, emailId, password, userId } = req.body;

    // Validate request data
    if (!name || !emailId || !password || !userId) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if email or userId already exists
    const existingUser = await User.findOne({ $or: [{ emailId }, { userId }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email or User ID already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      emailId,
      password: hashedPassword,
      userId,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // Validate request data
    if (!emailId || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // Find the user by email
    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, { httpOnly: true }); // Set token as a cookie
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Export the router
module.exports = router;
