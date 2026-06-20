/**
 * panel.js
 * Máquina de estados do painel lateral.
 * Busca dados completos via REST Countries para garantir
 * precisão de campos como unMember e independent.
 *
 * Autor: Leonardo Farias Martins
 */

const Panel = (() => {

  let lastCountry = null;

  const states = {
    idle:    document.getElementById("panel-idle"),
    loading: document.getElementById("panel-loading"),
    error:   document.getElementById("panel-error"),
    data:    document.getElementById("panel-data"),
  };

  const scanText = document.getElementById("scan-text");

  const scanMessages = [
    "Conectando à API...",
    "Buscando dados geoeconômicos...",
    "Processando indicadores...",
    "Quase lá...",
  ];

  /* ── Estados ────────────────────────────────────────────── */
  function show(name) {
    for (const [k, el] of Object.entries(states)) el.hidden = k !== name;
  }

  let scanInterval = null;

  function startScan() {
    let i = 0;
    scanText.textContent = scanMessages[0];
    scanInterval = setInterval(() => {
      i = (i + 1) % scanMessages.length;
      scanText.textContent = scanMessages[i];
    }, 900);
  }

  function stopScan() {
    clearInterval(scanInterval);
    scanInterval = null;
  }

  function idle()         { stopScan(); show("idle"); }
  function showError(msg) {
    stopScan();
    document.getElementById("error-body").textContent = msg || "Dados indisponíveis para este país.";
    show("error");
  }

  /* ── Carrega dados de um país ───────────────────────────── */
  async function load(country) {
    lastCountry = country;
    show("loading");
    startScan();

    try {
      // Busca dados completos e econômicos em paralelo
      const [full, eco] = await Promise.all([
        API.getCountry(country.cca2 || country.cca3),
        API.getEconomics(country.cca2 || country.cca3),
      ]);

      stopScan();
      render(full || country, eco);
      show("data");

    } catch (err) {
      console.warn("[Terravex] Erro ao carregar país:", err);
      showError(`Não foi possível carregar dados de ${country.name?.common || "este país"}.`);
    }
  }

  /* ── Render principal ───────────────────────────────────── */
  function render(c, eco) {
    document.getElementById("d-flag").textContent    = c.flag || "";
    document.getElementById("d-name").textContent    = c.name?.common || "—";
    document.getElementById("d-region").textContent  =
      [c.subregion, c.region].filter(Boolean).join(" · ");

    renderMetrics(c, eco);
    renderInfoTable(c, eco);
  }

  /* ── Métricas econômicas ────────────────────────────────── */
  function renderMetrics(c, eco) {
    const grid = document.getElementById("metrics-grid");
    grid.innerHTML = "";

    const cards = [];

    if (eco.gdp?.value)
      cards.push({ label: "PIB total",        value: "US$ " + fmt(eco.gdp.value),       year: eco.gdp.year });
    if (eco.gdpPc?.value)
      cards.push({ label: "PIB per capita",   value: "US$ " + fmt(eco.gdpPc.value),     year: eco.gdpPc.year });
    if (eco.inflation?.value != null)
      cards.push({ label: "Inflação anual",   value: fmtPct(eco.inflation.value),        year: eco.inflation.year });
    if (eco.unemployment?.value != null)
      cards.push({ label: "Desemprego",       value: fmtPct(eco.unemployment.value),     year: eco.unemployment.year });
    if (eco.lifeExp?.value != null)
      cards.push({ label: "Expectativa",      value: Math.round(eco.lifeExp.value) + " anos", year: eco.lifeExp.year });
    if (eco.gini?.value != null)
      cards.push({ label: "Índice Gini",      value: eco.gini.value.toFixed(1),          year: eco.gini.year });

    // Fallbacks com dados do REST Countries
    if (cards.length < 2 && c.population)
      cards.push({ label: "População",        value: fmt(c.population, 1),               year: "estimativa" });
    if (c.area)
      cards.push({ label: "Área territorial", value: fmtArea(c.area),                    year: "" });

    cards.slice(0, 6).forEach(card => {
      const el = document.createElement("div");
      el.className = "metric-card";
      el.innerHTML = `
        <span class="metric-card-label">${card.label}</span>
        <span class="metric-card-value">${card.value}</span>
        ${card.year ? `<span class="metric-card-year">${card.year}</span>` : ""}
      `;
      grid.appendChild(el);
    });
  }

  /* ── Tabela de dados gerais ─────────────────────────────── */
  function renderInfoTable(c, eco) {
    const table = document.getElementById("info-table");
    table.innerHTML = "";

    const rows = [];

    if (c.capital?.length)
      rows.push({ label: "Capital",          value: c.capital.join(", ") });

    if (c.population)
      rows.push({ label: "População",        value: fmt(c.population, 1) });

    if (c.area)
      rows.push({ label: "Área",             value: fmtArea(c.area) });

    if (c.languages)
      rows.push({ label: "Idiomas",          value: Object.values(c.languages).slice(0, 3).join(", ") });

    if (c.currencies) {
      const cur = Object.entries(c.currencies)
        .slice(0, 2)
        .map(([code, info]) => `${info?.name || code} (${code})`)
        .join(", ");
      rows.push({ label: "Moeda",            value: cur });
    }

    if (c.timezones?.length) {
      const tz = c.timezones.length === 1
        ? c.timezones[0]
        : `${c.timezones[0]} (+${c.timezones.length - 1} fuso${c.timezones.length > 2 ? "s" : ""})`;
      rows.push({ label: "Fuso horário",     value: tz });
    }

    if (c.car?.side)
      rows.push({ label: "Direção veicular", value: c.car.side === "left" ? "Esquerda" : "Direita" });

    if (c.borders?.length)
      rows.push({ label: "Fronteiras",       value: c.borders.slice(0, 6).join(", ") + (c.borders.length > 6 ? "…" : "") });

    if (c.continents?.length)
      rows.push({ label: "Continente",       value: c.continents.join(", ") });

    // unMember e independent vêm SEMPRE da API (dados precisos)
    // A REST Countries retorna boolean nativo — não usamos fallback hardcoded
    if (typeof c.unMember === "boolean")
      rows.push({ label: "Membro da ONU",    value: c.unMember ? "Sim" : "Não" });

    if (typeof c.independent === "boolean")
      rows.push({ label: "País independente", value: c.independent ? "Sim" : "Não / Território" });

    rows.forEach(({ label, value }) => {
      const row = document.createElement("div");
      row.className = "info-row";
      row.innerHTML = `<dt>${label}</dt><dd>${value}</dd>`;
      table.appendChild(row);
    });
  }

  /* ── Sugestões no idle ──────────────────────────────────── */
  function renderSuggestions(countriesIndex, onClickSuggestion) {
    const row = document.getElementById("suggestions-row");
    if (!row) return;

    CONFIG.suggestions.forEach(({ code, name }) => {
      const country = countriesIndex[code];
      if (!country) return;

      const chip = document.createElement("button");
      chip.className = "suggestion-chip";
      chip.setAttribute("aria-label", `Ver dados de ${name}`);
      chip.innerHTML = `<span>${country.flag || ""}</span><span>${name}</span>`;
      chip.addEventListener("click", () => onClickSuggestion(country));
      row.appendChild(chip);
    });
  }

  /* ── Eventos ────────────────────────────────────────────── */
  function setupEvents() {
    document.getElementById("panel-close-btn").addEventListener("click", idle);
    document.getElementById("retry-btn").addEventListener("click", () => {
      if (lastCountry) load(lastCountry);
    });
  }

  return { load, idle, showError, renderSuggestions, setupEvents };

})();
