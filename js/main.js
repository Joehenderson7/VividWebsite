// Vivid Engineering — shared page behavior
(function(){
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // sticky nav shadow
  const hdr = document.querySelector("header");
  const onScroll = () => hdr && hdr.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();

  // mobile menu
  const menuBtn = document.getElementById("menuBtn");
  const navList = document.getElementById("navList");
  if(menuBtn && navList){
    menuBtn.addEventListener("click", () => {
      const open = navList.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
    });
    navList.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      navList.classList.remove("open"); menuBtn.setAttribute("aria-expanded","false");
    }));
  }

  // scroll reveals + stat counters
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll(".count").forEach(el => {
        if(el.dataset.done) return; el.dataset.done = 1;
        const target = +el.dataset.target;
        if(reduce){ el.textContent = target; return; }
        const t0 = performance.now(), dur = 1400;
        (function tick(t){
          const p = Math.min((t - t0)/dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1-p, 3)));
          if(p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    });
  }, {threshold:.15});
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // homepage hero carousel (no-op on pages without slides)
  const slides = [...document.querySelectorAll(".slide")];
  const dots = [...document.querySelectorAll(".dot")];
  const metaProj = document.getElementById("metaProj");
  const metaLoc = document.getElementById("metaLoc");
  if(slides.length && dots.length){
    let cur = 0, timer;
    function show(i){
      slides[cur].classList.remove("active"); dots[cur].classList.remove("active");
      dots[cur].setAttribute("aria-selected","false");
      cur = i;
      slides[cur].classList.add("active"); dots[cur].classList.add("active");
      dots[cur].setAttribute("aria-selected","true");
      if(metaProj){ metaProj.textContent = slides[cur].dataset.proj; metaLoc.textContent = slides[cur].dataset.loc; }
    }
    function auto(){ timer = setInterval(() => show((cur+1)%slides.length), 6000); }
    dots.forEach((d,i) => d.addEventListener("click", () => { clearInterval(timer); show(i); if(!reduce) auto(); }));
    if(!reduce) auto();
  }
})();
