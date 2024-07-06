const express = require("express");
const router = express.Router();
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const {
  getPgVersion,
  printTableContents,
  findCompanyByPattern,
} = require("../sql2");

router.get("/pgversion", async (req, res) => {
  try {
    const version = await getPgVersion();
    res.json(version);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch PostgreSQL version" });
  }
});

router.get("/tablecontents", ClerkExpressRequireAuth({}), async (req, res) => {
  try {
    const contents = await printTableContents();
    res.json(contents);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch table contents" });
  }
});

router.get(
  "/search/:pattern",
  ClerkExpressRequireAuth({}),
  async (req, res) => {
    const pattern = req.params.pattern;
    try {
      const companyDetails = await findCompanyByPattern(pattern);
      res.json(companyDetails);
    } catch (err) {
      res.status(500).json({
        error: `Failed to search for companies matching pattern "${pattern}"`,
      });
    }
  }
);

module.exports = router;
