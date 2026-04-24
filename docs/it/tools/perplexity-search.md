---
read_when:
    - Vuoi usare Perplexity Search per la ricerca web
    - Hai bisogno della configurazione di `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`
summary: API Search di Perplexity e compatibilità Sonar/OpenRouter per `web_search`
title: Ricerca Perplexity
x-i18n:
    generated_at: "2026-04-24T09:07:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# API Search di Perplexity

OpenClaw supporta l'API Search di Perplexity come provider `web_search`.
Restituisce risultati strutturati con campi `title`, `url` e `snippet`.

Per compatibilità, OpenClaw supporta anche configurazioni legacy Perplexity Sonar/OpenRouter.
Se usi `OPENROUTER_API_KEY`, una chiave `sk-or-...` in `plugins.entries.perplexity.config.webSearch.apiKey`, oppure imposti `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, il provider passa al percorso chat-completions e restituisce risposte sintetizzate dall'IA con citazioni invece dei risultati strutturati della Search API.

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

### API Search nativa di Perplexity

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

**Tramite configurazione:** esegui `openclaw configure --section web`. Salva la chiave in
`~/.openclaw/openclaw.json` sotto `plugins.entries.perplexity.config.webSearch.apiKey`.
Anche quel campo accetta oggetti SecretRef.

**Tramite ambiente:** imposta `PERPLEXITY_API_KEY` oppure `OPENROUTER_API_KEY`
nell'ambiente del processo Gateway. Per un'installazione gateway, inseriscilo in
`~/.openclaw/.env` (oppure nel tuo ambiente di servizio). Vedi [Env vars](/it/help/faq#env-vars-and-env-loading).

Se `provider: "perplexity"` è configurato e il SecretRef della chiave Perplexity non è risolto senza fallback env, l'avvio/ricaricamento fallisce immediatamente.

## Parametri dello strumento

Questi parametri si applicano al percorso nativo dell'API Search di Perplexity.

<ParamField path="query" type="string" required>
Query di ricerca.
</ParamField>

<ParamField path="count" type="number" default="5">
Numero di risultati da restituire (1–10).
</ParamField>

<ParamField path="country" type="string">
Codice paese ISO di 2 lettere (ad es. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Codice lingua ISO 639-1 (ad es. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporale — `day` equivale a 24 ore.
</ParamField>

<ParamField path="date_after" type="string">
Solo risultati pubblicati dopo questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Solo risultati pubblicati prima di questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Array di allowlist/denylist di domini (massimo 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Budget totale dei contenuti (massimo 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite di token per pagina.
</ParamField>

Per il percorso di compatibilità legacy Sonar/OpenRouter:

- sono accettati `query`, `count` e `freshness`
- `count` lì è solo per compatibilità; la risposta resta comunque una singola
  risposta sintetizzata con citazioni invece di una lista di N risultati
- i filtri esclusivi della Search API come `country`, `language`, `date_after`,
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

// Estrazione di più contenuto
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regole del filtro di dominio

- Massimo 20 domini per filtro
- Non puoi mescolare allowlist e denylist nella stessa richiesta
- Usa il prefisso `-` per le voci denylist (ad es. `["-reddit.com"]`)

## Note

- L'API Search di Perplexity restituisce risultati di ricerca web strutturati (`title`, `url`, `snippet`)
- OpenRouter o `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` espliciti riportano Perplexity alle chat completions Sonar per compatibilità
- La compatibilità Sonar/OpenRouter restituisce una singola risposta sintetizzata con citazioni, non righe di risultati strutturati
- I risultati vengono memorizzati in cache per 15 minuti per impostazione predefinita (configurabile tramite `cacheTtlMinutes`)

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e l'auto-rilevamento
- [Documentazione API Search di Perplexity](https://docs.perplexity.ai/docs/search/quickstart) -- documentazione ufficiale Perplexity
- [Brave Search](/it/tools/brave-search) -- risultati strutturati con filtri paese/lingua
- [Exa Search](/it/tools/exa-search) -- ricerca neurale con estrazione del contenuto
