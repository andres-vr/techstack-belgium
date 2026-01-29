import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";


async function runUpdateCompanies() {
  try {
    console.log('runUpdateCompanies: starting');
    const rootDir = process.cwd();
    const companiesArray: any[] = [];

    const incompletePath = join(rootDir, "app", "data", "companies", "incomplete");
    const completePath = join(rootDir, "app", "data", "companies", "complete");

    // Use a Map to deduplicate by CBE
    const companiesMap = new Map<string, any>();

    for (const dirPath of [completePath, incompletePath]) {
      try {
        const files = await readdir(dirPath);
        console.log(`Processing ${files.length} files in ${dirPath}`);
        for (const file of files) {
          if (file.endsWith(".json")) {
            const filePath = join(dirPath, file);
            const content = await readFile(filePath, "utf-8");
            try {
              const data = JSON.parse(content);
              const list = Array.isArray(data) ? data : [data];
              for (const company of list) {
                const id = company.cbe || company.id || company.name;
                if (id) {
                  // Incomplete data (processed later in loop) will override complete if same ID
                  companiesMap.set(id, company);
                } else {
                  companiesArray.push(company);
                }
              }
            } catch (e) {
              console.warn(`Failed to parse JSON file ${filePath}:`, e);
            }
          }
        }
      } catch (err) {
        console.log(`Directory not found or empty: ${dirPath}`);
      }
    }

    // Combine map values and any that didn't have IDs
    const allCompanies = [...Array.from(companiesMap.values()), ...companiesArray];

    console.log(`Total unique companies found: ${allCompanies.length}`);

    // Write ONLY the array to public/companies.json as requested
    // "adding the array into the companies.json public file"
    const publicPath = join(rootDir, "public", "companies.json");
    await writeFile(publicPath, JSON.stringify(allCompanies, null, 2), "utf-8");

    console.log(`✅ Successfully updated ${publicPath} with ${allCompanies.length} companies`);

    // --- Sitemap generation -------------------------------------------------
    try {
      const { pathToFileURL } = await import('url');

      const siteUrl = 'https://techstack.be';
      const urls: { loc: string, lastmod: string }[] = [];
      const add = (loc: string, lastmod: string) => {
        const fullUrl = `${siteUrl}${loc.startsWith('/') ? loc : '/' + loc}`;
        urls.push({ loc: fullUrl, lastmod });
      };

      const slugify = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const launchDate = '2026-01-28';
      const getMaxLastmod = (companies: any[]) => {
        if (companies.length === 0) return launchDate;
        const dates = companies
          .map(c => c.lastUpdated)
          .filter(Boolean)
          .map(d => {
            const t = new Date(d).getTime();
            return isNaN(t) ? 0 : t;
          })
          .filter(t => t > 0);
        if (dates.length === 0) return launchDate;
        return new Date(Math.max(...dates)).toISOString().split('T')[0];
      };

      // Index and overall max lastmod
      const globalMaxLastmod = getMaxLastmod(allCompanies);
      add('/', globalMaxLastmod);

      // Static and search pages (fixed lastmod as requested)
      const fixedLastmod = launchDate;
      [
        '/companies',
        '/companies/add',
        '/companies/complete',
        '/companies/update',
        '/companies/technologies',
        '/companies/provinces',
        '/companies/municipalities',
        '/about',
        '/api-docs',
        '/companies.json'
      ].forEach(p => add(p, fixedLastmod));

      // Build mappings for filtering
      const techToCompanies = new Map<string, any[]>();
      const provinceToCompanies = new Map<string, any[]>();
      const municipalityToCompanies = new Map<string, any[]>();

      for (const c of allCompanies) {
        if (!c) continue;
        
        // Map by tech
        if (Array.isArray(c.tech)) {
          for (const t of c.tech) {
            const slug = slugify(t);
            if (!techToCompanies.has(slug)) techToCompanies.set(slug, []);
            techToCompanies.get(slug)!.push(c);
          }
        }

        // Map by location
        if (Array.isArray(c.locations)) {
          for (const loc of c.locations) {
            if (loc.province) {
              if (!provinceToCompanies.has(loc.province)) provinceToCompanies.set(loc.province, []);
              provinceToCompanies.get(loc.province)!.push(c);
            }
            if (loc.municipality) {
              if (!municipalityToCompanies.has(loc.municipality)) municipalityToCompanies.set(loc.municipality, []);
              municipalityToCompanies.get(loc.municipality)!.push(c);
            }
          }
        }
      }

      // 1. Province pages (only if has companies)
      let provincesList: any[] = [];
      try {
        const provMod = await import(pathToFileURL(join(rootDir, 'app', 'data', 'provinces.ts')).href);
        provincesList = provMod.provinces ?? provMod.default ?? [];
        for (const p of provincesList) {
          const comps = provinceToCompanies.get(p.id);
          if (comps && comps.length > 0) {
            add(`/companies/provinces/${p.id}`, getMaxLastmod(comps));
            
            // 1b. Province + Tech combinations
            for (const [techSlug, techComps] of techToCompanies.entries()) {
              const intersected = techComps.filter(tc => tc.locations?.some((l: any) => l.province === p.id));
              if (intersected.length > 0) {
                add(`/companies/provinces/${p.id}?tech=${techSlug}`, getMaxLastmod(intersected));
              }
            }
          }
        }
      } catch (e) {
        console.warn('[sitemap] failed to load provinces or generate province urls:', e);
      }

      // 2. Municipality pages
      try {
        const munDir = join(rootDir, 'app', 'data', 'municipalities');
        const munFiles = await readdir(munDir);
        for (const file of munFiles) {
          if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
          try {
            const mod = await import(pathToFileURL(join(munDir, file)).href);
            const arr = mod.default ?? Object.values(mod)[0];
            if (Array.isArray(arr)) {
              for (const m of arr) {
                if (m && m.id && m.province) {
                  const comps = municipalityToCompanies.get(m.id);
                  if (comps && comps.length > 0) {
                    add(`/companies/provinces/${m.province}/municipalities/${m.id}`, getMaxLastmod(comps));

                    // 2b. Municipality + Tech combinations
                    for (const [techSlug, techComps] of techToCompanies.entries()) {
                      const intersected = techComps.filter(tc => tc.locations?.some((l: any) => l.municipality === m.id));
                      if (intersected.length > 0) {
                        add(`/companies/provinces/${m.province}/municipalities/${m.id}?tech=${techSlug}`, getMaxLastmod(intersected));
                      }
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.warn('[sitemap] failed to process municipality file', file, e);
          }
        }
      } catch (e) {
        console.warn('[sitemap] failed to list municipalities directory', e);
      }

      // 3. Tech pages (standalone)
      for (const [techSlug, comps] of techToCompanies.entries()) {
        if (comps.length > 0) {
          add(`/companies/technologies/${techSlug}`, getMaxLastmod(comps));
        }
      }

      // 4. Company pages
      allCompanies.forEach((c: any) => {
        if (c && c.name) {
          const lastmod = c.lastUpdated ? new Date(c.lastUpdated).toISOString().split('T')[0] : globalMaxLastmod;
          add(`/companies/${slugify(c.name)}`, lastmod);
        }
      });

      // Build sitemap XML (No changefreq as requested)
      const entries = urls.map(({ loc, lastmod }) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`).join('\n');
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

      const sitemapPath = join(rootDir, 'public', 'sitemap.xml');
      await writeFile(sitemapPath, sitemapXml, 'utf-8');
      console.log(`✅ Wrote sitemap with ${urls.length} entries to ${sitemapPath}`);
    } catch (e) {
      console.error('✗ Sitemap generation failed:', e);
    }
    // --- end sitemap -------------------------------------------------------

    return {
      success: true,
      count: allCompanies.length
    };
  } catch (error) {
    console.error("Error updating companies.json:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

// Export a Nitro event handler when running in Nitro; otherwise export undefined default handler
let handler: any = undefined;
if (typeof defineEventHandler === 'function') {
  // @ts-ignore - defineEventHandler is provided by the Nitro runtime
  handler = defineEventHandler(async (event) => {
    return await runUpdateCompanies();
  });
}

export default handler;

// If not running inside Nitro (i.e. local CLI), execute the job immediately
if (typeof defineEventHandler !== 'function') {
  console.log('Running cron via CLI (no Nitro detected)');
  runUpdateCompanies()
    .then((res) => {
      console.log('Cron finished:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Cron failed:', err);
      process.exit(1);
    });
}

export { runUpdateCompanies };

