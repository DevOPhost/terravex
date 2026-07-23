/**
 * api.js
 * Módulo de dados do Terravex.
 *
 * Estratégia:
 *   - Dados de listagem (mapa, busca): arquivo local /data/countries.json
 *     → Zero dependência de CORS, carrega instantaneamente
 *   - Dados de detalhe por país: REST Countries API (chamada individual)
 *   - Dados econômicos: World Bank API
 *
 * Ambas as APIs externas têm CORS habilitado — só a listagem em massa
 * do restcountries.com tem problemas esporádicos de CORS em localhost.
 *
 * Autor: Leonardo Farias Martins
 */

const API = (() => {

  const cache = new Map();
  const TTL   = 15 * 60 * 1000;
  const REQUEST_TIMEOUT = 30000;

  async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  /* ── Cache ──────────────────────────────────────────────── */
  async function fetchCached(url) {
    const now = Date.now();
    const hit = cache.get(url);
    if (hit && now - hit.ts < TTL) return hit.data;

    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);

    const data = await res.json();
    cache.set(url, { data, ts: now });
    return data;
  }

  /* ── Lista local de países (para mapa e busca) ──────────── */
  async function getAllCountries() {
    return fetchCached("data/countries.json");
  }

  /* ── Detalhe de um país via REST Countries ──────────────── */
  const RC_FIELDS = [
    "name","cca2","cca3","ccn3","flag",
    "region","subregion","population","area",
    "currencies","capital","languages","latlng",
    "timezones","borders","independent","unMember","car",
  ].join(",");

  async function getCountry(code) {
    const url  = `https://restcountries.com/v3.1/alpha/${code}?fields=${RC_FIELDS}`;
    try {
      const data = await fetchCached(url);
      return Array.isArray(data) ? data[0] : data;
    } catch {
      // Fallback: retorna o que temos no arquivo local
      const all = await getAllCountries();
      return all.find(c => c.cca2 === code || c.cca3 === code) || null;
    }
  }

  /* ── World Bank ─────────────────────────────────────────── */
  async function wb(code, indicator) {
    const year = new Date().getFullYear();
    const url  = `https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&mrv=1&date=${year - 5}:${year}&per_page=5`;
    try {
      const data = await fetchCached(url);
      if (!data?.[1]?.length) return null;
      const entry = data[1].find(e => e.value !== null);
      return entry ? { value: entry.value, year: entry.date } : null;
    } catch {
      return null;
    }
  }

  async function getEconomics(code) {
    const [gdp, gdpPc, inflation, unemployment, lifeExp, gini] =
      await Promise.all([
        wb(code, "NY.GDP.MKTP.CD"),
        wb(code, "NY.GDP.PCAP.CD"),
        wb(code, "FP.CPI.TOTL.ZG"),
        wb(code, "SL.UEM.TOTL.ZS"),
        wb(code, "SP.DYN.LE00.IN"),
        wb(code, "SI.POV.GINI"),
      ]);
    return { gdp, gdpPc, inflation, unemployment, lifeExp, gini };
  }

  /* ── GeoJSON local ────────────────────────────────────── */
  async function getGeoJSON() {
    return fetchCached("data/countries.geo.json");
  }

  return { getAllCountries, getCountry, getEconomics, getGeoJSON };

})();
