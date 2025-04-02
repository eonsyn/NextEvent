const express = require("express");
const router = express.Router();
const fs = require("fs");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);
const nodemailer = require("nodemailer");
require("dotenv").config();

// Import models
const Post = require("../Models/Post");
const User = require("../Models/User");
const uploadfile = require("../Models/uploadFile");

// Import middlewares
const upload = require("../Middleware/multer.middleware");
const authMiddleware = require("../Middleware/auth.middleware");

// =================================================================
// EMAIL SENDING FUNCTION
// Sends an invitation email to users when a new event is posted.
// =================================================================
const sendEmail = (name, email, title, description) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true, // Use TLS for security
    port: 465, // Gmail SMTP port for TLS
    auth: {
      user: process.env.MAIL_USER_TEST, // Sender email
      pass: process.env.MAIL_PASS_TEST, // Sender password
    },
  });

  const mailOptions = {
    from: `NextEvent <${process.env.MAIL_USER_ARYAN}>`,
    to: email,
    subject: `You're Invited to: ${title}`,
    text: `Dear ${name},\n\nWe are thrilled to announce a new event: ${title}.\n\nDescription: ${description}\n\nJoin us and be part of something amazing!\n\nBest regards,\nNextEvent Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

// =================================================================
// CREATE EVENT POST (Protected Route)
// Uploads an image, saves event details, and notifies users via email.
// =================================================================
router.post(
  "/postEvent",
  upload.single("photo"), // Multer middleware for file upload
  authMiddleware, // Authentication middleware
  async (req, res) => {
    try {
      const { description, title, tags } = req.body;

      // Validate required fields
      if (!tags || !description || !title) {
        return res.status(400).json({ message: "All fields are required." });
      }

      // Validate file upload
      if (!req.file || !req.file.path) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload image to Cloudinary
      const uploadResult = await uploadfile(req.file.path);

      // Delete local file after upload
      await unlinkAsync(req.file.path);

      // Create a new event post
      const newPost = new Post({
        imageUrl: uploadResult.secure_url,
        writtenBy: req.user.userId, // Admin who created the post
        description,
        title,
        tags,
      });

      // Save the post in the database
      const savedPost = await newPost.save();

      // Fetch all users from the database
      const users = await User.find();

      // Send an email to each user
      users.forEach((user) => sendEmail(user.name, user.emailId, title, description));

      // Return success response
      res.status(201).json({
        message: "Post created successfully! Users have been notified.",
        post: savedPost,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Server error. Please try again later." });
    }
  }
);

// =================================================================
// GET ADMIN POSTS (Protected Route)
// Retrieves all posts created by the logged-in admin.
// =================================================================
router.get("/adminPost", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // Get admin ID from auth middleware

    // Fetch posts created by this admin
    const adminPosts = await Post.find({ writtenBy: userId });

    // Check if posts exist
    if (!adminPosts.length) {
      return res.status(404).json({ message: "No posts found for this admin." });
    }

    // Return posts
    return res.status(200).json(adminPosts);
  } catch (error) {
    console.error("Error fetching admin posts:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// =================================================================
// DELETE POST (Protected Route)
// Allows an admin to delete their own post by ID.
// =================================================================
router.delete("/deletePost/:_id", authMiddleware, async (req, res) => {
  try {
    const { _id } = req.params; // Get post ID from request parameters

    // Find and delete the post
    const deletedPost = await Post.findByIdAndDelete(_id);

    // Check if post exists
    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Return success response
    return res.status(200).json({
      message: "Post deleted successfully.",
      post: deletedPost,
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({
      message: "Failed to delete post.",
      error: error.message,
    });
  }
});

module.exports = router;
