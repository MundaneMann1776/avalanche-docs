# WRITING_GUIDE.md. Style rules for Avalanche Docs

This guide defines the required style for every page in this documentation
site. It mixes two standards, as the project owner requested:

- ASD-STE100 Simplified Technical English
- The Microsoft Style Guide for Technical Publications

STE100 governs the sentence and vocabulary discipline. The Microsoft Style
Guide governs clarity, structure, punctuation, lists, steps, and
terminology consistency. Where the two conflict, the STE100 sentence rules
win.

## 1. Audience and voice

- Address the reader as "you". Do not say "the user" when you mean the
  reader.
- Write for a competent engineer who is new to Avalanche. Do not explain
  TCP or HTTP at a tutorial level.
- Use the active voice. Example: "Avalanche sends one GET request." Do not
  write "One GET request is sent."
- Use the present tense for facts. Example: "The vector opens one socket
  per worker." Use the imperative for instructions.

## 2. Punctuation rules

- Never use the em dash character (U+2014) in any page, heading, code
  comment, or commit message. Use a period, a colon, or two sentences
  instead.
- Use a hyphen only inside a compound word, for example "low-and-slow".
- Use an en dash only inside a numeric range, for example "ports 80 to
  443". Do not use it as punctuation.
- Use the serial comma in a list of three or more items.
- Use one space after a period.
- Use straight quotes, not curly quotes, in prose that contains code terms.

## 3. STE100 sentence rules

- Write short sentences. Use 20 words or fewer for an instruction. Use 25
  words or fewer for a description. Split a longer sentence.
- Write one instruction in one sentence.
- Use a simple verb tense. Prefer the present tense. Avoid the past tense
  in procedures.
- Give one word one meaning. Use the same word for the same thing
  throughout the site.
- Use short, common words. Do not use slang or unnecessary jargon. Define a
  technical term the first time you use it.
- Do not remove words to make a sentence short. Do not write in a
  telegraphic style.
- Start each paragraph with its topic. Put the main point first.
- Put a warning or a caution immediately before the step it applies to.
- Use approved verbs: "start" not "commence"; "use" not "utilize"; "stop"
  not "terminate"; "finish" not "finalize"; "remove" not "delete" unless
  the stored record is "delete" because that matches the CLI word.
- Use "must" for requirements and "can" for possibility. Use "should" only
  for a recommendation.
- Do not write "please", "kindly", or "obviously".

## 4. Microsoft style rules

- Write in US English. Use "behavior", "canceled", "color", "initialize",
  and "optimize".
- Use consistent terminology. Use the exact product terms: "vector",
  "attack type", "attack", "run", "engagement", "canary", "kill switch",
  "egress".
- Use sentence case for headings and UI names. Proper names keep their
  case: "Cloudflare", "GitHub".
- Format UI labels in bold when you reference a dashboard element. Format
  file names, paths, commands, and config keys in code style.
- Write numbers as numerals when they are values: "43 attack types",
  "port 443", "Python 3.10". Spell out a number at the start of a sentence,
  or rewrite the sentence.
- Do not use a slash as a word separator in prose. Write "or" instead of
  "and/or".
- Do not hyphenate "login", "backend", "frontend", or "runtime" when used
  as a noun.

## 5. Structure of a page

Each page uses this shape:

1. YAML frontmatter with `title` and `description`.
2. One `# Title` line.
3. One paragraph that states what the page covers. Keep it to two or three
   sentences.
4. Body content. Use `##` for major sections and `###` for subsections. Do
   not skip heading levels.
5. A "Related pages" section at the end with links to the pages the reader
   needs next.

### Headings

- Make headings informative, not generic.
- Do not put code syntax in a heading except a literal flag name.
- Do not end a heading with a colon or a period.

### Paragraphs

- One topic per paragraph. Start with the topic sentence.
- Write three to five sentences per paragraph. Do not write wall
  paragraphs.

### Lists and steps

- Use a bullet list for items without order. Use a numbered list for steps
  the reader performs in order.
- Keep each list item to one idea.
- Introduce a list with a full sentence that ends with a colon.
- Number the steps. Start each step with an imperative verb. Keep a step to
  one action. Do not nest steps more than two levels.

### Notes, warnings, cautions

Use the VitePress containers:

- `::: tip` gives useful extra information. Use it rarely.
- `::: warning` warns about a risk that can break the test or the target.
- `::: danger` warns about something unsafe, destructive, or illegal.

Write the container text in STE100. Put it before the step it applies to.

### Tables

- Use a table for reference data: config keys, flags, status codes, values.
- Give the table a heading above it.
- Keep the first column short. Repeat the subject in each row when needed.
- Write the column header in sentence case.

### Code

- Put a command the reader types in a fenced code block tagged `bash`. Do
  not include the shell prompt. Do not show `$` at the start of a command
  line.
- Use `---` for a placeholder the reader replaces. Explain the placeholder
  after the block.
- Tag config file samples `yaml` or `json`. Tag Python samples `python`.

## 6. Frontmatter

Every page starts with YAML frontmatter:

```yaml
---
title: Page title
description: One sentence that says what this page covers.
---
```

The `title` becomes the browser tab and the sidebar entry. Keep it under 60
characters. Do not repeat the title verbatim in the description.

## 7. Accuracy rules

- Document only what the code does today. Do not invent features, flags,
  keys, or defaults.
- Read the source files before you write a page. Prefer the code and
  docstrings over memory.
- Use the real flag names and config keys exactly as the code defines them.
- Give real defaults where the code shows them.
- When a feature needs an optional library or root, say so in a `:::
  warning` container.
- When a feature is only for authorized use, say so in the page that
  describes it.

## 8. Links inside this site

- Use relative links between pages. Keep the `.md` extension in the link so
  VitePress resolves it.
- Do not link to internal repo files with absolute GitHub URLs.
- Keep anchor links lowercase and hyphenated.

## 9. Do not do this

- Do not copy text wholesale from the code repository docs without editing
  it into the required style.
- Do not write marketing claims. Do not write "powerful", "best-in-class",
  or "enterprise-grade".
- Do not write about planned roadmap items as if they exist.
- Do not use TODO, TBD, or placeholders.
- Do not leave empty sections.
- Never use the em dash character. See section 2.
