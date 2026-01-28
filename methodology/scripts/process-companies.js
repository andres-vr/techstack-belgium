import fs from "fs";
import readline from "readline";

// Find all companies in activity.csv with codes 62200, 62020, and 62010
async function extractCompaniesFromActivity() {
  const companies = new Set();
  const fileStream = fs.createReadStream("activity.csv");
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;
  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue; // Skip header
    }

    // Handle quoted CSV values
    const columns = line
      .split(",")
      .map((col) => col.replace(/^"|"$/g, "").trim());
    if (columns.length < 4) continue;

    const entityNumber = columns[0];
    const naceCode = columns[3];

    if (
      (naceCode === "62010" || naceCode === "62020" || naceCode === "62200") &&
      entityNumber
    ) {
      companies.add(entityNumber);
    }
  }

  return Array.from(companies);
}

async function main() {
  console.log(
    "Extracting companies from activity.csv with codes 62010/62020/62200...",
  );
  const activityCompanies = await extractCompaniesFromActivity();
  console.log(
    `Found ${activityCompanies.length} companies with the specified activity codes`,
  );

  // Write companies.json
  fs.writeFileSync(
    "companies.json",
    JSON.stringify(activityCompanies, null, 2),
    "utf8",
  );
  console.log("✓ Created companies.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
