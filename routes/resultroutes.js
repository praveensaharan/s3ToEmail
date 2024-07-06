const express = require("express");
const router = express.Router();
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const Result = require("../models/Results");
const { insertOrUpdateCompanyContacts } = require("../sql2");

router.get("/", ClerkExpressRequireAuth({}), async (req, res) => {
  try {
    const results = await Result.find();
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.delete("/:id", ClerkExpressRequireAuth({}), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Result.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ msg: "Result not found" });
    }
    res.json({ msg: "Result deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.put("/:id", ClerkExpressRequireAuth({}), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await Result.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!result) {
      return res.status(404).json({ msg: "Result not found" });
    }

    res.json({ msg: "Result edited successfully", result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.post(
  "/movetomain/:id",
  ClerkExpressRequireAuth({}),
  async (req, res) => {
    const { id } = req.params;

    try {
      const mongoDoc = await Result.findById(id);

      if (!mongoDoc) {
        return res
          .status(404)
          .json({ error: "Document not found in MongoDB." });
      }
      let { company_name, email } = mongoDoc;
      company_name = company_name.replace(/^['"](.*)['"]$/, "$1");

      const emails = [];
      emails.push(email);

      const domainMatch = email.match(/@([^@]+)/);

      if (!domainMatch) {
        return res.status(400).json({ error: "Invalid email format." });
      }

      const company_domain = domainMatch[1].replace(/\.[^.]*$/, "");

      await insertOrUpdateCompanyContacts(company_name, emails, company_domain);
      await Result.findByIdAndDelete(id);

      res.status(200).json({
        message:
          "Data moved to main table and deleted from MongoDB successfully.",
      });
    } catch (error) {
      console.error(
        "Error moving data to main table and deleting from MongoDB:",
        error
      );
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
