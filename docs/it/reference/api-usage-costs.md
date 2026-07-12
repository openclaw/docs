---
read_when:
    - Vuoi capire quali funzionalità possono chiamare API a pagamento
    - Devi verificare chiavi, costi e visibilità dell'utilizzo
    - Stai spiegando la rendicontazione dei costi di /status o /usage
summary: Verifica cosa può generare costi, quali chiavi vengono utilizzate e come visualizzare l'utilizzo
title: Utilizzo e costi dell'API
x-i18n:
    generated_at: "2026-07-12T07:27:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Mappa delle funzionalità di OpenClaw che possono chiamare API di provider a pagamento, con l'indicazione di dove ciascuna legge le proprie credenziali e dove viene visualizzato il costo risultante.

## Dove vengono visualizzati i costi

**`/status`** (istantanea per sessione)

- Mostra il modello della sessione corrente, l'utilizzo del contesto e i token dell'ultima risposta.
- Aggiunge un **costo stimato** per l'ultima risposta quando OpenClaw dispone dei metadati di utilizzo e dei prezzi locali per il modello attivo, inclusi i provider senza chiave API con prezzi espliciti, come i modelli Bedrock `aws-sdk`.
- Se l'istantanea della sessione attiva contiene pochi dati, `/status` recupera i contatori di token/cache e l'etichetta del modello attivo dall'ultima voce di utilizzo della trascrizione. I valori attivi esistenti diversi da zero hanno la precedenza sui dati della trascrizione; un totale della trascrizione delle dimensioni del prompt può comunque prevalere quando il totale memorizzato è assente o inferiore.

**`/usage`** (piè di pagina per messaggio)

- `/usage full` aggiunge un piè di pagina sull'utilizzo a ogni risposta, incluso il **costo stimato** quando sono configurati prezzi locali e sono disponibili i metadati di utilizzo.
- `/usage tokens` mostra solo i token. I runtime OAuth/token e CLI basati su abbonamento mostrano solo i token, a meno che non forniscano metadati di utilizzo compatibili e un prezzo locale esplicito.
- `/usage cost` stampa un riepilogo locale dei costi; `/usage off` disabilita il piè di pagina.
- Nota su Gemini CLI: sia l'output `stream-json` sia il precedente output `json` riportano l'utilizzo in `stats`. OpenClaw normalizza `stats.cached` in `cacheRead` e, quando necessario, ricava i token di input da `stats.input_tokens - stats.cached`.

**Interfaccia di controllo → Utilizzo** (analisi tra sessioni)

- Mostra i totali dei token e dei costi stimati ricavati dalle trascrizioni per l'intervallo di date selezionato, con suddivisioni per provider, modello, agente, canale e tipo di token.
- Confronta finestre di calendario più brevi che terminano alla data finale dell'intervallo selezionato. Le date mancanti vengono conteggiate come giorni di calendario con utilizzo pari a zero; non vengono saltate per creare una finestra più densa.
- Etichetta direttamente la scala del grafico giornaliero. Un indicatore `√` segnala che la compressione tramite radice quadrata mantiene visibili i giorni con utilizzo ridotto.
- Questi totali descrivono la cronologia locale delle sessioni disponibile, non una fattura del provider né un registro di fatturazione complessivo. L'interfaccia avvisa quando mancano i prezzi per alcune voci.

**Finestre di utilizzo della CLI** (quote del provider, non costo per messaggio)

- `openclaw status --usage` e `openclaw channels list` mostrano le **finestre di utilizzo** del provider nel formato `X% left`.
- Provider attuali per le finestre di utilizzo: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (include l'autenticazione OAuth/token di ChatGPT/Codex), Xiaomi e z.ai. Consulta [CLI dei modelli](/it/cli/models) e [CLI dei canali](/it/cli/channels) per l'elenco completo di provider e opzioni.
- I campi non elaborati `usage_percent` / `usagePercent` di MiniMax indicano la quota rimanente, quindi OpenClaw li inverte; quando presenti, i campi basati sul conteggio hanno la precedenza. Se la risposta include un array `model_remains`, OpenClaw seleziona la voce del modello di chat, ricava l'etichetta della finestra dai timestamp quando necessario e include il nome del modello nell'etichetta del piano.
- Quando disponibili, le credenziali per l'utilizzo provengono da hook specifici del provider; altrimenti OpenClaw usa come ripiego le credenziali OAuth/chiave API corrispondenti provenienti dai profili di autenticazione, dall'ambiente o dalla configurazione.

Consulta [Utilizzo dei token e costi](/it/reference/token-use) per esempi dettagliati.

<Note>
Anthropic ha confermato che il riutilizzo di Claude CLI (incluso `claude -p`) è un modello di integrazione autorizzato, a meno che non pubblichi una nuova politica. Anthropic non espone una stima in dollari per messaggio, quindi `/usage full` non può mostrare il costo dell'utilizzo di Claude CLI.
</Note>

## Come vengono individuate le chiavi

- **Profili di autenticazione**: specifici per agente, memorizzati in `auth-profiles.json`.
- **Variabili d'ambiente**: ad esempio `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Configurazione**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, che può esportare la chiave nell'ambiente del processo della skill.

## Funzionalità che possono consumare le chiavi

### Risposte del modello principale (chat + strumenti)

Ogni risposta o chiamata a uno strumento viene eseguita sul provider del modello corrente. Questa è la principale fonte di utilizzo e costi, inclusi i piani ospitati basati su abbonamento fatturati al di fuori dell'interfaccia locale di OpenClaw: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan e il percorso di accesso a Claude di Anthropic con Extra Usage abilitato.

Consulta [Modelli](/it/providers/models) per la configurazione dei prezzi e [Utilizzo dei token e costi](/it/reference/token-use) per la visualizzazione.

### Comprensione dei contenuti multimediali (audio/immagini/video)

I contenuti multimediali in ingresso possono essere riepilogati o trascritti tramite l'API di un provider prima dell'esecuzione della pipeline di risposta. Il supporto dei provider viene registrato per ciascun plugin e cambia con l'aggiunta di nuovi plugin; consulta [Comprensione dei contenuti multimediali](/it/nodes/media-understanding) per l'elenco e la configurazione attuali.

### Generazione di immagini e video

`image_generate` e `video_generate` vengono instradati verso qualsiasi provider configurato disponibile. La generazione di immagini può dedurre un provider predefinito basato sull'autenticazione quando `agents.defaults.imageGenerationModel` non è impostato; la generazione di video richiede un valore esplicito per `agents.defaults.videoGenerationModel` (ad esempio `qwen/wan2.6-t2v`).

Consulta [Generazione di immagini](/it/tools/image-generation) e [Generazione di video](/it/tools/video-generation) per l'elenco attuale dei provider.

### Incorporamenti della memoria e ricerca semantica

La ricerca semantica nella memoria utilizza API di incorporamento quando `agents.defaults.memorySearch.provider` specifica un adattatore remoto (ad esempio `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memorySearch.provider = "lmstudio"` o `"ollama"` viene eseguito su un server locale/ospitato autonomamente e in genere non comporta costi di hosting. `memorySearch.provider = "local"` mantiene tutto sul dispositivo senza utilizzare API. Un provider facoltativo `memorySearch.fallback` può gestire gli errori degli incorporamenti locali.

Consulta [Memoria](/it/concepts/memory).

### Strumento di ricerca sul Web

`web_search` può comportare costi di utilizzo a seconda del provider selezionato. Ogni provider legge prima la propria chiave da una variabile d'ambiente, quindi da `plugins.entries.<id>.config.webSearch.apiKey`:

| Provider               | Variabili d'ambiente                                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                                          |
| DuckDuckGo             | senza chiave; non ufficiale, basato su HTML, senza costi                                                                                                                                 |
| Exa                    | `EXA_API_KEY`                                                                                                                                                                            |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                                      |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                                         |
| Grok (xAI)             | profilo OAuth xAI o `XAI_API_KEY`                                                                                                                                                        |
| Kimi (Moonshot)        | `KIMI_API_KEY` o `MOONSHOT_API_KEY`                                                                                                                                                      |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY`                                                                                             |
| Ollama Web Search      | senza chiave per un host locale raggiungibile con accesso effettuato; la ricerca diretta su `https://ollama.com` usa `OLLAMA_API_KEY`; gli host protetti da autenticazione riutilizzano la normale autenticazione bearer del provider Ollama |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                                       |
| Perplexity Search API  | `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`                                                                                                                                              |
| SearXNG                | `SEARXNG_BASE_URL`; senza chiave/ospitato autonomamente, senza costi di hosting                                                                                                           |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                                         |

I percorsi di configurazione precedenti `tools.web.search.*` vengono ancora caricati tramite un livello di compatibilità, ma non sono più l'interfaccia consigliata.

**Credito gratuito di Brave Search**: ogni piano include 5 USD al mese di credito gratuito rinnovabile. Il piano Search costa 5 USD ogni 1.000 richieste, quindi il credito copre gratuitamente 1.000 richieste al mese. Imposta un limite di utilizzo nella dashboard di Brave per evitare addebiti imprevisti.

Consulta [Strumenti Web](/it/tools/web).

### Strumento di recupero Web (Firecrawl)

`web_fetch` può chiamare Firecrawl con un accesso iniziale senza chiave; aggiungi `FIRECRAWL_API_KEY` (o `plugins.entries.firecrawl.config.webFetch.apiKey`) per ottenere limiti più elevati. Se Firecrawl non è configurato, lo strumento usa come ripiego il recupero diretto insieme al plugin `web-readability` incluso (senza API a pagamento). Disabilita `plugins.entries.web-readability.enabled` per ignorare l'estrazione locale tramite Readability.

Consulta [Strumenti Web](/it/tools/web).

### Istantanee di utilizzo dei provider (stato/integrità)

`openclaw status --usage` e `openclaw models status --json` chiamano gli endpoint di utilizzo dei provider per mostrare le finestre delle quote o lo stato dell'autenticazione. Le chiamate sono poco frequenti, ma raggiungono comunque le API dei provider.

Consulta [CLI dei modelli](/it/cli/models).

### Riepilogo di salvaguardia della Compaction

La salvaguardia della Compaction può riepilogare la cronologia della sessione utilizzando il modello corrente, richiamando le API del provider quando viene eseguita.

Consulta [Gestione delle sessioni e Compaction](/it/reference/session-management-compaction).

### Scansione/verifica del modello

`openclaw models scan` può verificare i modelli OpenRouter e usa `OPENROUTER_API_KEY` quando la verifica è abilitata.

Consulta [CLI dei modelli](/it/cli/models).

### Conversazione (voce)

La modalità conversazione può richiamare ElevenLabs quando è configurato: `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`.

Consulta [Modalità conversazione](/it/nodes/talk).

### Skills (API di terze parti)

Le Skills possono memorizzare `apiKey` in `skills.entries.<name>.apiKey`. Se una skill usa tale chiave con un'API esterna, il costo dipende dal provider della skill.

Consulta [Skills](/it/tools/skills).

## Contenuti correlati

- [Utilizzo dei token e costi](/it/reference/token-use)
- [Memorizzazione nella cache dei prompt](/it/reference/prompt-caching)
- [Monitoraggio dell'utilizzo](/it/concepts/usage-tracking)
