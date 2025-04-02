const express = require("express");
const Post = require("../Models/Post");
const router = express.Router();

// Fetch All Posts
router.get("/allPosts", async (req, res) => {
  try {
    // Fetch posts with sorting (latest first) and select only necessary fields
    const allPosts = await Post.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .select("title description imageUrl tags createdAt writtenBy"); // Select specific fields

    // Check if posts exist
    if (!allPosts.length) {
      return res.status(404).json({ message: "No posts found." });
    }

    return res.status(200).json({ posts: allPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
});

module.exports = router;
