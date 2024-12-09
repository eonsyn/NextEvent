const express = require("express");
const router = express.Router();
const Post = require("../Models/Post");
const uploadfile = require("../Models/uploadFile");
const upload = require("../Middleware/multer.middleware");
const fs = require("fs");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);
const nodemailer = require("nodemailer");
const User = require("../Models/User");
const authMiddleware = require("../Middleware/auth.middleware");
require("dotenv").config();

const sendEmail = (name, email, title, description) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true, // True for 465, false for other ports
    port: 465,
    auth: {
      user: process.env.MAIL_USER_TEST,
      pass: process.env.MAIL_PASS_TEST,
    },
  });

  const mailOptions = {
    from: `NextEvent < ${process.env.MAIL_USER_ARYAN} >`,
    to: email,
    subject: `You're Invited to the ${title}`,
    text: `Dear ${name},\n\nWe are excited to announce a new event: **${title}**.\n\nDescription: ${description}\n\nJoin us for this exciting event and be part of something amazing!\n\nBest regards,\nNextEvent Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

router.post(
  "/postEvent",
  upload.single("photo"),
  authMiddleware,
  async (req, res) => {
    try {
      const { description, title, tags } = req.body;

      // Validate required fields
      if (!tags || !description || !title) {
        return res
          .status(400)
          .json({ message: "All required fields must be filled." });
      }

      if (!req.file || !req.file.path) {
        return res.status(400).send("No file uploaded");
      }

      // Upload to Cloudinary
      const uploadResult = await uploadfile(req.file.path);
      await unlinkAsync(req.file.path);

      // Create a new post
      const newPost = new Post({
        imageUrl: uploadResult.secure_url,
        writtenBy: req.user.userId,
        description,
        title,
        tags,
      });

      // Save the post to the database
      const savedPost = await newPost.save();

      // Fetch all users from the database
      const users = await User.find();

      // Send email to each user
      users.forEach((user) => {
        sendEmail(user.name, user.emailId, title, description);
      });

      // Send a success response
      res.status(201).json({
        message: "Post created successfully! Users have been notified.",
        post: savedPost,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res
        .status(500)
        .json({ message: "Server error. Please try again later." });
    }
  }
);

router.get("/adminPost", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    // Find posts where the admin's userId matches
    const adminPosts = await Post.find({ writtenBy: userId });

    // Check if posts exist for the given admin
    if (!adminPosts || adminPosts.length === 0) {
      return res
        .status(404)
        .json({ message: "No posts found for this admin." });
    }

    // Send the posts as a response
    return res.status(200).json(adminPosts);
  } catch (error) {
    console.error("Error fetching admin posts:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.delete("/deletePost/:_id", authMiddleware, async (req, res) => {
  const { _id } = req.params;

  try {
    // Find and delete the post by its ID
    const deletedPost = await Post.findByIdAndDelete(_id);

    // Check if the post exists
    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Return a success response
    return res
      .status(200)
      .json({ message: "Post deleted successfully", post: deletedPost });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete post", error: error.message });
  }
});

module.exports = router;
