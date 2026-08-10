# Deployment — CloudFront + Locked S3 (current architecture)

**Public URL (the only working link):** https://d2t2dn2a26uq4h.cloudfront.net
**S3 bucket:** `vivid-website-prototype-2026` (us-east-2) — **private**; Block All Public Access is ON.
**CloudFront distribution:** `vivid-website-prototype` (ID `E3TDO6BY8OXJCO`), Free plan.

Direct S3 URLs (e.g. `https://vivid-website-prototype-2026.s3.us-east-2.amazonaws.com/...`) return AccessDenied by design. All traffic goes through CloudFront.

## How access works now

CloudFront uses an Origin Access Control (OAC, `sign requests` mode) to sign every request it forwards to S3. The bucket policy trusts only the CloudFront service principal, pinned to this exact distribution via `AWS:SourceArn`:

    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "CloudFrontRead",
          "Effect": "Allow",
          "Principal": { "Service": "cloudfront.amazonaws.com" },
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::vivid-website-prototype-2026/*",
          "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::857953323156:distribution/E3TDO6BY8OXJCO" } }
        },
        {
          "Sid": "CloudFrontFeedbackWrite",
          "Effect": "Allow",
          "Principal": { "Service": "cloudfront.amazonaws.com" },
          "Action": "s3:PutObject",
          "Resource": "arn:aws:s3:::vivid-website-prototype-2026/feedback/comments.json",
          "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::857953323156:distribution/E3TDO6BY8OXJCO" } }
        }
      ]
    }

The shared feedback still works: a reviewer's PUT goes to the CloudFront domain, CloudFront signs it with the OAC, and the policy allows that signed write on exactly one object — `feedback/comments.json`. Verified: signed writes to any other key (pages, images) are denied with 403.

## Updating the site

Nothing changes for you as the bucket owner: upload changed files through the S3 console as before (your console session authenticates you; the public-access block doesn't apply to you). With CloudFront caching disabled, changes appear on the CloudFront URL immediately.

To reset the feedback thread, upload this folder's `feedback/comments.json` (an empty `[]`) over the existing one.

## Notes and gotchas

- If the distribution is ever deleted and recreated, the bucket policy's two `AWS:SourceArn` values must be updated to the new distribution ARN, or the site goes dark.
- The security relies on the pair: OAC on the CloudFront origin + this bucket policy. Don't switch the origin back to "Public" without also restoring a public-read bucket policy (and vice versa).
- WAF runs in monitor mode (logging, not blocking). If blocking is enabled later, re-test posting a comment.
- For production, replace the prototype feedback mechanism with a real form backend; see `CLOUDFRONT.md` for caching and custom-domain steps.

## Contact form backend (S3 dropbox)

Submissions from `contact.html` are PUT (via CloudFront, OAC-signed) to unique keys under the `contact/` prefix — one small JSON file per message. Two extra policy statements make this work while keeping submissions private:

    {
      "Sid": "CloudFrontContactWrite",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::vivid-website-prototype-2026/contact/*",
      "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::857953323156:distribution/E3TDO6BY8OXJCO" } }
    },
    {
      "Sid": "DenyContactReadViaCloudFront",
      "Effect": "Deny",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::vivid-website-prototype-2026/contact/*"
    }

The explicit Deny outranks the site-wide read Allow, so nothing under `contact/` can ever be fetched through the website — submissions (names, emails, project details) stay private. It targets only the CloudFront principal, so **your** console access is unaffected.

**Reading submissions:** S3 console → bucket → `contact/` prefix. Each object is one message (JSON: name, email, topic, message, timestamp). Delete objects after handling them, or leave them as a record.

**Tradeoffs, stated plainly:** anyone with the link can create objects under `contact/` (that's what a contact form is), so a bot could spam junk files there — isolated to that prefix, unable to touch the site, and costing fractions of a cent, but worth knowing. The honeypot field filters naive bots. For emailed delivery and tighter abuse controls, deploy the Lambda + SES handler in `backend/` (see `backend/SETUP-LAMBDA-SES.md`) — then remove these two statements.
