import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const FTE_FILE = path.resolve(__dirname, "companies-with-employees.json");
const INCOMPLETE_DIR = path.resolve(
  __dirname,
  "..",
  "app",
  "data",
  "companies",
  "incomplete",
);

function normalizeId(s) {
  if (!s) return "";
  return String(s).replace(/[^0-9]/g, "");
}

function loadFteMap() {
  if (!fs.existsSync(FTE_FILE)) {
    console.error("FTE file not found:", FTE_FILE);
    process.exit(1);
  }
  const arr = JSON.parse(safeReadFileSync(FTE_FILE));
  const map = new Map();
  for (const e of arr) {
    if (!e || !e.enterpriseNumber) continue;
    const raw = String(e.enterpriseNumber);
    map.set(raw, e.fte);
    map.set(normalizeId(raw), e.fte);
  }
  return map;
}

function processFile(filePath, fteMap, { dry = false } = {}) {
  const raw = safeReadFileSync(filePath);
  const arr = JSON.parse(raw);
  let kept = 0;
  let removed = 0;

  const out = arr.filter((item) => {
    const key1 =
      item.cbe || item.enterpriseNumber || item.kvk || item.vat || "";
    const candidates = [String(key1), normalizeId(key1)];
    let fte = undefined;
    for (const c of candidates) {
      if (fteMap.has(c)) {
        fte = fteMap.get(c);
        break;
      }
    }
    if (typeof fte === "number" && Number.isFinite(fte) && fte >= 2) {
      item.employees = Math.round(fte);
      kept++;
      return true;
    }
    removed++;
    return false;
  });

  if (!dry)
    fs.writeFileSync(filePath, JSON.stringify(out, null, 2) + "\n", "utf8");

  return { kept, removed };
}

function safeReadFileSync(targetPath, { allowedBase = process.cwd() } = {}) {
  const base = path.resolve(allowedBase);
  const target = path.resolve(targetPath);
  const rel = path.relative(base, target);
  if (rel.startsWith("..")) throw new Error(`Invalid file path: ${targetPath}`);
  return fs.readFileSync(target, "utf8");
}

export default function run({ dry = false } = {}) {
  if (!fs.existsSync(INCOMPLETE_DIR)) {
    console.error("Incomplete companies dir not found:", INCOMPLETE_DIR);
    process.exit(1);
  }

  const fteMap = loadFteMap();
  const files = fs
    .readdirSync(INCOMPLETE_DIR)
    .filter((f) => /^companies-.*\.json$/i.test(f));
  if (files.length === 0) {
    console.log("No companies-*.json files found under", INCOMPLETE_DIR);
    return;
  }

  let totalKept = 0;
  let totalRemoved = 0;

  for (const f of files) {
    const fp = path.join(INCOMPLETE_DIR, f);
    try {
      const { kept, removed } = processFile(fp, fteMap, { dry });
      totalKept += kept;
      totalRemoved += removed;
      console.log(`${f}: kept=${kept}, removed=${removed}`);
    } catch (err) {
      console.error("Error processing", f, err.message);
    }
  }

  console.log("Done. Total kept:", totalKept, "Total removed:", totalRemoved);
  if (dry) console.log("(dry-run) no file changes were written");
}

if (
  path.basename(process.argv[1] || "") ===
  path.basename(FTE_FILE).replace(".json", ".js")
) {
  const dry = process.argv.includes("--dry-run");
  run({ dry });
}
