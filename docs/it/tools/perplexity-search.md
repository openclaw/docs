---
read_when:
    - Vuoi usare Perplexity Search per la ricerca sul web
    - È necessario configurare PERPLEXITY_API_KEY o OPENROUTER_API_KEY
summary: Compatibilità dell'API Perplexity Search e di Sonar/OpenRouter con web_search
title: Ricerca Perplexity
x-i18n:
    generated_at: "2026-07-12T07:38:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw supporta l'API Perplexity Search come provider di `web_search`. Restituisce risultati strutturati con i campi `title`, `url` e `snippet`.

Per compatibilità, OpenClaw supporta anche le configurazioni legacy di Perplexity Sonar/OpenRouter. Se utilizzi `OPENROUTER_API_KEY`, una chiave `sk-or-...` in `plugins.entries.perplexity.config.webSearch.apiKey` oppure imposti `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, il provider passa al percorso delle chat completions e restituisce risposte sintetizzate dall'IA con citazioni anziché risultati strutturati dell'API Search.

## Installare il Plugin

Installa il Plugin ufficiale, quindi riavvia il Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Ottenere una chiave API Perplexity

1. Crea un account Perplexity su [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Genera una chiave API nella dashboard.
3. Salva la chiave nella configurazione oppure imposta `PERPLEXITY_API_KEY` nell'ambiente del Gateway.

## Compatibilità con OpenRouter

Se utilizzavi già OpenRouter per Perplexity Sonar, mantieni `provider: "perplexity"` e imposta `OPENROUTER_API_KEY` nell'ambiente del Gateway, oppure salva una chiave `sk-or-...` in `plugins.entries.perplexity.config.webSearch.apiKey`.

Controlli di compatibilità facoltativi:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Esempi di configurazione

### API Perplexity Search nativa

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

### Compatibilità con OpenRouter / Sonar

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

**Tramite configurazione:** esegui `openclaw configure --section web`. La chiave viene salvata in `~/.openclaw/openclaw.json` nel campo `plugins.entries.perplexity.config.webSearch.apiKey`. Tale campo accetta anche oggetti SecretRef.

**Tramite ambiente:** imposta `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY` nell'ambiente del processo Gateway. Per un'installazione del Gateway, inseriscila in `~/.openclaw/.env` (o nell'ambiente del servizio). Consulta [Variabili d'ambiente](/it/help/faq#env-vars-and-env-loading).

Se è configurato `provider: "perplexity"` e il SecretRef della chiave Perplexity non viene risolto, senza alcun valore di riserva nell'ambiente, l'avvio o il ricaricamento termina immediatamente con un errore.

## Parametri dello strumento

Questi parametri si applicano al percorso dell'API Perplexity Search nativa.

<ParamField path="query" type="string" required>
Query di ricerca.
</ParamField>

<ParamField path="count" type="number" default="5">
Numero di risultati da restituire (1-10).
</ParamField>

<ParamField path="country" type="string">
Codice paese ISO di 2 lettere (ad esempio `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Codice lingua ISO 639-1 (ad esempio `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporale: `day` corrisponde a 24 ore.
</ParamField>

<ParamField path="date_after" type="string">
Solo i risultati pubblicati dopo questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Solo i risultati pubblicati prima di questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Array di domini consentiti o esclusi (massimo 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Budget totale dei contenuti (massimo 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite di token per pagina.
</ParamField>

Per il percorso legacy di compatibilità Sonar/OpenRouter:

- Sono accettati `query`, `count` e `freshness`.
- In questo percorso, `count` è disponibile solo per compatibilità; la risposta rimane un'unica risposta sintetizzata con citazioni, anziché un elenco di N risultati.
- I filtri esclusivi dell'API Search (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) restituiscono errori espliciti.

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

// Filtro per dominio (elenco consentiti)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtro per dominio (elenco esclusi: prefisso -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Estrazione di più contenuti
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regole del filtro per dominio

- Massimo 20 domini per filtro.
- Non è possibile combinare voci consentite ed escluse nella stessa richiesta.
- Utilizza il prefisso `-` per le voci escluse (ad esempio `["-reddit.com"]`).

## Note

- L'API Perplexity Search restituisce risultati di ricerca web strutturati (`title`, `url`, `snippet`).
- OpenRouter, oppure un valore esplicito per `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, fa tornare Perplexity alle chat completions di Sonar per compatibilità.
- La compatibilità Sonar/OpenRouter restituisce un'unica risposta sintetizzata con citazioni, non righe di risultati strutturati.
- Per impostazione predefinita, i risultati vengono memorizzati nella cache per 15 minuti (configurabile tramite `cacheTtlMinutes`).

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Panoramica della ricerca web" href="/it/tools/web" icon="globe">
    Tutti i provider e le regole di rilevamento automatico.
  </Card>
  <Card title="Ricerca Brave" href="/it/tools/brave-search" icon="shield">
    Risultati strutturati con filtri per paese e lingua.
  </Card>
  <Card title="Ricerca Exa" href="/it/tools/exa-search" icon="magnifying-glass">
    Ricerca neurale con estrazione dei contenuti.
  </Card>
  <Card title="Documentazione dell'API Perplexity Search" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Guida introduttiva e documentazione di riferimento ufficiali dell'API Perplexity Search.
  </Card>
</CardGroup>
