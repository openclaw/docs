---
read_when:
    - Vuoi usare Brave Search per web_search
    - Hai bisogno di un BRAVE_API_KEY o dei dettagli del piano
summary: Configurazione dell'API Brave Search per web_search
title: Brave Search (percorso legacy)
x-i18n:
    generated_at: "2026-04-05T13:42:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
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
            mode: "web", // or "llm-context"
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
Il legacy `tools.web.search.apiKey` continua a essere caricato tramite il livello di compatibilità, ma non è più il percorso di configurazione canonico.

`webSearch.mode` controlla il trasporto Brave:

- `web` (predefinito): normale ricerca web Brave con titoli, URL e frammenti
- `llm-context`: API Brave LLM Context con blocchi di testo ed estrazione delle fonti già effettuate per il grounding

## Parametri dello strumento

| Parameter     | Descrizione                                                         |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Query di ricerca (obbligatoria)                                     |
| `count`       | Numero di risultati da restituire (1-10, predefinito: 5)            |
| `country`     | Codice paese ISO di 2 lettere (ad esempio, "US", "DE")              |
| `language`    | Codice lingua ISO 639-1 per i risultati di ricerca (ad esempio, "en", "de", "fr") |
| `search_lang` | Codice lingua di ricerca Brave (ad esempio, `en`, `en-gb`, `zh-hans`) |
| `ui_lang`     | Codice lingua ISO per gli elementi dell'interfaccia                 |
| `freshness`   | Filtro temporale: `day` (24h), `week`, `month` o `year`             |
| `date_after`  | Solo risultati pubblicati dopo questa data (YYYY-MM-DD)             |
| `date_before` | Solo risultati pubblicati prima di questa data (YYYY-MM-DD)         |

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
```

## Note

- OpenClaw usa il piano Brave **Search**. Se disponi di un abbonamento legacy (ad esempio il piano Free originale con 2.000 query/mese), rimane valido ma non include funzionalità più recenti come LLM Context o limiti di frequenza più alti.
- Ogni piano Brave include **\$5/mese di credito gratuito** (rinnovabile). Il piano Search costa \$5 per 1.000 richieste, quindi il credito copre 1.000 query/mese. Imposta il tuo limite di utilizzo nella dashboard Brave per evitare addebiti imprevisti. Consulta il [portale API Brave](https://brave.com/search/api/) per i piani aggiornati.
- Il piano Search include l'endpoint LLM Context e i diritti di inferenza AI. L'archiviazione dei risultati per addestrare o mettere a punto modelli richiede un piano con diritti di archiviazione espliciti. Consulta i [Termini di servizio](https://api-dashboard.search.brave.com/terms-of-service) di Brave.
- La modalità `llm-context` restituisce voci di origine grounded invece della normale forma di frammento della ricerca web.
- La modalità `llm-context` non supporta `ui_lang`, `freshness`, `date_after` o `date_before`.
- `ui_lang` deve includere un sottotag regionale come `en-US`.
- Per impostazione predefinita, i risultati vengono memorizzati nella cache per 15 minuti (configurabile tramite `cacheTtlMinutes`).

Consulta [Strumenti web](/tools/web) per la configurazione completa di web_search.
