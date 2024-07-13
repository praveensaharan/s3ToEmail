const express = require("express");
const multer = require("multer");
const router = express.Router();
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const { getPresignedUrl, uploadImage } = require("../imageUploader");
const { processImage } = require("../imageProcessor");
const { processText } = require("../textProcessor");
const Result = require("../models/Results");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/image",
  ClerkExpressRequireAuth({}),
  upload.single("image"),
  async (req, res) => {
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

        if (!Array.isArray(results) || results.length === 0) {
          return res.status(400).json({
            error: "Image processing failed to extract required fields",
          });
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
  }
);

router.post("/text", ClerkExpressRequireAuth({}), async (req, res) => {
  try {
    const text = req.body.text;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const results = await processText(text);

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

router.post("/imageextension", upload.single("image"), async (req, res) => {
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

      if (!Array.isArray(results) || results.length === 0) {
        return res.status(400).json({
          error: "Image processing failed to extract required fields",
        });
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

router.post("/textextension", async (req, res) => {
  try {
    const text = req.body.text;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const results = await processText(text);

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

module.exports = router;
