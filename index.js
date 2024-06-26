const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { getPresignedUrl, uploadImage } = require("./imageUploader");
const { processImage } = require("./imageProcessor");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors()); // Enable CORS
app.use(express.json());

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
      return res
        .status(400)
        .json({ error: "Only PNG and JPEG images are allowed." });
    }

    const filename = `image-${Date.now()}.${file.mimetype.split("/")[1]}`;
    const contentType = file.mimetype;
    const presignedUrl = await getPresignedUrl(filename, contentType);
    await uploadImage(presignedUrl, file.buffer, contentType);
    const publicUrl = `https://praveen-private.s3.ap-south-1.amazonaws.com/uploads/user/${filename}`;

    if (!publicUrl) {
      return res.status(400).json({ error: "Failed to get image URL" });
    }

    try {
      const results = await processImage(publicUrl);
      return res.json({ url: publicUrl, results });
    } catch (error) {
      console.error(`Error processing image: ${error}`);
      return res.status(500).json({ error: "Failed to process image" });
    }
  } catch (err) {
    console.error(`Error uploading image: ${err}`);
    return res.status(500).json({ error: "Failed to upload image." });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to Image Processor");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
