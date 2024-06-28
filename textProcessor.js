const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const axios = require("axios");

const emailValidationApiKey = process.env.EMAIL_VALIDATION_API_KEY;
const generativeAiApiKey = process.env.GENERATIVE_AI_API_KEY;

async function validateEmail(email) {
  const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${emailValidationApiKey}&email=${email}`;
  try {
    const response = await axios.get(url);
    const responseData = response.data;
    const deliverability = responseData.deliverability;
    return deliverability === "DELIVERABLE";
  } catch (error) {
    console.error(`Error validating email ${email}: ${error}`);
    return false;
  }
}

async function extractCompany(text) {
  try {
    const genAI = new GoogleGenerativeAI(generativeAiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Please extract only the company name from the text below. Format it as 'Company Name'. text: ${text}`;
    const result = await model.generateContent(prompt);
    const extractedText = (await result.response.text()).trim();
    return extractedText;
  } catch (error) {
    console.error(`Error extracting company name: ${error}`);
    return "";
  }
}

async function processText(allText) {
  if (!allText) {
    console.error("Failed to process text as it is empty");
    return [];
  }

  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = allText.match(emailPattern) || [];
  const companyName = await extractCompany(allText);

  const results = await Promise.all(
    emails.map(async (email) => {
      const verified = false;
      //   const verified = await validateEmail(email);
      return {
        company_name: companyName,
        email: email,
        email_verify: verified,
      };
    })
  );

  return results;
}

module.exports = {
  processText,
};
