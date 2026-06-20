/**
 * search.js
 * Busca de países com autocomplete, debounce e navegação por teclado.
 *
 * Autor: Leonardo Farias Martins
 */

const Search = (() => {

  let countries    = [];
  let activeIndex  = -1;
  let onSelect     = null;
  let debounceTimer;

  const input  = document.getElementById("search-input");
  const list   = document.getElementById("search-list");

  /* ── Init ───────────────────────────────────────────────── */
  function init(data, selectCallback) {
    countries = data.slice().sort((a, b) =>
      (a.name?.common || "").localeCompare(b.name?.common || "")
    );
    onSelect = selectCallback;

    input.addEventListener("input",   onInput);
    input.addEventListener("keydown", onKeydown);
    input.addEventListener("focus",   () => { if (input.value.trim()) renderResults(query(input.value)); });
    document.addEventListener("click", e => { if (!e.target.closest(".search-container")) close(); });
  }

  /* ── Query ──────────────────────────────────────────────── */
  function query(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) return [];
    return countries.filter(c => {
      const common = (c.name?.common || "").toLowerCase();
      const native = Object.values(c.name?.nativeName || {})
        .map(n => (n.common || "").toLowerCase()).join(" ");
      return common.includes(q) || native.includes(q);
    }).slice(0, 8);
  }

  /* ── Handlers ───────────────────────────────────────────── */
  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      activeIndex = -1;
      const results = query(input.value);
      results.length ? renderResults(results) : close();
    }, 120);
  }

  function onKeydown(e) {
    const items = list.querySelectorAll("li");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      highlight(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      highlight(items);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex]?.click();
    } else if (e.key === "Escape") {
      close();
      input.blur();
    }
  }

  function highlight(items) {
    items.forEach((li, i) => li.setAttribute("aria-selected", String(i === activeIndex)));
    if (activeIndex >= 0) items[activeIndex].scrollIntoView({ block: "nearest" });
  }

  /* ── Render ─────────────────────────────────────────────── */
  function renderResults(results) {
    list.innerHTML = "";
    list.hidden    = false;

    results.forEach(c => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.innerHTML = `
        <span class="sl-flag">${c.flag || ""}</span>
        <span class="sl-name">${c.name?.common || "—"}</span>
        <span class="sl-region">${c.region || ""}</span>
      `;
      li.addEventListener("click", () => {
        input.value = "";
        close();
        if (onSelect) onSelect(c);
      });
      list.appendChild(li);
    });
  }

  function close() {
    list.hidden    = true;
    list.innerHTML = "";
    activeIndex    = -1;
  }

  return { init };

})();
