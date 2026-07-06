# TerraveX

**[English](#english) · [Português](#portugues)**

---

<a name="english"></a>

TerraveX is an interactive global economic intelligence map with **CambioX**, a built-in currency conversion system. Click a country and the side panel opens with GDP, inflation, unemployment, life expectancy, population, area, currencies, languages, borders, and more — all powered by real public APIs, without a custom backend or database.

I started this project because I wanted to understand how to combine multiple public APIs in a useful way. Along the way, it became much more than that: modular architecture, manual caching, choropleth coloring by metrics, country search, and visual canvas effects built from scratch. I went further than I initially planned and learned a lot in the process.

**[→ Open repository](https://github.com/DevOPhost/terravex.git)**

---

## What you can do

* Click any of the 195 countries and view economic and general data in the side panel.
* Use autocomplete search, including native country names — try searching for `Deutschland`.
* Switch between three coloring modes: by region, by population, or by land area.
* See the map legend update automatically when the selected metric changes.
* Navigate the map normally with scroll, zoom, and drag.
* Convert currencies using updated exchange data through CambioX.
* Explore country information without creating an account or connecting to a backend.

---

## Technologies

TerraveX uses only HTML, CSS, and JavaScript — no framework, no bundler, and no Node.js runtime. I wanted the project to run directly on GitHub Pages without any build step.

External dependencies:

* **[Leaflet.js](https://leafletjs.com)** — interactive map rendering.
* **[REST Countries API](https://restcountries.com)** — general country data such as name, flag, capital, currency, language, and borders.
* **[World Bank API](https://api.worldbank.org)** — economic and social indicators such as GDP, inflation, unemployment, Gini index, and life expectancy.
* **[CartoDB](https://carto.com)** — dark map tiles.
* **Google Fonts** — Syne for display text, JetBrains Mono for data, and Inter for body text.

---

## Project structure

```text
terravex/
├── index.html
├── css/
│   └── style.css        # full design system using custom properties
├── js/
│   ├── config.js        # constants, colors, and formatters
│   ├── ambient.js       # background canvas with lat/lon grid and particles
│   ├── api.js           # REST Countries + World Bank with 15-minute cache
│   ├── map.js           # Leaflet, GeoJSON, ripple, choropleth, and legend
│   ├── panel.js         # side panel state machine
│   ├── search.js        # autocomplete with debounce and keyboard support
│   └── app.js           # main initialization
└── data/
    └── countries.geo.json   # world borders in GeoJSON, around 14MB
```

The JavaScript modules use the IIFE pattern with their own scope. The project works without ES modules and without a bundler, so there is no compilation step required before deploying it to GitHub Pages.

---

## Running locally

`fetch()` does not work properly with `file://`, so the project needs a simple HTTP server:

```bash
git clone https://github.com/DevOPhost/terravex.git
cd terravex

# Option 1 — Node.js
npx serve .

# Option 2 — Python
python -m http.server 8080

# Option 3 — Live Server extension in VS Code
```

Then open:

```text
http://localhost:8080
```

---

## Deploying to GitHub Pages

1. Create a repository named `terravex` on GitHub.
2. Go to **Settings → Pages**.
3. Set the source to **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder.
5. Wait a few minutes. The project will be available at:

```text
https://yourusername.github.io/terravex
```

---

## Technical notes

**API cache:** API responses are kept in memory for 15 minutes. If you click Brazil, close the panel, and click it again soon after, TerraveX does not make a second request for the same data.

**World Bank data:** indicators from the World Bank are not updated in real time. The panel shows the most recent value available for each metric and displays the reference year below the data.

**Local GeoJSON:** country borders are stored in `/data` instead of being loaded from an external CDN. The file is around 14MB, but server compression reduces the transfer size. The advantage is that the map does not depend on a third-party GeoJSON provider to work.

**Countries without economic data:** some small or dependent territories do not have complete World Bank records. In those cases, the panel shows the available REST Countries data and omits missing indicators without breaking the interface.

**No backend:** TerraveX does not use a database, authentication, server-side code, or private environment variables. All data comes from public APIs or from the local GeoJSON file.

---

## Current status

TerraveX is a static frontend project with real API integration. It was built to be lightweight, easy to deploy, and useful as a study case for maps, public data, API composition, caching, and interactive interfaces.

The project can still evolve with better mobile refinements, more indicators, historical comparisons, advanced filters, and stronger error handling for unstable API responses.

---

Made by **Leonardo Farias Martins**
Computer Science — UNIC, Mato Grosso

---

<a name="portugues"></a>

TerraveX é um mapa interativo de inteligência econômica global com o **CambioX**, um sistema integrado de conversão de moedas. Ao clicar em um país, o painel lateral abre com PIB, inflação, desemprego, expectativa de vida, população, área territorial, moedas, idiomas, fronteiras e outros dados — tudo vindo de APIs públicas reais, sem backend próprio e sem banco de dados.

Comecei este projeto porque queria entender como combinar múltiplas APIs públicas de forma útil. No meio do caminho, ele virou algo maior: arquitetura em módulos, cache manual, coloração choropleth por métricas, busca por países e efeitos visuais feitos do zero no canvas. Fui além do que eu planejava no início e aprendi bastante durante o processo.

**[→ Abrir repositório](https://github.com/DevOPhost/terravex.git)**

---

## O que dá para fazer

* Clicar em qualquer um dos 195 países e ver dados econômicos e gerais no painel lateral.
* Usar a busca com autocomplete, incluindo nomes nativos dos países — teste pesquisar por `Deutschland`.
* Alternar entre três modos de coloração: por região, por população ou por área territorial.
* Ver a legenda do mapa atualizar automaticamente conforme a métrica selecionada muda.
* Navegar pelo mapa normalmente com scroll, zoom e arraste.
* Converter moedas com dados atualizados por meio do CambioX.
* Explorar informações dos países sem criar conta e sem depender de backend próprio.

---

## Tecnologias

O TerraveX usa apenas HTML, CSS e JavaScript — sem framework, sem bundler e sem Node.js em runtime. A ideia foi fazer um projeto que funcionasse diretamente no GitHub Pages, sem etapa de build.

Dependências externas:

* **[Leaflet.js](https://leafletjs.com)** — renderização do mapa interativo.
* **[REST Countries API](https://restcountries.com)** — dados gerais dos países, como nome, bandeira, capital, moeda, idioma e fronteiras.
* **[World Bank API](https://api.worldbank.org)** — indicadores econômicos e sociais, como PIB, inflação, desemprego, índice de Gini e expectativa de vida.
* **[CartoDB](https://carto.com)** — tiles do mapa com tema escuro.
* **Google Fonts** — Syne para textos de destaque, JetBrains Mono para dados e Inter para textos gerais.

---

## Estrutura do projeto

```text
terravex/
├── index.html
├── css/
│   └── style.css        # design system completo usando custom properties
├── js/
│   ├── config.js        # constantes, cores e formatadores
│   ├── ambient.js       # canvas de fundo com grade lat/lon e partículas
│   ├── api.js           # REST Countries + World Bank com cache de 15 min
│   ├── map.js           # Leaflet, GeoJSON, ripple, choropleth e legenda
│   ├── panel.js         # máquina de estados do painel lateral
│   ├── search.js        # autocomplete com debounce e suporte a teclado
│   └── app.js           # inicialização geral
└── data/
    └── countries.geo.json   # fronteiras mundiais em GeoJSON, cerca de 14MB
```

Os módulos JavaScript usam o padrão IIFE com escopo próprio. O projeto funciona sem ES modules e sem bundler, então não precisa de nenhuma etapa de compilação antes do deploy no GitHub Pages.

---

## Rodando localmente

O `fetch()` não funciona corretamente com `file://`, então o projeto precisa de um servidor HTTP simples:

```bash
git clone https://github.com/DevOPhost/terravex.git
cd terravex

# Opção 1 — Node.js
npx serve .

# Opção 2 — Python
python -m http.server 8080

# Opção 3 — extensão Live Server no VS Code
```

Depois abra:

```text
http://localhost:8080
```

---

## Deploy no GitHub Pages

1. Crie o repositório como `terravex` no GitHub.
2. Vá em **Settings → Pages**.
3. Em source, selecione **Deploy from a branch**.
4. Escolha a branch `main` e a pasta `/ (root)`.
5. Aguarde alguns minutos. O projeto ficará disponível em:

```text
https://seuusuario.github.io/terravex
```

---

## Observações técnicas

**Cache de API:** as respostas das APIs ficam em memória por 15 minutos. Se você clicar no Brasil, fechar o painel e clicar nele novamente logo depois, o TerraveX não faz uma segunda requisição para os mesmos dados.

**Dados do World Bank:** os indicadores do World Bank não são atualizados em tempo real. O painel mostra o valor mais recente disponível para cada métrica e exibe o ano de referência abaixo do dado.

**GeoJSON local:** as fronteiras dos países ficam em `/data` em vez de serem carregadas por um CDN externo. O arquivo tem cerca de 14MB, mas a compressão do servidor reduz bastante o tamanho transferido. A vantagem é que o mapa não depende de um terceiro para fornecer o GeoJSON.

**Países sem dados econômicos:** alguns territórios pequenos ou dependentes não possuem registros completos no World Bank. Nesses casos, o painel mostra os dados disponíveis do REST Countries e omite os indicadores ausentes sem quebrar a interface.

**Sem backend:** o TerraveX não usa banco de dados, autenticação, código server-side ou variáveis privadas de ambiente. Todos os dados vêm de APIs públicas ou do arquivo GeoJSON local.

---

## Status atual

O TerraveX é um projeto frontend estático com integração real a APIs. Ele foi criado para ser leve, simples de publicar e útil como estudo de mapas, dados públicos, composição de APIs, cache e interfaces interativas.

O projeto ainda pode evoluir com melhores ajustes para mobile, mais indicadores, comparações históricas, filtros avançados e tratamento mais robusto para respostas instáveis das APIs.

---

Feito por **Leonardo Farias Martins**
Ciência da Computação — UNIC, Mato Grosso
