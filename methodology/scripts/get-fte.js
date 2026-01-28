import { randomUUID } from "crypto";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from parent directory (project root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const NBB_KEY = process.env.NBB_KEY;

function getHeaders(accept = "application/json") {
  const headers = {
    Accept: accept,
    "X-Request-Id": randomUUID(),
  };
  if (NBB_KEY) {
    headers["NBB-CBSO-Subscription-Key"] = NBB_KEY;
  }
  return headers;
}

async function getFTE(enterpriseNumber, verbose = false, year = 2024) {
  try {
    // Remove dots from enterprise number (API expects format without dots)
    const cleanNumber = enterpriseNumber.replace(/\./g, "");
    if (verbose)
      console.log(
        `  [1/3] Fetching filings for ${cleanNumber} (year: ${year})...`,
      );

    // 1. Get filings for specified year
    const filingUrl = `https://ws.cbso.nbb.be/authentic/legalEntity/${cleanNumber}/references?year=${year}`;
    if (verbose) console.log(`  URL: ${filingUrl}`);

    const response = await fetch(filingUrl, {
      headers: getHeaders("application/json"),
    });

    if (verbose) console.log(`  Status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        // No filings found for this company - this is normal
        if (verbose) console.log(`  → No filings found (404)`);
        return { fte: null, wages: null };
      }
      // For other errors, try to get the error body
      const errorText = await response.text().catch(() => "");
      if (verbose)
        console.log(
          `  → Error response: ${errorText ? errorText.substring(0, 200) : "(empty)"}`,
        );
      throw new Error(
        `Failed to fetch filings: ${response.status}${errorText ? ` - ${errorText}` : ""}`,
      );
    }

    const filings = await response.json();
    if (verbose) {
      console.log(`  → Found ${filings?.length || 0} filing(s)`);
      if (filings?.length > 0) {
        console.log(
          `  → Sample filing keys: ${Object.keys(filings[0]).slice(0, 5).join(", ")}`,
        );
        console.log(
          `  → First filing: ${JSON.stringify(filings[0]).substring(0, 200)}...`,
        );
      }
    }

    if (!filings || !filings.length) {
      if (verbose) console.log(`  → No filing records found`);
      return { fte: null, wages: null };
    }

    // 2. Pick latest - API returns ExerciseDates with lowercase fields (despite schema docs)
    const latest = filings.sort((a, b) => {
      // Try both capitalizations as API docs appear inconsistent
      const aDate = a.ExerciseDates?.endDate || a.ExerciseDates?.EndDate || "";
      const bDate = b.ExerciseDates?.endDate || b.ExerciseDates?.EndDate || "";
      return new Date(bDate) - new Date(aDate);
    })[0];

    if (verbose) {
      const dateStr =
        latest.ExerciseDates?.endDate ||
        latest.ExerciseDates?.EndDate ||
        "unknown";
      console.log(
        `  [2/3] Latest filing: ${latest.ReferenceNumber} (${dateStr})`,
      );
    }

    // 3. First, try to verify the reference exists via the /reference endpoint
    const refCheckUrl = `https://ws.cbso.nbb.be/authentic/deposit/${latest.ReferenceNumber}/reference`;
    if (verbose) console.log(`  [2.5/3] Verifying reference: ${refCheckUrl}`);

    const refCheckResponse = await fetch(refCheckUrl, {
      headers: getHeaders("application/json"),
    });

    if (verbose) console.log(`  Status: ${refCheckResponse.status}`);

    if (!refCheckResponse.ok) {
      const errorText = await refCheckResponse
        .text()
        .catch(() => "(unable to read response)");
      if (verbose)
        console.log(
          `  → Reference check failed: ${errorText.substring(0, 150)}`,
        );
      if (refCheckResponse.status === 404) {
        if (verbose)
          console.log(
            `  ⊘ This reference number is not accessible (old filing)`,
          );
        return { fte: null, wages: null };
      }
      throw new Error(`Failed to verify reference: ${refCheckResponse.status}`);
    }

    // 3. Get detailed data (JSON-XBRL format)
    const accountingUrl = `https://ws.cbso.nbb.be/authentic/deposit/${latest.ReferenceNumber}/accountingData`;
    if (verbose)
      console.log(`  [3/3] Fetching accounting data: ${accountingUrl}`);

    const accountingResponse = await fetch(accountingUrl, {
      headers: getHeaders("application/x.jsonxbrl"),
    });

    if (verbose) console.log(`  Status: ${accountingResponse.status}`);

    if (!accountingResponse.ok) {
      const errorText = await accountingResponse
        .text()
        .catch(() => "(unable to read response)");

      // Check if this is a PDF-only filing (no JSON-XBRL available)
      if (
        accountingResponse.status === 404 &&
        (errorText.includes("pdf model has no published json xbrl") ||
          errorText.includes("reference.number.not.found.json"))
      ) {
        if (verbose) {
          console.log(
            `  ⊘ PDF-only filing (no structured XBRL data available)`,
          );
        }
        return { fte: null, wages: null }; // This is normal - not all filings have XBRL format
      }

      if (verbose)
        console.log(`  → Error response: ${errorText.substring(0, 200)}`);
      throw new Error(
        `Failed to fetch accountingData: ${accountingResponse.status} - ${errorText}`,
      );
    }

    const data = await accountingResponse.json();
    if (verbose) {
      console.log(`  [3/3] Extracting FTE from accounting data...`);
      if (verbose) {
        // Log sample of Rubrics to understand structure
        if (
          data?.Rubrics &&
          Array.isArray(data.Rubrics) &&
          data.Rubrics.length > 0
        ) {
          console.log(`  → Rubrics count: ${data.Rubrics.length}`);
          const sample = data.Rubrics[0];
          console.log(
            `  → Sample Rubric keys: ${Object.keys(sample).join(", ")}`,
          );
          console.log(`  → Sample Rubric: ${JSON.stringify(sample)}`);
          // Find first non-empty rubric
          const nonEmpty = data.Rubrics.find((r) => r.Code || r.code);
          if (nonEmpty) {
            console.log(`  → Non-empty rubric: ${JSON.stringify(nonEmpty)}`);
          }
        }
      }
    }

    // 4. Extract FTE from JSON-XBRL structure
    // In JSON-XBRL format from NBB, look for employee data in Rubrics
    let fte = null;
    let wages = null;

    if (data?.Rubrics && Array.isArray(data.Rubrics)) {
      // Look for employee-related rubrics
      // Check all rubric codes for employee count indicators
      for (const rubric of data.Rubrics) {
        const code = rubric.Code || rubric.code || "";
        const value = rubric.Value;

        // Employee count is typically in specific codes
        // CBE/NBB uses codes like 9087 or similar for employee count
        if (
          ["9087", "9088", "9089"].includes(code) &&
          value != null &&
          Number(value) > 0
        ) {
          fte = Number(value);
          if (verbose) console.log(`  → Found FTE in rubric ${code}: ${fte}`);
          break;
        }
      }

      // If FTE not found, extract wage data as fallback
      if (fte === null) {
        let totalWages = 0;
        let wageRubricsFound = 0;

        for (const rubric of data.Rubrics) {
          const code = rubric.Code || rubric.code || "";
          const value = rubric.Value;

          // Sum all personnel cost rubrics (codes starting with 62)
          // 620 = Wages and salaries
          // 621 = Social security costs
          // 622 = Pension costs
          if (
            (code === "620" ||
              code === "621" ||
              code === "622" ||
              code.startsWith("62")) &&
            value != null &&
            !isNaN(value)
          ) {
            const numValue = Number(value);
            if (numValue > 0) {
              totalWages += numValue;
              wageRubricsFound++;
              if (verbose)
                console.log(`  → Found wage rubric ${code}: ${numValue}`);
            }
          }
        }

        // Only keep wage totals relevant for FTE estimation per new spec
        if (totalWages >= 110000) {
          wages = totalWages;
          if (verbose)
            console.log(
              `  → Total wages from ${wageRubricsFound} rubric(s): ${wages}`,
            );
        } else if (totalWages > 0 && verbose) {
          console.log(
            `  → Total wages (${totalWages}) below €110k threshold, ignoring`,
          );
        }
      }

      // If not found, log sample codes for debugging
      if (fte == null && wages == null && verbose) {
        const codes = data.Rubrics.slice(0, 10).map(
          (r) => r.Code || r.code || "(empty)",
        );
        console.log(`  → First 10 rubric codes: ${codes.join(", ")}`);
      }
    }

    // Apply FTE estimation logic:
    // 1. Use reported FTE if available
    // 2. If not, and wages >= 110k, estimate: floor(wages / 55000)
    // 3. Otherwise, FTE remains null
    let fte_final = fte;
    let fte_estimated = false;

    if (fte_final === null && wages != null && wages >= 110000) {
      fte_final = Math.floor(wages / 55000);
      fte_estimated = true;
      if (verbose) {
        console.log(
          `  → Estimated FTE from wages: ${fte_final} (€${wages} / €55k)`,
        );
      }
    }

    if (verbose) {
      if (fte != null) {
        console.log(`  ✓ FTE: ${fte} (reported)`);
      } else if (fte_final != null && fte_estimated) {
        console.log(`  ✓ FTE: ${fte_final} (estimated from €${wages})`);
      } else if (wages != null) {
        console.log(
          `  ✓ Wages: €${wages} (< €110k threshold, no FTE estimate)`,
        );
      } else {
        console.log(`  ✗ No FTE or wage data found in response`);
      }
    }

    return { fte: fte_final != null ? Number(fte_final) : null, wages };
  } catch (err) {
    console.error(
      `getFTE(${enterpriseNumber}) error:`,
      err && err.message ? err.message : err,
    );
    return { fte: null, wages: null };
  }
}

async function processAll({
  inputPath = "./companies2.json",
  outputPath = "./companies-with-employees2.json",
  verbose = false,
  year = 2024,
  delayMs = 500, // Delay between companies (conservative for API rate limits)
} = {}) {
  const inputUrl = new URL(inputPath, import.meta.url);
  const outputUrl = new URL(outputPath, import.meta.url);

  const raw = await fs.readFile(inputUrl, "utf8");
  const companies = JSON.parse(raw);

  // Check if file exists and has data
  let existingCount = 0;
  let needsComma = false;
  try {
    const existingRaw = await fs.readFile(outputUrl, "utf8");
    const existingData = JSON.parse(existingRaw);
    existingCount = existingData.length;

    // File exists with valid JSON array - we'll need to remove closing bracket and add comma
    // Find and remove the closing bracket
    const lastBracketIndex = existingRaw.lastIndexOf("]");
    if (lastBracketIndex !== -1) {
      const withoutClosing = existingRaw.substring(0, lastBracketIndex);
      await fs.writeFile(outputUrl, withoutClosing, "utf8");
      needsComma = existingCount > 0; // Add comma if there are existing entries
    }
  } catch (err) {
    if (verbose) console.log("No existing file found, starting fresh");
    // Start fresh with opening bracket
    await fs.writeFile(outputUrl, "[", "utf8");
    needsComma = false;
  }

  console.log(
    `\n📊 Starting FTE fetch for ${companies.length} companies (year: ${year})...`,
  );
  if (existingCount > 0) {
    console.log(
      `   (${existingCount} companies already in file, will append new results)`,
    );
  }

  console.log(
    `NBB_KEY: ${NBB_KEY ? "✓ Set" : "✗ Not set (may limit API access)"}\n`,
  );
  console.log(`⏱️  Rate limit: ${delayMs}ms delay between companies`);
  console.log(`💾 Saving each company immediately after processing\n`);

  let successCount = 0;
  let errorCount = 0;
  let rateLimitHits = 0;

  for (let i = 0; i < companies.length; i++) {
    const en = companies[i];
    const progress = `[${i + 1}/${companies.length}]`;
    process.stdout.write(`${progress} ${en} ... `);

    let result;
    try {
      const data = await getFTE(en, verbose, year);
      result = {
        enterpriseNumber: en,
        fte: data.fte != null ? Number(data.fte) : null,
      };

      if (data.fte === null) {
        console.log("⊘ no FTE");
      } else {
        console.log(`✓ ${data.fte} FTE`);
        successCount++;
      }
    } catch (err) {
      // Check if it's a rate limit error (429 or 503)
      if (err?.message?.includes("429") || err?.message?.includes("503")) {
        console.log(`⏸️  rate limit - retrying in 30s...`);
        rateLimitHits++;
        await new Promise((r) => setTimeout(r, 30000)); // Wait 30 seconds

        // Retry once
        try {
          const data = await getFTE(en, verbose, year);
          result = {
            enterpriseNumber: en,
            fte: data.fte != null ? Number(data.fte) : null,
          };
          if (data.fte === null) {
            console.log("⊘ no FTE (retry)");
          } else {
            console.log(`✓ ${data.fte} FTE (retry)`);
            successCount++;
          }
        } catch (retryErr) {
          console.log(`✗ error (retry failed)`);
          errorCount++;
          result = {
            enterpriseNumber: en,
            fte: null,
            wages: null,
            error: retryErr?.message,
          };
        }
      } else {
        console.log(`✗ error`);
        errorCount++;
        result = {
          enterpriseNumber: en,
          fte: null,
          wages: null,
          error: err?.message,
        };
      }
    }

    // Append to file immediately as part of JSON array
    const prefix = needsComma ? ",\n" : "\n";
    const entry = JSON.stringify(result, null, 2)
      .split("\n")
      .map((line) => "  " + line)
      .join("\n");
    await fs.appendFile(outputUrl, prefix + entry, "utf8");
    needsComma = true; // All subsequent entries need a comma

    // Rate limit delay
    await new Promise((r) => setTimeout(r, delayMs));
  }

  // Close the JSON array
  await fs.appendFile(outputUrl, "\n]", "utf8");

  console.log(`\n✅ Complete!`);
  console.log(`   Companies processed: ${companies.length}`);
  console.log(`   With data: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  if (rateLimitHits > 0) {
    console.log(`   Rate limit hits: ${rateLimitHits}`);
  }
  console.log(`   Total in file: ${existingCount + companies.length}`);
  console.log(`   Wrote to: ${outputPath}`);
}

if (process.argv.includes("--run") || process.argv[1]?.includes("get-fte.js")) {
  const verbose = process.argv.includes("--verbose");

  processAll({ verbose }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { getFTE, processAll };
