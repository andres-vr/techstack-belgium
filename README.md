# TechStack Belgium 🇧🇪

[![License: CC0](https://img.shields.io/badge/License-CC0-lightgrey.svg)](license.md)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82.svg)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D.svg)](https://vuejs.org/)

An open-source directory of Belgian tech companies and their technology stacks. Discover what technologies companies in Belgium are using, filter by province, municipality, or specific technologies.

**🌐 Live at [techstack.be](https://techstack.be)**

## Features

- 🔍 **Search & Filter** — Find companies by name, technology, province, or municipality
- 🗺️ **Interactive Map** — Visualize company locations across Belgium
- 🏷️ **Technology Tags** — Browse by 100+ technologies across frontend, backend, mobile, cloud, and more
- 🌍 **Multilingual** — Available in English, Dutch, French, and German
- 📊 **Company Data** — View company details including employee count, founding date, and verified tech stacks
- 🆓 **Open Data** — All company data is available via our public API and JSON export

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/techstack-belgium.git
cd techstack-belgium

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables below)

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

| Variable                   | Description                                                       | Required          |
| -------------------------- | ----------------------------------------------------------------- | ----------------- |
| `CBE_KEY`                  | API key for the Belgian CBE (Crossroads Bank for Enterprises) API | Yes               |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox access token for geocoding and maps                        | Yes               |
| `GITHUB_TOKEN`             | GitHub token for automated PR creation                            | For contributions |

## Project Structure

```
├── app/
│   ├── components/     # Vue components
│   ├── data/           # Static data (companies, provinces, municipalities, tech)
│   │   └── companies/  # Company JSON files (complete & incomplete)
│   ├── pages/          # Nuxt pages/routes
│   ├── stores/         # Pinia stores
│   └── utils/          # Helper functions
├── i18n/
│   └── locales/        # Translation files (en, nl, fr, de)
├── methodology/        # Data collection scripts
├── public/             # Static assets and companies.json
├── server/
│   ├── api/            # API routes (add, submit, update)
│   └── utils/          # Server utilities (enrichment, geocoding)
└── types/              # TypeScript type definitions
```

## Available Scripts

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `npm run dev`      | Start development server         |
| `npm run build`    | Build for production             |
| `npm run preview`  | Preview production build locally |
| `npm run generate` | Generate static site             |

**Note**: The `companies.json` file and sitemap are automatically updated by the GitHub Actions workflow when companies are added, updated, or completed via PRs.

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) with Vue 3
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Maps**: [MapLibre GL](https://maplibre.org/)
- **i18n**: [@nuxtjs/i18n](https://i18n.nuxtjs.org/)
- **Images**: [@nuxt/image](https://image.nuxt.com/) with Vercel provider
- **Analytics**: Vercel Analytics & Speed Insights

## Data Sources

Company data is sourced from:

- **[CBE API](https://cbeapi.be/)** — Official Belgian enterprise data
- **[NBB (National Bank of Belgium)](https://developer.cbso.nbb.be/)** — Financial data for employee counts
- **Community Contributions** — Tech stack information verified through public sources

## Contributing

We welcome contributions from the community! Whether you want to add a company, update tech stack information, improve translations, or contribute code, we'd love your help.

### Quick Ways to Contribute

- **🏢 Add a Company**: Use [techstack.be/companies/add](https://techstack.be/companies/add) to add a company by CBE number
- **📝 Complete Company**: Use [techstack.be/companies/complete](https://techstack.be/companies/complete) to complete company details
- **🔄 Update Tech Stack**: Use [techstack.be/companies/update](https://techstack.be/companies/update) to update existing companies

### Contributing Policy

For detailed guidelines on contributing, including code style, data quality standards, and pull request guidelines, please see our **[Contributing Guide](CONTRIBUTING.md)**.

## API

The full company dataset is available as a public JSON file:

```
GET https://techstack.be/companies.json
```

See the [API Documentation](https://techstack.be/api-docs) for more details.

## License

This project is dedicated to the public domain under the [CC0 1.0 Universal](license.md) license.

---

Built with ❤️ for the Belgian tech community
