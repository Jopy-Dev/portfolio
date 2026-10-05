# Jopy Dev Portfolio

Type: web app — class: full-product

Personal portfolio of Mark Jommer, Full-stack Developer, built for [portfolio.jopy.dev](https://portfolio.jopy.dev). A statically exported Next.js site with an editorial layout, scroll-driven motion, and a dedicated page for each featured project.

## Tech Stack

- Next.js 16 (App Router, static export) and React 19
- TypeScript (strict)
- Tailwind CSS 4
- GSAP with ScrollTrigger, and Lenis for smooth scrolling
- Biome for formatting and linting
- Node's built-in test runner, plus Vitest for the contact Worker
- Static hosting on Cloudflare Workers, deployed from GitHub

The contact form sends messages through a Cloudflare Worker that checks size, origin, and rate limits and verifies Cloudflare Turnstile before delivering the email.

## Getting Started

Requires Node.js `24.20.0` (see `.nvmrc`) and npm `12.0.2`.

```bash
npm ci
npm run dev
```

The dev server runs at `http://localhost:3000`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the static site into `apps/site/out` |
| `npm run format:check` | Check formatting |
| `npm run lint` | Lint the codebase |
| `npm run typecheck` | Run the TypeScript compiler |
| `npm test` | Run the test suite (run `npm run build` first) |

## Project Structure

```text
apps/site/          Next.js application
  src/app/          Routes, metadata, sitemap, robots
  src/components/   Layout, sections, projects, motion, UI
  src/content/      Portfolio content (profile, skills, projects)
  src/styles/       Design tokens and component styles
scripts/guards/     Build-time checks for tokens, environment, and output
tests/contracts/    Build output and behavior tests
```

## License

Licensed under the [Apache License 2.0](LICENSE). © 2026 Mark Jommer.

The license covers the source code. Personal content (biography, project details and images), skill icons, and third-party fonts and code keep their own terms; see [NOTICE](NOTICE). Derivative works must keep the attribution in `NOTICE`.

## Credits

Font licenses are listed in `THIRD_PARTY_NOTICES.txt` and `OFL-1.1.txt`.

Designed and built by Mark Jommer: [GitHub](https://github.com/Jopy-Dev) · [LinkedIn](https://www.linkedin.com/in/markjommer)
