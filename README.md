# Vivid Engineering Group — Website Prototype

A dependency-free static website: plain HTML, one shared stylesheet, two small scripts. No framework, no build step. Open `index.html` in a browser or deploy the folder contents to any static host (see `DEPLOY.md`).

## Structure

    index.html                  Homepage (full-screen hero carousel, stats, services, projects, careers)
    services.html               Four service lines with real copy from vivideg.com
    projects.html               Portfolio grid
    project-central-70.html     Project detail template (duplicate for other projects)
    team.html                   Leadership/staff copy + leadership bio cards (bios from vivideg.com; headshots still needed)
    careers.html                Careers page
    contact.html                Offices + working contact form (private S3 dropbox; Lambda+SES upgrade in backend/)
    css/styles.css              The entire design system
    js/main.js                  Nav, mobile menu, scroll reveals, stat counters, hero carousel
    js/feedback.js              Site-wide shared feedback panel + storage notice (see below)
    js/contact.js               Contact form handler (S3 dropbox, or Lambda endpoint when configured)
    backend/                    Production contact handler: Lambda + SES code and setup guide
    images/                     Photos (+ auto-fallback SVG placeholders), logo, IMAGE-SOURCES.md
    feedback/comments.json      The shared feedback datastore (seeded empty)
    favicon.svg                 Brand-swoosh favicon

## Design system

Palette sampled from the Vivid logo: lime #AECB37 → kelly green #1FA24D gradient, charcoal #24272B, on a cool paper background, with a soil-strata accent band (a geotechnical boring-log motif) as the signature element. Type: Barlow Condensed (display), Barlow (body), IBM Plex Mono (labels/data), loaded from Google Fonts. All tokens are CSS variables at the top of `styles.css`.

## Images

Every photo slot references `images/<name>.jpg`. If the jpg is missing, an `onerror` handler swaps in the same-named `.svg` placeholder, which is labeled with the intended shot. Drop correctly-named jpgs into `images/` and they appear everywhere automatically — see `images/IMAGE-SOURCES.md` for the download list.

## Shared feedback

The Feedback button (every page) posts comments to `feedback/comments.json` in the site's own S3 bucket via a public-write policy scoped to that single file. All reviewers see one shared thread; comments are tagged per page and can be removed (two-click confirm). This is prototype-grade by design: last-write-wins on simultaneous posts, and anyone with the link could overwrite the file. `DEPLOY.md` covers the policy and the tradeoffs. The storage notice discloses all of this to visitors; the only thing kept in the visitor's browser is their reviewer name (opt-out offered).

## Before production launch (handoff to EnvisionIT)

Add leadership headshots to the team cards (names/titles/bios are in from vivideg.com); confirm the stats-band numbers with Steve; source the Garden of the Gods, Cimarron, and environmental photos; optionally switch the contact form to emailed delivery via the Lambda + SES handler in backend/; replace the prototype feedback system with a proper backend or remove it; align page structure with the Slickplan sitemap. The Pueblo West office (621 E. Enterprise Drive, Pueblo West, CO 81007 — (719) 896-4356, per vivideg.com/contact) is now listed as the third office on every page.
