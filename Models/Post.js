const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
    trim: true, // Ensures no leading/trailing spaces
  },
  writtenBy: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  tags: {
    type: [String], // Array of strings for multiple tags
    default: [], // If no tags are provided, it will default to an empty array
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically sets the current date/time
  },
  updatedAt: {
    type: Date,
  },
});

// Middleware to update `updatedAt` before saving
postSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
