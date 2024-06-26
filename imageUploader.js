const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const axios = require("axios");
require("dotenv").config();

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getPresignedUrl(filename, contentType) {
  const command = new PutObjectCommand({
    Bucket: "praveen-private",
    Key: `uploads/user/${filename}`,
    ContentType: contentType,
  });
  const response = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return response;
}

async function uploadImage(url, imageBuffer, contentType) {
  try {
    const response = await axios.put(url, imageBuffer, {
      headers: {
        "Content-Type": contentType,
      },
    });
    console.log("Successfully uploaded image:", response.status);
  } catch (err) {
    console.error("Error uploading image:", err);
    throw err;
  }
}

module.exports = {
  getPresignedUrl,
  uploadImage,
};
