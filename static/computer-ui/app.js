const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* -------------------------
  Clock
-------------------------- */
const clockEl = $("#clock");
function tick() {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  clockEl.textContent = `${hh}:${m} ${ampm}`;
}
tick();
setInterval(tick, 10000);

/* -------------------------
  Start menu
-------------------------- */
const startBtn = $("#startBtn");
const startMenu = $("#startMenu");

function setStart(open) {
  startMenu.classList.toggle("open", open);
  startMenu.setAttribute("aria-hidden", open ? "false" : "true");
}

startBtn?.addEventListener("click", () =>
  setStart(!startMenu.classList.contains("open")),
);
window.addEventListener("mousedown", (e) => {
  if (!startMenu.contains(e.target) && !startBtn.contains(e.target))
    setStart(false);
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setStart(false);
});

/* -------------------------
  Windows open/close/focus + taskbar buttons
-------------------------- */
let zTop = 20;
let activeWin = null;

const tasks = $("#tasks");

function getWin(id) {
  return document.querySelector(`.win[data-win="${id}"]`);
}

function ensureTaskButton(win) {
  const id = win.dataset.win;
  let btn = tasks.querySelector(`[data-task="${id}"]`);
  if (!btn) {
    btn = document.createElement("button");
    btn.className = "taskBtn";
    btn.dataset.task = id;
    btn.textContent = win.querySelector(".wintitle")?.textContent || id;

    btn.addEventListener("click", () => {
      if (activeWin === win && !win.classList.contains("hidden")) {
        win.classList.add("hidden");
        setActiveTask(null);
      } else {
        win.classList.remove("hidden");
        focusWin(win);
      }
    });

    tasks.appendChild(btn);
  }
  return btn;
}

function setActiveTask(idOrNull) {
  $$(".taskBtn").forEach((b) =>
    b.classList.toggle("active", b.dataset.task === idOrNull),
  );
}

function focusWin(win) {
  if (!win) return;
  win.style.zIndex = String(++zTop);
  activeWin = win;

  const id = win.dataset.win;
  ensureTaskButton(win);
  setActiveTask(id);
}

function openWin(id) {
  const win = getWin(id);
  if (!win) return null;
  win.classList.remove("hidden");
  focusWin(win);
  setStart(false);
  return win;
}

function closeWin(win) {
  if (!win) return;
  win.classList.add("hidden");
  if (activeWin === win) {
    activeWin = null;
    setActiveTask(null);
  }
}

/* wire window buttons */
$$(".win").forEach((win) => {
  win.addEventListener("mousedown", () => focusWin(win));

  win
    .querySelector("[data-close]")
    ?.addEventListener("click", () => closeWin(win));
  win.querySelector("[data-min]")?.addEventListener("click", () => {
    win.classList.add("hidden");
    if (activeWin === win) {
      activeWin = null;
      setActiveTask(null);
    }
  });

  win.querySelector("[data-max]")?.addEventListener("click", () => {
    win.classList.toggle("maxed");
    focusWin(win);
  });

  ensureTaskButton(win);
});

/* desktop icons + quicklaunch */
$$("[data-open]").forEach((btn) =>
  btn.addEventListener("click", () => openWin(btn.dataset.open)),
);

/* -------------------------
  Drag windows
-------------------------- */
function makeDraggable(win) {
  const bar = win.querySelector("[data-drag]");
  if (!bar) return;

  let dragging = false;
  let startX = 0,
    startY = 0;
  let baseLeft = 0,
    baseTop = 0;

  const onDown = (e) => {
    if (win.classList.contains("maxed")) return;
    dragging = true;
    focusWin(win);

    startX = e.clientX;
    startY = e.clientY;

    const rect = win.getBoundingClientRect();
    baseLeft = rect.left;
    baseTop = rect.top;

    bar.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const left = Math.max(6, Math.min(window.innerWidth - 120, baseLeft + dx));
    const top = Math.max(6, Math.min(window.innerHeight - 70, baseTop + dy));

    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
  };

  const onUp = () => (dragging = false);

  bar.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}
$$(".win").forEach(makeDraggable);

/* -------------------------
  Explorer demo content
-------------------------- */
const explorerGrid = $("#explorerGrid");
if (explorerGrid) {
  const files = [
    { icon: "📁", name: "Projects", meta: "folder" },
    { icon: "🧊", name: "room.glb", meta: "3D model" },
    { icon: "🛒", name: "amazon.url", meta: "shortcut" },
  ];

  explorerGrid.innerHTML = files
    .map(
      (f) => `
      <div class="file" tabindex="0" data-f="${f.name}">
        <div><b>${f.icon}</b> ${f.name}</div>
        <div style="opacity:.7; font-size:11px;">${f.meta}</div>
      </div>
    `,
    )
    .join("");

  explorerGrid.addEventListener("dblclick", (e) => {
    const card = e.target.closest(".file");
    if (!card) return;
    if (card.dataset.f === "amazon.url") openAmazon1999();
  });
}

/* -------------------------
  Notes (localStorage)
-------------------------- */
const noteTitle = $("#noteTitle");
const noteBody = $("#noteBody");
const noteStatus = $("#noteStatus");
const saveNote = $("#saveNote");
const NOTE_KEY = "room95_note_v1";

function loadNote() {
  if (!noteTitle || !noteBody || !noteStatus) return;
  const raw = localStorage.getItem(NOTE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.title) noteTitle.value = data.title;
    if (data.body) noteBody.value = data.body;
    noteStatus.textContent = "Loaded from disk (kinda).";
  } catch {}
}

function persistNote(msg = "Saved.") {
  if (!noteTitle || !noteBody || !noteStatus) return;
  localStorage.setItem(
    NOTE_KEY,
    JSON.stringify({ title: noteTitle.value, body: noteBody.value }),
  );
  noteStatus.textContent = msg;
}

saveNote?.addEventListener("click", () => persistNote("Saved."));
noteTitle?.addEventListener("input", () => persistNote("Autosaving..."));
noteBody?.addEventListener("input", () => persistNote("Autosaving..."));
loadNote();

/* -------------------------
  Center a window
-------------------------- */
function centerWindow(win) {
  if (!win || win.classList.contains("maxed")) return;

  const rect = win.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const left = Math.max(6, Math.round((window.innerWidth - w) / 2));
  const top = Math.max(6, Math.round((window.innerHeight - 44 - h) / 2)); // 44px taskbar

  win.style.left = `${left}px`;
  win.style.top = `${top}px`;
}

/* -------------------------
  Amazön 1999 (default open)
  - opens IE window
  - centers IE window
  - loads amazon.html in scrollable iframe
-------------------------- */
function openAmazon1999() {
  const win = openWin("internet");
  centerWindow(win);

  const addr = $("#addr");
  const page = $("#iePage");

  if (addr) addr.value = "room95://amazon1999/buy";

  if (page) {
    page.innerHTML = `
      <div style="height:100%; display:flex; justify-content:center;">
        <iframe
          src="./amazon.html"
          title="Amazön 1999"
          style="
            width: 94%;
            max-width: 760px;
            height: 100%;
            border: 2px inset #c0c0c0;
            background: #fff;
          "
        ></iframe>
      </div>
    `;
  }
}

/* Any element with data-amazon opens the fake page */
$$("[data-amazon]").forEach((btn) =>
  btn.addEventListener("click", () => openAmazon1999()),
);

/* Shutdown */
$("#shutdownBtn")?.addEventListener("click", () => {
  setStart(false);
  alert("It is now safe to turn off your computer.");
});

/* ✅ DEFAULT: open Amazön first */
openAmazon1999();

/* -------------------------------------------------
  Bridge messages from nested iframes (amazon.html)
  to the parent Three.js page.

  amazon.html -> (postMessage) -> computer-ui (this)
  computer-ui -> (postMessage) -> Three.js page
--------------------------------------------------*/
window.addEventListener("message", (event) => {
  const data = event?.data;
  if (!data || data.__room95 !== true) return;
  if (data.type !== "ROOM95_SHOP") return;

  // Forward to the Three.js page (the iframe parent)
  try {
    window.parent?.postMessage(data, "*");
  } catch {}
});
