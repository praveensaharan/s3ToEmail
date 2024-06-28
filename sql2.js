// db.js
require("dotenv").config();
const postgres = require("postgres");

let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: "require",
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});

async function getPgVersion() {
  try {
    const result = await sql`SELECT version()`;
    console.log("PostgreSQL Version:", result);
    return result;
  } catch (err) {
    console.error("Error fetching PostgreSQL version:", err);
    throw err;
  }
}

async function findCompanyByPattern(pattern) {
  try {
    const sqlPattern = `%${pattern}%`;
    const companyDetails = await sql`
      SELECT id, company_name, email1, email2, email3 FROM company_contacts
      WHERE company_name ILIKE ${sqlPattern}
      OR company_domain ILIKE ${sqlPattern}`;
    console.log(`Details for companies matching pattern "${pattern}":`);
    return companyDetails;
  } catch (err) {
    console.error(`Error fetching details for pattern "${pattern}":`, err);
    throw err;
  }
}

async function printTableContents() {
  try {
    const tableContents = await sql`SELECT * FROM company_contacts LIMIT 20`;
    console.log("First 20 Table Contents:");
    return tableContents;
  } catch (err) {
    console.error("Error fetching table contents:", err);
    throw err;
  }
}

module.exports = {
  getPgVersion,
  findCompanyByPattern,
  printTableContents,
};
