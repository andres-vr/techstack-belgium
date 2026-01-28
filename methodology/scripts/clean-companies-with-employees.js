import fs from "fs";
import path from "path";

const FILE = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "companies-with-employees.json",
);

function load() {
  const raw = fs.readFileSync(FILE, "utf8");
  return JSON.parse(raw);
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export default function run({ dry = false } = {}) {
  if (!fs.existsSync(FILE)) {
    console.error("File not found:", FILE);
    process.exit(1);
  }

  const list = load();
  const before = list.length;

  const cleaned = list.filter((item) => {
    if (item == null) return false;
    const f = item.fte;
    return typeof f === "number" && Number.isFinite(f) && f >= 2;
  });

  if (!dry) save(cleaned);

  console.log("Cleaned companies-with-employees.json");
  console.log(
    "Before:",
    before,
    "After:",
    cleaned.length,
    "Removed:",
    before - cleaned.length,
  );
  if (dry) console.log("(dry-run) no file changes were written");
}

if (path.basename(process.argv[1] || "") === path.basename(FILE)) {
  const dry = process.argv.includes("--dry-run");
  run({ dry });
}
