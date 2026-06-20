/**
 * map.js
 * Controla o mapa Leaflet: inicialização, renderização do GeoJSON,
 * cores por filtro, interações, ripple e legenda.
 *
 * Autor: Leonardo Farias Martins
 */

const MapCtrl = (() => {

  let map          = null;
  let geoLayer     = null;
  let selectedLayer= null;
  let index        = {};         // { cca2: country, cca3: country }
  let activeFilter = "region";
  let onSelect     = null;

  const tip     = document.getElementById("hover-tip");
  const tipFlag = document.getElementById("ht-flag");
  const tipName = document.getElementById("ht-name");
  const tipReg  = document.getElementById("ht-region");
  const mapEl   = document.getElementById("map");

  /* ── Inicialização ──────────────────────────────────────── */
  function init(selectCallback) {
    onSelect = selectCallback;

    map = L.map("map", {
      center:         CONFIG.map.center,
      zoom:           CONFIG.map.zoom,
      minZoom:        CONFIG.map.minZoom,
      maxZoom:        CONFIG.map.maxZoom,
      zoomControl:    true,
      attributionControl: true,
    });

    // Tile escuro CartoDB
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
        subdomains:  "abcd",
        maxZoom:     19,
        opacity:     0.5,
      }
    ).addTo(map);

    map.zoomControl.setPosition("bottomright");

    // Move tooltip junto com o mouse
    mapEl.addEventListener("mousemove", e => {
      const r = mapEl.getBoundingClientRect();
      tip.style.left = (e.clientX - r.left + 16) + "px";
      tip.style.top  = (e.clientY - r.top  - 48) + "px";
    });

    // Clique no fundo do mapa (sem país) → deselect
    map.on("click", () => {
      if (selectedLayer) {
        geoLayer.resetStyle(selectedLayer);
        selectedLayer = null;
      }
    });
  }

  /* ── Carga do GeoJSON ───────────────────────────────────── */
  function load(geojson, countries) {
    // Indexa por cca2 e cca3
    countries.forEach(c => {
      if (c.cca2) index[c.cca2] = c;
      if (c.cca3) index[c.cca3] = c;
    });

    geoLayer = L.geoJSON(geojson, {
      style:         f => featureStyle(f, false),
      onEachFeature: (f, layer) => {
        layer.on({
          mouseover: e => onHover(e, f),
          mouseout:  e => onOut(e, f),
          click:     e => onClick(e, f),
        });
      },
    }).addTo(map);
  }

  /* ── Estilo de features ─────────────────────────────────── */
  function resolveCountry(f) {
    const p = f.properties || {};
    // datasets/geo-countries GeoJSON usa estas chaves:
    return (
      index[p["ISO3166-1-Alpha-2"]] ||
      index[p["ISO3166-1-Alpha-3"]] ||
      index[p.ISO_A2] ||
      index[p.iso_a2] ||
      index[p.ISO_A3] ||
      index[p.iso_a3] ||
      null
    );
  }

  function fillColor(country) {
    if (!country) return CONFIG.regionColors["default"];
    if (activeFilter === "region")     return CONFIG.regionColors[country.region] || CONFIG.regionColors["default"];
    if (activeFilter === "population") return choroplethColor("population", country.population);
    if (activeFilter === "area")       return choroplethColor("area", country.area);
    return CONFIG.regionColors["default"];
  }

  function featureStyle(f, selected) {
    const c    = resolveCountry(f);
    const fill = fillColor(c);
    const base = { ...CONFIG.poly.base, fillColor: fill };
    return selected ? { ...base, ...CONFIG.poly.selected } : base;
  }

  /* ── Interações ─────────────────────────────────────────── */
  function onHover(e, f) {
    const layer   = e.target;
    const country = resolveCountry(f);
    if (!country) return;

    if (layer !== selectedLayer) {
      layer.setStyle({ ...CONFIG.poly.hover, fillColor: layer.options.fillColor });
      layer.bringToFront();
    }

    tipFlag.textContent = country.flag || "";
    tipName.textContent = country.name?.common || "—";
    tipReg.textContent  = country.region || "";
    tip.classList.add("visible");
  }

  function onOut(e, f) {
    const layer = e.target;
    if (layer !== selectedLayer) geoLayer.resetStyle(layer);
    tip.classList.remove("visible");
  }

  function onClick(e, f) {
    L.DomEvent.stopPropagation(e);
    const country = resolveCountry(f);
    if (!country) return;

    // Ripple visual no ponto clicado
    spawnRipple(e.originalEvent);

    // Reset layer anterior
    if (selectedLayer) geoLayer.resetStyle(selectedLayer);
    selectedLayer = e.target;
    selectedLayer.setStyle({ ...CONFIG.poly.selected, fillColor: selectedLayer.options.fillColor });
    selectedLayer.bringToFront();

    if (onSelect) onSelect(country);
  }

  /* ── Ripple ─────────────────────────────────────────────── */
  function spawnRipple(e) {
    const rect   = mapEl.getBoundingClientRect();
    const ripple = document.createElement("div");
    ripple.className = "map-ripple";
    ripple.style.left = (e.clientX - rect.left) + "px";
    ripple.style.top  = (e.clientY - rect.top)  + "px";
    mapEl.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  }

  /* ── Filtro de cor ──────────────────────────────────────── */
  function setFilter(filter) {
    activeFilter = filter;
    if (!geoLayer) return;

    geoLayer.eachLayer(layer => {
      const c    = resolveCountry(layer.feature);
      const fill = fillColor(c);
      const isSelected = layer === selectedLayer;
      layer.setStyle(isSelected
        ? { ...CONFIG.poly.selected, fillColor: fill }
        : { ...CONFIG.poly.base, fillColor: fill }
      );
    });

    renderLegend(filter);
  }

  /* ── Voar até um país ───────────────────────────────────── */
  function flyTo(country) {
    if (!country?.latlng?.length) return;
    const [lat, lng] = country.latlng;
    const zoom = country.area > 1_000_000 ? 3 : country.area > 100_000 ? 4 : 5;
    map.flyTo([lat, lng], zoom, { duration: 1.1, easeLinearity: 0.35 });
  }

  /* ── Legenda ────────────────────────────────────────────── */
  function renderLegend(filter) {
    const container = document.getElementById("map-legend");
    const entries   = CONFIG.legendEntries[filter] || [];

    const labels = { region: "Região", population: "População", area: "Área" };

    container.innerHTML = `<p class="legend-heading">${labels[filter] || filter}</p>` +
      entries.map(e => `
        <div class="legend-entry">
          <span class="legend-swatch" style="background:${e.color}"></span>
          <span>${e.label}</span>
        </div>
      `).join("");
  }

  return { init, load, setFilter, flyTo, renderLegend };

})();
