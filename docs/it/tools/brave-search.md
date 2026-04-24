---
read_when:
    - Vuoi usare Brave Search per `web_search`
    - Hai bisogno di un `BRAVE_API_KEY` o dei dettagli del piano
summary: Configurazione dell’API Brave Search per `web_search`
title: Ricerca Brave
x-i18n:
    generated_at: "2026-04-24T09:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# API Brave Search

OpenClaw supporta l’API Brave Search come provider `web_search`.

## Ottieni una chiave API

1. Crea un account Brave Search API su [https://brave.com/search/api/](https://brave.com/search/api/)
2. Nella dashboard, scegli il piano **Search** e genera una chiave API.
3. Memorizza la chiave nella configurazione oppure imposta `BRAVE_API_KEY` nell’ambiente del Gateway.

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

Le impostazioni di ricerca Brave specifiche del provider ora si trovano sotto `plugins.entries.brave.config.webSearch.*`.
Il legacy `tools.web.search.apiKey` continua a essere caricato tramite il compatibility shim, ma non è più il percorso di configurazione canonico.

`webSearch.mode` controlla il trasporto Brave:

- `web` (predefinito): normale ricerca web Brave con titoli, URL e snippet
- `llm-context`: API Brave LLM Context con blocchi di testo preestratti e fonti per grounding

## Parametri dello strumento

<ParamField path="query" type="string" required>
Query di ricerca.
</ParamField>

<ParamField path="count" type="number" default="5">
Numero di risultati da restituire (1–10).
</ParamField>

<ParamField path="country" type="string">
Codice paese ISO a 2 lettere (es. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Codice lingua ISO 639-1 per i risultati di ricerca (es. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Codice lingua di ricerca Brave (es. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Codice lingua ISO per gli elementi UI.
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

- OpenClaw usa il piano **Search** di Brave. Se hai un abbonamento legacy (es. il piano Free originale con 2.000 query/mese), resta valido ma non include funzionalità più recenti come LLM Context o rate limit più alti.
- Ogni piano Brave include **5$/mese di credito gratuito** (rinnovabile). Il piano Search costa 5$ per 1.000 richieste, quindi il credito copre 1.000 query/mese. Imposta il tuo limite di utilizzo nella dashboard Brave per evitare addebiti imprevisti. Vedi il [portale API Brave](https://brave.com/search/api/) per i piani attuali.
- Il piano Search include l’endpoint LLM Context e i diritti di inferenza AI. Memorizzare i risultati per addestrare o ottimizzare modelli richiede un piano con diritti di archiviazione espliciti. Vedi i [Termini di servizio](https://api-dashboard.search.brave.com/terms-of-service) di Brave.
- La modalità `llm-context` restituisce voci di fonte grounded invece della normale forma di snippet della ricerca web.
- La modalità `llm-context` non supporta `ui_lang`, `freshness`, `date_after` o `date_before`.
- `ui_lang` deve includere un sottotag di regione come `en-US`.
- I risultati vengono messi in cache per 15 minuti per impostazione predefinita (configurabile tramite `cacheTtlMinutes`).

## Correlati

- [Panoramica Web Search](/it/tools/web) -- tutti i provider e auto-rilevamento
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati con filtro di dominio
- [Exa Search](/it/tools/exa-search) -- ricerca neurale con estrazione dei contenuti
