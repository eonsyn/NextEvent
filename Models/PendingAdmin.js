const mongoose = require("mongoose");

const PendingAdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  emailId: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
  },
  password: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  requestedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PendingAdmin", PendingAdminSchema);
