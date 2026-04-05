---
read_when:
    - Vuoi usare Brave Search per `web_search`
    - Hai bisogno di un `BRAVE_API_KEY` o dei dettagli del piano
summary: Configurazione dell'API Brave Search per `web_search`
title: Brave Search
x-i18n:
    generated_at: "2026-04-05T14:05:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc026a69addf74375a0e407805b875ff527c77eb7298b2f5bb0e165197f77c0c
    source_path: tools/brave-search.md
    workflow: 15
---

# API Brave Search

OpenClaw supporta l'API Brave Search come provider `web_search`.

## Ottenere una chiave API

1. Crea un account Brave Search API su [https://brave.com/search/api/](https://brave.com/search/api/)
2. Nella dashboard, scegli il piano **Search** e genera una chiave API.
3. Memorizza la chiave nella configurazione oppure imposta `BRAVE_API_KEY` nell'ambiente del Gateway.

## Esempio di configurazione

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // oppure "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Le impostazioni di ricerca Brave specifiche del provider ora si trovano in `plugins.entries.brave.config.webSearch.*`.
Il legacy `tools.web.search.apiKey` viene ancora caricato tramite lo shim di compatibilità, ma non è più il percorso di configurazione canonico.

`webSearch.mode` controlla il trasporto Brave:

- `web` (predefinito): normale ricerca web Brave con titoli, URL e snippet
- `llm-context`: API Brave LLM Context con frammenti di testo e fonti già estratti per il grounding

## Parametri dello strumento

| Parametro     | Descrizione                                                         |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Query di ricerca (obbligatoria)                                     |
| `count`       | Numero di risultati da restituire (1-10, predefinito: 5)            |
| `country`     | Codice paese ISO a 2 lettere (ad es. "US", "DE")                    |
| `language`    | Codice lingua ISO 639-1 per i risultati di ricerca (ad es. "en", "de", "fr") |
| `search_lang` | Codice lingua di ricerca Brave (ad es. `en`, `en-gb`, `zh-hans`)    |
| `ui_lang`     | Codice lingua ISO per gli elementi dell'interfaccia                 |
| `freshness`   | Filtro temporale: `day` (24h), `week`, `month` o `year`             |
| `date_after`  | Solo risultati pubblicati dopo questa data (YYYY-MM-DD)             |
| `date_before` | Solo risultati pubblicati prima di questa data (YYYY-MM-DD)         |

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
```

## Note

- OpenClaw usa il piano **Search** di Brave. Se hai un abbonamento legacy (ad esempio il piano Free originale con 2.000 query/mese), resta valido ma non include funzionalità più recenti come LLM Context o limiti di frequenza più alti.
- Ogni piano Brave include **5 $/mese di credito gratuito** (rinnovabile). Il piano Search costa 5 $ ogni 1.000 richieste, quindi il credito copre 1.000 query/mese. Imposta il tuo limite di utilizzo nella dashboard Brave per evitare addebiti imprevisti. Consulta il [portale API Brave](https://brave.com/search/api/) per i piani attuali.
- Il piano Search include l'endpoint LLM Context e i diritti di inferenza AI. L'archiviazione dei risultati per addestrare o ottimizzare modelli richiede un piano con diritti di archiviazione espliciti. Consulta i [Termini di servizio](https://api-dashboard.search.brave.com/terms-of-service) di Brave.
- La modalità `llm-context` restituisce voci di fonte grounding invece della normale forma di snippet della ricerca web.
- La modalità `llm-context` non supporta `ui_lang`, `freshness`, `date_after` o `date_before`.
- `ui_lang` deve includere un sottotag di area geografica come `en-US`.
- I risultati vengono memorizzati nella cache per 15 minuti per impostazione predefinita (configurabile tramite `cacheTtlMinutes`).

## Correlati

- [Panoramica di Web Search](/tools/web) -- tutti i provider e il rilevamento automatico
- [Perplexity Search](/tools/perplexity-search) -- risultati strutturati con filtro per dominio
- [Exa Search](/tools/exa-search) -- ricerca neurale con estrazione del contenuto
