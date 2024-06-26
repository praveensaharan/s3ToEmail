const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  company_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  email_verify: {
    type: Boolean,
    required: true,
  },
  url: {
    type: String,
    required: false,
  },
});

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;
