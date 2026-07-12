---
read_when:
    - Vuoi effettuare ricerche sul web senza una chiave API
    - Vuoi l'API Search a pagamento di Parallel
    - Vuoi estratti densi classificati in base all'efficienza del contesto per gli LLM
summary: Ricerca parallela -- estratti densi da fonti web ottimizzati per gli LLM
title: Ricerca parallela
x-i18n:
    generated_at: "2026-07-12T07:38:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Il Plugin Parallel fornisce due provider `web_search` di [Parallel](https://parallel.ai/), entrambi restituiscono estratti classificati e ottimizzati per gli LLM da un indice web creato per gli agenti IA:

| Provider                        | id              | Autenticazione                                                                                         |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| Ricerca Parallel (gratuita)     | `parallel-free` | Nessuna — [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuito di Parallel      |
| Ricerca Parallel                | `parallel`      | `PARALLEL_API_KEY` — API Search a pagamento, limiti di frequenza superiori e ottimizzazione obiettivi |

Imposta `tools.web.search.provider` su `parallel-free` o `parallel` per selezionarne esplicitamente uno; nessuno dei due viene rilevato automaticamente.

<Note>
  I modelli OpenAI Responses diretti (`api: "openai-responses"`, provider
  `openai`, URL di base dell'API ufficiale) utilizzano automaticamente la
  ricerca web nativa ospitata da OpenAI quando `tools.web.search.provider`
  non è impostato, è vuoto, è `"auto"` o è `"openai"`; pertanto, per
  impostazione predefinita, ignorano Parallel. Imposta
  `tools.web.search.provider` su `parallel-free` o `parallel` per instradarli
  invece tramite Parallel. Consulta la [panoramica della ricerca web](/it/tools/web).
</Note>

## Installare il Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Chiave API (provider a pagamento)

`parallel-free` non richiede una chiave, ma deve comunque essere selezionato esplicitamente. Il provider `parallel` a pagamento richiede una chiave API:

<Steps>
  <Step title="Creare un account">
    Registrati su [platform.parallel.ai](https://platform.parallel.ai) e
    genera una chiave API dalla tua dashboard.
  </Step>
  <Step title="Archiviare la chiave">
    Imposta `PARALLEL_API_KEY` nell'ambiente del Gateway oppure esegui la configurazione tramite:

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
            apiKey: "par-...", // facoltativo se PARALLEL_API_KEY è impostata
            baseUrl: "https://api.parallel.ai", // facoltativo; OpenClaw aggiunge /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" per il Search MCP gratuito oppure "parallel" per il
        // provider a pagamento basato su API mostrato qui.
        provider: "parallel",
      },
    },
  },
}
```

**Alternativa tramite variabile d'ambiente:** imposta `PARALLEL_API_KEY` nell'ambiente del Gateway. Per un'installazione del Gateway, inseriscila in `~/.openclaw/.env`.

## Sostituzione dell'URL di base

Si applica solo al provider `parallel` a pagamento; `parallel-free` utilizza sempre `https://search.parallel.ai/mcp` e ignora questa impostazione.

Imposta `plugins.entries.parallel.config.webSearch.baseUrl` per instradare le richieste a pagamento tramite un proxy compatibile o un endpoint alternativo, ad esempio Cloudflare AI Gateway. OpenClaw normalizza gli host senza schema anteponendo `https://` e aggiunge `/v1/search`, a meno che il percorso non termini già così. L'endpoint risolto fa parte della chiave della cache di ricerca, quindi i risultati provenienti da endpoint diversi non vengono mai condivisi.

## Parametri dello strumento

Entrambi i provider espongono il formato di ricerca nativo di Parallel, affinché il modello specifichi un obiettivo in linguaggio naturale insieme ad alcune brevi query con parole chiave: la combinazione che Parallel [consiglia](https://docs.parallel.ai/search/best-practices) per ottenere risultati ottimali.

<ParamField path="objective" type="string" required>
Descrizione in linguaggio naturale della domanda o dell'obiettivo sottostante (massimo 5000 caratteri). Deve essere autosufficiente.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Query di ricerca concise basate su parole chiave, ciascuna di 3-6 parole (1-5 voci, massimo 200 caratteri ciascuna). Fornisci 2-3 query diverse per ottenere risultati ottimali.
</ParamField>

<ParamField path="count" type="number">
Numero di risultati da restituire (1-40).
</ParamField>

<ParamField path="session_id" type="string">
ID di sessione Parallel facoltativo ricavato dal `sessionId` di un risultato precedente. Passalo alle ricerche successive della stessa attività, affinché Parallel raggruppi le chiamate correlate e migliori i risultati successivi. Massimo 1000 caratteri per `parallel`; il Search MCP gratuito `parallel-free` impone un limite di 100. Un ID oltre il limite viene scartato nella versione a pagamento oppure ne viene generato uno nuovo nella versione gratuita.
</ParamField>

<ParamField path="client_model" type="string">
Identificatore facoltativo del modello che effettua la chiamata, ad esempio `claude-opus-4-7` o `gpt-5.6-sol`, con un massimo di 100 caratteri. Consente a Parallel di adattare le impostazioni predefinite alle capacità del modello. Passa lo slug esatto del modello attivo; non abbreviarlo con un alias della famiglia.
</ParamField>

## Note

- Parallel classifica e comprime i risultati in funzione della loro utilità per il ragionamento degli LLM, non per il clic degli utenti; aspettati quindi estratti densi per ciascun risultato anziché il contenuto completo delle pagine.
- Gli estratti dei risultati vengono restituiti nell'array `excerpts` e sono inoltre concatenati in `description` per garantire la compatibilità con il contratto generico `web_search`.
- Entrambi i provider restituiscono un `session_id`; OpenClaw lo espone come `sessionId` nel payload dello strumento, affinché i chiamanti possano raggruppare le ricerche successive. Un ID di sessione generato da Parallel, ovvero non fornito dal chiamante, viene escluso dalla voce della cache, poiché attività non correlate con query identiche non devono ereditarlo.
- `searchId`, `warnings` e `usage` di Parallel vengono mantenuti quando presenti.
- OpenClaw inoltra sempre a Parallel un numero di risultati risolto come `advanced_settings.max_results` (`parallel`) oppure applica `count` lato client dopo la risposta di dimensione fissa di Parallel (`parallel-free`). Ha precedenza l'argomento `count` del chiamante, seguito da `tools.web.search.maxResults`; altrimenti viene usato il valore predefinito generico di `web_search` di OpenClaw (5), mentre il valore predefinito dell'API di Parallel è 10.
- Per impostazione predefinita, i risultati vengono memorizzati nella cache per 15 minuti (`cacheTtlMinutes`).
- `parallel-free` genera un nuovo `session_id` per ogni chiamata tramite il proprio handshake MCP quando il chiamante non ne fornisce uno; in tal caso, `parallel` lo lascia non impostato.

## Contenuti correlati

- [Panoramica della ricerca web](/it/tools/web) — tutti i provider e il rilevamento automatico
- [Ricerca Exa](/it/tools/exa-search) — ricerca neurale con estrazione dei contenuti
- [Ricerca Perplexity](/it/tools/perplexity-search) — risultati strutturati con filtro per dominio
