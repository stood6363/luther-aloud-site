(function () {
  "use strict";

  var DATA_URL = "data/episodes.json";

  function el(tag, opts) {
    var e = document.createElement(tag);
    if (!opts) return e;
    if (opts.cls) e.className = opts.cls;
    if (opts.text != null) e.textContent = opts.text;
    if (opts.html != null) e.innerHTML = opts.html;
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (k) {
        if (opts.attrs[k] != null) e.setAttribute(k, opts.attrs[k]);
      });
    }
    return e;
  }

  function youTubeId(url) {
    if (!url) return null;
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : null;
  }

  function renderAbout(meta) {
    var body = document.getElementById("about-copy-body");
    if (body && meta && meta.about_video_description) {
      body.textContent = meta.about_video_description;
    }
  }

  function fmtMeta(entry, isLive) {
    var bits = [];
    if (entry.year != null) bits.push(String(entry.year));
    if (entry.vol) bits.push("Holman Vol. " + entry.vol);
    // Live entries: only show a duration when we know the real one.
    // Coming-soon entries: show the length estimate (obviously not final).
    var time = isLive ? entry.duration : entry.estimated_length;
    if (time) bits.push(time);
    return bits;
  }

  function metaSpans(bits) {
    var wrap = el("div", { cls: "card-meta" });
    bits.forEach(function (b, i) {
      if (i > 0) wrap.appendChild(el("span", { cls: "sep", text: "·" }));
      wrap.appendChild(el("span", { text: b }));
    });
    return wrap;
  }

  function renderLiveCard(entry, youtubeUrl) {
    var card = el("a", {
      cls: "card card-live",
      attrs: { href: youtubeUrl || "https://youtube.com/@LutherAloud", rel: "noopener" }
    });

    var thumb = el("div", { cls: "card-live-thumb" });
    var vid = youTubeId(youtubeUrl);
    if (vid) {
      var img = el("img", {
        attrs: {
          src: "https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg",
          alt: "YouTube thumbnail — " + entry.title,
          loading: "lazy"
        }
      });
      thumb.appendChild(img);
    } else if (entry.thumbnail) {
      var img2 = el("img", {
        attrs: {
          src: entry.thumbnail,
          alt: "Cover — " + entry.title,
          loading: "lazy",
          onerror: "this.style.display='none'"
        }
      });
      thumb.appendChild(img2);
      thumb.appendChild(el("span", { text: entry.title }));
    } else {
      thumb.appendChild(el("span", { text: "▶ " + entry.title }));
    }
    card.appendChild(thumb);

    var body = el("div", { cls: "card-live-body" });
    body.appendChild(el("span", { cls: "card-live-tag", text: "Episode " + entry.num }));
    body.appendChild(el("h4", { text: entry.title }));
    if (entry.subtitle) body.appendChild(el("p", { cls: "card-live-sub", text: entry.subtitle }));

    var metaBits = fmtMeta(entry, true);
    if (metaBits.length) {
      var metaLine = el("p", { cls: "card-live-meta", text: metaBits.join(" · ") });
      body.appendChild(metaLine);
    }
    var btn = el("span", { cls: "btn btn-primary", text: "Watch the video ↗" });
    body.appendChild(btn);
    card.appendChild(body);
    return card;
  }

  function renderRegularCard(entry) {
    var card = el("div", { cls: "card card-soon" });

    card.appendChild(el("div", {
      cls: "card-num",
      text: "№ " + entry.num
    }));

    card.appendChild(el("h4", { cls: "card-title", text: entry.title }));
    if (entry.subtitle) card.appendChild(el("p", { cls: "card-subtitle", text: entry.subtitle }));

    var metaBits = fmtMeta(entry, false);
    if (metaBits.length) card.appendChild(metaSpans(metaBits));

    if (entry.estimated_episodes && entry.estimated_episodes > 1) {
      card.appendChild(el("div", {
        cls: "card-count",
        text: "planned ≈ " + entry.estimated_episodes + " individual episodes"
      }));
    }

    if (entry.note) card.appendChild(el("p", { cls: "card-note", text: entry.note }));

    return card;
  }

  function renderRoadmap(data) {
    var root = document.getElementById("roadmap-list");
    if (!root) return;
    root.innerHTML = "";

    var totalLive = 0, totalPlanned = 0, totalPlannedEps = 0;

    data.phases.forEach(function (phase) {
      var pWrap = el("section", { cls: "phase", attrs: { id: phase.id } });

      var head = el("header", { cls: "phase-head" });
      head.appendChild(el("div", { cls: "phase-meta", text: phase.years || "" }));
      head.appendChild(el("h3", { text: phase.name }));
      if (phase.source) head.appendChild(el("p", { text: phase.source }));
      if (phase.note) head.appendChild(el("p", { cls: "phase-note", text: phase.note }));
      pWrap.appendChild(head);

      phase.groups.forEach(function (group) {
        var gWrap = el("div", { cls: "group", attrs: { id: group.id } });
        var gHead = el("div", { cls: "group-head" });
        gHead.appendChild(el("h4", { text: group.name }));
        if (group.note) gHead.appendChild(el("p", { cls: "group-note", text: group.note }));
        gWrap.appendChild(gHead);

        var cards = el("div", { cls: "cards" });
        group.entries.forEach(function (entry) {
          if (entry.status === "live") {
            cards.appendChild(renderLiveCard(entry, entry.youtube_url));
            totalLive += 1;
          } else {
            cards.appendChild(renderRegularCard(entry));
            totalPlanned += 1;
            totalPlannedEps += (entry.estimated_episodes || 1);
          }
        });
        gWrap.appendChild(cards);
        pWrap.appendChild(gWrap);
      });

      root.appendChild(pWrap);
    });

    var totalsEl = document.getElementById("roadmap-totals");
    if (totalsEl) {
      var grand = totalLive + totalPlannedEps;
      totalsEl.innerHTML =
        "<strong>" + totalLive + "</strong> available · " +
        "<strong>" + totalPlanned + "</strong> works planned · " +
        "<strong>≈ " + grand + "</strong> episodes coming soon.";
    }
  }

  function renderError(msg) {
    var root = document.getElementById("roadmap-list");
    if (!root) return;
    root.innerHTML = "";
    var box = el("div", { cls: "group-note", text: msg });
    root.appendChild(box);
  }

  function stampYear() {
    var y = document.getElementById("footer-year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function initNavMenu() {
    var nav = document.querySelector(".site-nav");
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("nav-menu");
    if (!nav || !toggle || !menu) return;

    var setOpen = function (open) {
      if (open) {
        nav.classList.add("nav-open");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close menu");
        document.body.classList.add("nav-locked");
      } else {
        nav.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        document.body.classList.remove("nav-locked");
      }
    };

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Tapping a menu link closes the panel so the target section is visible.
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });

    // ESC closes and returns focus to the toggle.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Tap outside the header closes the panel.
    document.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") === "true" &&
          !nav.contains(e.target)) {
        setOpen(false);
      }
    });

    // Crossing back to desktop viewport should never leave the panel "open".
    var mq = window.matchMedia("(min-width: 781px)");
    var onChange = function (ev) { if (ev.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  function initBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;
    var threshold = 400;

    // Purely scroll-position driven: visible when scrolled past threshold,
    // hidden otherwise. rAF-throttled so the class flips live during a
    // smooth-scroll animation, not just when scroll events settle.
    var ticking = false;
    var update = function () {
      ticking = false;
      if (window.pageYOffset > threshold) btn.classList.add("visible");
      else btn.classList.remove("visible");
    };
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    btn.addEventListener("click", function () {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      // Drop focus so :focus-visible / mouse-focus doesn't leave the
      // active colour stuck after the click, and hide immediately —
      // the scroll listener will re-show it if the user scrolls down again.
      btn.blur();
      btn.classList.remove("visible");
    });

    update();
  }

  function boot() {
    stampYear();
    initNavMenu();
    initBackToTop();
    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to load episodes.json (HTTP " + r.status + ")");
        return r.json();
      })
      .then(function (data) {
        renderAbout(data.meta || {});
        renderRoadmap(data);
      })
      .catch(function (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        renderError("Could not load the episodes list.");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
