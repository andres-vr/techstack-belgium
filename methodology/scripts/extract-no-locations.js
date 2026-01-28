import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function safeReadFileSync(targetPath, { allowedBase = process.cwd() } = {}) {
  const base = path.resolve(allowedBase);
  const target = path.resolve(targetPath);
  const rel = path.relative(base, target);
  if (rel.startsWith("..")) throw new Error(`Invalid file path: ${targetPath}`);
  return fs.readFileSync(target, "utf8");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const incompleteDirPath = path.join(
  __dirname,
  "app",
  "data",
  "companies",
  "incomplete",
);

// Get all JSON files in the incomplete directory
const files = fs
  .readdirSync(incompleteDirPath)
  .filter((file) => file.endsWith(".json"));

console.log(`Found ${files.length} JSON files to process\n`);

const companiesWithoutLocations = [];

files.forEach((file) => {
  const filePath = path.join(incompleteDirPath, file);
  console.log(`Processing ${file}...`);

  try {
    const content = safeReadFileSync(filePath);
    const companies = JSON.parse(content);

    // Filter companies with empty locations array
    const filtered = companies.filter(
      (company) =>
        company.locations &&
        Array.isArray(company.locations) &&
        company.locations.length === 0,
    );

    companiesWithoutLocations.push(...filtered);

    console.log(
      `  ✓ Found ${filtered.length} companies without locations (${companies.length} total)`,
    );
  } catch (error) {
    console.error(`  ✗ Error processing ${file}:`, error.message);
  }
});

// Write to companies2.json
const outputPath = path.join(__dirname, "companies2.json");
fs.writeFileSync(
  outputPath,
  JSON.stringify(companiesWithoutLocations, null, 2),
  "utf8",
);

console.log(
  `\n✓ Done! Found ${companiesWithoutLocations.length} companies without locations`,
);
console.log(`  Saved to companies2.json`);
