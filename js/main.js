(() => {
  const AR = document.documentElement.lang === "ar";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  document.addEventListener("DOMContentLoaded", () => {
    /* ---------- header, progress bar, back-to-top ---------- */
    const header = $(".header"),
      bar = $("#progress"),
      topBtn = $(".to-top");
    const onScroll = () => {
      const y = window.scrollY,
        h = document.documentElement.scrollHeight - innerHeight;
      if (header) header.classList.toggle("scrolled", y > 20);
      if (bar) bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
      if (topBtn) topBtn.classList.toggle("show", y > 500);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (topBtn)
      topBtn.addEventListener("click", () =>
        scrollTo({ top: 0, behavior: "smooth" }),
      );

    const toggle = $(".menu-toggle"),
      nav = $(".nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("open");
        nav.classList.toggle("open");
      });
    }
    $$(".caret").forEach((c) =>
      c.addEventListener("click", () =>
        c.closest(".has-sub").classList.toggle("open"),
      ),
    );

    /* ---------- smooth page transitions ---------- */
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        a.target === "_blank" ||
        a.hasAttribute("download") ||
        /^(https?:|tel:|mailto:)/.test(href) ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      )
        return;
      e.preventDefault();
      document.body.classList.add("leaving");
      setTimeout(() => (location.href = href), 240);
    });
    addEventListener("pageshow", (e) => {
      if (e.persisted) document.body.classList.remove("leaving");
    });

    /* ---------- reveal on scroll (staggered inside each group) ---------- */
    const groups = new Map();
    $$(".reveal").forEach((el) => {
      const p = el.parentElement;
      const i = groups.get(p) || 0;
      el.style.setProperty("--d", Math.min(i, 6));
      groups.set(p, i + 1);
    });
    const items = $$(".reveal");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("show");
              io.unobserve(e.target);
            }
          }),
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
      );
      items.forEach((el) => io.observe(el));
    } else items.forEach((el) => el.classList.add("show"));

    /* ---------- animated counters ---------- */
    $$("[data-count]").forEach((el) => {
      const target = +el.dataset.count,
        suffix = el.dataset.suffix || "";
      const run = () => {
        const t0 = performance.now(),
          dur = 1500;
        const tick = (now) => {
          const p = Math.min((now - t0) / dur, 1),
            eased = 1 - Math.pow(1 - p, 3);
          el.textContent =
            Math.floor(target * eased).toLocaleString("en-US") + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      if ("IntersectionObserver" in window)
        new IntersectionObserver((es, o) => {
          if (es[0].isIntersecting) {
            run();
            o.disconnect();
          }
        }).observe(el);
      else run();
    });

    /* ---------- card glow follows the mouse ---------- */
    $$(".card").forEach((c) =>
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", e.clientX - r.left + "px");
        c.style.setProperty("--my", e.clientY - r.top + "px");
      }),
    );

    /* ---------- rotating word in the hero ---------- */
    const rot = $("#rot");
    if (rot) {
      const words = rot.dataset.words.split("|");
      let i = 0;
      setInterval(() => {
        rot.classList.add("out");
        setTimeout(() => {
          i = (i + 1) % words.length;
          rot.textContent = words[i];
          rot.classList.remove("out");
        }, 350);
      }, 2400);
    }

    /* ---------- works filter ---------- */
    const btns = $$(".filter-btn"),
      works = $$(".work");
    btns.forEach((b) =>
      b.addEventListener("click", () => {
        btns.forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        const f = b.dataset.filter;
        works.forEach((w) => {
          const show = f === "all" || w.dataset.cat === f;
          w.classList.toggle("hide", !show);
          if (show) {
            w.classList.remove("show-anim");
            void w.offsetWidth;
            w.classList.add("show-anim");
          }
        });
      }),
    );

    /* ---------- contact form -> WhatsApp ---------- */
    const form = $("#contactForm");
    if (form) {
      const pre = new URLSearchParams(location.search).get("service");
      const sel = $("#service");
      if (pre && sel)
        [...sel.options].forEach((o) => {
          if (o.value === pre) sel.value = pre;
        });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = true;
        $$("[required]", form).forEach((input) => {
          const field = input.closest(".field");
          let valid = input.value.trim() !== "";
          if (valid && input.type === "email")
            valid = /^\S+@\S+\.\S+$/.test(input.value);
          field.classList.toggle("invalid", !valid);
          if (!valid) ok = false;
        });
        const note = $(".form-note", form);
        if (!ok) {
          note.textContent = "";
          return;
        }
        const d = Object.fromEntries(new FormData(form));
        const text = encodeURIComponent(
          AR
            ? `مرحباً ميديا شوب،\nالاسم: ${d.name}\nالهاتف: ${d.phone || "-"}\nالبريد: ${d.email}\nالخدمة: ${d.service}\n\n${d.message}`
            : `Hello Media Shop,\nName: ${d.name}\nPhone: ${d.phone || "-"}\nEmail: ${d.email}\nService: ${d.service}\n\n${d.message}`,
        );
        note.textContent = AR
          ? "شكراً لك! سيتم فتح واتساب لإرسال طلبك…"
          : "Thank you! Opening WhatsApp to send your request…";
        window.open(
          `https://wa.me/${form.dataset.whatsapp}?text=${text}`,
          "_blank",
        );
        form.reset();
      });
    }

    /* ---------- live stamp designer ---------- */
    const stage = $("#stampPreview");
    if (stage) initDesigner(stage);

    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  });

  /* ======================================================
     Stamp designer
     ====================================================== */
  function initDesigner(stage) {
    const state = { shape: "round", ink: "#1f4fd6" };
    const f = {
      l1: $("#sLine1"),
      l2: $("#sLine2"),
      c: $("#sCenter"),
    };
    const isAr = (t) => /[\u0600-\u06FF]/.test(t);
    const esc = (s) =>
      s.replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
      );
    const filter = `<filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.2 0 0 0 2.15" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in"/></filter>`;

    function build() {
      const ink = state.ink;
      const tb = `stroke="${ink}" stroke-width="1.6" stroke-linejoin="round" paint-order="stroke"`; // extra-bold text
      const l1 = (f.l1.value || "").toUpperCase().slice(0, 36);
      const l2 = (f.l2.value || "").toUpperCase().slice(0, 36);
      const lines = (f.c.value || "")
        .toUpperCase()
        .split("\n")
        .slice(0, 3)
        .filter(Boolean);
      const maxc = Math.max(1, ...lines.map((l) => l.length));
      let svg;

      if (state.shape === "round") {
        const fsTop = Math.max(
          11,
          Math.min(26, 290 / (Math.max(l1.length, 1) * 0.72)),
        );
        const fsBot = Math.max(
          10,
          Math.min(22, 330 / (Math.max(l2.length, 1) * 0.72)),
        );
        const fsC = Math.max(11, Math.min(30, 130 / (maxc * 0.66)));
        const startY = 150 - ((lines.length - 1) * fsC * 1.15) / 2 + fsC * 0.34;
        const ctr = lines
          .map(
            (t, i) =>
              `<text ${tb} x="150" y="${startY + i * fsC * 1.15}" text-anchor="middle" font-size="${fsC}" font-weight="900" fill="${ink}" font-family="Arial Black, Arial, Cairo, Tahoma, sans-serif">${esc(t)}</text>`,
          )
          .join("");
        svg = `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">${filter}
          <defs><path id="tp" d="M50,150 a100,100 0 0,1 200,0"/><path id="bp" d="M37,150 a113,113 0 0,0 226,0"/></defs>
          <g filter="url(#rough)" fill="none" stroke="${ink}">
            <circle cx="150" cy="150" r="140" stroke-width="7"/>
            <circle cx="150" cy="150" r="130" stroke-width="2"/>
            <circle cx="150" cy="150" r="80" stroke-width="2.5"/>
            <text ${tb} font-size="${fsTop}" font-weight="900" fill="${ink}" text-anchor="middle" letter-spacing="${isAr(l1) ? 0 : 1.5}" font-family="Arial Black, Arial, Cairo, Tahoma, sans-serif"><textPath href="#tp" startOffset="50%">${esc(l1)}</textPath></text>
            <text ${tb} font-size="${fsBot}" font-weight="900" fill="${ink}" text-anchor="middle" letter-spacing="${isAr(l2) ? 0 : 1.5}" font-family="Arial Black, Arial, Cairo, Tahoma, sans-serif"><textPath href="#bp" startOffset="50%">${esc(l2)}</textPath></text>
            <text x="38" y="158" font-size="18" fill="${ink}" stroke="none" text-anchor="middle">★</text>
            <text x="262" y="158" font-size="18" fill="${ink}" stroke="none" text-anchor="middle">★</text>
            ${ctr}
          </g></svg>`;
      } else {
        const oval = state.shape === "oval";
        const fs1 = Math.max(
          14,
          Math.min(34, 330 / (Math.max(l1.length, 1) * 0.72)),
        );
        const fs2 = Math.max(
          11,
          Math.min(20, 320 / (Math.max(l2.length, 1) * 0.72)),
        );
        const cap = { 0: 28, 1: 30, 2: 21, 3: 16 }[lines.length];
        const fsC = Math.max(11, Math.min(cap, 280 / (maxc * 0.68)));
        const midStart =
          (oval ? 102 : 107) -
          ((lines.length - 1) * fsC * 1.15) / 2 +
          fsC * 0.34;
        const ctr = lines
          .map(
            (t, i) =>
              `<text ${tb} x="200" y="${midStart + i * fsC * 1.15}" text-anchor="middle" font-size="${fsC}" font-weight="900" fill="${ink}" font-family="Arial Black, Arial, Cairo, Tahoma, sans-serif">${esc(t)}</text>`,
          )
          .join("");
        const frame = oval
          ? `<ellipse cx="200" cy="100" rx="192" ry="92" stroke-width="7"/><ellipse cx="200" cy="100" rx="182" ry="82" stroke-width="2"/>`
          : `<rect x="6" y="6" width="388" height="188" rx="16" stroke-width="7"/><rect x="17" y="17" width="366" height="166" rx="9" stroke-width="2"/>`;
        const y1 = oval ? 58 : 60;
        const y2 = oval ? 160 : 168;
        svg = `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">${filter}
          <g filter="url(#rough)" fill="none" stroke="${ink}">
            ${frame}
            <text ${tb} x="200" y="${y1}" text-anchor="middle" font-size="${fs1}" font-weight="900" fill="${ink}" font-family="Arial Black, Arial, Cairo, Tahoma, sans-serif">${esc(l1)}</text>
            ${ctr}
            <text ${tb} x="200" y="${y2}" text-anchor="middle" font-size="${fs2}" font-weight="900" fill="${ink}" letter-spacing="${isAr(l2) ? 0 : 1}" font-family="Arial, Cairo, Tahoma, sans-serif">${esc(l2)}</text>
          </g></svg>`;
      }
      stage.innerHTML = svg;
      const el = stage.firstElementChild;
      el.classList.add("pop");
      updateOrder();
    }

    function updateOrder() {
      const o = $("#orderStamp");
      if (!o) return;
      const shapeName = (
        AR
          ? { round: "دائري", rect: "مستطيل", oval: "بيضاوي" }
          : { round: "Round", rect: "Rectangle", oval: "Oval" }
      )[state.shape];
      const inkName =
        (AR
          ? {
              "#1f4fd6": "أزرق",
              "#d3202a": "أحمر",
              "#17181a": "أسود",
              "#13813c": "أخضر",
              "#6a2fb5": "بنفسجي",
            }
          : {
              "#1f4fd6": "Blue",
              "#d3202a": "Red",
              "#17181a": "Black",
              "#13813c": "Green",
              "#6a2fb5": "Purple",
            })[state.ink] || "";
      const center = f.c.value.replace(/\n/g, " / ");
      const msg = AR
        ? `مرحباً ميديا شوب، أريد طلب ختم:\nالشكل: ${shapeName}\nالحبر: ${inkName}\nالنص العلوي / الشركة: ${f.l1.value}\nالنص السفلي: ${f.l2.value}\nالمنتصف: ${center}`
        : `Hello Media Shop, I would like to order a stamp:\nShape: ${shapeName}\nInk: ${inkName}\nTop / company: ${f.l1.value}\nBottom: ${f.l2.value}\nCenter: ${center}`;
      o.href = `https://wa.me/${o.dataset.whatsapp}?text=${encodeURIComponent(msg)}`;
    }

    $$("#shapeSeg button").forEach((b) =>
      b.addEventListener("click", () => {
        $$("#shapeSeg button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        state.shape = b.dataset.shape;
        build();
      }),
    );
    $$("#inkSwatches button").forEach((b) =>
      b.addEventListener("click", () => {
        $$("#inkSwatches button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        state.ink = b.dataset.ink;
        build();
      }),
    );
    [f.l1, f.l2, f.c].forEach((i) => i.addEventListener("input", build));
    build();
  }
})();
