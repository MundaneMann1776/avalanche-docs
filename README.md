# Avalanche Docs

The documentation site for the Avalanche availability-testing toolkit.

This repository builds a static documentation website with VitePress. The
content is Markdown under `docs/`. The site is published to GitHub Pages.

## Content

The site covers:

- Getting started. Install, quick start, and requirements.
- User guide. Modes, CLI, dashboard, presets, configuration, playbooks,
  safety.
- Attack vectors. Overview pages per OSI layer, a vector reference, and a
  knowledge-base page for every vector.
- Reconnaissance. Subdomains, origin-IP finder, endpoints, campaigns, WAF
  cookies.
- Infrastructure. Proxy, reflector, and spoof-source pipelines.
- Distributed mode. Controller, agent, and capacity benchmark.
- Controls and observability. Governor, SLO mode, metrics, checkpoint,
  comparison.
- Architecture. Package map, engine pipeline, vector architecture, config
  model, emission and statistics.
- Developer guide. How to add vectors, presets, modifiers, and config
  fields.
- Reference. CLI flags, configuration keys, and data files.

## Writing style

All content follows ASD-STE100 Simplified Technical English combined with
the Microsoft Style Guide. See `WRITING_GUIDE.md` for the rules. The rules
are a hard requirement from the project owner.

## Accuracy

Documentation reflects the code in the Avalanche repository. Do not
document features that do not exist. When the code changes, update the
affected pages in the same change.

## Local development

```bash
npm install
npm run docs:dev
```

The dev server runs at http://localhost:5173 by default.

## Build

```bash
npm run docs:build
```

The static output is written to `docs/.vitepress/dist`.

## Preview a build

```bash
npm run docs:preview
```

## Publish to GitHub Pages

The repository ships a GitHub Actions workflow in
`.github/workflows/deploy.yml`. It builds the site and publishes it to
GitHub Pages on every push to `main`.

To enable Pages:

1. Push this repository to GitHub.
2. Open **Settings > Pages**.
3. Set **Source** to **GitHub Actions**.

## Related

- Avalanche repository: https://github.com/MundaneMann1776/Avalanche
