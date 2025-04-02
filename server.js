// Import required modules
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt"); // For password hashing
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config(); // Load environment variables

// Import route handlers
const adminRoutes = require("./Routes/adminRoutes");
const authRoutes = require("./Routes/authRoute");
const publicRoutes = require("./Routes/publicRoutes");
const superadminRoutes = require("./Routes/superRoutes");
const userRoutes = require("./Routes/userRoutes");

// Import MongoDB connection function
const connectdb = require("./config/dbConeect");

// Initialize Express app
const app = express();

// Set up view engine for rendering EJS templates
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Configure CORS to allow cross-origin requests
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true, // Allow cookies in cross-origin requests
  })
);

// Middleware to set response headers for CORS credentials
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// Middleware for parsing JSON and URL-encoded request bodies
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded payloads

// Middleware for handling cookies
app.use(cookieParser());

// Connect to MongoDB database
connectdb();

// Define API routes
app.use("/api/admin", adminRoutes); // Admin-related routes
app.use("/api/auth", authRoutes); // Authentication-related routes
app.use("/api/public", publicRoutes); // Publicly accessible routes
app.use("/api/user", userRoutes); // User-related routes
app.use("/api/superadmin", superadminRoutes); // Superadmin-related routes

// Default route - Homepage
app.get("/", async (req, res) => {
  res.send("Hello World!"); // Simple response for root URL
});

// Start the Express server
const PORT = process.env.PORT || 3000; // Use environment port or default to 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
