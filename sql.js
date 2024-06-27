const postgres = require("postgres");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
require("dotenv").config();

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
  } catch (err) {
    console.error("Error fetching PostgreSQL version:", err);
  }
}

async function deleteTable() {
  try {
    await sql`DROP TABLE IF EXISTS company_contacts`;
    console.log("Table 'company_contacts' deleted successfully.");
  } catch (err) {
    console.error("Error deleting table:", err);
  }
}

async function createTable() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS company_contacts (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(200) NOT NULL,
      email1 VARCHAR(100),
      email2 VARCHAR(100),
      email3 VARCHAR(100),
      verify BOOLEAN NOT NULL
    )`;
    console.log("Table 'company_contacts' created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  }
}

async function insertDataFromCSV() {
  try {
    const filePath = path.resolve(__dirname, "data.csv"); // Update the file path if necessary
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.company_name && row.company_name.trim() !== "") {
          results.push({
            company_name: row.company_name || "",
            email1: row.email1 || "",
            email2: row.email2 || "",
            email3: row.email3 || "",
            verify: row.verify.toLowerCase() === "true", // Convert string to boolean
          });
        }
      })
      .on("end", async () => {
        for (const row of results) {
          const { company_name, email1, email2, email3, verify } = row;
          await sql`INSERT INTO company_contacts (company_name, email1, email2, email3, verify) VALUES (${company_name}, ${email1}, ${email2}, ${email3}, ${verify})`;
        }
        console.log("Data inserted successfully from CSV.");
      });
  } catch (err) {
    console.error("Error inserting data from CSV:", err);
  }
}

async function printTableContents() {
  try {
    const tableContents =
      await sql`SELECT email1, email2, email3 FROM company_contacts LIMIT 10`;
    console.log("First 20 Table Contents:");
    console.table(tableContents);
  } catch (err) {
    console.error("Error fetching table contents:", err);
  }
}

async function findCompanyByPattern(pattern) {
  try {
    const sqlPattern = `%${pattern}%`;
    const companyDetails = await sql`
      SELECT id, company_name, email1, email2  FROM company_contacts
      WHERE company_name ILIKE ${sqlPattern}
      OR company_domain ILIKE ${sqlPattern}`;
    console.log(`Details for companies matching pattern "${pattern}":`);
    console.table(companyDetails);
  } catch (err) {
    console.error(`Error fetching details for pattern "${pattern}":`, err);
  }
}

async function addCompanyDomainColumn() {
  try {
    await sql`ALTER TABLE company_contacts ADD COLUMN company_domain TEXT`;
    console.log("Added company_domain column to the table.");
  } catch (err) {
    console.error("Error adding company_domain column:", err);
  }
}

async function updateCompanyDomain() {
  try {
    await sql`
      UPDATE company_contacts
      SET company_domain = regexp_replace(
  substring(email1 from '@([^@]+)'),
  '^@|\\.[^.]*$',
  ''
)
      WHERE email1 IS NOT NULL AND email1 != ''
    `;
    console.log("Updated company_domain values based on email1.");
  } catch (err) {
    console.error("Error updating company_domain values:", err);
  }
}
async function findCompaniesWithSameName() {
  try {
    const duplicateNames = await sql`
      SELECT company_name, COUNT(*)
      FROM company_contacts
      GROUP BY company_name
      HAVING COUNT(*) > 1
    `;
    if (duplicateNames.length > 0) {
      console.log("Companies with exactly the same name:");
      console.table(duplicateNames);
    } else {
      console.log("No companies with exactly the same name found.");
    }
  } catch (err) {
    console.error("Error fetching companies with the same name:", err);
  }
}

async function mergeExactDuplicateRows(companyName, companyDomain) {
  try {
    // Fetch the duplicate rows based on company_name and company_domain
    const duplicateRows = await sql`
      SELECT * FROM company_contacts
      WHERE company_name = ${companyName} AND company_domain = ${companyDomain};
    `;

    if (duplicateRows.length > 1) {
      // Merge the duplicate rows by inserting a new row with the combined data
      const mergedRow = {
        company_name: companyName,
        company_domain: companyDomain,
        email1: duplicateRows[0].email1,
        email2: duplicateRows[1]
          ? duplicateRows[1].email2
          : duplicateRows[0].email2,
        email3: duplicateRows[2]
          ? duplicateRows[2].email3
          : duplicateRows[0].email3,
        email4: duplicateRows[3]
          ? duplicateRows[3].email4
          : duplicateRows[0].email4,
        email5: duplicateRows[4]
          ? duplicateRows[4].email5
          : duplicateRows[0].email5,
        email6: duplicateRows[5]
          ? duplicateRows[5].email6
          : duplicateRows[0].email6,
        verify: duplicateRows.some((row) => row.verify), // Assume verification is true if any of the duplicates are verified
      };

      await sql`
        INSERT INTO company_contacts (company_name, email1, email2, email3, email4, email5, email6, verify, company_domain)
        VALUES (
          ${mergedRow.company_name},
          ${mergedRow.email1},
          ${mergedRow.email2},
          ${mergedRow.email3},
          ${mergedRow.email4},
          ${mergedRow.email5},
          ${mergedRow.email6},
          ${mergedRow.verify},
          ${mergedRow.company_domain}
        );
      `;

      // Collect the IDs of the duplicate rows to delete them
      const idsToDelete = duplicateRows.map((row) => row.id);

      // Delete the original duplicate rows
      const result = await sql`
        DELETE FROM company_contacts
        WHERE company_name = ${companyName}
          AND company_domain = ${companyDomain}
          AND id IN (${sql.join(idsToDelete, sql`, `)})
        RETURNING *;
      `;

      if (result.length > 0) {
        console.log("Exact duplicate rows removed:");
        console.table(result);
      } else {
        console.log("No exact duplicate rows found.");
      }
    } else {
      console.log("No duplicates found to merge.");
    }
  } catch (err) {
    console.error("Error merging exact duplicate rows:", err);
  }
}

// Example usage:
(async () => {
  await findCompanyByPattern("Accentu");
  await findCompaniesWithSameName();
})();
