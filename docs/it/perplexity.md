---
read_when:
    - Vuoi usare Perplexity Search per la ricerca web
    - Hai bisogno di configurare `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`
summary: API di ricerca Perplexity e compatibilità Sonar/OpenRouter per `web_search`
title: Ricerca Perplexity (percorso legacy)
x-i18n:
    generated_at: "2026-04-24T08:49:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# API di ricerca Perplexity

OpenClaw supporta l'API di ricerca Perplexity come provider `web_search`.
Restituisce risultati strutturati con campi `title`, `url` e `snippet`.

Per compatibilità, OpenClaw supporta anche le vecchie configurazioni Perplexity Sonar/OpenRouter.
Se usi `OPENROUTER_API_KEY`, una chiave `sk-or-...` in `plugins.entries.perplexity.config.webSearch.apiKey`, oppure imposti `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, il provider passa al percorso chat-completions e restituisce risposte sintetizzate dall'AI con citazioni invece dei risultati strutturati dell'API Search.

## Ottenere una chiave API Perplexity

1. Crea un account Perplexity su [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Genera una chiave API nella dashboard
3. Salva la chiave nella configurazione oppure imposta `PERPLEXITY_API_KEY` nell'ambiente del Gateway.

## Compatibilità OpenRouter

Se stavi già usando OpenRouter per Perplexity Sonar, mantieni `provider: "perplexity"` e imposta `OPENROUTER_API_KEY` nell'ambiente del Gateway, oppure salva una chiave `sk-or-...` in `plugins.entries.perplexity.config.webSearch.apiKey`.

Controlli di compatibilità facoltativi:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Esempi di configurazione

### API di ricerca Perplexity nativa

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Compatibilità OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Dove impostare la chiave

**Tramite configurazione:** esegui `openclaw configure --section web`. Memorizza la chiave in
`~/.openclaw/openclaw.json` sotto `plugins.entries.perplexity.config.webSearch.apiKey`.
Quel campo accetta anche oggetti SecretRef.

**Tramite ambiente:** imposta `PERPLEXITY_API_KEY` oppure `OPENROUTER_API_KEY`
nell'ambiente del processo Gateway. Per un'installazione gateway, inseriscila in
`~/.openclaw/.env` (oppure nel tuo ambiente del servizio). Consulta [Variabili env](/it/help/faq#env-vars-and-env-loading).

Se `provider: "perplexity"` è configurato e il SecretRef della chiave Perplexity non è risolto senza fallback env, startup/reload fallisce in modalità fail-fast.

## Parametri dello strumento

Questi parametri si applicano al percorso nativo dell'API di ricerca Perplexity.

| Parametro             | Descrizione                                          |
| --------------------- | ---------------------------------------------------- |
| `query`               | Query di ricerca (obbligatoria)                      |
| `count`               | Numero di risultati da restituire (1-10, predefinito: 5) |
| `country`             | Codice paese ISO a 2 lettere (es. "US", "DE")       |
| `language`            | Codice lingua ISO 639-1 (es. "en", "de", "fr")      |
| `freshness`           | Filtro temporale: `day` (24h), `week`, `month` o `year` |
| `date_after`          | Solo risultati pubblicati dopo questa data (YYYY-MM-DD) |
| `date_before`         | Solo risultati pubblicati prima di questa data (YYYY-MM-DD) |
| `domain_filter`       | Array di allowlist/denylist di domini (max 20)      |
| `max_tokens`          | Budget totale dei contenuti (predefinito: 25000, max: 1000000) |
| `max_tokens_per_page` | Limite di token per pagina (predefinito: 2048)      |

Per il vecchio percorso di compatibilità Sonar/OpenRouter:

- `query`, `count` e `freshness` sono accettati
- `count` lì è solo per compatibilità; la risposta resta comunque una risposta sintetizzata
  con citazioni invece di un elenco di N risultati
- I filtri disponibili solo per l'API Search come `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` e `max_tokens_per_page`
  restituiscono errori espliciti

**Esempi:**

```javascript
// Ricerca specifica per paese e lingua
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Risultati recenti (ultima settimana)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Ricerca per intervallo di date
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtro di dominio (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtro di dominio (denylist - prefisso con -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Estrazione di contenuti più ampia
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regole del filtro di dominio

- Massimo 20 domini per filtro
- Non è possibile mescolare allowlist e denylist nella stessa richiesta
- Usa il prefisso `-` per le voci denylist (ad esempio `["-reddit.com"]`)

## Note

- L'API di ricerca Perplexity restituisce risultati di ricerca web strutturati (`title`, `url`, `snippet`)
- OpenRouter o `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` espliciti riportano Perplexity a Sonar chat completions per compatibilità
- La compatibilità Sonar/OpenRouter restituisce una risposta sintetizzata con citazioni, non righe di risultati strutturati
- I risultati vengono messi in cache per 15 minuti per impostazione predefinita (configurabile tramite `cacheTtlMinutes`)

Consulta [Strumenti web](/it/tools/web) per la configurazione completa di web_search.
Consulta la [documentazione dell'API di ricerca Perplexity](https://docs.perplexity.ai/docs/search/quickstart) per maggiori dettagli.

## Correlati

- [Ricerca Perplexity](/it/tools/perplexity-search)
- [Ricerca web](/it/tools/web)
