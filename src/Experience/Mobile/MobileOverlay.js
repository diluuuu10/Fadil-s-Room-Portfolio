/* ============================================================
   Mobile overlay — shows full-screen TV (GeoCities) or PC (Win95)
   themed content when the user taps a screen mesh on mobile.

   Only active when isMobile() returns true. Built lazily — DOM
   is created on first show.
============================================================ */

import { PERSON, SKILLS, PROJECTS, RESUME, CREDITS } from "./portfolioData.js";

let rootEl = null;
let bodyEl = null;
let backBtnEl = null;
let currentStage = null;
let onCloseCallback = null;

function ensureRoot() {
  if (rootEl) return rootEl;

  rootEl = document.createElement("div");
  rootEl.className = "mobOverlay";
  rootEl.setAttribute("role", "dialog");
  rootEl.setAttribute("aria-modal", "true");
  rootEl.innerHTML = `
    <button class="mobBack" type="button" aria-label="Back to room">
      <span class="mobBackArrow">←</span>
      <span class="mobBackText">Back to room</span>
    </button>
    <div class="mobBody" id="mobBody"></div>
  `;
  document.body.appendChild(rootEl);

  bodyEl = rootEl.querySelector("#mobBody");
  backBtnEl = rootEl.querySelector(".mobBack");

  backBtnEl.addEventListener("click", () => {
    hideMobileOverlay();
  });

  return rootEl;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ============================================================
   TV CONTENT — GeoCities aesthetic
============================================================ */
function tvContentHTML() {
  return `
    <div class="mobTv">
      <div class="mobTvMarquee">
        <div class="mobTvMarqueeTrack">
          ★ WELCOME TO FADIL'S HOMEPAGE ★ LAST UPDATED: TODAY ★
          UNDER CONSTRUCTION ★ THANKS FOR VISITING ★
        </div>
      </div>

      <header class="mobTvHero">
        <h1 class="mobTvWordart">~ Fadil's Home Page ~</h1>
        <div class="mobTvSub">
          <span class="mobBlink">★ NEW! ★</span>
          A place on the World Wide Web
          <span class="mobBlink">★ NEW! ★</span>
        </div>
        <div class="mobTvConstruction">
          🚧 UNDER CONSTRUCTION 🚧
        </div>
      </header>

      <hr class="mobTvRainbow" />

      <section class="mobTvBlock">
        <h2 class="mobTvHeading">~* About Me *~</h2>
        <div class="mobTvPhoto">
          <img src="${PERSON.photo}" alt="${escapeHtml(PERSON.name)}" />
          <div class="mobTvPhotoCaption">It's me!</div>
        </div>
        ${PERSON.bio.map((p) => `<p class="mobTvBio">${escapeHtml(p)}</p>`).join("")}
        <table class="mobTvFact">
          <tr><td class="mobTvFactKey">Name:</td><td>${escapeHtml(PERSON.name)}</td></tr>
          <tr><td class="mobTvFactKey">Location:</td><td>${escapeHtml(PERSON.location)} 🇦🇺</td></tr>
          <tr><td class="mobTvFactKey">Status:</td><td><b style="color:#007700">✓ ${escapeHtml(PERSON.status)}</b></td></tr>
          <tr><td class="mobTvFactKey">Stack:</td><td>React · Three.js · MERN</td></tr>
        </table>
      </section>

      <hr class="mobTvRainbow" />

      <section class="mobTvBlock">
        <h2 class="mobTvHeading">~* Skills *~</h2>
        <div class="mobTvSkills">
          ${Object.entries(SKILLS).map(([cat, items]) => `
            <div class="mobTvSkillCol">
              <h3>${escapeHtml(cat)}</h3>
              <ul>${items.map((s) => `<li>★ ${escapeHtml(s)}</li>`).join("")}</ul>
            </div>
          `).join("")}
        </div>
      </section>

      <hr class="mobTvRainbow" />

      <section class="mobTvBlock">
        <h2 class="mobTvHeading">~* Projects *~</h2>
        <div class="mobTvProjects">
          ${PROJECTS.map((p) => `
            <div class="mobTvProject ${p.status === "live" ? "mobTvProjectLive" : ""}">
              <div class="mobTvProjectGlyph">${p.icon}</div>
              <h3>${escapeHtml(p.name)}</h3>
              <p>${escapeHtml(p.description)}</p>
              <div class="mobTvTechRow">
                ${p.tech.map((t) => `<span class="mobTvTechPill">${escapeHtml(t)}</span>`).join("")}
              </div>
              <div class="mobTvStatus mobTvStatus-${p.status}">
                ${p.status === "live" ? "★ LIVE — YOU ARE HERE! ★" : "★ COMING SOON ★"}
              </div>
              ${p.url ? `<a class="mobTvOpenBtn" href="${p.url}" target="_blank" rel="noopener">Open project →</a>` : ""}
              ${p.github ? `<a class="mobTvGhBtn" href="${p.github}" target="_blank" rel="noopener">View on GitHub</a>` : ""}
            </div>
          `).join("")}
        </div>
      </section>

      <hr class="mobTvRainbow" />

      <section class="mobTvBlock">
        <h2 class="mobTvHeading">~* Resume *~</h2>
        <div class="mobTvResume">
          <h3 class="mobTvResHead">★ Profile</h3>
          <p>${escapeHtml(RESUME.profile)}</p>
          <h3 class="mobTvResHead">★ What I'm Building</h3>
          <ul>${RESUME.building.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
          <h3 class="mobTvResHead">★ Education &amp; Focus</h3>
          <ul>${RESUME.education.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>
          <h3 class="mobTvResHead">★ Availability</h3>
          <p>${escapeHtml(RESUME.availability)}</p>
        </div>
      </section>

      <hr class="mobTvRainbow" />

      <section class="mobTvBlock">
        <h2 class="mobTvHeading">~* Contact Me! *~</h2>
        <p class="mobTvCentered">
          <a class="mobTvBigMail" href="mailto:${escapeHtml(PERSON.email)}">
            📧 ${escapeHtml(PERSON.email)}
          </a>
        </p>
        <table class="mobTvFact mobTvContact">
          <tr><td class="mobTvFactKey">📧 Email</td><td><a href="mailto:${escapeHtml(PERSON.email)}">${escapeHtml(PERSON.email)}</a></td></tr>
          <tr><td class="mobTvFactKey">💼 LinkedIn</td><td><a href="${PERSON.linkedin.url}" target="_blank" rel="noopener">${escapeHtml(PERSON.linkedin.handle)}</a></td></tr>
          <tr><td class="mobTvFactKey">🐙 GitHub</td><td><a href="${PERSON.github.url}" target="_blank" rel="noopener">${escapeHtml(PERSON.github.handle)}</a></td></tr>
          <tr><td class="mobTvFactKey">📍 Location</td><td>${escapeHtml(PERSON.location)} (Remote OK)</td></tr>
        </table>
      </section>

      <hr class="mobTvRainbow" />

      <footer class="mobTvFooter">
        <div class="mobTvCounter">
          You are visitor: <span class="mobTvCounterDigits">00012846</span>
        </div>
        <div class="mobTvCopy">© 1999–${new Date().getFullYear()} ${escapeHtml(PERSON.name)} · No Java required</div>
      </footer>
    </div>
  `;
}

/* ============================================================
   PC CONTENT — Win95 aesthetic
============================================================ */
function pcContentHTML() {
  return `
    <div class="mobPc">
      <header class="mobPcTitlebar">
        <span class="mobPcSysIcon">💻</span>
        <span class="mobPcTitle">My Computer — Portfolio</span>
      </header>

      <div class="mobPcBody">
        <div class="mobPcDesktop">
          <h2 class="mobPcHeading">Welcome to my desktop</h2>
          <p class="mobPcLead">Tap an icon below to read more about that section.</p>

          <div class="mobPcIcons">
            <a href="#mob-about" class="mobPcIcon">
              <span class="mobPcIconGlyph">👤</span>
              <span class="mobPcIconLabel">About Me</span>
            </a>
            <a href="#mob-projects" class="mobPcIcon">
              <span class="mobPcIconGlyph">💾</span>
              <span class="mobPcIconLabel">Projects</span>
            </a>
            <a href="#mob-resume" class="mobPcIcon">
              <span class="mobPcIconGlyph">📜</span>
              <span class="mobPcIconLabel">Resume</span>
            </a>
            <a href="#mob-contact" class="mobPcIcon">
              <span class="mobPcIconGlyph">📧</span>
              <span class="mobPcIconLabel">Contact</span>
            </a>
          </div>
        </div>

        <section id="mob-about" class="mobPcWindow">
          <div class="mobPcWinbar">About Me</div>
          <div class="mobPcWinbody">
            ${PERSON.bio.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
            <table class="mobPcFact">
              <tr><td class="mobPcFactKey">Name</td><td>${escapeHtml(PERSON.name)}</td></tr>
              <tr><td class="mobPcFactKey">Location</td><td>${escapeHtml(PERSON.location)}</td></tr>
              <tr><td class="mobPcFactKey">Status</td><td>${escapeHtml(PERSON.status)}</td></tr>
            </table>
          </div>
        </section>

        <section id="mob-projects" class="mobPcWindow">
          <div class="mobPcWinbar">My Projects</div>
          <div class="mobPcWinbody">
            <div class="mobPcProjects">
              ${PROJECTS.map((p) => `
                <div class="mobPcProject ${p.status === "live" ? "mobPcProjectLive" : ""}">
                  <div class="mobPcProjectHead">
                    <span class="mobPcProjectIcon">${p.icon}</span>
                    <span class="mobPcProjectName">${escapeHtml(p.name)}</span>
                    <span class="mobPcProjectBadge mobPcProjectBadge-${p.status}">${p.status === "live" ? "LIVE" : "SOON"}</span>
                  </div>
                  <p>${escapeHtml(p.description)}</p>
                  <div class="mobPcTech">
                    ${p.tech.map((t) => `<span class="mobPcTechChip">${escapeHtml(t)}</span>`).join("")}
                  </div>
                  ${p.url ? `<a class="mobPcBtn" href="${p.url}" target="_blank" rel="noopener">Open</a>` : ""}
                </div>
              `).join("")}
            </div>
          </div>
        </section>

        <section id="mob-resume" class="mobPcWindow">
          <div class="mobPcWinbar">Resume.txt — Notepad</div>
          <div class="mobPcWinbody mobPcNotepad">
            <h3>★ Profile</h3>
            <p>${escapeHtml(RESUME.profile)}</p>
            <h3>★ Skills</h3>
            ${Object.entries(SKILLS).map(([cat, items]) =>
              `<p><b>${escapeHtml(cat)}:</b> ${items.map(escapeHtml).join(", ")}</p>`
            ).join("")}
            <h3>★ What I'm Building</h3>
            <ul>${RESUME.building.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
            <h3>★ Education &amp; Focus</h3>
            <ul>${RESUME.education.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>
            <h3>★ Availability</h3>
            <p>${escapeHtml(RESUME.availability)}</p>
          </div>
        </section>

        <section id="mob-contact" class="mobPcWindow">
          <div class="mobPcWinbar">Contact</div>
          <div class="mobPcWinbody">
            <p class="mobPcCentered">
              <a class="mobPcBigMail" href="mailto:${escapeHtml(PERSON.email)}">
                📧 ${escapeHtml(PERSON.email)}
              </a>
            </p>
            <table class="mobPcFact">
              <tr><td class="mobPcFactKey">Email</td><td><a href="mailto:${escapeHtml(PERSON.email)}">${escapeHtml(PERSON.email)}</a></td></tr>
              <tr><td class="mobPcFactKey">LinkedIn</td><td><a href="${PERSON.linkedin.url}" target="_blank" rel="noopener">${escapeHtml(PERSON.linkedin.handle)}</a></td></tr>
              <tr><td class="mobPcFactKey">GitHub</td><td><a href="${PERSON.github.url}" target="_blank" rel="noopener">${escapeHtml(PERSON.github.handle)}</a></td></tr>
              <tr><td class="mobPcFactKey">Location</td><td>${escapeHtml(PERSON.location)}</td></tr>
            </table>
          </div>
        </section>

        <div class="mobPcTaskbar">
          <span class="mobPcStart"><span class="mobPcStartFlag">⊞</span> Start</span>
          <span class="mobPcClock" id="mobPcClock">12:00 PM</span>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   SHOW / HIDE
============================================================ */
export function showMobileOverlay(stage, onClose) {
  ensureRoot();
  currentStage = stage;
  onCloseCallback = onClose || null;

  // Pick content based on stage
  if (stage === "tv") {
    rootEl.dataset.stage = "tv";
    bodyEl.innerHTML = tvContentHTML();
  } else if (stage === "computer") {
    rootEl.dataset.stage = "computer";
    bodyEl.innerHTML = pcContentHTML();
    // Live clock in fake taskbar
    const clockEl = bodyEl.querySelector("#mobPcClock");
    if (clockEl) {
      const updateClock = () => {
        const d = new Date();
        let h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        clockEl.textContent = `${h}:${m} ${ampm}`;
      };
      updateClock();
      clockEl.dataset.timer = setInterval(updateClock, 30000);
    }

    // Smooth scroll for desktop icons
    bodyEl.querySelectorAll(".mobPcIcon").forEach((icon) => {
      icon.addEventListener("click", (e) => {
        const href = icon.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        const target = bodyEl.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  // Reset scroll so each open starts at the top
  bodyEl.scrollTop = 0;

  // Show with slide-up animation
  rootEl.classList.add("mobOverlay-open");
  document.body.classList.add("mobOverlay-active");
}

export function hideMobileOverlay() {
  if (!rootEl) return;
  rootEl.classList.remove("mobOverlay-open");
  document.body.classList.remove("mobOverlay-active");

  // Stop any clock timer
  const clockEl = bodyEl?.querySelector("#mobPcClock");
  if (clockEl?.dataset.timer) {
    clearInterval(parseInt(clockEl.dataset.timer));
  }

  if (typeof onCloseCallback === "function") {
    onCloseCallback();
    onCloseCallback = null;
  }
  currentStage = null;
}

export function isMobileOverlayOpen() {
  return !!(rootEl && rootEl.classList.contains("mobOverlay-open"));
}
