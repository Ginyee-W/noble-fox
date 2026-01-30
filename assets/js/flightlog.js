(function () {
  const root = document.getElementById("flightlog");
  if (!root) return;

  const jsonUrl = root.dataset.jsonUrl;
  const yearSelect = document.getElementById("flightYear");
  const mapEl = document.getElementById("flight-map");

  const map = L.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true }).setView([20, 0], 2);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 6,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const layer = L.layerGroup().addTo(map);

  function toNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }

  function controlPoint(a, b) {
    const lat1 = a[0], lon1 = a[1];
    const lat2 = b[0], lon2 = b[1];
    const midLat = (lat1 + lat2) / 2;
    const midLon = (lon1 + lon2) / 2;

    const dx = lon2 - lon1;
    const dy = lat2 - lat1;

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ox = (-dy / len) * 10;
    const oy = (dx / len) * 10;

    return [midLat + oy, midLon + ox];
  }

  function renderListFilter(year) {
    document.querySelectorAll(".flight-year").forEach((sec) => {
      sec.style.display = (year === "all" || sec.dataset.year === year) ? "" : "none";
    });
  }

  function renderMap(flights, year) {
    layer.clearLayers();

    const selected = (year === "all") ? flights : flights.filter(f => f.year === year);
    const bounds = [];

    selected.forEach((f) => {
      const a = [toNum(f.from_lat), toNum(f.from_lon)];
      const b = [toNum(f.to_lat), toNum(f.to_lon)];
      if (!a[0] || !a[1] || !b[0] || !b[1]) return;

      const c = controlPoint(a, b);

      const path = ["M", a, "Q", c, b];
      const curve = L.curve(path, { weight: 2, opacity: 0.75 });

      curve.on("click", () => {
        const html = `<a href="${f.url}">${f.flight_no || f.title}</a><br/>${f.date} · ${f.aircraft || ""}`;
        L.popup().setLatLng(c).setContent(html).openOn(map);
      });

      curve.addTo(layer);
      bounds.push(a, b);
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [20, 20] });
  }

  async function init() {
    const res = await fetch(jsonUrl);
    const flights = await res.json();

    const apply = () => {
      const year = yearSelect.value;
      renderListFilter(year);
      renderMap(flights, year);
    };

    yearSelect.addEventListener("change", apply);
    apply();
  }

  init().catch(console.error);
})();
