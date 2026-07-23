/**
 * cambio.js
 * CambioX — Conversor de moedas com gráfico histórico.
 * Integrado ao Terravex como segundo módulo principal.
 *
 * APIs:
 *   Open Exchange Rates (gratuita, sem chave): taxas em tempo real
 *   Frankfurter API (gratuita, sem chave): histórico de taxas
 *
 * Autor: Leonardo Farias Martins
 */

const Cambio = (() => {

  /* ── Moedas suportadas ──────────────────────────────────── */
  const CURRENCIES = [
    { code:"USD", name:"Dólar Americano",       flag:"🇺🇸" },
    { code:"BRL", name:"Real Brasileiro",        flag:"🇧🇷" },
    { code:"EUR", name:"Euro",                   flag:"🇪🇺" },
    { code:"GBP", name:"Libra Esterlina",        flag:"🇬🇧" },
    { code:"JPY", name:"Iene Japonês",           flag:"🇯🇵" },
    { code:"CNY", name:"Yuan Chinês",            flag:"🇨🇳" },
    { code:"CAD", name:"Dólar Canadense",        flag:"🇨🇦" },
    { code:"AUD", name:"Dólar Australiano",      flag:"🇦🇺" },
    { code:"CHF", name:"Franco Suíço",           flag:"🇨🇭" },
    { code:"INR", name:"Rúpia Indiana",          flag:"🇮🇳" },
    { code:"MXN", name:"Peso Mexicano",          flag:"🇲🇽" },
    { code:"ARS", name:"Peso Argentino",         flag:"🇦🇷" },
    { code:"CLP", name:"Peso Chileno",           flag:"🇨🇱" },
    { code:"COP", name:"Peso Colombiano",        flag:"🇨🇴" },
    { code:"PEN", name:"Sol Peruano",            flag:"🇵🇪" },
    { code:"UYU", name:"Peso Uruguaio",          flag:"🇺🇾" },
    { code:"KRW", name:"Won Sul-Coreano",        flag:"🇰🇷" },
    { code:"SGD", name:"Dólar de Singapura",     flag:"🇸🇬" },
    { code:"HKD", name:"Dólar de Hong Kong",     flag:"🇭🇰" },
    { code:"NOK", name:"Coroa Norueguesa",       flag:"🇳🇴" },
    { code:"SEK", name:"Coroa Sueca",            flag:"🇸🇪" },
    { code:"DKK", name:"Coroa Dinamarquesa",     flag:"🇩🇰" },
    { code:"PLN", name:"Zloty Polonês",          flag:"🇵🇱" },
    { code:"CZK", name:"Coroa Tcheca",           flag:"🇨🇿" },
    { code:"HUF", name:"Forint Húngaro",         flag:"🇭🇺" },
    { code:"RUB", name:"Rublo Russo",            flag:"🇷🇺" },
    { code:"TRY", name:"Lira Turca",             flag:"🇹🇷" },
    { code:"ZAR", name:"Rand Sul-Africano",      flag:"🇿🇦" },
    { code:"SAR", name:"Riyal Saudita",          flag:"🇸🇦" },
    { code:"AED", name:"Dirham dos EAU",         flag:"🇦🇪" },
    { code:"ILS", name:"Novo Shekel",            flag:"🇮🇱" },
    { code:"THB", name:"Baht Tailandês",         flag:"🇹🇭" },
    { code:"MYR", name:"Ringgit Malaio",         flag:"🇲🇾" },
    { code:"IDR", name:"Rupia Indonésia",        flag:"🇮🇩" },
    { code:"PHP", name:"Peso Filipino",          flag:"🇵🇭" },
    { code:"TWD", name:"Dólar Taiwanês",         flag:"🇹🇼" },
    { code:"NZD", name:"Dólar Neozelandês",      flag:"🇳🇿" },
    { code:"EGP", name:"Libra Egípcia",          flag:"🇪🇬" },
    { code:"PKR", name:"Rupia Paquistanesa",     flag:"🇵🇰" },
    { code:"BDT", name:"Taka de Bangladesh",     flag:"🇧🇩" },
    { code:"VND", name:"Dong Vietnamita",        flag:"🇻🇳" },
    { code:"NGN", name:"Naira Nigeriana",        flag:"🇳🇬" },
    { code:"KES", name:"Xelim Queniano",         flag:"🇰🇪" },
    { code:"GHS", name:"Cedi Ganês",             flag:"🇬🇭" },
    { code:"UAH", name:"Hryvnia Ucraniana",      flag:"🇺🇦" },
    { code:"QAR", name:"Riyal Catarense",        flag:"🇶🇦" },
  ];

  const POPULAR_PAIRS = [
    { from:"USD", to:"BRL" },
    { from:"EUR", to:"BRL" },
    { from:"USD", to:"EUR" },
    { from:"GBP", to:"BRL" },
    { from:"USD", to:"JPY" },
    { from:"EUR", to:"USD" },
    { from:"USD", to:"CNY" },
    { from:"GBP", to:"USD" },
  ];

  const QREF_AMOUNTS = [1, 10, 100, 1000, 5000, 10000];

  /* ── Estado interno ─────────────────────────────────────── */
  let chart        = null;
  let currentDays  = 7;
  let currentFrom  = "USD";
  let currentTo    = "BRL";
  let currentRate  = null;
  let rateCache    = new Map();
  let histCache    = new Map();
  const CACHE_TTL  = 10 * 60 * 1000;
  const REQUEST_TIMEOUT = 15000;

  async function fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  /* ── Helpers de formato ─────────────────────────────────── */
  function fmtNum(n, decimals = 4) {
    if (n == null || isNaN(n)) return "—";
    const d = n >= 1000 ? 2 : n >= 100 ? 3 : decimals;
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: d,
    }).format(n);
  }

  function flagOf(code) {
    return CURRENCIES.find(c => c.code === code)?.flag || "🏳";
  }

  /* ── Cache helper ───────────────────────────────────────── */
  function fromCache(map, key) {
    const hit = map.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
    return null;
  }

  function toCache(map, key, data) {
    map.set(key, { data, ts: Date.now() });
  }

  /* ── API: taxa atual ─────────────────────────────────────── */
  async function fetchRate(from, to) {
    if (from === to) return 1;
    const key = `${from}-${to}`;
    const cached = fromCache(rateCache, key);
    if (cached) return cached;

    const data = await fetchJson(`https://open.er-api.com/v6/latest/${from}`);
    if (data.result !== "success") throw new Error("API erro");

    // Armazena todas as taxas dessa base de uma vez
    for (const [c, r] of Object.entries(data.rates)) {
      toCache(rateCache, `${from}-${c}`, r);
    }

    return data.rates[to] ?? null;
  }

  /* ── API: histórico (Frankfurter) ───────────────────────── */
  async function fetchHistory(from, to, days) {
    const key = `${from}-${to}-${days}`;
    const cached = fromCache(histCache, key);
    if (cached) return cached;

    const end   = new Date();
    const start = new Date(end - days * 864e5);
    const fmt   = d => d.toISOString().slice(0, 10);
    const url   = `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=${from}&to=${to}`;

    const data = await fetchJson(url);
    if (!data.rates) throw new Error("Sem histórico");

    const result = Object.entries(data.rates)
      .map(([date, v]) => ({ date, value: v[to] }))
      .filter(d => d.value != null)
      .sort((a, b) => a.date.localeCompare(b.date));

    toCache(histCache, key, result);
    return result;
  }

  /* ── Seletores ──────────────────────────────────────────── */
  function populateSelects() {
    const fromSel = document.getElementById("from-currency");
    const toSel   = document.getElementById("to-currency");

    CURRENCIES.forEach(({ code, name }) => {
      [fromSel, toSel].forEach(sel => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = `${code} — ${name}`;
        sel.appendChild(opt);
      });
    });

    fromSel.value = "USD";
    toSel.value   = "BRL";
    updateFlags();
  }

  function updateFlags() {
    document.getElementById("from-flag").textContent = flagOf(document.getElementById("from-currency").value);
    document.getElementById("to-flag").textContent   = flagOf(document.getElementById("to-currency").value);
  }

  /* ── Conversão principal ────────────────────────────────── */
  async function doConvert(addHistory = true) {
    const from   = document.getElementById("from-currency").value;
    const to     = document.getElementById("to-currency").value;
    const amount = parseFloat(document.getElementById("from-amount").value) || 0;
    const result = document.getElementById("result-display");
    const rateEl = document.getElementById("rate-text");

    currentFrom = from;
    currentTo   = to;

    try {
      const rate = await fetchRate(from, to);
      currentRate = rate;

      const converted = amount * rate;
      result.textContent = fmtNum(converted, 4);
      result.classList.remove("pop");
      void result.offsetWidth; // reflow para reiniciar animação
      result.classList.add("pop");

      rateEl.textContent = `1 ${from} = ${fmtNum(rate, 6)} ${to}  ·  1 ${to} = ${fmtNum(1/rate, 6)} ${from}`;

      if (addHistory && amount > 0) {
        addToHistory(amount, from, converted, to);
      }

      renderQuickRefs(rate, from, to);
      loadChart(from, to, currentDays);

    } catch {
      result.textContent = "Erro";
      rateEl.textContent = "Não foi possível buscar a taxa. Tente novamente.";
    }
  }

  /* ── Referências rápidas ────────────────────────────────── */
  function renderQuickRefs(rate, from, to) {
    const container = document.getElementById("quick-refs");
    container.innerHTML = "";
    QREF_AMOUNTS.forEach(n => {
      const div = document.createElement("div");
      div.className = "qref-item";
      div.innerHTML = `
        <span class="qref-amount">${n} ${from}</span>
        <span class="qref-result">${fmtNum(n * rate, 2)}</span>
      `;
      container.appendChild(div);
    });
  }

  /* ── Gráfico histórico ──────────────────────────────────── */
  async function loadChart(from, to, days) {
    const loading  = document.getElementById("chart-loading");
    const empty    = document.getElementById("chart-empty");
    const titleEl  = document.getElementById("chart-title");
    const metaEl   = document.getElementById("chart-meta");
    const canvas   = document.getElementById("rate-chart");

    if (from === to) {
      empty.hidden   = false;
      loading.hidden = true;
      return;
    }

    loading.hidden = false;
    empty.hidden   = true;

    try {
      const history = await fetchHistory(from, to, days);
      loading.hidden = true;

      if (!history.length) { empty.hidden = false; return; }

      const labels = history.map(d => {
        const dt = new Date(d.date + "T12:00:00");
        return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      });
      const values = history.map(d => d.value);
      const first  = values[0];
      const last   = values[values.length - 1];
      const pct    = ((last - first) / first * 100).toFixed(2);
      const up     = last >= first;

      titleEl.textContent = `${from} / ${to} — ${days === 7 ? "7 dias" : days === 30 ? "30 dias" : "90 dias"}`;
      metaEl.textContent  = `Variação: ${up ? "+" : ""}${pct}% no período`;

      const color = up ? "#3dc98a" : "#e85d75";
      const colorDim = up ? "rgba(61,201,138,0.12)" : "rgba(232,93,117,0.12)";

      if (chart) chart.destroy();

      chart = new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: [{
            data: values,
            borderColor: color,
            borderWidth: 2,
            fill: true,
            backgroundColor: (ctx) => {
              const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
              g.addColorStop(0, up ? "rgba(61,201,138,0.18)" : "rgba(232,93,117,0.18)");
              g.addColorStop(1, "rgba(0,0,0,0)");
              return g;
            },
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 500, easing: "easeOutQuart" },
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(12,17,24,0.95)",
              borderColor: "rgba(30,45,61,0.8)",
              borderWidth: 1,
              titleColor: "#7a9ab8",
              bodyColor: "#e2ecf8",
              titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
              bodyFont:  { family: "'JetBrains Mono', monospace", size: 13 },
              padding: 10,
              callbacks: {
                label: ctx => ` ${fmtNum(ctx.raw, 6)} ${to}`,
              },
            },
          },
          scales: {
            x: {
              grid:  { color: "rgba(30,45,61,0.5)", drawBorder: false },
              ticks: {
                color: "#3a5468",
                font:  { family: "'JetBrains Mono', monospace", size: 9 },
                maxTicksLimit: days <= 7 ? 7 : days <= 30 ? 8 : 10,
                maxRotation: 0,
              },
            },
            y: {
              position: "right",
              grid:  { color: "rgba(30,45,61,0.5)", drawBorder: false },
              ticks: {
                color: "#3a5468",
                font:  { family: "'JetBrains Mono', monospace", size: 9 },
                maxTicksLimit: 5,
                callback: v => fmtNum(v, 3),
              },
            },
          },
        },
      });

    } catch {
      loading.hidden = true;
      empty.hidden   = false;
      metaEl.textContent = "Histórico indisponível para este par.";
    }
  }

  /* ── Pares populares ────────────────────────────────────── */
  async function renderPopularPairs() {
    const grid = document.getElementById("pairs-grid");
    grid.innerHTML = "";

    POPULAR_PAIRS.forEach(({ from, to }) => {
      const item = document.createElement("div");
      item.className = "pair-item";
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", `Selecionar par ${from}/${to}`);

      item.innerHTML = `
        <span class="pair-label">${flagOf(from)} ${from} / ${flagOf(to)} ${to}</span>
        <span class="pair-rate loading" id="pr-${from}-${to}">Carregando...</span>
      `;

      const activate = () => {
        document.getElementById("from-currency").value = from;
        document.getElementById("to-currency").value   = to;
        updateFlags();
        doConvert(false);
      };

      item.addEventListener("click", activate);
      item.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") activate(); });
      grid.appendChild(item);

      // Busca taxa em background
      fetchRate(from, to).then(rate => {
        const el = document.getElementById(`pr-${from}-${to}`);
        if (!el) return;
        el.classList.remove("loading");
        el.textContent = `1 ${from} = ${fmtNum(rate, 4)} ${to}`;
      }).catch(() => {
        const el = document.getElementById(`pr-${from}-${to}`);
        if (el) el.textContent = "Indisponível";
      });
    });
  }

  /* ── Histórico de conversões ────────────────────────────── */
  function addToHistory(amount, from, result, to) {
    const list  = document.getElementById("history-list");
    const empty = document.getElementById("history-empty");
    empty.hidden = true;

    const li = document.createElement("li");
    li.className = "history-item";

    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    li.innerHTML = `
      <span class="history-conv">${fmtNum(amount,2)} ${from} → ${fmtNum(result,4)} ${to}</span>
      <span class="history-time">${time}</span>
    `;

    list.insertBefore(li, list.firstChild);
    while (list.children.length > 12) list.removeChild(list.lastChild);
  }

  /* ── Botão copiar ───────────────────────────────────────── */
  function setupCopyBtn() {
    const btn   = document.getElementById("copy-rate-btn");
    const label = document.getElementById("copy-label");

    btn.addEventListener("click", async () => {
      const text = document.getElementById("rate-text").textContent;
      if (!text || text === "—") return;
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add("copied");
        label.textContent = "Copiado!";
        setTimeout(() => { btn.classList.remove("copied"); label.textContent = "Copiar"; }, 2000);
      } catch {
        label.textContent = "Erro";
        setTimeout(() => { label.textContent = "Copiar"; }, 1500);
      }
    });
  }

  /* ── Inicialização ──────────────────────────────────────── */
  function init() {
    populateSelects();
    setupCopyBtn();
    renderPopularPairs();

    // Eventos dos inputs
    document.getElementById("from-currency").addEventListener("change", () => { updateFlags(); doConvert(false); });
    document.getElementById("to-currency").addEventListener("change",   () => { updateFlags(); doConvert(false); });
    document.getElementById("from-amount").addEventListener("input",    () => doConvert(false));
    document.getElementById("from-amount").addEventListener("keydown",  e => { if (e.key === "Enter") doConvert(true); });

    // Swap
    const swapBtn = document.getElementById("swap-btn");
    swapBtn.addEventListener("click", () => {
      const fromSel = document.getElementById("from-currency");
      const toSel   = document.getElementById("to-currency");
      [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
      swapBtn.classList.add("spinning");
      setTimeout(() => swapBtn.classList.remove("spinning"), 400);
      updateFlags();
      doConvert(false);
    });

    // Períodos do gráfico
    document.querySelectorAll(".range-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".range-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentDays = +btn.dataset.days;
        loadChart(currentFrom, currentTo, currentDays);
      });
    });

    // Limpar histórico
    document.getElementById("clear-history-btn").addEventListener("click", () => {
      document.getElementById("history-list").innerHTML = "";
      document.getElementById("history-empty").hidden = false;
    });

    // Conversão inicial
    doConvert(false);
  }

  return { init };

})();
