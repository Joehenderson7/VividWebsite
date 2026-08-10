# Clean URLs — one-time CloudFront setup

The site's pages now link to extensionless URLs (`/services`, `/project-sh-7`, ...).
For those to actually serve, CloudFront needs the function in `clean-urls.js`
attached as a **viewer-request** function on distribution `E3TDO6BY8OXJCO`.
Until it's attached, deploy the HTML anyway — the old `.html` URLs keep working;
only the new clean links 404. So do this setup in the same sitting as the deploy.

## Option A — CloudFront console (easiest)
1. CloudFront console → **Functions** → **Create function**
   - Name: `vivid-clean-urls`, runtime **cloudfront-js-2.0**
2. Paste the contents of `clean-urls.js`, **Save**, then use the **Test** tab if you
   like (event type viewer-request, URI `/services` → expect `request.uri = /services.html`;
   URI `/services.html` → expect a 301 response to `/services`).
3. **Publish** tab → Publish function.
4. Still on the Publish tab → **Add association**:
   - Distribution `E3TDO6BY8OXJCO`, Event type **Viewer request**, Cache behavior `Default (*)`.
5. Wait for the distribution to finish deploying (~2-5 min), then invalidate `/*`.

## Option B — CloudShell (all CLI)
```bash
# 1) create (paste clean-urls.js into the heredoc first)
cat > clean-urls.js <<'EOF'
<contents of clean-urls.js>
EOF

aws cloudfront create-function --name vivid-clean-urls \
  --function-config 'Comment=Clean URLs rewrite,Runtime=cloudfront-js-2.0' \
  --function-code fileb://clean-urls.js
# note the ETag in the output, then:

aws cloudfront publish-function --name vivid-clean-urls --if-match <ETAG_FROM_CREATE>

# 2) attach to the default cache behavior
ARN=$(aws cloudfront describe-function --name vivid-clean-urls \
      --query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text)
aws cloudfront get-distribution-config --id E3TDO6BY8OXJCO > dist.json
ETAG=$(jq -r '.ETag' dist.json)
jq --arg arn "$ARN" '.DistributionConfig
  | .DefaultCacheBehavior.FunctionAssociations =
    {Quantity:1, Items:[{EventType:"viewer-request", FunctionARN:$arn}]}' \
  dist.json > distconfig.json
aws cloudfront update-distribution --id E3TDO6BY8OXJCO \
  --if-match "$ETAG" --distribution-config file://distconfig.json

# 3) after Deployed status:
aws cloudfront create-invalidation --distribution-id E3TDO6BY8OXJCO --paths "/*"
```

## Verify after deploy
- https://d2t2dn2a26uq4h.cloudfront.net/services → renders the services page, no .html in the bar
- https://d2t2dn2a26uq4h.cloudfront.net/services.html → 301 → /services
- https://d2t2dn2a26uq4h.cloudfront.net/index.html → 301 → /
- /css/styles.css, /images/..., /robots.txt still load normally (extensions pass through)
- Feedback widget still posts/loads (feedback/comments.json has an extension — untouched)

## Notes
- The function runs on every request but only touches extensionless paths and .html paths.
- S3 objects keep their `.html` names — nothing changes in the bucket.
- At vivideg.com cutover the same function moves with the distribution; canonicals,
  sitemap.xml, and all internal links already use the clean form.
