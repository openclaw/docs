---
read_when:
    - Vuoi usare Brave Search per web_search
    - È necessaria una BRAVE_API_KEY o i dettagli del piano
summary: Configurazione dell'API Brave Search per web_search
title: Ricerca Brave
x-i18n:
    generated_at: "2026-05-02T08:35:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ecb9e3e5475bb26f4058311429b558f49cdd1df907a622f93f297ac6569d65
    source_path: tools/brave-search.md
    workflow: 16
---

# API Brave Search

OpenClaw supporta Brave Search API come provider `web_search`.

## Ottenere una chiave API

1. Crea un account Brave Search API su [https://brave.com/search/api/](https://brave.com/search/api/)
2. Nella dashboard, scegli il piano **Search** e genera una chiave API.
3. Archivia la chiave nella configurazione oppure imposta `BRAVE_API_KEY` nell'ambiente del Gateway.

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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

Le impostazioni di ricerca specifiche del provider Brave ora si trovano in `plugins.entries.brave.config.webSearch.*`.
Il vecchio `tools.web.search.apiKey` viene ancora caricato tramite lo shim di compatibilità, ma non è più il percorso di configurazione canonico.

`webSearch.mode` controlla il trasporto Brave:

- `web` (predefinito): normale ricerca web Brave con titoli, URL e snippet
- `llm-context`: API Brave LLM Context con blocchi di testo pre-estratti e fonti per il grounding

`webSearch.baseUrl` può indirizzare le richieste Brave a un proxy compatibile con Brave
o a un gateway attendibile. OpenClaw aggiunge `/res/v1/web/search` o `/res/v1/llm/context` all'URL di base
configurato e mantiene l'URL di base nella chiave della cache. Gli endpoint pubblici
devono usare `https://`; `http://` è accettato solo per host proxy di loopback attendibili
o di rete privata.

## Parametri dello strumento

<ParamField path="query" type="string" required>
Query di ricerca.
</ParamField>

<ParamField path="count" type="number" default="5">
Numero di risultati da restituire (1-10).
</ParamField>

<ParamField path="country" type="string">
Codice paese ISO di 2 lettere (ad es. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Codice lingua ISO 639-1 per i risultati di ricerca (ad es. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Codice della lingua di ricerca Brave (ad es. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Codice lingua ISO per gli elementi dell'interfaccia utente.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro temporale: `day` equivale a 24 ore.
</ParamField>

<ParamField path="date_after" type="string">
Solo risultati pubblicati dopo questa data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Solo risultati pubblicati prima di questa data (`YYYY-MM-DD`).
</ParamField>

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

- OpenClaw usa il piano **Search** di Brave. Se hai un abbonamento legacy (ad es. il piano Free originale con 2.000 query/mese), rimane valido ma non include funzionalità più recenti come LLM Context o limiti di frequenza più elevati.
- Ogni piano Brave include **\$5/mese di credito gratuito** (rinnovabile). Il piano Search costa \$5 per 1.000 richieste, quindi il credito copre 1.000 query/mese. Imposta il limite di utilizzo nella dashboard Brave per evitare addebiti imprevisti. Consulta il [portale API Brave](https://brave.com/search/api/) per i piani attuali.
- Il piano Search include l'endpoint LLM Context e i diritti di inferenza AI. L'archiviazione dei risultati per addestrare o ottimizzare modelli richiede un piano con diritti di archiviazione espliciti. Consulta i [Termini di servizio](https://api-dashboard.search.brave.com/terms-of-service) di Brave.
- La modalità `llm-context` restituisce voci di origine con grounding invece della normale forma degli snippet di ricerca web.
- La modalità `llm-context` supporta `freshness` e intervalli delimitati `date_after` + `date_before`. Non supporta `ui_lang`; `date_before` senza `date_after` viene rifiutato perché Brave richiede che gli intervalli di freschezza personalizzati includano sia data di inizio sia data di fine.
- `ui_lang` deve includere un sottotag regionale come `en-US`.
- I risultati vengono memorizzati nella cache per 15 minuti per impostazione predefinita (configurabile tramite `cacheTtlMinutes`).
- I valori personalizzati di `webSearch.baseUrl` sono inclusi nell'identità della cache Brave, quindi
  le risposte specifiche del proxy non entrano in conflitto.
- Abilita il flag di diagnostica `brave.http` per registrare URL/parametri di query delle richieste Brave, stato/tempi delle risposte ed eventi di hit/miss/scrittura della cache di ricerca durante la risoluzione dei problemi. Il flag non registra mai la chiave API né i corpi delle risposte, ma le query di ricerca possono essere sensibili.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati con filtro per dominio
- [Exa Search](/it/tools/exa-search) -- ricerca neurale con estrazione dei contenuti
