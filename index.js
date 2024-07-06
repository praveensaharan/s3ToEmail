const express = require("express");
const cors = require("cors");
const connectDB = require("./database");
require("dotenv").config();

connectDB();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/user", require("./routes/user"));
app.use("/upload", require("./routes/upload"));
app.use("/result", require("./routes/resultroutes"));
app.use("/database", require("./routes/database"));

app.get("/", (req, res) => {
  res.send("Welcome to Image Processor");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// const express = require("express");
// const multer = require("multer");
// const cors = require("cors");
// const {
//   ClerkExpressRequireAuth,
//   createClerkClient,
// } = require("@clerk/clerk-sdk-node");

// const { getPresignedUrl, uploadImage } = require("./imageUploader");
// const { processImage } = require("./imageProcessor");
// const { processText } = require("./textProcessor");
// const connectDB = require("./database");
// const {
//   getPgVersion,
//   findCompanyByPattern,
//   printTableContents,
//   insertOrUpdateCompanyContacts,
// } = require("./sql2");
// const Result = require("./Routes/Results");
// require("dotenv").config();

// connectDB();

// const app = express();
// const port = process.env.PORT || 3000;
// if (!process.env.CLERK_SECRET_KEY) {
//   console.error(
//     "Error: Missing Clerk Secret Key. Go to https://dashboard.clerk.com and get your key for your instance."
//   );
//   process.exit(1);
// }

// let clerkClient;

// try {
//   clerkClient = createClerkClient({
//     secretKey: process.env.CLERK_SECRET_KEY,
//   });
// } catch (error) {
//   console.error("Error initializing Clerk client:", error);
//   process.exit(1);
// }
// const upload = multer({ storage: multer.memoryStorage() });

// app.use(cors());
// app.use(express.json());

// app.get("/user-info", ClerkExpressRequireAuth({}), async (req, res) => {
//   if (!req.auth || !req.auth.userId) {
//     return res.status(401).json({ error: "Unauthenticated!" });
//   }

//   try {
//     const user = await clerkClient.users.getUser(req.auth.userId);
//     const userInfo = {
//       id: user.id,
//       email: user.emailAddresses[0].emailAddress,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       createdAt: user.createdAt,
//     };
//     res.json(userInfo);
//   } catch (error) {
//     console.error("Error fetching user information:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// app.post(
//   "/upload",
//   ClerkExpressRequireAuth({}),
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const file = req.file;

//       if (!file) {
//         return res.status(400).json({ error: "No file uploaded" });
//       }

//       if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
//         return res
//           .status(400)
//           .json({ error: "Only PNG and JPEG images are allowed." });
//       }

//       const filename = `image-${Date.now()}.${file.mimetype.split("/")[1]}`;
//       const contentType = file.mimetype;

//       try {
//         const presignedUrl = await getPresignedUrl(filename, contentType);
//         await uploadImage(presignedUrl, file.buffer, contentType);
//         const publicUrl = `https://praveen-private.s3.ap-south-1.amazonaws.com/uploads/user/${filename}`;

//         const results = await processImage(publicUrl);

//         console.log("Image processing results:", results);

//         if (!Array.isArray(results) || results.length === 0) {
//           return res.status(400).json({
//             error: "Image processing failed to extract required fields",
//           });
//         }

//         const savedResults = [];
//         for (const result of results) {
//           if (!result.company_name || !result.email) {
//             continue; // Skip incomplete results
//           }
//           const newResult = new Result({
//             company_name: result.company_name,
//             email: result.email,
//             email_verify: result.email_verify,
//             url: publicUrl,
//           });

//           await newResult.save();
//           savedResults.push(result);
//         }

//         if (savedResults.length === 0) {
//           return res.status(400).json({ error: "No valid results to save" });
//         }

//         return res.json({ url: publicUrl, results: savedResults });
//       } catch (error) {
//         console.error(`Error processing image: ${error}`);
//         return res.status(500).json({ error: "Failed to process image" });
//       }
//     } catch (err) {
//       console.error(`Error uploading image: ${err}`);
//       return res.status(500).json({ error: "Failed to upload image." });
//     }
//   }
// );

// app.post("/uploadtext", ClerkExpressRequireAuth({}), async (req, res) => {
//   try {
//     const text = req.body.text;

//     if (!text) {
//       return res.status(400).json({ error: "No text provided" });
//     }

//     const results = await processText(text);

//     console.log("Text processing results:", results);

//     if (!Array.isArray(results) || results.length === 0) {
//       return res
//         .status(400)
//         .json({ error: "Text processing failed to extract required fields" });
//     }

//     const savedResults = [];
//     for (const result of results) {
//       if (!result.company_name || !result.email) {
//         continue;
//       }
//       const newResult = new Result({
//         company_name: result.company_name,
//         email: result.email,
//         email_verify: result.email_verify,
//       });

//       await newResult.save();
//       savedResults.push(result);
//     }

//     if (savedResults.length === 0) {
//       return res.status(400).json({ error: "No valid results to save" });
//     }

//     return res.json({ results: savedResults });
//   } catch (err) {
//     console.error(`Error processing text: ${err}`);
//     return res.status(500).json({ error: "Failed to process text." });
//   }
// });

// app.get("/results", ClerkExpressRequireAuth({}), async (req, res) => {
//   try {
//     const results = await Result.find();
//     res.json(results);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server error");
//   }
// });

// app.delete("/delete/:id", ClerkExpressRequireAuth({}), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await Result.findByIdAndDelete(id);
//     if (!result) {
//       return res.status(404).json({ msg: "Result not found" });
//     }
//     res.json({ msg: "Result deleted successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server error");
//   }
// });

// app.put("/edit/:id", ClerkExpressRequireAuth({}), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const result = await Result.findByIdAndUpdate(id, updateData, {
//       new: true,
//     });

//     if (!result) {
//       return res.status(404).json({ msg: "Result not found" });
//     }

//     res.json({ msg: "Result edited successfully", result });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server error");
//   }
// });

// app.post("/movetomain/:id", ClerkExpressRequireAuth({}), async (req, res) => {
//   const { id } = req.params;

//   try {
//     const mongoDoc = await Result.findById(id);

//     if (!mongoDoc) {
//       return res.status(404).json({ error: "Document not found in MongoDB." });
//     }
//     let { company_name, email } = mongoDoc;
//     company_name = company_name.replace(/^['"](.*)['"]$/, "$1");

//     const emails = [];
//     emails.push(email);

//     const domainMatch = email.match(/@([^@]+)/);

//     if (!domainMatch) {
//       return res.status(400).json({ error: "Invalid email format." });
//     }

//     const company_domain = domainMatch[1].replace(/\.[^.]*$/, "");
//     // console.log(company_name.slice(2, 5), emails, company_domain);

//     await insertOrUpdateCompanyContacts(company_name, emails, company_domain);
//     await Result.findByIdAndDelete(id);

//     res.status(200).json({
//       message:
//         "Data moved to main table and deleted from MongoDB successfully.",
//     });
//   } catch (error) {
//     console.error(
//       "Error moving data to main table and deleting from MongoDB:",
//       error
//     );
//     res.status(500).json({ error: "Server error" });
//   }
// });

// app.get("/pgversion", async (req, res) => {
//   try {
//     const version = await getPgVersion();
//     res.json(version);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch PostgreSQL version" });
//   }
// });

// app.get("/tablecontents", ClerkExpressRequireAuth({}), async (req, res) => {
//   try {
//     const contents = await printTableContents();
//     res.json(contents);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch table contents" });
//   }
// });

// app.get("/search/:pattern", ClerkExpressRequireAuth({}), async (req, res) => {
//   const pattern = req.params.pattern;
//   try {
//     const companyDetails = await findCompanyByPattern(pattern);
//     res.json(companyDetails);
//   } catch (err) {
//     res.status(500).json({
//       error: `Failed to search for companies matching pattern "${pattern}"`,
//     });
//   }
// });

// app.get("/", (req, res) => {
//   res.send("Welcome to Image Processor");
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}/`);
// });
