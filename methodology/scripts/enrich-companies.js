import "dotenv/config";
import fs from "fs";
import path from "path";

function safeReadFileSync(targetPath, { allowedBase = process.cwd() } = {}) {
  const base = path.resolve(allowedBase);
  const target = path.resolve(targetPath);
  const rel = path.relative(base, target);
  if (rel.startsWith("..")) throw new Error(`Invalid file path: ${targetPath}`);
  return fs.readFileSync(target, "utf8");
}

const KEY = process.env.CBE_KEY;
console.log("Using API key:", KEY ? KEY.slice(0, 4) + "..." : "none");
if (!KEY) {
  console.warn("KEY environment variable not set; fetches will be skipped.");
}

const MUNICIPALITIES_DIR = path.join(
  process.cwd(),
  "app",
  "data",
  "municipalities",
);
const COMPANIES_DIR = path.join(
  process.cwd(),
  "app",
  "data",
  "companies",
  "incomplete",
);

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function loadCompanyNumbers() {
  if (fs.existsSync("companies.json")) {
    const json = safeReadFileSync("companies.json");
    const list = JSON.parse(json);
    return Array.isArray(list) ? list : [];
  }
}

function buildMunicipalityMaps() {
  const municipalityMap = new Map(); // normalized name -> province
  const municipalityIdMap = new Map(); // normalized name -> id

  if (!fs.existsSync(MUNICIPALITIES_DIR))
    return { municipalityMap, municipalityIdMap };

  const files = fs
    .readdirSync(MUNICIPALITIES_DIR)
    .filter((file) => file.endsWith(".ts"));

  const municipalityPattern =
    /\{\s*id:\s*"([^"]+)"[^}]*?province:\s*"([^"]+)"[^}]*?names:\s*\{([^}]+)\}/g;

  for (const file of files) {
    const content = safeReadFileSync(path.join(MUNICIPALITIES_DIR, file));
    let match;

    while ((match = municipalityPattern.exec(content)) !== null) {
      const [, id, province, namesBlock] = match;
      const names = [
        id,
        (namesBlock.match(/nl:\s*"([^"]+)"/) || [])[1],
        (namesBlock.match(/fr:\s*"([^"]+)"/) || [])[1],
        (namesBlock.match(/en:\s*"([^"]+)"/) || [])[1],
        (namesBlock.match(/de:\s*"([^"]+)"/) || [])[1],
      ].filter(Boolean);

      for (const name of names) {
        const key = normalize(name);
        municipalityMap.set(key, province);
        municipalityIdMap.set(key, id);
      }
    }
  }

  return { municipalityMap, municipalityIdMap };
}

function resolveLocation(city, maps, fullAddress) {
  if (!city) return null;
  // Remove province abbreviations like (Brab.), (Limb.), etc.
  const cleanCity = String(city)
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim();
  const key = normalize(cleanCity);
  const province = maps.municipalityMap.get(key) || null;
  const municipality = maps.municipalityIdMap.get(key) || null;
  if (!province || !municipality) return null;
  const cleanFullAddress =
    typeof fullAddress === "string"
      ? fullAddress.replace(/\s*\([^)]*\)\s*$/g, "").trim()
      : fullAddress || "";
  return {
    province,
    municipality,
    address: cleanFullAddress,
  };
}

function formatCbe(number, formatted) {
  if (formatted) return formatted;
  const digits = (number || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  return number || "";
}

function toTitleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractName(item) {
  const candidates = [
    item.commercial_name,
    item.denomination,
    item.abbreviation,
    item.denomination_with_legal_form,
    item.branch_name,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  const name = candidates[0] || "";
  return toTitleCase(name);
}

function extractWebsite(item) {
  const site = item.contact_infos?.web;
  if (!site || typeof site !== "string") return "";
  return site.trim();
}

function extractFoundedYear(item) {
  if (!item.start_date) return null;
  const match = String(item.start_date).match(/^(\d{4})/);
  if (match) return Number(match[1]);
  return null;
}

function extractAllLocations(item, maps) {
  const locations = [];
  if (!Array.isArray(item.establishments)) return locations;

  for (const est of item.establishments) {
    if (!est.city) continue;
    const location = resolveLocation(est.city, maps, est.full_address || "");
    if (location) {
      locations.push(location);
      console.log(
        `Resolved location for city="${est.city}" -> province=${location.province}, municipality=${location.municipality}, address="${location.address}"`,
      );
    }
  }

  // If no establishments resolved, try main address
  if (locations.length === 0 && item.address?.city) {
    const location = resolveLocation(
      item.address.city,
      maps,
      item.address?.full_address || "",
    );
    if (location) {
      locations.push(location);
      console.log(
        `Resolved location for main address city="${item.address.city}" -> province=${location.province}, municipality=${location.municipality}, address="${location.address}"`,
      );
    }
  }

  return locations;
}

function toCleanNumber(number) {
  if (number == null) return "";
  if (typeof number === "number") return String(number).replace(/\D/g, "");
  if (typeof number === "string") return number.replace(/\D/g, "");
  if (typeof number === "object") {
    const candidates = [
      number.cbe,
      number.cbe_number,
      number.entityNumber,
      number.entity_number,
      number.number,
      number.id,
    ];
    for (const c of candidates) {
      if (c == null) continue;
      if (typeof c === "number" || typeof c === "string")
        return String(c).replace(/\D/g, "");
    }
  }
  return "";
}

function stripParentheticalSuffix(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchCompany(number) {
  const maxAttempts = 6;
  let attempt = 0;
  let backoff = 500; // ms
  const cleanNumber = toCleanNumber(number);

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await fetch(
        `https://cbeapi.be/api/v1/company/${cleanNumber}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${KEY}`,
            Accept: "application/json",
          },
        },
      );

      if (response.status === 429) {
        const ra = response.headers.get("retry-after");
        const wait = ra ? parseInt(ra, 10) * 1000 : backoff;
        console.warn(
          `HTTP 429 for ${cleanNumber} (attempt ${attempt}). Waiting ${wait}ms before retry.`,
        );
        await sleep(wait + Math.round(Math.random() * 300));
        backoff *= 2;
        continue;
      }

      if (!response.ok) {
        if (response.status >= 500 && attempt < maxAttempts) {
          console.warn(
            `HTTP ${response.status} for ${cleanNumber} (attempt ${attempt}). Retrying after ${backoff}ms.`,
          );
          await sleep(backoff + Math.round(Math.random() * 200));
          backoff *= 2;
          continue;
        }
        console.error(`HTTP error ${response.status} for ${cleanNumber}`);
        return null;
      }

      const json = await response.json();
      const item = Array.isArray(json.data) ? json.data[0] : json.data;
      if (!item) return null;
      return item;
    } catch (err) {
      if (attempt < maxAttempts) {
        console.warn(
          `Fetch error for ${cleanNumber} (attempt ${attempt}): ${err.message || err}. Retrying after ${backoff}ms.`,
        );
        await sleep(backoff + Math.round(Math.random() * 200));
        backoff *= 2;
        continue;
      }
      console.error(`Fetch failed for ${cleanNumber}:`, err.message || err);
      return null;
    }
  }
  return null;
}

function appendCompanyToArrayFile(filePath, companyObj) {
  // Load existing array or recover from corruption
  let arr = [];
  if (fs.existsSync(filePath)) {
    const content = safeReadFileSync(filePath);
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        arr = parsed;
      }
    } catch (err) {
      console.warn(
        `Warning: ${filePath} is not valid JSON: ${err.message}. Attempting recovery.`,
      );
      const objectMatches =
        content.match(/\{[\s\S]*?\}(?=\s*,|\s*\]|\s*$)/g) || [];
      for (const m of objectMatches) {
        try {
          const o = JSON.parse(m);
          if (o && typeof o === "object") arr.push(o);
        } catch (e) {
          // skip malformed objects
        }
      }
    }
  }

  // Check if company already exists
  const existingIndex = arr.findIndex((c) => c && c.cbe === companyObj.cbe);
  if (existingIndex >= 0) {
    // Skip if already exists
    return;
  }

  // Append the new company
  arr.push(companyObj);

  // Write to temp file then rename (atomic)
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(arr, null, 2) + "\n", "utf8");
  fs.renameSync(tmpPath, filePath);

  // Verify the write succeeded
  const verifyContent = fs.readFileSync(filePath, "utf8");
  const verifyArr = JSON.parse(verifyContent);
  const found = verifyArr.some((c) => c && c.cbe === companyObj.cbe);

  if (!found) {
    throw new Error(
      `Verification failed: ${companyObj.cbe} not present after write`,
    );
  }
}

function buildCompanyObject(item, maps) {
  const cbe = formatCbe(item.cbe_number, item.cbe_number_formatted);
  const name = extractName(item);
  const site = extractWebsite(item);
  const locations = extractAllLocations(item, maps);
  // Ensure addresses have parenthetical province parts removed (e.g. "(Brab.)")
  for (const loc of locations) {
    if (loc && loc.address) loc.address = stripParentheticalSuffix(loc.address);
  }
  const founded = extractFoundedYear(item);

  return {
    cbe,
    name,
    site: site || "",
    locations,
    tech: [],
    employees: null,
    founded: founded || null,
    proof: [],
  };
}

async function main() {
  const numbers = loadCompanyNumbers();
  const toFetch = numbers.slice();
  const concurrency = 1;
  let idx = 0;

  const maps = buildMunicipalityMaps();

  if (!fs.existsSync(COMPANIES_DIR)) {
    fs.mkdirSync(COMPANIES_DIR, { recursive: true });
  }

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= toFetch.length) break;
      const num = toFetch[i];

      const apiData = await fetchCompany(num);
      await sleep(500 + Math.round(Math.random() * 200));

      if (!apiData) {
        continue;
      }

      const company = buildCompanyObject(apiData, maps);
      if (!company.name) {
        continue;
      }

      // Log CBE, province and full address
      if (company.locations && company.locations.length > 0) {
        company.locations.forEach((loc) => {
          console.log(
            `${company.cbe} - ${loc.province || "N/A"} - ${loc.fullAddress || loc.address || "N/A"}`,
          );
        });
      }

      const firstChar = (company.name || "").charAt(0).toLowerCase();
      const letter = /^[a-z]$/.test(firstChar) ? firstChar : "other";
      const outFileName = `companies-${letter}.json`;
      const outPath = path.join(COMPANIES_DIR, outFileName);

      try {
        appendCompanyToArrayFile(outPath, company);
      } catch (err) {
        console.error(`Failed to append:`, err.message || err);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, toFetch.length) },
    () => worker(),
  );

  await Promise.all(workers);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
