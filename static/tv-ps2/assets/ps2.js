const items = [...document.querySelectorAll(".item")];

const bigTitle = document.getElementById("bigTitle");
const subTitle = document.getElementById("subTitle");
const clockEl = document.getElementById("clock");

let index = Math.max(
  0,
  items.findIndex((i) => i.classList.contains("active")),
);
if (index === -1) index = 0;

function setActive(i) {
  index = (i + items.length) % items.length;

  items.forEach((btn, k) => btn.classList.toggle("active", k === index));

  const btn = items[index];
  bigTitle.textContent = btn.dataset.title || "Menu";
  subTitle.textContent = btn.dataset.sub || "";
}

function openActive() {
  const btn = items[index];
  const link = btn.dataset.link;
  if (link) window.location.href = link;
}

items.forEach((btn, i) => {
  btn.addEventListener("mouseenter", () => setActive(i));
  btn.addEventListener("focus", () => setActive(i));

  btn.addEventListener("click", () => {
    setActive(i);
    setTimeout(openActive, 90);
  });
});

window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  if (e.key === "ArrowRight") {
    e.preventDefault();
    setActive(index + 1);
    items[index].focus({ preventScroll: true });
  }

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setActive(index - 1);
    items[index].focus({ preventScroll: true });
  }

  if (e.key === "Enter") {
    e.preventDefault();
    openActive();
  }
  // Esc does nothing on home
});

function tick() {
  const d = new Date();
  clockEl.textContent =
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0");
}
tick();
setInterval(tick, 10000);

setActive(index);
