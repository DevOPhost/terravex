/**
 * config.js
 * Constantes globais, paleta de cores e funções utilitárias do Terravex.
 *
 * Autor: Leonardo Farias Martins
 */

const CONFIG = {

  map: {
    center:  [20, 10],
    zoom:    2.2,
    minZoom: 1.5,
    maxZoom: 8,
  },

  /* Cor por região geográfica */
  regionColors: {
    "Americas": "#e8873a",
    "Europe":   "#7c6af7",
    "Asia":     "#e85d88",
    "Africa":   "#3dc98a",
    "Oceania":  "#50b8e8",
    "Antarctic":"#4a6070",
    "default":  "#2a3d50",
  },

  /* Stops de choropleth */
  choropleth: {
    population: [
      { min: 0,             color: "#151f2e" },
      { min: 500_000,       color: "#1a2f44" },
      { min: 5_000_000,     color: "#1a4060" },
      { min: 25_000_000,    color: "#1a5870" },
      { min: 100_000_000,   color: "#7c6af7" },
      { min: 500_000_000,   color: "#a78bfa" },
      { min: 1_000_000_000, color: "#f0c060" },
    ],
    area: [
      { min: 0,          color: "#151f2e" },
      { min: 5_000,      color: "#1a3040" },
      { min: 50_000,     color: "#1a4558" },
      { min: 300_000,    color: "#1a5868" },
      { min: 1_000_000,  color: "#7c6af7" },
      { min: 5_000_000,  color: "#e85d88" },
      { min: 10_000_000, color: "#f0c060" },
    ],
  },

  /* Legendas legíveis por filtro */
  legendEntries: {
    region: [
      { color: "#e8873a", label: "Américas"  },
      { color: "#7c6af7", label: "Europa"    },
      { color: "#e85d88", label: "Ásia"      },
      { color: "#3dc98a", label: "África"    },
      { color: "#50b8e8", label: "Oceania"   },
    ],
    population: [
      { color: "#151f2e", label: "< 500 mil"   },
      { color: "#1a5870", label: "1 – 100 M"   },
      { color: "#7c6af7", label: "100 – 500 M" },
      { color: "#f0c060", label: "> 1 bilhão"  },
    ],
    area: [
      { color: "#151f2e", label: "< 5 mil km²"    },
      { color: "#1a5868", label: "50 – 300 mil km²"},
      { color: "#7c6af7", label: "1 – 5 M km²"    },
      { color: "#f0c060", label: "> 10 M km²"     },
    ],
  },

  /* Estilos dos polígonos Leaflet */
  poly: {
    base:     { weight: 0.7, opacity: 1, color: "#07111a", fillOpacity: 0.82 },
    hover:    { weight: 1.4, color: "#a78bfa", fillOpacity: 0.96 },
    selected: { weight: 2,   color: "#f0c060", fillOpacity: 1    },
  },

  /* Países exibidos como sugestões no idle */
  suggestions: [
    { code: "BR", name: "Brasil"         },
    { code: "US", name: "EUA"            },
    { code: "JP", name: "Japão"          },
    { code: "DE", name: "Alemanha"       },
    { code: "CN", name: "China"          },
    { code: "IN", name: "Índia"          },
    { code: "NG", name: "Nigéria"        },
    { code: "AU", name: "Austrália"      },
  ],
};

/* ── Utilitários ──────────────────────────────────────────── */

/**
 * Retorna a cor de choropleth para um dado valor numérico.
 * @param {"population"|"area"} metric
 * @param {number|null} value
 */
function choroplethColor(metric, value) {
  const stops = CONFIG.choropleth[metric];
  if (!stops || value == null || isNaN(value)) return CONFIG.regionColors["default"];
  let color = stops[0].color;
  for (const s of stops) {
    if (value >= s.min) color = s.color;
    else break;
  }
  return color;
}

/**
 * Formata números grandes com sufixo legível.
 * @param {number|null} n
 * @param {number} [decimals]
 */
function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e12) return (n / 1e12).toFixed(decimals) + " T";
  if (n >= 1e9)  return (n / 1e9).toFixed(decimals)  + " B";
  if (n >= 1e6)  return (n / 1e6).toFixed(decimals)  + " M";
  if (n >= 1e3)  return (n / 1e3).toFixed(1)         + " K";
  return n.toLocaleString("pt-BR");
}

/**
 * Formata área em km².
 */
function fmtArea(km2) {
  if (!km2) return "—";
  return km2.toLocaleString("pt-BR") + " km²";
}

/**
 * Formata percentual com uma casa decimal.
 */
function fmtPct(n) {
  if (n == null || isNaN(n)) return "—";
  return n.toFixed(1) + "%";
}
