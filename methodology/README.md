# Methodology - Data Processing Pipeline

This folder contains all scripts and data files used to build and maintain the TechStack.be company database.

## Overview

TechStack.be uses a rigorous, multi-step filtering process to identify qualified Belgian tech companies, powered by official Belgian business data.

## Five-Step Filtering Process

### 1. **Start with All Belgian Companies**

- Source: All registered companies in the Belgian Central Business Registry (CBE) as of November 30, 2026

### 2. **Filter by Industry Classification (NACE Codes)**

- Filter: Only companies with NACE codes 62010, 62020, or 62200 (IT/Software services)
- NACE 62010: Computer programming activities
- NACE 62020: IT consultancy activities
- NACE 62200: Other information technology and computer service activities

### 3. **Filter by Belgian Location**

- Verify: Only companies with at least one physical office in Belgium
- Purpose: Ensure actual presence in the country

### 4. **Filter by Active Status (2024 Annual Filings)**

- Check: National Bank of Belgium for 2024 annual account filings
- Purpose: Confirm companies still exist and are operational

### 5. **Filter by Company Size (FTE ≥ 2)**

- Extract: Full-Time Employee counts from structured JSON-XBRL filings
- Filter: Remove companies with fewer than 2 FTE
- Rationale: **Companies with fewer than 2 FTE are typically owner-managed entities with no separate operational team. For comparability, we exclude these by default.**

Note: In our run we applied an additional practical cleanup step: we removed entries where FTE was unavailable or less than 2 from `methodology/companies-with-employees.json`, then merged the remaining FTE counts into the `app/data/companies/incomplete/companies-*.json` files by setting each company's `employees` field to the rounded FTE and removing companies without matching FTE data. We also removed stale `.bak` files created during earlier processing.

### Data Sources

- **[CBEAPI](https://cbeapi.be/)** - REST API for Belgian company data
- **[NBB Developer Portal](https://developer.cbso.nbb.be/)** - National Bank of Belgium API for financial/employee data

---

## Files & Scripts

### Input Data

- **`activity.csv`** - Activity codes dataset for initial filtering
- **`companies.json`** - List of CBE company numbers to process

### Processing Scripts (Run in Order)

1. **`process-companies.js`**
   - Extracts all Belgian companies from the activity codes CSV
   - Identifies companies with NACE codes: 62010, 62020, 62200
   - Outputs: `companies.json`
   - Run: `node process-companies.js`

2. **`enrich-companies.js`**
   - Enriches company data from [CBEAPI](https://cbeapi.be/)
   - Extracts: name, website, locations, founded year
   - Outputs: JSON files by company name first letter in `app/data/companies/incomplete/`
   - Requires: `CBE_KEY` environment variable (CBEAPI key)
   - Run: `CBE_KEY=xxx node enrich-companies.js`

3. **`get-fte.js`**
   - Verifies companies are active by checking for 2024 annual account filings at [NBB Developer API](https://developer.cbso.nbb.be/)
   - Extracts Full-Time Employee (FTE) counts from structured JSON-XBRL filings
   - Companies with PDF-only filings (no JSON-XBRL data) are marked as null
   - Used to filter out companies with unavailable data and those with < 2 FTE
   - Features: Rate limiting (500ms delay), progress saving every 100 companies, automatic retry on rate limits
   - Requires: NBB API credentials (NBB_KEY environment variable)
   - Run: `node get-fte.js` (add `--verbose` for detailed API responses)
   - Output: `companies-with-employees.json` with employee counts or null for unavailable data

   Additional steps used during the recent cleanup
   - Run `node methodology/clean-companies-with-employees.cjs` to remove entries with `fte` null or `< 2` from `methodology/companies-with-employees.json`.
   - Run `node methodology/apply-fte-to-incomplete.cjs` to iterate `app/data/companies/incomplete/companies-*.json`, set `employees` to the rounded FTE where available, and remove companies without matching FTE.
   - If unmatched FTE entries exist (FTE entries that don't map to any company file), run `node methodology/find-and-remove-unmatched-fte.cjs` to log and remove those entries from `companies-with-employees.json`.
   - Remove `.bak` files created during prior runs; the current scripts no longer create backups.

4. **`merge-employees.js`**
   - Merges FTE data with company records
   - Validates minimum employee threshold
   - Run: `node merge-employees.js`

### Utility Scripts

- **`extract-no-locations.cjs`** - Identifies companies with missing location data
- **`clean-empty-locations.cjs`** - Cleans up malformed location entries

---

## Environment Variables

```bash
# CBE API Key (required for enrich-companies.js)
CBE_KEY=your_cbe_api_key

# Optional
DEBUG=techstack:*   # Enable debug logging
```

---

## Output

Final verified company data is stored in:

```
app/data/companies/complete/
├── companies-a.json
├── companies-b.json
├── ...
└── companies-other.json
```

Each file contains a JSON array of verified companies.

---

## Data Quality Checklist

- ✅ Only companies registered in CBE
- ✅ Only NACE codes: 62010, 62020, 62200
- ✅ Only companies with Belgian office
- ✅ Only companies with ≥ 2 FTE
- ✅ No duplicate entries (checked by CBE number)
- ✅ Verified location data
- ✅ Company name standardized (title case)

---

## Updating the Database

To update with new/modified companies:

1. Export fresh activity codes from CBE → `activity.csv`
2. Run `process-companies.js` to generate new `companies.json`
3. Run `enrich-companies.js` to fetch latest company data
4. Run `get-fte.js` to verify employee counts
5. Run `merge-employees.js` to finalize data
6. (Cleanup) Run `methodology/clean-companies-with-employees.cjs` then `methodology/apply-fte-to-incomplete.cjs` to apply FTEs and remove unmatched records.

---

## GitHub Actions Integration

When submissions or updates are processed via the web form, GitHub Actions automatically:

1. Calls `prepareSubmission()` to validate and enrich data
2. Takes screenshots for proof verification
3. Uploads images to ImgBB
4. Appends/updates records in `app/data/companies/complete/`
5. Commits changes back to the repository

See `.github/scripts/process-submission.ts` and `process-update.ts`

---

## Questions?

For methodology details, see [../SEO_SSR_SYSTEM.md](../SEO_SSR_SYSTEM.md) and [../SUBMISSION_FLOW.md](../SUBMISSION_FLOW.md)
