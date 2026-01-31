# Contributing to TechStack Belgium

Thank you for your interest in contributing to TechStack Belgium! This guide will help you get started.

## Ways to Contribute

### 1. Add a New Company (via Website)

The easiest way to add a company is through our website:

1. **Add by CBE Number**: Go to [techstack.be/companies/add](https://techstack.be/companies/add)
   - Enter the company's CBE (enterprise) number
   - Our system will automatically fetch company details
   - You just need to add the tech stack and proof URLs or verify via email

2. **Complete Company**: Go to [techstack.be/companies/complete](https://techstack.be/companies/complete)
   - Complete company details for companies already in our incomplete database
   - Provide proof URLs (job postings, tech blogs, GitHub, etc.)
   - Verify the submission with proof or via email

3. **Update Existing Company**: Go to [techstack.be/companies/update](https://techstack.be/companies/update)
   - Search for the company
   - Update their tech stack with new technologies
   - Verify the submission with proof or via email

### 2. Improve the Codebase

#### Setting Up Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/techstack-belgium.git
cd techstack-belgium

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Fill in required API keys

# Start development server
npm run dev
```

#### Code Style

- Use TypeScript for all new code
- Follow Vue 3 Composition API patterns
- Use Tailwind CSS for styling
- Run type checking before submitting: `npx tsc --noEmit`

### 3. Add Translations

We support English, Dutch, French, and German. Translation files are in `i18n/locales/`.

To add or improve translations:

1. Open the relevant locale file (e.g., `i18n/locales/nl.json`)
2. Add missing translations or improve existing ones
3. Make sure all locale files have the same keys
4. Submit a pull request

### 4. Report Issues

Found a bug or have a suggestion? Please [open an issue](https://github.com/your-org/techstack-belgium/issues) with:

- Clear description of the problem or suggestion
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

## Pull Request Guidelines

1. **Branch naming**: Use descriptive names like `add/company-name` or `fix/map-loading`
2. **Commit messages**: Write clear, concise commit messages
3. **One thing per PR**: Keep pull requests focused on a single change
4. **Update documentation**: If your change affects usage, update the README

## Data Quality Guidelines

When adding company data:

- ✅ Use the official CBE number when available
- ✅ Provide proof URLs (job postings, tech blogs, GitHub repos)
- ✅ Keep tech stack current (technologies actually in use)
- ✅ Use official technology names, as in app/data/tech.ts (e.g., "Vue" not "VueJS")
- ✅ Use official province names, as in app/data/provinces.ts (e.g., "Antwerp" not "Antwerpen")
- ✅ Use official municipality names, as in app/data/municipalities.ts (e.g., "Antwerp" not "Antwerpen")
- ❌ Don't add companies without verifiable tech stack information
- ❌ Don't include deprecated or outdated technologies

## Questions?

Feel free to open an issue or discussion if you have questions about contributing.

---

Thank you for helping make TechStack Belgium better! 🚀
