# CloudFront Setup

The site is served through Amazon CloudFront in front of the S3 bucket.

**Primary URL (share this one):** https://d2t2dn2a26uq4h.cloudfront.net
**Distribution:** `vivid-website-prototype` (ID `E3TDO6BY8OXJCO`), Free plan ($0/month, 1M requests / 100 GB included)
**Origin:** `vivid-website-prototype-2026.s3.us-east-2.amazonaws.com` via Origin Access Control `EOWZDJKJ2B6UY` (sign requests). The bucket is private (Block All Public Access ON); only this distribution can read it, and write only to `feedback/comments.json`. See `DEPLOY.md` for the exact bucket policy.

The old direct S3 URL no longer works (AccessDenied) — the bucket is locked to CloudFront-only access. This CloudFront URL is the single public entry point.

## Configuration choices, and why

**Viewer protocol: Redirect HTTP → HTTPS.** Everyone lands on the secure URL, and the bare domain works because the default root object is set to `index.html`.

**Allowed methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE.** The shared feedback panel PUTs to `feedback/comments.json` on the same origin as the pages. CloudFront signs the forwarded request via OAC, and the bucket policy permits that signed write on exactly one object. Verified after lockdown: feedback GET/PUT return 200 through CloudFront, while PUTs to any other key (pages, images) return 403.

**Cache policy: CachingDisabled.** Deliberate for the review phase: every request goes to S3, so re-uploading a file makes it visible immediately with no invalidations and no "why isn't my change showing" confusion. The cost is that CloudFront currently adds HTTPS/edge routing but not caching speed. When the site stabilizes, switch the behavior's cache policy to `CachingOptimized` and create an invalidation (`/*`) after each deployment (first 1,000 invalidation paths per month are free). If caching is ever enabled, add a second behavior for `feedback/*` that keeps `CachingDisabled`, or the comment thread will go stale.

**WAF: included protections in monitor mode.** The plan bundles WAF at no charge. Monitor mode logs would-be blocks without enforcing them — chosen because strict rules can flag the anonymous feedback PUTs. After watching the WAF metrics for a while, blocking can be enabled; re-test comment posting afterward.

**Custom domain:** when Vivid is ready to point `vivideg.com` (or a subdomain like `beta.vivideg.com`) here, add it under Settings → Alternate domain names, request the free ACM certificate in us-east-1, and create a DNS record at the domain registrar pointing to `d2t2dn2a26uq4h.cloudfront.net`.

## Updating the site

Same as before — upload changed files to the S3 bucket (see `DEPLOY.md`). With caching disabled, changes appear on the CloudFront URL immediately (hard-refresh the browser if in doubt). Nothing in CloudFront needs touching for routine content updates.
