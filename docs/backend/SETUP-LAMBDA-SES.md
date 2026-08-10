# Upgrading the contact form to emailed delivery (Lambda + SES)

The form works today by dropping submissions into the private `contact/` prefix of the S3 bucket (read them in the S3 console). When you want submissions emailed to an inbox instead, deploy this Lambda. Takes about 15 minutes, costs effectively $0 at contact-form volume.

## 1. Verify your email in SES

SES console (us-east-2) → Identities → Create identity → Email address → enter the delivery address (e.g. `ssammons@vivideg.com`) → click the verification link SES emails you.

**Sandbox note:** new AWS accounts start in the SES sandbox, which only sends *to verified addresses*. Since the form delivers to your own verified address, the sandbox is fine — no production-access request needed. (If you later want the From address to be something else, verify that identity too.)

## 2. Create the Lambda

Lambda console (us-east-2) → Create function → Author from scratch:
- Name: `vivid-contact-form`
- Runtime: Python 3.12
- Create, then paste the contents of `lambda_contact_handler.py` into the code editor (rename the default file's `lambda_handler` reference: set the handler to `lambda_function.handler` under Runtime settings, or name the file to match).
- Configuration → Environment variables: `TO_ADDRESS` = your verified email; optionally `FROM_ADDRESS` and `ALLOWED_ORIGIN` (defaults to the CloudFront domain).
- Configuration → Permissions → click the execution role → Add permissions → Create inline policy → JSON:

      { "Version": "2012-10-17",
        "Statement": [{ "Effect": "Allow", "Action": "ses:SendEmail", "Resource": "*" }] }

## 3. Enable the Function URL

Configuration → Function URL → Create: Auth type **NONE** (the function validates input itself), and enable CORS — Allow origin: `https://d2t2dn2a26uq4h.cloudfront.net`, allow methods `POST`, allow headers `content-type`. Copy the Function URL.

## 4. Point the form at it

In `js/contact.js`, set:

    var LAMBDA_ENDPOINT = "https://<your-id>.lambda-url.us-east-2.on.aws/";

Re-upload `js/contact.js` to the bucket. The form now POSTs to Lambda, which emails you with Reply-To set to the visitor — replying in your mail client goes straight to them. The S3 dropbox statements in the bucket policy can then be removed (see `../DEPLOY.md`).

## Abuse considerations

The Function URL is public by design (contact forms are). Mitigations already in the code: honeypot field client-side, input validation and size caps server-side, fixed recipient (nobody can use it to email arbitrary addresses). If spam ever becomes real, add reCAPTCHA/Turnstile client-side and verify the token in the handler.
