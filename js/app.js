/**
 * app.js
 * Orquestrador principal do Terravex.
 * Inicializa todos os módulos e gerencia a navegação entre abas.
 *
 * Autor: Leonardo Farias Martins
 */

(async function boot() {

  /* ── Navegação por abas ─────────────────────────────────── */
  const mapControls = document.getElementById("map-controls");

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;

      // Atualiza botões
      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });

      // Mostra/esconde panels
      document.getElementById("view-map").hidden    = view !== "map";
      document.getElementById("view-cambio").hidden = view !== "cambio";

      // Controles do mapa só aparecem na aba mapa
      mapControls.style.display = view === "map" ? "flex" : "none";

      // Invalida o mapa ao voltar (Leaflet precisa de resize)
      if (view === "map" && window._leafletMap) {
        setTimeout(() => window._leafletMap.invalidateSize(), 50);
      }
    });
  });

  /* ── Filtro de cor do mapa ──────────────────────────────── */
  document.querySelectorAll(".seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      MapCtrl.setFilter(btn.dataset.filter);
    });
  });

  /* ── Inicializa mapa e painel ───────────────────────────── */
  MapCtrl.init(country => {
    Panel.load(country);
    MapCtrl.flyTo(country);
  });

  MapCtrl.renderLegend("region");
  Panel.setupEvents();

  /* ── Inicializa CambioX ─────────────────────────────────── */
  Cambio.init();

  /* ── Carrega dados do mapa em paralelo ──────────────────── */
  const overlay = document.getElementById("init-overlay");

  try {
    console.log("[Terravex] Carregando GeoJSON e países...");

    const [geojson, countries] = await Promise.all([
      API.getGeoJSON(),
      API.getAllCountries(),
    ]);

    console.log("[Terravex] Dados recebidos — países:", countries.length, "| features:", geojson.features?.length);

    const byCode = {};
    countries.forEach(c => { if (c.cca2) byCode[c.cca2] = c; });

    MapCtrl.load(geojson, countries);

    Panel.renderSuggestions(byCode, country => {
      // Vai para a aba mapa e abre o país
      document.getElementById("tab-map").click();
      Panel.load(country);
      MapCtrl.flyTo(country);
    });

    Search.init(countries, country => {
      document.getElementById("tab-map").click();
      Panel.load(country);
      MapCtrl.flyTo(country);
    });

    overlay.classList.add("hidden");
    setTimeout(() => overlay.remove(), 700);

    console.log("[Terravex] Pronto.");

  } catch (err) {
    console.error("[Terravex] Erro na inicialização:", err);
    const txt = overlay.querySelector(".init-text");
    if (txt) txt.textContent = "Erro ao carregar. Recarregue a página.";
    Panel.showError("Não foi possível carregar os dados. Verifique sua conexão.");
  }

})();
