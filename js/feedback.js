// Vivid Engineering — shared design feedback
// Comments are stored in feedback/comments.json in the site's own S3 bucket.
// The bucket policy allows public PUT on that single object (see DEPLOY.md),
// so every reviewer sees the same thread. Prototype-grade by design:
// last-write-wins, and anyone with the link could clear the file.
(function(){
  "use strict";
  const FEEDBACK_URL = "feedback/comments.json";
  const PAGE = document.body.dataset.page || "home";
  const PAGE_LABEL = document.body.dataset.pageLabel || "Homepage";
  const PAGE_FILES = {
    "home":"/","services":"/services","laboratory":"/laboratory-materials-testing","geotechnical":"/geotechnical-geological-engineering",
    "inspection":"/construction-inspection-and-materials-testing","environmental":"/environmental-services","projects":"/projects",
    "central-70":"/project-central-70","sh7":"/project-sh7","co119":"/project-co119",
    "powerpathway":"/project-powerpathway","estesloop":"/project-estesloop",
    "team":"/team","careers":"/careers","contact":"/contact",
    "privacy":"/privacy-policy"
  };
  const PAGE_LABELS = {
    "home":"Homepage","services":"Services","laboratory":"Laboratory Testing","geotechnical":"Geotechnical",
    "inspection":"Inspection & Testing","environmental":"Environmental","projects":"Projects",
    "central-70":"Central 70 Detail","sh7":"SH 7 Detail","co119":"CO 119 Detail",
    "powerpathway":"Power Pathway Detail","estesloop":"Estes Loop Detail",
    "team":"Our Team","careers":"Careers","contact":"Contact",
    "privacy":"Privacy Policy"
  };

  let store = null;
  try{ localStorage.setItem("__vt","1"); localStorage.removeItem("__vt"); store = localStorage; }catch(e){ store = null; }

  // ---- inject markup ----
  document.body.insertAdjacentHTML("beforeend", `
<aside aria-label="Design feedback">
<button class="fb-toggle" id="fbToggle" aria-controls="fbPanel" aria-expanded="false"><span aria-hidden="true">\u{1F4AC}</span> Feedback <span class="cnt" id="fbCount" aria-label="comment count">\u2013</span></button>
<div class="fb-panel" id="fbPanel">
  <div class="fb-head"><h3>Design Feedback</h3><button class="close" id="fbClose" aria-label="Close feedback panel">\u2715</button></div>
  <div class="fb-body">
    <p class="fb-note"><strong>Shared with everyone:</strong> comments are posted to this site and visible to anyone with the link. They're tagged to the page you're viewing.</p>
    <div class="fb-form">
      <label for="fbName">Your name</label>
      <input id="fbName" type="text" placeholder="e.g., Steve" autocomplete="name">
      <label for="fbText">Comment on this page</label>
      <textarea id="fbText" placeholder="e.g., Swap the hero photo for the drone shot of Cimarron\u2026"></textarea>
      <button class="btn btn-solid" type="button" id="fbPost">Post Comment</button>
      <button class="fb-ghostbtn" type="button" id="fbRefresh">Refresh Comments</button>
      <button class="fb-ghostbtn" type="button" id="fbExport">Copy All Comments</button>
      <p class="fb-status" id="fbStatus" role="status"></p>
    </div>
    <div class="fb-list" id="fbList"><p class="fb-empty">Open the panel to load comments.</p></div>
  </div>
</div>
</aside>
<div class="cookie-notice" id="cookieNotice" role="dialog" aria-label="Storage notice">
  <div class="cn-label">Notice</div>
  <p>This prototype sets no tracking or advertising cookies. Design feedback you post is <strong>public</strong>: it's saved to this site and visible to anyone with the link. Your browser locally remembers only your reviewer name.</p>
  <div class="cn-actions">
    <button class="btn btn-solid" id="cnAccept" type="button">OK, got it</button>
    <button class="cn-decline" id="cnDecline" type="button">Don't remember my name on this device</button>
  </div>
</div>`);

  const panel = document.getElementById("fbPanel");
  const toggleBtn = document.getElementById("fbToggle");
  const cntEl = document.getElementById("fbCount");
  const statusEl = document.getElementById("fbStatus");
  const listEl = document.getElementById("fbList");
  let fbOpen = false;
  let cache = [];

  // ---- consent notice (name-memory only; feedback itself is public by design) ----
  const CONSENT_KEY = "vivid-storage-consent";
  let consent = null;
  try{ consent = store ? store.getItem(CONSENT_KEY) : null; }catch(e){}
  let rememberName = consent !== "declined";
  const cnBar = document.getElementById("cookieNotice");
  if(cnBar && !consent){
    cnBar.classList.add("show");
    document.getElementById("cnAccept").addEventListener("click", () => {
      try{ if(store) store.setItem(CONSENT_KEY, "accepted"); }catch(e){}
      cnBar.classList.remove("show");
    });
    document.getElementById("cnDecline").addEventListener("click", () => {
      try{ if(store) store.setItem(CONSENT_KEY, "declined"); store.removeItem("vivid-reviewer-name"); }catch(e){}
      rememberName = false;
      cnBar.classList.remove("show");
    });
  }

  function esc(s){ const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  // ---- shared storage over HTTP ----
  async function loadComments(){
    try{
      const r = await fetch(FEEDBACK_URL + "?t=" + Date.now(), {cache:"no-store"});
      if(!r.ok) return null;
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    }catch(e){ return null; }
  }
  async function saveComments(arr){
    try{
      const r = await fetch(FEEDBACK_URL, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(arr)
      });
      return r.ok;
    }catch(e){ return false; }
  }

  function renderComments(all){
    cache = all;
    const sorted = all.slice().sort((a,b) => b.ts - a.ts);
    cntEl.textContent = sorted.length;
    if(!sorted.length){ listEl.innerHTML = '<p class="fb-empty">No comments yet \u2014 be the first to leave feedback.</p>'; return; }
    const here = sorted.filter(c => c.page === PAGE), elsewhere = sorted.filter(c => c.page !== PAGE);
    const item = c => `
      <div class="fb-item">
        <div class="meta"><span class="who">${esc(c.name)}</span>
          <a class="where" href="${PAGE_FILES[c.page] || "/"}">${esc(PAGE_LABELS[c.page] || c.page)}</a></div>
        <p>${esc(c.text)}</p>
        <div class="row2"><time>${new Date(c.ts).toLocaleString()}</time>
          <button class="del" data-del="${esc(String(c.id))}">Remove</button></div>
      </div>`;
    listEl.innerHTML =
      `<h4>On this page (${here.length})</h4>` +
      (here.map(item).join("") || '<p class="fb-empty">Nothing yet on this page.</p>') +
      (elsewhere.length ? `<h4 style="margin-top:18px">Other pages (${elsewhere.length})</h4>` + elsewhere.map(item).join("") : "");
    listEl.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
      if(b.dataset.armed !== "1"){ b.dataset.armed = "1"; b.textContent = "Confirm remove?"; return; }
      statusEl.textContent = "Removing\u2026";
      const latest = await loadComments();
      const arr = (latest === null ? cache : latest).filter(c => String(c.id) !== b.dataset.del);
      const ok = await saveComments(arr);
      statusEl.textContent = ok ? "Removed." : "Couldn't update the shared thread \u2014 see DEPLOY.md (feedback storage).";
      refresh();
    }));
  }

  async function refresh(){
    listEl.innerHTML = '<p class="fb-empty">Loading comments\u2026</p>';
    const all = await loadComments();
    if(all === null){
      cntEl.textContent = "!";
      listEl.innerHTML = '<p class="fb-empty">Couldn\u2019t load the shared feedback file. If this is a fresh deployment, make sure feedback/comments.json was uploaded (see DEPLOY.md).</p>';
      return;
    }
    renderComments(all);
  }

  document.getElementById("fbClose").addEventListener("click", () => {
    fbOpen = false; panel.classList.remove("open");
    toggleBtn.setAttribute("aria-expanded","false"); toggleBtn.focus();
  });
  toggleBtn.addEventListener("click", () => {
    fbOpen = !fbOpen;
    panel.classList.toggle("open", fbOpen);
    toggleBtn.setAttribute("aria-expanded", String(fbOpen));
    if(fbOpen){
      const nameInput = document.getElementById("fbName");
      if(store && rememberName && !nameInput.value){
        try{ nameInput.value = store.getItem("vivid-reviewer-name") || ""; }catch(e){}
      }
      refresh();
    }
  });
  document.getElementById("fbRefresh").addEventListener("click", refresh);
  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && fbOpen){
      fbOpen = false; panel.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded","false"); toggleBtn.focus();
    }
  });

  document.getElementById("fbPost").addEventListener("click", async () => {
    const name = document.getElementById("fbName").value.trim();
    const text = document.getElementById("fbText").value.trim();
    if(!name || !text){ statusEl.textContent = "Add your name and a comment first."; return; }
    statusEl.textContent = "Posting\u2026";
    const latest = await loadComments();
    const arr = latest === null ? cache.slice() : latest;
    arr.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2,7), page: PAGE, name, text, ts: Date.now() });
    const ok = await saveComments(arr);
    if(ok){
      if(store && rememberName){ try{ store.setItem("vivid-reviewer-name", name); }catch(e){} }
      statusEl.textContent = "Posted \u2014 visible to everyone with the link.";
      document.getElementById("fbText").value = "";
    } else {
      statusEl.textContent = "Couldn't publish \u2014 feedback storage may not be configured yet (see DEPLOY.md). Your text is kept above; copy it to send directly.";
    }
    refresh();
  });

  document.getElementById("fbExport").addEventListener("click", async () => {
    const all = await loadComments() || cache;
    if(!all.length){ statusEl.textContent = "Nothing to copy yet."; return; }
    const txt = "Vivid website prototype feedback\n\n" + all.slice().sort((a,b)=>a.ts-b.ts).map(c =>
      "[" + (PAGE_LABELS[c.page] || c.page) + "] " + c.name + " \u2014 " + new Date(c.ts).toLocaleString() + "\n" + c.text).join("\n\n");
    try{
      await navigator.clipboard.writeText(txt);
      statusEl.textContent = "Copied to clipboard.";
    }catch(e){
      const ta = document.createElement("textarea");
      ta.value = txt; ta.style.cssText = "width:100%;min-height:140px;margin-top:10px;font-size:13px";
      statusEl.textContent = "Couldn't auto-copy \u2014 select and copy from the box below:";
      statusEl.after(ta); ta.select();
    }
  });
})();
