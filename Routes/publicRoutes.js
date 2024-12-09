const express = require("express");
const Post = require("../Models/Post"); // Ensure the correct model name is used
const router = express.Router();

router.get("/allPosts", async (req, res) => {
  try {
    const allPosts = await Post.find(); // Await the result of the query
    return res.status(200).json({ posts: allPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
});

module.exports = router;
