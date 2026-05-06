---
read_when:
    - Vuoi usare Perplexity Search per la ricerca sul web
    - È necessario configurare PERPLEXITY_API_KEY o OPENROUTER_API_KEY
summary: Compatibilità dell'API di ricerca di Perplexity e di Sonar/OpenRouter per web_search
title: Ricerca Perplexity
x-i18n:
    generated_at: "2026-05-06T09:13:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 113abafae66acd8aaa0302b687ba13347eb44a81a4217b61bb68f07d8a119cb0
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw supporta Perplexity Search API come provider `web_search`.
Restituisce risultati strutturati con campi `title`, `url` e `snippet`.

Per compatibilità, OpenClaw supporta anche le configurazioni legacy Perplexity Sonar/OpenRouter.
Se usi `OPENROUTER_API_KEY`, una chiave `sk-or-...` in `plugins.entries.perplexity.config.webSearch.apiKey`, oppure imposti `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, il provider passa al percorso chat-completions e restituisce risposte sintetizzate dall'IA con citazioni invece di risultati strutturati della Search API.

## Ottenere una chiave API Perplexity

1. Crea un account Perplexity su [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Genera una chiave API nella dashboard
3. Archivia la chiave nella configurazione o imposta `PERPLEXITY_API_KEY` nell'ambiente del Gateway.

## Compatibilità con OpenRouter

Se stavi già usando OpenRouter per Perplexity Sonar, mantieni `provider: "perplexity"` e imposta `OPENROUTER_API_KEY` nell'ambiente del Gateway, oppure archivia una chiave `sk-or-...` in `plugins.entries.perplexity.config.webSearch.apiKey`.

Controlli di compatibilità opzionali:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Esempi di configurazione

### Search API Perplexity nativa

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

**Tramite configurazione:** esegui `openclaw configure --section web`. Archivia la chiave in
`~/.openclaw/openclaw.json` sotto `plugins.entries.perplexity.config.webSearch.apiKey`.
Quel campo accetta anche oggetti SecretRef.

**Tramite ambiente:** imposta `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`
nell'ambiente del processo Gateway. Per un'installazione del Gateway, inseriscila in
`~/.openclaw/.env` (o nell'ambiente del tuo servizio). Vedi [Variabili d'ambiente](/it/help/faq#env-vars-and-env-loading).

Se `provider: "perplexity"` è configurato e la SecretRef della chiave Perplexity non viene risolta senza fallback env, l'avvio/ricaricamento fallisce rapidamente.

## Parametri dello strumento

Questi parametri si applicano al percorso nativo Perplexity Search API.

<ParamField path="query" type="string" required>
Query di ricerca.
</ParamField>

<ParamField path="count" type="number" default="5">
Numero di risultati da restituire (1-10).
</ParamField>

<ParamField path="country" type="string">
Codice paese ISO a 2 lettere (ad esempio `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Codice lingua ISO 639-1 (ad esempio `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporale: `day` corrisponde a 24 ore.
</ParamField>

<ParamField path="date_after" type="string">
Solo risultati pubblicati dopo questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Solo risultati pubblicati prima di questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Array allowlist/denylist di domini (max 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Budget totale di contenuto (max 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite di token per pagina.
</ParamField>

Per il percorso di compatibilità legacy Sonar/OpenRouter:

- `query`, `count` e `freshness` sono accettati
- `count` lì è solo per compatibilità; la risposta è comunque una sola
  risposta sintetizzata con citazioni invece di un elenco di N risultati
- I filtri disponibili solo nella Search API, come `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` e `max_tokens_per_page`
  restituiscono errori espliciti

**Esempi:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regole dei filtri di dominio

- Massimo 20 domini per filtro
- Non è possibile mescolare allowlist e denylist nella stessa richiesta
- Usa il prefisso `-` per le voci denylist (ad esempio `["-reddit.com"]`)

## Note

- Perplexity Search API restituisce risultati di ricerca web strutturati (`title`, `url`, `snippet`)
- OpenRouter o `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` espliciti riportano Perplexity alle chat completions Sonar per compatibilità
- La compatibilità Sonar/OpenRouter restituisce una sola risposta sintetizzata con citazioni, non righe di risultati strutturati
- I risultati vengono memorizzati nella cache per 15 minuti per impostazione predefinita (configurabile tramite `cacheTtlMinutes`)

## Correlati

<CardGroup cols={2}>
  <Card title="Panoramica della ricerca web" href="/it/tools/web" icon="globe">
    Tutti i provider e le regole di rilevamento automatico.
  </Card>
  <Card title="Ricerca Brave" href="/it/tools/brave-search" icon="shield">
    Risultati strutturati con filtri per paese e lingua.
  </Card>
  <Card title="Ricerca Exa" href="/it/tools/exa-search" icon="magnifying-glass">
    Ricerca neurale con estrazione del contenuto.
  </Card>
  <Card title="Documentazione Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Guida rapida e riferimento ufficiali per Perplexity Search API.
  </Card>
</CardGroup>
