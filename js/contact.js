// Vivid Engineering — contact form handler
// Default delivery: writes each submission as a private JSON object under
// contact/ in the site's S3 bucket (via CloudFront-signed PUT). Submissions
// are NOT readable through the site (explicit deny in the bucket policy);
// the site owner reads them in the S3 console.
//
// Production upgrade: deploy backend/lambda_contact_handler.py (see
// backend/SETUP-LAMBDA-SES.md), then set LAMBDA_ENDPOINT to the Function URL
// below — the form switches to emailed delivery automatically.
(function(){
  "use strict";

  var LAMBDA_ENDPOINT = null; // e.g. "https://xxxxxxxx.lambda-url.us-east-2.on.aws/"

  var btn = document.getElementById("cfSend");
  if(!btn) return;
  var note = document.getElementById("cfNote");

  function val(id){ var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function say(msg){ if(note) note.textContent = msg; }

  btn.addEventListener("click", function(){
    // honeypot: hidden field humans never fill in
    var hp = document.getElementById("cf-website");
    if(hp && hp.value){ say("Submission blocked."); return; }

    var name = val("f-name"), email = val("f-email"), topic = val("f-topic"), msg = val("f-msg");
    if(!name || !email || !msg){ say("Please fill in your name, email, and project details."); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ say("That email address doesn't look right \u2014 mind double-checking it?"); return; }

    btn.disabled = true;
    say("Sending\u2026");

    var payload = { name: name, email: email, topic: topic, message: msg,
                    submitted_from: location.href, ts: new Date().toISOString() };

    var send;
    if(LAMBDA_ENDPOINT){
      send = fetch(LAMBDA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      var key = "contact/msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".json";
      send = fetch(key, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    send.then(function(r){
      if(r.ok){
        say("Thanks, " + name + " \u2014 your message was sent. We'll get back to you soon.");
        ["f-name","f-email","f-msg"].forEach(function(i){ var el = document.getElementById(i); if(el) el.value = ""; });
      } else {
        say("Couldn't send right now (" + r.status + "). Please email ssammons@vivideg.com directly.");
      }
    }).catch(function(){
      say("Couldn't send right now. Please email ssammons@vivideg.com directly.");
    }).finally(function(){
      btn.disabled = false;
    });
  });
})();
