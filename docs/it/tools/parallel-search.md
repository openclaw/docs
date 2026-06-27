---
read_when:
    - Vuoi la ricerca web senza una chiave API
    - Ti serve l'API Search a pagamento di Parallel
    - Vuoi estratti densi classificati per efficienza del contesto LLM
summary: Ricerca parallela -- estratti densi ottimizzati per LLM da fonti web
title: Ricerca parallela
x-i18n:
    generated_at: "2026-06-27T18:22:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Il Plugin Parallel fornisce due provider `web_search` di [Parallel](https://parallel.ai/):

- **Parallel Search (Free)** (`parallel-free`) -- il [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuito
  di Parallel. Non richiede alcun account né chiave API. Selezionalo
  esplicitamente quando vuoi usare il percorso di ricerca ospitato da Parallel
  senza chiave.
- **Parallel Search** (`parallel`) -- l'API Search a pagamento di Parallel.
  Richiede una `PARALLEL_API_KEY` e offre limiti di frequenza più elevati e
  ottimizzazione dell'obiettivo.

Entrambi restituiscono estratti classificati e ottimizzati per LLM da un indice
web creato per agenti IA. Imposta `tools.web.search.provider` su
`parallel-free` o `parallel` per sceglierne uno esplicitamente.

<Note>
  I modelli OpenAI Responses usano la ricerca web nativa di OpenAI quando
  `tools.web.search.provider` non è impostato, quindi bypassano i provider
  Parallel. Imposta `tools.web.search.provider` su `parallel-free` o `parallel`
  per instradarli tramite Parallel.
</Note>

## Installa il Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Chiave API (provider a pagamento)

`parallel-free` non richiede alcuna chiave API, ma deve comunque essere
selezionato come provider gestito. Il provider a pagamento `parallel` richiede
una chiave API:

<Steps>
  <Step title="Create an account">
    Registrati su [platform.parallel.ai](https://platform.parallel.ai) e
    genera una chiave API dalla tua dashboard.
  </Step>
  <Step title="Store the key">
    Imposta `PARALLEL_API_KEY` nell'ambiente Gateway oppure configura tramite:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configurazione

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Alternativa con variabile d'ambiente:** imposta `PARALLEL_API_KEY`
nell'ambiente Gateway. Per un'installazione gateway, inseriscila in
`~/.openclaw/.env`.

## Override dell'URL di base

L'override dell'URL di base si applica solo al provider a pagamento `parallel`.
Il provider gratuito `parallel-free` usa sempre `https://search.parallel.ai/mcp`.

Imposta `plugins.entries.parallel.config.webSearch.baseUrl` quando le richieste
Parallel devono passare attraverso un proxy compatibile o un endpoint Parallel
alternativo (ad esempio, Cloudflare AI Gateway). OpenClaw normalizza gli host
senza schema anteponendo `https://` e aggiunge `/v1/search` a meno che il
percorso non termini già così. L'endpoint risolto è incluso nella chiave della
cache di ricerca, quindi i risultati provenienti da endpoint Parallel diversi
non vengono condivisi.

## Parametri dello strumento

OpenClaw espone la forma di ricerca nativa di Parallel in modo che il modello
possa compilare sia l'obiettivo in linguaggio naturale sia alcune brevi query
con parole chiave — l'abbinamento che Parallel
[consiglia](https://docs.parallel.ai/search/best-practices) per ottenere i
risultati migliori.

<ParamField path="objective" type="string" required>
Descrizione in linguaggio naturale della domanda o dell'obiettivo sottostante
(max 5000 caratteri). Deve essere autonoma.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Query di ricerca concise con parole chiave, 3-6 parole ciascuna (1-5 voci,
max 200 caratteri ciascuna). Fornisci 2-3 query diverse per risultati migliori.
</ParamField>

<ParamField path="count" type="number">
Risultati da restituire (1-40).
</ParamField>

<ParamField path="session_id" type="string">
ID sessione Parallel facoltativo (max 1000 caratteri su `parallel`; il Search
MCP gratuito `parallel-free` lo limita a 100). Passa il `sessionId` da un
risultato Parallel precedente nelle ricerche successive che fanno parte dello
stesso task, così Parallel può raggruppare le chiamate correlate e migliorare i
risultati successivi. Un ID oltre il limite viene scartato e ne viene generato
uno nuovo.
</ParamField>

<ParamField path="client_model" type="string">
Identificatore facoltativo del modello che effettua la chiamata (ad es.
`claude-opus-4-7`, `gpt-5.5`). Consente a Parallel di adattare le impostazioni
predefinite alle capacità del tuo modello. Passa lo slug esatto del modello
attivo; non abbreviarlo in un alias di famiglia.
</ParamField>

## Note

- Parallel classifica e comprime i risultati in base all'utilità per il
  ragionamento LLM, non al click-through umano; aspettati estratti densi in
  ogni risultato invece del contenuto completo della pagina
- Gli estratti dei risultati tornano come array `excerpts` e vengono anche
  uniti nel campo `description` per compatibilità con il contratto generico
  `web_search`
- Parallel restituisce un `session_id` in ogni risposta; OpenClaw lo espone come
  `sessionId` nel payload dello strumento, così i chiamanti possono raggruppare
  le ricerche successive
- `searchId`, `warnings` e `usage` da Parallel vengono inoltrati quando presenti
- OpenClaw inoltra sempre a Parallel un conteggio dei risultati risolto come
  `advanced_settings.max_results`. L'argomento `count` del chiamante ha la
  precedenza, poi l'impostazione di primo livello
  `tools.web.search.maxResults`, altrimenti il valore predefinito generico
  `web_search` di OpenClaw (5). Questo mantiene coerente il volume dei
  risultati quando si passa da un provider all'altro; Parallel da solo usa come
  impostazione predefinita 10
- I risultati vengono memorizzati nella cache per 15 minuti per impostazione
  predefinita (configurabile tramite `cacheTtlMinutes`)
- Il provider gratuito `parallel-free` accetta gli stessi parametri. Applica
  `count` lato client e genera un `session_id` per chiamata quando non ne viene
  fornito uno.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Ricerca Exa](/it/tools/exa-search) -- ricerca neurale con estrazione dei contenuti
- [Perplexity Search](/it/tools/perplexity-search) -- risultati strutturati con filtro per dominio
