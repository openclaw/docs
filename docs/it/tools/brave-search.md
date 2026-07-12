---
read_when:
    - Vuoi usare Brave Search per web_search
    - Hai bisogno di una BRAVE_API_KEY o dei dettagli del piano
summary: Configurazione dell'API Brave Search per web_search
title: Ricerca Brave
x-i18n:
    generated_at: "2026-07-12T07:32:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw supporta l'API Brave Search come provider di `web_search`.

## Ottenere una chiave API

1. Crea un account per l'API Brave Search all'indirizzo [https://brave.com/search/api/](https://brave.com/search/api/)
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
            baseUrl: "https://api.search.brave.com", // sostituzione facoltativa del proxy/URL di base
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

Le impostazioni di ricerca specifiche del provider Brave si trovano in `plugins.entries.brave.config.webSearch.*`; questo è il percorso di configurazione canonico. Un valore condiviso di primo livello `tools.web.search.apiKey` e i valori con ambito `tools.web.search.brave.*` vengono ancora caricati tramite un'unione di compatibilità, ma le nuove configurazioni devono utilizzare il percorso con ambito del Plugin indicato sopra.

`webSearch.mode` controlla il trasporto Brave:

- `web` (predefinito): normale ricerca web Brave con titoli, URL e frammenti
- `llm-context`: API Brave LLM Context con blocchi di testo e fonti pre-estratti per l'ancoraggio

`webSearch.baseUrl` può indirizzare le richieste Brave a un proxy o Gateway
attendibile e compatibile con Brave. OpenClaw aggiunge `/res/v1/web/search` o `/res/v1/llm/context`
all'URL di base configurato e mantiene l'URL di base nella chiave della cache. Gli endpoint
pubblici devono usare `https://`; `http://` è accettato solo per host proxy local loopback
attendibili o della rete privata.

## Parametri dello strumento

<ParamField path="query" type="string" required>
Query di ricerca.
</ParamField>

<ParamField path="count" type="number" default="5">
Numero di risultati da restituire (1–10).
</ParamField>

<ParamField path="country" type="string">
Codice paese ISO a 2 lettere (ad es. `US`, `DE`).
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
Filtro temporale: `day` corrisponde a 24 ore.
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

- OpenClaw utilizza il piano **Search** di Brave. Se disponi di un abbonamento precedente (ad es. il piano Free originale con 2.000 query al mese), rimane valido ma non include funzionalità più recenti come LLM Context o limiti di frequenza più elevati.
- Ogni piano Brave include **\$5 al mese di credito gratuito** (rinnovabile). Il piano Search costa \$5 ogni 1.000 richieste, quindi il credito copre 1.000 query al mese. Imposta il limite di utilizzo nella dashboard Brave per evitare addebiti imprevisti. Consulta il [portale API di Brave](https://brave.com/search/api/) per i piani attuali.
- Il piano Search include l'endpoint LLM Context e i diritti di inferenza IA. La memorizzazione dei risultati per addestrare o perfezionare modelli richiede un piano con diritti di archiviazione espliciti. Consulta i [Termini di servizio](https://api-dashboard.search.brave.com/terms-of-service) di Brave.
- La modalità `llm-context` restituisce voci di fonti ancorate anziché il normale formato con frammenti della ricerca web.
- La modalità `llm-context` supporta `freshness` e intervalli delimitati da `date_after` + `date_before`. Non supporta `ui_lang`; `date_before` senza `date_after` viene rifiutato perché Brave richiede che gli intervalli di attualità personalizzati includano sia la data iniziale sia quella finale.
- `ui_lang` deve includere un sottotag regionale, ad esempio `en-US`.
- Per impostazione predefinita, i risultati vengono memorizzati nella cache per 15 minuti (configurabile tramite `cacheTtlMinutes`).
- I valori personalizzati di `webSearch.baseUrl` sono inclusi nell'identità della cache Brave, quindi
  le risposte specifiche del proxy non entrano in conflitto.
- Abilita il flag di diagnostica `brave.http` per registrare gli URL e i parametri di query delle richieste Brave, lo stato e i tempi delle risposte e gli eventi di riscontro positivo, mancato riscontro e scrittura della cache di ricerca durante la risoluzione dei problemi. Il flag non registra mai la chiave API né i corpi delle risposte, ma le query di ricerca possono contenere dati sensibili.

## Contenuti correlati

- [Panoramica della ricerca web](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Ricerca Perplexity](/it/tools/perplexity-search) -- risultati strutturati con filtro per dominio
- [Ricerca Exa](/it/tools/exa-search) -- ricerca neurale con estrazione dei contenuti
