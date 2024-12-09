const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const upload = async function (localFilePath) {
  try {
    if (!localFilePath) {
      console.error("File path is missing");
      return null;
    }

    // Upload file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      public_id: `${Date.now()}-${localFilePath.originalname}`,
    });

    return uploadResult; // Return the result if needed
  } catch (error) {
    console.error("Error during Cloudinary upload:", error);
    throw error;
  }
};

module.exports = upload;
