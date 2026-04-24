---
read_when:
    - Vuoi usare Brave Search per `web_search`
    - Ti servono un `BRAVE_API_KEY` o i dettagli del piano
summary: Configurazione dell'API di Brave Search per `web_search`
title: Brave Search (percorso legacy)
x-i18n:
    generated_at: "2026-04-24T08:29:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# API di Brave Search

OpenClaw supporta l'API di Brave Search come provider `web_search`.

## Ottenere una chiave API

1. Crea un account Brave Search API su [https://brave.com/search/api/](https://brave.com/search/api/)
2. Nella dashboard, scegli il piano **Search** e genera una chiave API.
3. Salva la chiave nella configurazione oppure imposta `BRAVE_API_KEY` nell'ambiente del Gateway.

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
Il percorso legacy `tools.web.search.apiKey` continua a essere caricato tramite il livello di compatibilità, ma non è più il percorso di configurazione canonico.

`webSearch.mode` controlla il trasporto Brave:

- `web` (predefinito): normale ricerca web di Brave con titoli, URL e snippet
- `llm-context`: API Brave LLM Context con blocchi di testo e fonti già estratti per il grounding

## Parametri dello strumento

| Parametro     | Descrizione                                                         |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Query di ricerca (obbligatoria)                                     |
| `count`       | Numero di risultati da restituire (1-10, predefinito: 5)            |
| `country`     | Codice paese ISO di 2 lettere (ad es. `"US"`, `"DE"`)               |
| `language`    | Codice lingua ISO 639-1 per i risultati di ricerca (ad es. `"en"`, `"de"`, `"fr"`) |
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

- OpenClaw usa il piano **Search** di Brave. Se hai un abbonamento legacy (ad es. il piano Free originale con 2.000 query/mese), rimane valido ma non include funzionalità più recenti come LLM Context o limiti di frequenza più elevati.
- Ogni piano Brave include **\$5/mese di credito gratuito** (rinnovabile). Il piano Search costa \$5 per 1.000 richieste, quindi il credito copre 1.000 query/mese. Imposta il tuo limite di utilizzo nella dashboard Brave per evitare addebiti imprevisti. Consulta il [portale API di Brave](https://brave.com/search/api/) per i piani aggiornati.
- Il piano Search include l'endpoint LLM Context e i diritti di inferenza AI. L'archiviazione dei risultati per addestrare o ottimizzare modelli richiede un piano con espliciti diritti di archiviazione. Consulta i [Termini di servizio](https://api-dashboard.search.brave.com/terms-of-service) di Brave.
- La modalità `llm-context` restituisce voci di fonte con grounding invece del normale formato di snippet della ricerca web.
- La modalità `llm-context` non supporta `ui_lang`, `freshness`, `date_after` o `date_before`.
- `ui_lang` deve includere un sottotag di regione come `en-US`.
- I risultati vengono memorizzati nella cache per 15 minuti per impostazione predefinita (configurabile tramite `cacheTtlMinutes`).

Consulta [Strumenti web](/it/tools/web) per la configurazione completa di web_search.

## Correlati

- [Ricerca Brave](/it/tools/brave-search)
