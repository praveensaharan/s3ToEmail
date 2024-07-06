const { createClerkClient } = require("@clerk/clerk-sdk-node");

if (!process.env.CLERK_SECRET_KEY) {
  console.error(
    "Error: Missing Clerk Secret Key. Go to https://dashboard.clerk.com and get your key for your instance."
  );
  process.exit(1);
}

let clerkClient;

try {
  clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
} catch (error) {
  console.error("Error initializing Clerk client:", error);
  process.exit(1);
}

module.exports = { clerkClient };
