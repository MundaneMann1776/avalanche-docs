---
title: Maintaining This Documentation
description: How to keep the Avalanche documentation in sync with the code.
---

# Maintaining This Documentation

This site documents the Avalanche toolkit. The code changes often. Features
are added. Features are removed. This page explains how to keep the docs
true to the code.

Read `AGENTS.md` in this repository before you edit any page. It holds the
rules and the current review stamp.

## When to update the docs

Update the docs when you change the code in a way that users or developers
can see. The triggers are:

- A new attack vector or a new attack type.
- A removed attack vector or attack type.
- A new config key, flag, or preset.
- A changed default, name, or behavior.
- A changed runtime requirement or optional library.
- A new subsystem or a removed subsystem.

A pure internal refactor does not need a docs update.

## The sync procedure

Follow these steps after a code change that affects the docs:

1. Go to the Avalanche repository and note the commit you document.
   `git log --oneline -1` shows it.
2. Compare the docs with the code. Read the changed source files. Do not
   trust the code repository's own prose docs over the code.
3. Update the affected pages. Use the exact flag names, config keys, and
   defaults from the code.
4. Update the review stamp in `docs/AGENTS.md`. Put the new commit, the
   version, and the date there.
5. Check the attack-type counts in `docs/AGENTS.md`. Keep them in sync with
   `frontend/src/data/attackTypes.ts` in the Avalanche repository.
6. Build the site. Run `npm run docs:build`.
7. Check that every link resolves. Run the link check in `MAINTAINING.md`
   of this page set, or scan the built site.
8. Commit the docs and push to `main`. GitHub Actions publishes the site.

## Add a new vector

A new vector touches four places:

1. A new knowledge-base page:
   `docs/attack-vectors/kb/vector-<name>.md`.
2. The vector tables in `docs/attack-vectors/overview.md` and
   `docs/attack-vectors/reference.md`.
3. The layer page that fits the vector. Layer 3, 4, or 7.
4. The sidebar in `docs/.vitepress/config.mts`.

Use an existing vector page as the template. Follow its section order.

## Remove a vector

A removed vector needs the reverse change. Delete its knowledge-base page.
Remove its rows from the tables. Remove its sidebar entry. Then recheck the
attack-type counts.

## Keep the style

Every page uses ASD-STE100 Simplified Technical English combined with the
Microsoft Style Guide. The rules are in `AGENTS.md` of this repository.
Keep the style when you edit. Do not copy text from the code repository
verbatim.

## Build and preview

```bash
npm install
npm run docs:dev        # live preview at http://localhost:5173
npm run docs:build      # static build
npm run docs:preview    # preview the build
```

## Publish

A push to `main` triggers the deploy workflow. The site appears on GitHub
Pages about one minute later. There is no per-version cost. There is no
publishing step to run per release.

## Related pages

- [Introduction](../getting-started/introduction.md)
- [User Guide Overview](../user-guide/overview.md)
- [Developer Guide](../developer/overview.md)
