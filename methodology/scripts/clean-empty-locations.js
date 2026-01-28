import fs from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "app", "data", "companies", "incomplete");

if (!fs.existsSync(DIR)) {
  console.error("Directory not found:", DIR);
  process.exit(1);
}

let totalRemoved = 0;
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const fp = path.join(DIR, file);
  let content = fs.readFileSync(fp, "utf8");
  let arr = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) arr = parsed;
    else {
      console.warn(`${file}: JSON parsed but is not an array — skipping`);
      continue;
    }
  } catch (err) {
    // attempt lightweight recovery by extracting top-level objects
    const matches = content.match(/\{[\s\S]*?\}(?=\s*,|\s*\]|\s*$)/g) || [];
    for (const m of matches) {
      try {
        const o = JSON.parse(m);
        if (o && typeof o === "object") arr.push(o);
      } catch (e) {
        // skip malformed objects
      }
    }
    if (arr.length === 0) {
      console.warn(
        `${file}: failed to parse and recovered no objects — skipping`,
      );
      continue;
    }
  }

  const original = arr.length;
  const filtered = arr.filter(
    (c) => !(Array.isArray(c.locations) && c.locations.length === 0),
  );
  const removed = original - filtered.length;

  if (removed > 0) {
    fs.writeFileSync(fp, JSON.stringify(filtered, null, 2) + "\n", "utf8");
    console.log(`${file}: removed ${removed}`);
    totalRemoved += removed;
  } else {
    console.log(`${file}: none removed`);
  }
}

console.log(`Total removed: ${totalRemoved}`);

// Also remove company numbers listed in companies2.json from companies.json
try {
  const rootCompanies2 = path.join(process.cwd(), "companies2.json");
  const rootCompanies = path.join(process.cwd(), "companies.json");
  if (fs.existsSync(rootCompanies2) && fs.existsSync(rootCompanies)) {
    const raw = fs.readFileSync(rootCompanies2, "utf8");
    let list2 = [];
    try {
      list2 = JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to parse companies2.json — attempting to recover");
      const matches = raw.match(/\{[\s\S]*?\}(?=\s*,|\s*\]|\s*$)/g) || [];
      for (const m of matches) {
        try {
          list2.push(JSON.parse(m));
        } catch (ee) {}
      }
    }

    const set2 = new Set();
    for (const it of list2) {
      if (!it) continue;
      if (typeof it === "string") set2.add(it.trim());
      else if (typeof it === "object") {
        const v = it.cbe || it.cbe_number || it.number || it.id || "";
        if (v) set2.add(String(v).trim());
      }
    }

    const compRaw = fs.readFileSync(rootCompanies, "utf8");
    let compList = JSON.parse(compRaw);
    if (!Array.isArray(compList)) {
      console.warn("companies.json is not an array — skipping root removal");
    } else {
      const before = compList.length;
      const filteredComp = compList.filter((s) => !set2.has(String(s).trim()));
      const removedComp = before - filteredComp.length;
      if (removedComp > 0) {
        fs.writeFileSync(
          rootCompanies,
          JSON.stringify(filteredComp, null, 2) + "\n",
          "utf8",
        );
        console.log(`companies.json: removed ${removedComp}`);
        totalRemoved += removedComp;
      } else {
        console.log("companies.json: none removed");
      }
    }
  } else {
    console.log(
      "companies2.json or companies.json not found — skipping root removal",
    );
  }
} catch (err) {
  console.error(
    "Error while pruning companies.json:",
    err && err.message ? err.message : err,
  );
}

console.log(`Total removed: ${totalRemoved}`);
process.exit(0);
