---
title: Endpoint Discovery
description: Discover the live paths of a site and feed them to the HTTP flood.
---

# Endpoint Discovery

Endpoint discovery finds the reachable paths of a target site. The HTTP
flood can then aim at the paths that exist instead of guessing. Use
Avalanche only against systems you own or have written permission to test.

Discovery supports two source modes:

- Crawl. A recursive HTML parser follows same-host links from a seed path.
- Sitemap. The service fetches the sitemap and imports its URLs.

Both modes record the method, the HTTP status, the content type, the source
that found the path, and a score. The dashboard saves the result per FQDN to
`~/.avalanche/endpoints.json`.

## The recursive crawl

The crawler walks the site with a breadth-first search. It starts at the
seed path and follows links up to a maximum depth and a maximum URL count.
The default depth is 2 and the default URL cap is 200. A depth of 0 fetches
the seed page only.

The crawler extracts links from these sources in each HTML page:

- Anchor and media tags such as `a`, `script`, `img`, `link`, and `iframe`.
- Form actions, with their HTTP methods.
- Inline JavaScript strings and static JavaScript URL patterns.
- Meta refresh targets.
- Sitemap URLs referenced by `robots.txt`.

JavaScript files are fetched even when static assets are skipped, so the
URLs they embed become visible. The crawler normalizes URLs before it stores
them. It drops fragments and tracking parameters such as `utm_*`, `gclid`,
and `fbclid`.

The crawler classifies each path as `static`, `api`, or `html`. API paths
start with `/api/`, `/rest/`, `/v1/`, or `/v2/`, or they lead to GraphQL or
a `.json` file. The crawler skips static assets by default. Turn
`include_static` on to keep them.

Paths receive a score. Sitemap paths score highest, then crawl links, then
form actions, then JavaScript finds. API routes gain extra weight. A path
that returns an error status loses points.

## Sitemap import

The sitemap mode fetches `/sitemap.xml`. When the root document is a
sitemap index, the service expands up to 30 child sitemaps in parallel.
Every `<loc>` value is normalized to a same-host path. Paths from other
hosts are dropped. The same static filter applies unless you include static
paths.

## JS-rendered harvesting

A plain crawl misses paths that exist only after JavaScript runs. The
optional render phase opens the discovered HTML pages in a headless
Chromium browser and parses the rendered DOM with the same extractor. New
paths carry the source `js-render`.

The render phase needs the `headless` extra. It uses Playwright with the
Chromium browser installed.

::: warning
The render phase needs the `headless` extra. Install it with
`uv sync --extra headless` and run `playwright install chromium`.
:::

The phase has its own budget on top of the crawl cap. The default page limit
is 25 and the concurrency is 4 pages. Navigation goes only to same-origin
URLs that the crawl already found. Rendering never leaves the crawl scope.

## The endpoint store

The store keeps one saved list per FQDN. The dashboard reads and writes the
list through these routes:

- `POST /api/endpoints/discover` runs one discovery.
- `GET /api/endpoints` and `PUT /api/endpoints` list and save lists.
- `DELETE /api/endpoints` removes a saved list.
- `GET /api/endpoints/export` returns the saved list as CSV.
- `POST /api/endpoints/validate-file` validates an uploaded endpoint file.

A saved `EndpointPath` carries the path, method, status, content type,
source, category, score, and host. The CSV export writes these fields plus
the discovery timestamp.

## Extra endpoints in a run

The HTTP vector consumes an explicit endpoint list through the config key
`extra_endpoints`. When the list is non-empty, the vector builds its request
distribution from those paths instead of a generic guess list. Dynamic
paths get the bulk of the traffic. Static paths are deprioritized, because
the edge cache serves them. Only `/` is always kept.

The HTTP vector config carries the list:

```yaml
vectors:
  http:
    enabled: true
    extra_endpoints:
      - /
      - /api/v1/products
```

The command line loads a file the same way:

```bash
avalanche -t target.example --http 200 --endpoints-file endpoints.txt
```

The file holds one path or URL per line. Blank lines and lines that start
with `#` are skipped. URLs are normalized to their paths. The dashboard
applies a saved list by writing it into the run payload as
`extra_endpoints`.

## Auto-discovery during a run

The runtime flag `auto_discover` runs a crawl just before the vectors
start. The crawl runs only when the HTTP vector is enabled. The discovered
paths that answer below status 400 are injected into `extra_endpoints`.
This gives a run real endpoints with no manual step.

The runtime keys are:

- `auto_discover` turns the pre-run crawl on or off. The default is off.
- `crawl_depth` sets the crawl depth. The default is 2 and the range is 0
  to 10.
- `max_urls` caps the URLs to crawl. The default is 200 and the range is 1
  to 5,000.
- `discover_js` renders pages in headless Chromium during the crawl. It
  needs the `headless` extra.
- `discover_js_max_pages` caps the pages to render. The default is 25.

The CLI exposes these as flags:

```bash
avalanche -t target.example --http 200 --auto-discover --crawl-depth 3 --max-urls 500
avalanche -t target.example --http 200 --auto-discover --discover-js
```

Use `--no-auto-discover` and `--no-discover-js` to turn the flags off. The
`--crawl-depth`, `--max-urls`, and `--discover-js-max-pages` flags take the
numeric values. A run never discovers automatically unless you set
`--auto-discover` or the config key.

## What adaptive targeting does next

Per-endpoint statistics and adaptive targeting shift the load toward the
endpoints that answer. They consume the same endpoint distribution that
discovery feeds. When a discovered path starts to fail, the controller
reduces its share over time. See [Adaptive Targeting](../controls/adaptive-targeting.md) for how the 
weights move.

## Related pages

- [Reconnaissance Overview](overview.md) — where discovery sits in the flow.
- [Adaptive Targeting](../controls/adaptive-targeting.md) — the load moves
  based on per-endpoint health.
- [Campaigns](campaigns.md) — sweep every target for endpoints.
- [Subdomain Discovery](subdomains.md) — seed the crawl with verified hosts.
