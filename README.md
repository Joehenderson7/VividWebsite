# Vivid Engineering Group — Website

A dependency-free static website: plain HTML, one shared stylesheet, three small scripts. No framework, no build step. Open `index.html` in a browser, or deploy the repo root to any static host (see `docs/DEPLOY.md`).

Live prototype: S3 + CloudFront at https://d2t2dn2a26uq4h.cloudfront.net (pages are `noindex` until the vivideg.com cutover).

## Layout

Everything in the repo root **is** the website — file names map 1:1 to live URLs (a CloudFront function serves `/page` from `page.html`). Everything that is *not* part of the site lives in `docs/`.

    index.html                        Homepage (hero carousel, stats, services, projects, careers)
    services.html                     The four service lines, with links to each detail page
    geotechnical-geological-engineering.html
    construction-inspection-and-materials-testing.html
    environmental-services.html
    laboratory-materials-testing.html Three AASHTO-accredited labs (Colorado Springs · Denver · Pueblo West)
    projects.html                     Portfolio grid
    project-*.html                    Project detail pages (central-70, sh-7, co-119,
                                      power-pathway, estes-loop, chief-hosa, floyd-hill)
    team.html                         Leadership bios + staff spotlight
    careers.html                      Careers page (Indeed listings synced daily between
                                      the INDEED-JOBS:START/END markers)
    contact.html                      Offices + working contact form
    privacy-policy.html
    css/styles.css                    The entire design system
    js/main.js                        Nav, mobile menu, scroll reveals, stat counters, carousel
    js/feedback.js                    Site-wide shared feedback panel (prototype-grade)
    js/contact.js                     Contact form handler
    images/                           Optimized photos, SVG placeholders, logos, favicons
    feedback/comments.json            Shared feedback datastore (seeded empty — never
                                      overwrite the live copy when deploying)
    robots.txt · sitemap.xml · favicon.svg · favicon.png

    docs/                             Everything that is not served as part of the site:
      DEPLOY.md                       S3/CloudFront deploy guide (content types, invalidations)
      CLOUDFRONT.md                   Distribution + clean-URL function notes
      IMAGE-SOURCES.md                Source URLs for photos not yet in the repo
      cloudfront/                     clean-urls.js viewer-request function + deploy guide
      backend/                        Optional Lambda + SES contact handler + setup guide

## Naming conventions

- Pages: lowercase, hyphen-separated words; project pages are `project-<name>.html`
  (e.g. `project-chief-hosa.html` → `/project-chief-hosa`).
- Images: `hero-<page>.jpg` (page hero, 1920w) and `project-<name>.jpg` (card/figure, 1600w),
  EXIF stripped. Same-named `.svg` files are labeled placeholders: photo slots use an
  `onerror` handler that swaps `.jpg` → `.svg` when the photo is missing.
- The `data-page` attribute on each `<body>` must match a key in `PAGE_FILES`/`PAGE_LABELS`
  in `js/feedback.js` — add new pages to both.

## Design system

Palette sampled from the Vivid logo: lime #AECB37 → kelly green #1FA24D gradient, charcoal #24272B, on a cool paper background, with a soil-strata accent band (a geotechnical boring-log motif) as the signature element. Type: Barlow Condensed (display), Barlow (body), IBM Plex Mono (labels/data), from Google Fonts. All tokens are CSS variables at the top of `styles.css`.

## Feedback widget

The Feedback button (every page) posts comments to `feedback/comments.json` in the site's S3 bucket via a public-write policy scoped to that single file. All reviewers see one shared thread; comments are tagged per page. Prototype-grade by design — `docs/DEPLOY.md` covers the policy and tradeoffs. Never deploy the repo's seeded-empty `feedback/comments.json` over the live one.

## Deploying

Per-file `aws s3 cp` with explicit content types, then a CloudFront invalidation — see `docs/DEPLOY.md`. **Never `aws s3 sync --delete`:** several photos exist only in the bucket (listed in `docs/IMAGE-SOURCES.md`) until they're backfilled into the repo.

## Still to do

Backfill the bucket-only photos into `images/`; real photos for SH 7, CO 119, Garden of the Gods, Cimarron, the environmental hero, and a lab interior; confirm SH 7 / CO 119 clients and the stats-band numbers; at cutover remove `noindex` (grep `PROTOTYPE: remove`), add 301s from old Squarespace URLs, and submit the sitemap in Search Console.
