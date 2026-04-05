---
read_when:
    - Vuoi una ricerca web basata su Tavily
    - Hai bisogno di una chiave API Tavily
    - Vuoi Tavily come provider `web_search`
    - Vuoi l'estrazione di contenuti dagli URL
summary: Strumenti di ricerca ed estrazione Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-05T14:07:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

OpenClaw può usare **Tavily** in due modi:

- come provider `web_search`
- come strumenti plugin espliciti: `tavily_search` e `tavily_extract`

Tavily è un'API di ricerca progettata per applicazioni IA, che restituisce risultati strutturati
ottimizzati per il consumo da parte degli LLM. Supporta profondità di ricerca configurabile, filtraggio
per argomento, filtri di dominio, riepiloghi di risposta generati dall'IA ed estrazione di contenuti
dagli URL (incluse le pagine renderizzate con JavaScript).

## Ottieni una chiave API

1. Crea un account Tavily su [tavily.com](https://tavily.com/).
2. Genera una chiave API nella dashboard.
3. Memorizzala nella configurazione oppure imposta `TAVILY_API_KEY` nell'ambiente del gateway.

## Configura la ricerca Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Note:

- Scegliere Tavily durante l'onboarding o `openclaw configure --section web` abilita
  automaticamente il plugin Tavily incluso.
- Memorizza la configurazione di Tavily in `plugins.entries.tavily.config.webSearch.*`.
- `web_search` con Tavily supporta `query` e `count` (fino a 20 risultati).
- Per controlli specifici di Tavily come `search_depth`, `topic`, `include_answer`
  o filtri di dominio, usa `tavily_search`.

## Strumenti plugin Tavily

### `tavily_search`

Usalo quando vuoi controlli di ricerca specifici di Tavily invece del
`web_search` generico.

| Parametro         | Descrizione                                                           |
| ----------------- | --------------------------------------------------------------------- |
| `query`           | Stringa di query di ricerca (mantienila sotto i 400 caratteri)        |
| `search_depth`    | `basic` (predefinito, bilanciato) o `advanced` (massima rilevanza, più lento) |
| `topic`           | `general` (predefinito), `news` (aggiornamenti in tempo reale) o `finance` |
| `max_results`     | Numero di risultati, 1-20 (predefinito: 5)                            |
| `include_answer`  | Include un riepilogo di risposta generato dall'IA (predefinito: false) |
| `time_range`      | Filtra per recenza: `day`, `week`, `month` o `year`                   |
| `include_domains` | Array di domini a cui limitare i risultati                            |
| `exclude_domains` | Array di domini da escludere dai risultati                            |

**Profondità di ricerca:**

| Profondità | Velocità | Rilevanza | Ideale per                           |
| ---------- | -------- | --------- | ------------------------------------ |
| `basic`    | Più veloce | Alta    | Query per uso generale (predefinito) |
| `advanced` | Più lento | Massima  | Precisione, fatti specifici, ricerca |

### `tavily_extract`

Usalo per estrarre contenuti puliti da uno o più URL. Gestisce
pagine renderizzate con JavaScript e supporta chunking focalizzato sulla query per un'estrazione
mirata.

| Parametro           | Descrizione                                                |
| ------------------- | ---------------------------------------------------------- |
| `urls`              | Array di URL da estrarre (1-20 per richiesta)              |
| `query`             | Riordina i chunk estratti in base alla rilevanza per questa query |
| `extract_depth`     | `basic` (predefinito, veloce) o `advanced` (per pagine ricche di JS) |
| `chunks_per_source` | Chunk per URL, 1-5 (richiede `query`)                      |
| `include_images`    | Include gli URL delle immagini nei risultati (predefinito: false) |

**Profondità di estrazione:**

| Profondità | Quando usarla                              |
| ---------- | ------------------------------------------ |
| `basic`    | Pagine semplici - prova prima questa       |
| `advanced` | SPA renderizzate in JS, contenuti dinamici, tabelle |

Suggerimenti:

- Massimo 20 URL per richiesta. Suddividi elenchi più lunghi in più chiamate.
- Usa `query` + `chunks_per_source` per ottenere solo il contenuto rilevante invece delle pagine complete.
- Prova prima `basic`; passa a `advanced` se il contenuto manca o è incompleto.

## Scegliere lo strumento giusto

| Esigenza                             | Strumento         |
| ------------------------------------ | ----------------- |
| Ricerca web rapida, senza opzioni speciali | `web_search`     |
| Ricerca con profondità, argomento, risposte IA | `tavily_search`  |
| Estrarre contenuti da URL specifici  | `tavily_extract` |

## Correlati

- [Panoramica di Ricerca Web](/tools/web) -- tutti i provider e il rilevamento automatico
- [Firecrawl](/tools/firecrawl) -- ricerca + scraping con estrazione di contenuti
- [Exa Search](/tools/exa-search) -- ricerca neurale con estrazione di contenuti
