"use strict";

/* ------------------------------------------------------------
   Settings
   Change DEFAULT_API if your FastAPI server runs somewhere else.
   You can also click the "API connected" label to change it in the page.
   ------------------------------------------------------------ */
const DEFAULT_API = "http://127.0.0.1:8000";
const API_STORE = "nyc-room-api";

/* Order matches model.classes_, so Probability[i] belongs to CLASSES[i]. */
const CLASSES = [
  { key: "Entire home/apt", cls: "home", color: "#f6b94d", rows: 10 },
  { key: "Private room", cls: "private", color: "#4fd1c5", rows: 7 },
  { key: "Shared room", cls: "shared", color: "#ff8aa1", rows: 5 },
];

const BOROUGHS = {
  Manhattan: { lat: 40.7831, lng: -73.9712 },
  Brooklyn: { lat: 40.6782, lng: -73.9442 },
  Queens: { lat: 40.7282, lng: -73.7949 },
  Bronx: { lat: 40.8448, lng: -73.8648 },
  "Staten Island": { lat: 40.5795, lng: -74.1502 },
};

/* Neighbourhoods the model knows, grouped by borough. */
const HOODS = {
  "Bronx": [
    "Allerton", "Baychester", "Belmont", "Bronxdale", "Castle Hill", "City Island",
    "Claremont Village", "Clason Point", "Co-op City", "Concord", "Concourse",
    "Concourse Village", "East Morrisania", "Eastchester", "Edenwald", "Fieldston", "Fordham",
    "Highbridge", "Hunts Point", "Kingsbridge", "Longwood", "Marble Hill", "Melrose",
    "Morris Heights", "Morris Park", "Morrisania", "Mott Haven", "Mount Eden", "Mount Hope",
    "North Riverdale", "Norwood", "Olinville", "Parkchester", "Pelham Bay", "Pelham Gardens",
    "Port Morris", "Riverdale", "Schuylerville", "Soundview", "Spuyten Duyvil", "Throgs Neck",
    "Tremont", "Unionport", "University Heights", "Van Nest", "Wakefield", "West Farms",
    "Westchester Square", "Williamsbridge", "Woodlawn"
  ],
  "Brooklyn": [
    "Bath Beach", "Bay Ridge", "Bedford-Stuyvesant", "Bensonhurst", "Bergen Beach",
    "Boerum Hill", "Borough Park", "Brighton Beach", "Brooklyn Heights", "Brownsville",
    "Bushwick", "Canarsie", "Carroll Gardens", "Clinton Hill", "Cobble Hill", "Columbia St",
    "Coney Island", "Crown Heights", "Cypress Hills", "DUMBO", "Downtown Brooklyn",
    "Dyker Heights", "East Flatbush", "East New York", "Flatbush", "Flatlands", "Fort Greene",
    "Fort Hamilton", "Gowanus", "Gravesend", "Greenpoint", "Kensington", "Manhattan Beach",
    "Midwood", "Mill Basin", "Navy Yard", "Park Slope", "Prospect Heights",
    "Prospect-Lefferts Gardens", "Red Hook", "Sea Gate", "Sheepshead Bay", "South Slope",
    "Sunset Park", "Vinegar Hill", "Williamsburg", "Windsor Terrace"
  ],
  "Manhattan": [
    "Battery Park City", "Chelsea", "Chinatown", "Civic Center", "East Harlem", "East Village",
    "Financial District", "Flatiron District", "Gramercy", "Greenwich Village", "Harlem",
    "Hell's Kitchen", "Inwood", "Kips Bay", "Little Italy", "Lower East Side", "Midtown",
    "Morningside Heights", "Murray Hill", "NoHo", "Nolita", "Roosevelt Island", "SoHo",
    "Stuyvesant Town", "Theater District", "Tribeca", "Two Bridges", "Upper East Side",
    "Upper West Side", "Washington Heights", "West Village"
  ],
  "Queens": [
    "Arverne", "Astoria", "Bay Terrace", "Bayside", "Bayswater", "Belle Harbor", "Bellerose",
    "Breezy Point", "Briarwood", "Cambria Heights", "College Point", "Corona",
    "Ditmars Steinway", "Douglaston", "East Elmhurst", "Edgemere", "Elmhurst", "Far Rockaway",
    "Flushing", "Forest Hills", "Fresh Meadows", "Glendale", "Hollis", "Holliswood",
    "Howard Beach", "Jackson Heights", "Jamaica", "Jamaica Estates", "Jamaica Hills",
    "Kew Gardens", "Kew Gardens Hills", "Laurelton", "Little Neck", "Long Island City",
    "Maspeth", "Middle Village", "Neponsit", "Ozone Park", "Queens Village", "Rego Park",
    "Richmond Hill", "Ridgewood", "Rockaway Beach", "Rosedale", "South Ozone Park",
    "Springfield Gardens", "St. Albans", "Sunnyside", "Whitestone", "Woodhaven", "Woodside"
  ],
  "Staten Island": [
    "Arden Heights", "Arrochar", "Bay Terrace, Staten Island", "Bull's Head",
    "Castleton Corners", "Clifton", "Dongan Hills", "Eltingville", "Emerson Hill",
    "Graniteville", "Grant City", "Great Kills", "Grymes Hill", "Howland Hook", "Huguenot",
    "Mariners Harbor", "Midland Beach", "New Brighton", "New Dorp", "New Dorp Beach",
    "New Springville", "Oakwood", "Port Richmond", "Prince's Bay", "Randall Manor", "Rosebank",
    "Rossville", "Shore Acres", "Silver Lake", "South Beach", "St. George", "Stapleton",
    "Todt Hill", "Tompkinsville", "Tottenville", "West Brighton", "Westerleigh", "Willowbrook"
  ],
};

/* Same rules as your Pydantic model. */
const RULES = {
  latitude: { label: "Latitude", type: "float", min: -90, max: 90 },
  longitude: { label: "Longitude", type: "float", min: -180, max: 180 },
  price: { label: "Price", type: "float", min: 0, exclusiveMin: true },
  minimum_nights: { label: "Minimum nights", type: "int", min: 1, max: 365 },
  number_of_reviews: { label: "Total reviews", type: "int", min: 0 },
  reviews_per_month: { label: "Reviews per month", type: "float", min: 0 },
  calculated_host_listings_count: { label: "Host listings", type: "int", min: 0 },
  availability_365: { label: "Availability", type: "int", min: 0, max: 365 },
};
const NUMERIC = Object.keys(RULES);

const EXAMPLES = [
  { // likely an entire home
    neighbourhood_group: "Manhattan", neighbourhood: "Midtown",
    latitude: 40.7549, longitude: -73.984, price: 250, minimum_nights: 2,
    number_of_reviews: 30, reviews_per_month: 1.2,
    calculated_host_listings_count: 2, availability_365: 200,
  },
  { // likely a private room
    neighbourhood_group: "Brooklyn", neighbourhood: "Bedford-Stuyvesant",
    latitude: 40.6782, longitude: -73.9442, price: 60, minimum_nights: 3,
    number_of_reviews: 10, reviews_per_month: 0.5,
    calculated_host_listings_count: 1, availability_365: 150,
  },
  { // likely a shared room
    neighbourhood_group: "Queens", neighbourhood: "Jackson Heights",
    latitude: 40.75, longitude: -73.87, price: 25, minimum_nights: 1,
    number_of_reviews: 2, reviews_per_month: 0.1,
    calculated_host_listings_count: 10, availability_365: 365,
  },
];

const START = {
  neighbourhood_group: "Brooklyn", neighbourhood: "Williamsburg",
  latitude: 40.7081, longitude: -73.9571, price: 150, minimum_nights: 2,
  number_of_reviews: 2, reviews_per_month: 1,
  calculated_host_listings_count: 1, availability_365: 365,
};

/* ------------------------------------------------------------
   Helpers
   ------------------------------------------------------------ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const form = $("#form");
const card = $("#resultCard");
const city = $("#city");
const goBtn = $("#goBtn");
const hoodSel = $("#neighbourhood");
const boroughSel = $("#neighbourhood_group");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let apiBase = (() => {
  try { return localStorage.getItem(API_STORE) || DEFAULT_API; } catch { return DEFAULT_API; }
})();
let exampleIndex = 0;

function setState(state) { card.dataset.state = state; }

/* ------------------------------------------------------------
   Background: faint skyline and stars
   ------------------------------------------------------------ */
function buildBackground() {
  const sky = $("#bgSky");
  sky.innerHTML = "";

  for (let i = 0; i < 46; i++) {
    const s = document.createElement("span");
    s.className = "star";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 70 + "%";
    s.style.setProperty("--d", 3 + Math.random() * 5 + "s");
    s.style.setProperty("--delay", Math.random() * 4 + "s");
    sky.appendChild(s);
  }

  const line = document.createElement("div");
  line.className = "skyline";
  const count = Math.max(14, Math.round(window.innerWidth / 52));
  for (let i = 0; i < count; i++) {
    const b = document.createElement("span");
    b.className = "bar-b";
    b.style.height = 50 + Math.random() * 190 + "px";
    line.appendChild(b);
  }
  sky.appendChild(line);
}

let bgWidth = window.innerWidth;
let bgTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(bgTimer);
  bgTimer = setTimeout(() => {
    if (Math.abs(window.innerWidth - bgWidth) > 120) {
      bgWidth = window.innerWidth;
      buildBackground();
    }
  }, 250);
});

/* ------------------------------------------------------------
   The three towers
   ------------------------------------------------------------ */
const towers = CLASSES.map((c) => {
  const col = document.createElement("div");
  col.className = "tower-col";

  const tower = document.createElement("div");
  tower.className = "tower";
  tower.dataset.cls = c.cls;

  const wins = [];
  for (let i = 0; i < c.rows * 3; i++) {
    const w = document.createElement("span");
    w.className = "win";
    tower.appendChild(w);
    wins.push(w);
  }

  const name = document.createElement("span");
  name.className = "tower-name";
  name.textContent = c.key;

  col.append(tower, name);
  city.appendChild(col);

  // fixed random order so windows light up in a stable pattern
  const order = wins.map((_, i) => i).sort(() => Math.random() - 0.5);
  return { col, tower, wins, order };
});

function lightTower(t, ratio, { stagger = 900 } = {}) {
  const n = Math.round(ratio * t.wins.length);
  t.order.forEach((winIndex, rank) => {
    const w = t.wins[winIndex];
    w.style.transitionDelay = reduced ? "0s" : (rank / t.wins.length) * (stagger / 1000) + "s";
    w.classList.toggle("on", rank < n);
  });
}

function lightAll(ratios) {
  towers.forEach((t, i) => lightTower(t, ratios[i]));
}

function markTop(index) {
  towers.forEach((t, i) => {
    t.tower.classList.toggle("top", i === index);
    t.col.classList.toggle("top", i === index);
  });
}

function setThinking(on) {
  city.classList.toggle("thinking", on);
  if (on) {
    towers.forEach((t) => {
      t.wins.forEach((w) => w.style.setProperty("--fd", Math.random() * 0.4 + "s"));
    });
    lightAll([0.4, 0.4, 0.4]);
    markTop(-1);
  }
}

/* ------------------------------------------------------------
   Form basics
   ------------------------------------------------------------ */
function fillHoods(borough, keep) {
  hoodSel.innerHTML = "";
  const list = HOODS[borough] || [];
  list.forEach((n) => hoodSel.add(new Option(n, n)));
  if (keep && list.includes(keep)) hoodSel.value = keep;
}

boroughSel.addEventListener("change", () => {
  fillHoods(boroughSel.value);
  const c = BOROUGHS[boroughSel.value];
  if (c) {
    form.elements.latitude.value = c.lat;
    form.elements.longitude.value = c.lng;
    clearErr("latitude");
    clearErr("longitude");
  }
});

const avail = form.elements.availability_365;
function updateAvail() {
  const pct = Number(avail.value) / 365;
  avail.style.setProperty("--pct", pct);
  $("#availVal").textContent = avail.value;
}
avail.addEventListener("input", updateAvail);

function writeForm(d) {
  boroughSel.value = d.neighbourhood_group;
  fillHoods(d.neighbourhood_group, d.neighbourhood);
  NUMERIC.forEach((name) => {
    form.elements[name].value = d[name];
    clearErr(name);
  });
  clearErr("neighbourhood");
  updateAvail();
}

function readForm() {
  const body = { neighbourhood_group: boroughSel.value, neighbourhood: hoodSel.value };
  NUMERIC.forEach((name) => { body[name] = Number(form.elements[name].value); });
  return body;
}

$("#exampleBtn").addEventListener("click", () => {
  writeForm(EXAMPLES[exampleIndex % EXAMPLES.length]);
  exampleIndex++;
  if (!reduced) {
    form.animate(
      [{ boxShadow: "0 0 0 0 rgba(246,185,77,0.5)" }, { boxShadow: "0 0 0 12px rgba(246,185,77,0)" }],
      { duration: 650, easing: "ease-out" }
    );
  }
});

/* ------------------------------------------------------------
   Validation
   ------------------------------------------------------------ */
function showErr(name, msg) {
  const el = form.elements[name];
  if (el && el.closest(".f")) el.closest(".f").classList.add("bad");
  const slot = $("#" + name + "-err");
  if (slot) slot.textContent = msg;
}

function clearErr(name) {
  const el = form.elements[name];
  if (el && el.closest(".f")) el.closest(".f").classList.remove("bad");
  const slot = $("#" + name + "-err");
  if (slot) slot.textContent = "";
}

function check(name) {
  const r = RULES[name];
  const raw = form.elements[name].value.trim();
  if (raw === "") return `Enter a value for ${r.label.toLowerCase()}.`;
  const n = Number(raw);
  if (!Number.isFinite(n)) return `${r.label} must be a number.`;
  if (r.type === "int" && !Number.isInteger(n)) return `${r.label} must be a whole number.`;
  if (r.exclusiveMin && n <= r.min) return `${r.label} must be more than ${r.min}.`;
  if (!r.exclusiveMin && r.min !== undefined && n < r.min) return `${r.label} must be at least ${r.min}.`;
  if (r.max !== undefined && n > r.max) return `${r.label} must be ${r.max} or less.`;
  return "";
}

function validate() {
  let first = null;
  NUMERIC.forEach((name) => {
    const msg = check(name);
    if (msg) { showErr(name, msg); first = first || form.elements[name]; }
    else clearErr(name);
  });
  if (!hoodSel.value) {
    showErr("neighbourhood", "Choose a neighbourhood.");
    first = first || hoodSel;
  } else clearErr("neighbourhood");
  if (first) first.focus();
  return !first;
}

NUMERIC.forEach((name) => {
  const el = form.elements[name];
  if (el.type === "range") return;
  el.addEventListener("input", () => clearErr(name));
  el.addEventListener("blur", () => { const m = check(name); m ? showErr(name, m) : clearErr(name); });
});
hoodSel.addEventListener("change", () => clearErr("neighbourhood"));

/* ------------------------------------------------------------
   API
   ------------------------------------------------------------ */
async function api(path, options = {}, timeout = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(apiBase + path, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function setStatus(state) {
  const el = $("#status");
  el.dataset.state = state;
  $("#statusText").textContent =
    state === "online" ? "API connected" : state === "offline" ? "API offline" : "Checking API";
}

async function pingApi() {
  setStatus("checking");
  try {
    const res = await api("/", {}, 4000);
    if (!res.ok) throw new Error();
    setStatus("online");
  } catch {
    setStatus("offline");
  }
}

$("#status").addEventListener("click", () => {
  const next = window.prompt("Where is your FastAPI server running?", apiBase);
  if (!next || !next.trim()) return;
  apiBase = next.trim().replace(/\/+$/, "");
  try { localStorage.setItem(API_STORE, apiBase); } catch { /* storage blocked */ }
  pingApi();
});

/* ------------------------------------------------------------
   Showing results
   ------------------------------------------------------------ */
function countUp(el, target) {
  if (reduced) { el.textContent = Math.round(target) + "%"; return; }
  const start = performance.now();
  const dur = 900;
  (function frame(now) {
    const t = Math.min(1, (now - start) / dur);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + "%";
    if (t < 1) requestAnimationFrame(frame);
  })(start);
}

function showResult(payload, data) {
  const probs = CLASSES.map((_, i) => (data.Probability && data.Probability[i]) || 0);
  let topIndex = CLASSES.findIndex((c) => c.key === data.Predicted_room_type);
  if (topIndex < 0) topIndex = probs.indexOf(Math.max(...probs));
  const top = CLASSES[topIndex];

  $("#verdictTitle").textContent = top.key;
  $("#verdictTitle").style.setProperty("--vc", top.color);
  $("#verdictSub").textContent =
    `${payload.neighbourhood}, ${payload.neighbourhood_group} · $${payload.price} a night · ` +
    `${Math.round(probs[topIndex] * 100)}% confidence`;

  const list = $("#bars");
  list.innerHTML = "";
  const rows = CLASSES.map((c, i) => {
    const li = document.createElement("li");
    li.className = "row" + (i === topIndex ? " top" : "");
    li.dataset.cls = c.cls;
    li.innerHTML =
      '<div class="row-head"><span class="row-name"></span><span class="row-pct">0%</span></div>' +
      '<div class="track"><span class="fill"></span></div>';
    $(".row-name", li).textContent = c.key;
    list.appendChild(li);
    return li;
  });

  setState("result");
  markTop(topIndex);
  lightAll(probs);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    rows.forEach((li, i) => {
      const fill = $(".fill", li);
      fill.style.transitionDelay = i * 90 + "ms";
      fill.style.transform = `scaleX(${probs[i]})`;
      countUp($(".row-pct", li), probs[i] * 100);
    });
  }));
}

function showFail(title, html) {
  $("#failTitle").textContent = title;
  $("#failMsg").innerHTML = html;
  setState("fail");
  markTop(-1);
  lightAll([0, 0, 0]);
  card.classList.remove("shake");
  void card.offsetWidth;
  card.classList.add("shake");
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function predict() {
  if (!validate()) return;
  const payload = readForm();

  goBtn.disabled = true;
  goBtn.classList.add("loading");
  $(".go-label", goBtn).textContent = "Predicting";
  $("#hint").textContent = "Reading the listing…";
  setState("loading");
  setThinking(true);
  if (window.innerWidth <= 780) card.scrollIntoView({ behavior: "smooth", block: "start" });

  const minWait = new Promise((r) => setTimeout(r, reduced ? 0 : 700));

  try {
    const [res] = await Promise.all([
      api("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      minWait,
    ]);

    let body = null;
    try { body = await res.json(); } catch { /* not JSON */ }

    if (!res.ok) {
      if (res.status === 422 && body && Array.isArray(body.detail)) {
        const lines = body.detail.map((d) => {
          const field = d.loc && d.loc[d.loc.length - 1];
          if (form.elements[field]) showErr(field, d.msg);
          return escapeHtml(`${field}: ${d.msg}`);
        });
        showFail("The API rejected some values", lines.join("<br />"));
      } else {
        showFail("The API returned an error", `Status ${res.status}. Check the terminal running <code>uvicorn</code> for the traceback.`);
      }
      return;
    }

    showResult(payload, body);
    setStatus("online");
  } catch (err) {
    const timedOut = err && err.name === "AbortError";
    showFail(
      timedOut ? "The API took too long" : "Cannot reach the API",
      timedOut
        ? `No answer from <code>${escapeHtml(apiBase)}</code> within 15 seconds.`
        : `Start it with <code>uvicorn main:app --reload</code>, then check the address by clicking the status label above. Tried <code>${escapeHtml(apiBase)}/predict</code>.`
    );
    setStatus("offline");
  } finally {
    setThinking(false);
    goBtn.disabled = false;
    goBtn.classList.remove("loading");
    $(".go-label", goBtn).textContent = "Predict room type";
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  predict();
});

/* ------------------------------------------------------------
   Start
   ------------------------------------------------------------ */
buildBackground();
writeForm(START);
pingApi();
