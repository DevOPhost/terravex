# TerraveX

Mapa interativo de inteligência econômica global com o sistema CambioX, responsável pelas conversões de moedas. Clica num país, o painel abre com PIB, inflação, desemprego, expectativa de vida e mais - tudo vindo de APIs reais, sem banco de dados próprio, sem backend.

Comecei esse projeto querendo entender como combinar múltiplas APIs públicas de forma útil. No meio do caminho virou algo bem maior: arquitetura em módulos, cache manual, choropleth colorido por métricas, efeitos visuais feitos do zero no canvas. Fui além do que eu planejava e aprendi bastante no processo.

**[→ Abrir o projeto](https://github.com/DevOPhost/terravex.git)**

---

## O que dá pra fazer

- Clicar em qualquer um dos 195 países e ver os dados econômicos no painel lateral
- Usar a busca com autocomplete (funciona com nome nativo também — testa "Deutschland")
- Alternar entre três modos de coloração: por região, por população ou por área territorial
- Ver a legenda atualizar conforme o filtro muda
- Navegar o mapa com scroll e zoom normalmente
- Converter moedas com dados 100% atualizados

---

## Tecnologias

Só HTML, CSS e JavaScript — sem framework, sem bundler, sem Node no runtime. Queria que funcionasse direto no GitHub Pages sem nenhum passo de build.

Dependências externas:

- **[Leaflet.js](https://leafletjs.com)** — renderização do mapa interativo
- **[REST Countries API](https://restcountries.com)** — dados gerais: nome, bandeira, capital, moeda, idioma, fronteiras...
- **[World Bank API](https://api.worldbank.org)** — indicadores econômicos: PIB, inflação, desemprego, Gini, expectativa de vida
- **[CartoDB](https://carto.com)** — tiles do mapa com tema escuro
- **Google Fonts** — Syne (display) + JetBrains Mono (dados) + Inter (corpo)

---

## Estrutura do projeto

```
terravex/
├── index.html
├── css/
│   └── style.css        # design system completo em custom properties
├── js/
│   ├── config.js        # constantes, cores, formatadores
│   ├── ambient.js       # canvas de fundo (grade lat/lon + partículas)
│   ├── api.js           # REST Countries + World Bank com cache de 15 min
│   ├── map.js           # Leaflet, GeoJSON, ripple, choropleth, legenda
│   ├── panel.js         # máquina de estados do painel lateral
│   ├── search.js        # autocomplete com debounce e teclado
│   └── app.js           # inicialização geral
└── data/
    └── countries.geo.json   # fronteiras mundiais em GeoJSON (~14MB)
```

Os módulos JS usam o padrão IIFE com escopo próprio. Funciona sem ES modules e sem bundler, então não precisa de nenhum passo de compilação para subir no Pages.

---

## Rodando localmente

O `fetch()` não funciona com `file://`, então precisa de um servidor HTTP simples:

```bash
git clone https://github.com/DevOPhost/terravex.git
cd terravex

# Opção 1 — Node.js
npx serve .

# Opção 2 — Python
python -m http.server 8080

# Opção 3 — extensão Live Server no VS Code
```

Depois abre `http://localhost:8080` no navegador.

---

## Deploy no GitHub Pages

1. Cria o repositório como `terravex` no GitHub
2. Vai em **Settings → Pages**
3. Source: **Deploy from a branch**, branch `main`, pasta `/ (root)`
4. Aguarda uns minutos — vai estar em `https://seuusuario.github.io/terravex`

---

## Observações técnicas

**Cache de API:** toda chamada fica em memória por 15 minutos. Se você clicar no Brasil, fechar o painel e clicar de novo, não vai gerar uma segunda requisição.

**Dados do World Bank:** os indicadores não são atualizados em tempo real — o próprio World Bank publica com defasagem de 1 a 2 anos. O que aparece é o dado mais recente disponível, com o ano indicado embaixo de cada métrica.

**GeoJSON local:** o arquivo de fronteiras fica em `/data` em vez de vir de um CDN externo. São ~14MB, mas comprimido pelo servidor cai bastante. A vantagem é não depender de um terceiro para o mapa funcionar.

**Países sem dados econômicos:** alguns territórios pequenos ou dependentes não têm registros no World Bank. Nesses casos o painel mostra o que tem (dados do REST Countries) e omite o que não existe, sem quebrar.

---

Feito por **Leonardo Farias Martins**  
Ciência da Computação — UNIC, Mato Grosso
