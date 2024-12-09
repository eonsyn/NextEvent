const mongoose = require("mongoose");

// Define the Admin schema
const superAdminSchema = new mongoose.Schema({
  password: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
  },
});

// Export the Admin model
const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);
module.exports = SuperAdmin;
