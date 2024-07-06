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
    console.error("Error fetching PostgreSQL version:", err.message);
    throw err;
  }
}

async function findCompanyByPattern(pattern) {
  try {
    const sqlPattern = `%${pattern}%`;
    const companyDetails = await sql`
      SELECT id, company_name, email1, email2, email3 FROM company_info
      WHERE company_name ILIKE ${sqlPattern}
      OR company_domain ILIKE ${sqlPattern}`;
    console.log(
      `Details for companies matching pattern "${pattern}":`,
      companyDetails
    );
    return companyDetails;
  } catch (err) {
    console.error(
      `Error fetching details for pattern "${pattern}":`,
      err.message
    );
    throw err;
  }
}

async function printTableContents() {
  try {
    const tableContents = await sql`SELECT * FROM company_info LIMIT 200`;
    console.log("First 200 Table Contents:", tableContents);
    return tableContents;
  } catch (err) {
    console.error("Error fetching table contents:", err.message);
    throw err;
  }
}

async function insertOrUpdateCompanyContacts(
  companyName,
  emails,
  companyDomain
) {
  try {
    if (!companyName || !companyDomain || !Array.isArray(emails)) {
      throw new Error("Invalid input data");
    }

    const uniqueEmails = [
      ...new Set(
        emails.filter((email) => typeof email === "string" && email.trim())
      ),
    ];

    const existingEntries = await sql`
      SELECT * FROM company_info
      WHERE company_name = ${companyName}
      AND company_domain = ${companyDomain}
    `;

    if (existingEntries.length > 0) {
      let updatedEmails = new Set();

      existingEntries.forEach((entry) => {
        for (let i = 1; i <= 6; i++) {
          if (entry[`email${i}`]) {
            updatedEmails.add(entry[`email${i}`]);
          }
        }
      });

      uniqueEmails.forEach((email) => {
        updatedEmails.add(email);
      });
      const emailArray = Array.from(updatedEmails).slice(0, 6);
      const firstEntryId = existingEntries[0].id;
      const numEmails = emailArray.length;
      await sql`
        UPDATE company_info
      SET
        email1 = ${numEmails >= 1 ? emailArray[0] : null},
        email2 = ${numEmails >= 2 ? emailArray[1] : null},
        email3 = ${numEmails >= 3 ? emailArray[2] : null},
        email4 = ${numEmails >= 4 ? emailArray[3] : null},
        email5 = ${numEmails >= 5 ? emailArray[4] : null},
        email6 = ${numEmails >= 6 ? emailArray[5] : null},
        verify = true
      WHERE id = ${firstEntryId}
      `;

      console.log("Successfully updated company contacts with new emails.");
    } else {
      const emailValues = uniqueEmails
        .slice(0, 6)
        .concat(Array(6).fill(null))
        .slice(0, 6);

      await sql`
        INSERT INTO company_info (
          company_name,
          email1, email2, email3, email4, email5, email6,
          verify,
          company_domain
        ) VALUES (
          ${companyName},
          ${emailValues[0]}, ${emailValues[1]}, ${emailValues[2]},
          ${emailValues[3]}, ${emailValues[4]}, ${emailValues[5]},
          true,
          ${companyDomain}
        )
      `;

      console.log("Successfully inserted new company contacts.");
    }
  } catch (err) {
    console.error("Error inserting or updating company contacts:", err.message);
    throw err;
  }
}

module.exports = {
  getPgVersion,
  findCompanyByPattern,
  printTableContents,
  insertOrUpdateCompanyContacts,
};
