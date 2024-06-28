const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { getPresignedUrl, uploadImage } = require("./imageUploader");
const { processImage } = require("./imageProcessor");
const { processText } = require("./textProcessor");
const connectDB = require("./database");
const { getPgVersion } = require("./sql2");
const Result = require("./Routes/Results");
require("dotenv").config();

connectDB();

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
      return res
        .status(400)
        .json({ error: "Only PNG and JPEG images are allowed." });
    }

    const filename = `image-${Date.now()}.${file.mimetype.split("/")[1]}`;
    const contentType = file.mimetype;

    try {
      const presignedUrl = await getPresignedUrl(filename, contentType);
      await uploadImage(presignedUrl, file.buffer, contentType);
      const publicUrl = `https://praveen-private.s3.ap-south-1.amazonaws.com/uploads/user/${filename}`;

      const results = await processImage(publicUrl);

      console.log("Image processing results:", results);

      if (!Array.isArray(results) || results.length === 0) {
        return res.status(400).json({
          error: "Image processing failed to extract required fields",
        });
      }

      const savedResults = [];
      for (const result of results) {
        if (!result.company_name || !result.email) {
          continue; // Skip incomplete results
        }
        const newResult = new Result({
          company_name: result.company_name,
          email: result.email,
          email_verify: result.email_verify,
          url: publicUrl,
        });

        await newResult.save();
        savedResults.push(result);
      }

      if (savedResults.length === 0) {
        return res.status(400).json({ error: "No valid results to save" });
      }

      return res.json({ url: publicUrl, results: savedResults });
    } catch (error) {
      console.error(`Error processing image: ${error}`);
      return res.status(500).json({ error: "Failed to process image" });
    }
  } catch (err) {
    console.error(`Error uploading image: ${err}`);
    return res.status(500).json({ error: "Failed to upload image." });
  }
});

app.post("/uploadtext", async (req, res) => {
  try {
    const text = req.body.text;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const results = await processText(text);

    console.log("Text processing results:", results);

    if (!Array.isArray(results) || results.length === 0) {
      return res
        .status(400)
        .json({ error: "Text processing failed to extract required fields" });
    }

    const savedResults = [];
    for (const result of results) {
      if (!result.company_name || !result.email) {
        continue;
      }
      const newResult = new Result({
        company_name: result.company_name,
        email: result.email,
        email_verify: result.email_verify,
      });

      await newResult.save();
      savedResults.push(result);
    }

    if (savedResults.length === 0) {
      return res.status(400).json({ error: "No valid results to save" });
    }

    return res.json({ results: savedResults });
  } catch (err) {
    console.error(`Error processing text: ${err}`);
    return res.status(500).json({ error: "Failed to process text." });
  }
});

app.get("/results", async (req, res) => {
  try {
    const results = await Result.find();
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/pgversion", async (req, res) => {
  try {
    const version = await getPgVersion();
    res.json(version);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch PostgreSQL version" });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to Image Processor");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
