---
read_when:
    - Vuoi eseguire OpenClaw con modelli cloud o locali tramite Ollama
    - Hai bisogno di indicazioni per l'installazione e la configurazione di Ollama
    - Vuoi usare i modelli di visione di Ollama per comprendere le immagini
summary: Esegui OpenClaw con Ollama (modelli cloud e locali)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T07:25:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw comunica con l'API nativa di Ollama (`/api/chat`), non con l'endpoint
compatibile con OpenAI `/v1`. Sono supportate tre modalità:

| Modalità       | Cosa utilizza                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Cloud + locale | Un host Ollama raggiungibile, che serve modelli locali e, se è stato effettuato l'accesso, modelli `:cloud` |
| Solo cloud     | Direttamente `https://ollama.com`, senza daemon locale                                                 |
| Solo locale    | Un host Ollama raggiungibile, esclusivamente con modelli locali                                        |

Per la configurazione solo cloud con l'id provider dedicato `ollama-cloud`, consulta
[Ollama Cloud](/it/providers/ollama-cloud). Usa riferimenti `ollama-cloud/<model>` quando
vuoi mantenere l'instradamento cloud separato da un provider `ollama` locale.

<Warning>
Non usare l'URL `/v1` compatibile con OpenAI (`http://host:11434/v1`). Impedisce il corretto funzionamento delle chiamate agli strumenti e i modelli possono emettere il JSON grezzo delle chiamate agli strumenti come testo normale. Usa l'URL nativo: `baseUrl: "http://host:11434"` (senza `/v1`).
</Warning>

La chiave di configurazione canonica è `baseUrl`. È accettata anche `baseURL` per
gli esempi nello stile dell'SDK OpenAI, ma le nuove configurazioni devono usare `baseUrl`.

## Regole di autenticazione

<AccordionGroup>
  <Accordion title="Host locali e LAN">
    Gli URL Ollama di local loopback, rete privata, `.local` e con semplice nome host non richiedono un vero token bearer. OpenClaw usa il marcatore `ollama-local` per questi casi.
  </Accordion>
  <Accordion title="Host remoti e Ollama Cloud">
    Gli host remoti pubblici e `https://ollama.com` richiedono una credenziale reale: `OLLAMA_API_KEY`, un profilo di autenticazione o la proprietà `apiKey` del provider. Per l'uso diretto del servizio ospitato, preferisci il provider `ollama-cloud`.
  </Accordion>
  <Accordion title="Id provider personalizzati">
    Un provider personalizzato con `api: "ollama"` segue le stesse regole. Ad esempio, un provider `ollama-remote` indirizzato a un host LAN privato può usare `apiKey: "ollama-local"`; i sotto-agenti risolvono tale marcatore tramite l'hook del provider Ollama anziché considerarlo una credenziale mancante. Anche `agents.defaults.memorySearch.provider` può fare riferimento a un id provider personalizzato affinché gli embedding usino quell'endpoint Ollama.
  </Accordion>
  <Accordion title="Profili di autenticazione">
    `auth-profiles.json` archivia la credenziale per un id provider; inserisci le impostazioni dell'endpoint (`baseUrl`, `api`, modelli, intestazioni, timeout) in `models.providers.<id>`. I vecchi file piatti come `{ "ollama-windows": { "apiKey": "ollama-local" } }` non costituiscono un formato di runtime; `openclaw doctor --fix` li riscrive come profilo canonico con chiave API `ollama-windows:default`, creando un backup. Un valore `baseUrl` in tale file precedente è superfluo e deve essere spostato nella configurazione del provider.
  </Accordion>
  <Accordion title="Ambito degli embedding di memoria">
    L'autenticazione bearer per gli embedding di memoria Ollama è limitata all'host per cui è stata dichiarata:

    - Una chiave a livello di provider viene inviata esclusivamente all'host di quel provider.
    - `agents.*.memorySearch.remote.apiKey` viene inviata esclusivamente al relativo host remoto per gli embedding.
    - Un semplice valore della variabile d'ambiente `OLLAMA_API_KEY` viene considerato conforme alla convenzione di Ollama Cloud e, per impostazione predefinita, non viene inviato agli host locali o auto-ospitati.

  </Accordion>
</AccordionGroup>

## Per iniziare

<Tabs>
  <Tab title="Configurazione iniziale (consigliata)">
    <Steps>
      <Step title="Avvia la configurazione iniziale">
        ```bash
        openclaw onboard
        ```

        Seleziona **Ollama**, quindi scegli una modalità: **Cloud + locale**, **Solo cloud** o **Solo locale**.
      </Step>
      <Step title="Seleziona un modello">
        `Solo cloud` richiede `OLLAMA_API_KEY` e suggerisce valori predefiniti per i modelli cloud ospitati. `Cloud + locale` e `Solo locale` richiedono un URL di base Ollama, rilevano i modelli disponibili e scaricano automaticamente il modello locale selezionato se manca. Un tag `:latest` installato, come `gemma4:latest`, viene mostrato una sola volta anziché duplicare `gemma4`. `Cloud + locale` verifica inoltre se sull'host è stato effettuato l'accesso per usare il cloud.
      </Step>
      <Step title="Verifica">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Modalità non interattiva:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` e `--custom-model-id` sono facoltativi; se vengono omessi, vengono usati l'host locale predefinito e il modello suggerito `gemma4`.

  </Tab>

  <Tab title="Configurazione manuale">
    <Steps>
      <Step title="Installa e avvia Ollama">
        Scaricalo da [ollama.com/download](https://ollama.com/download), quindi scarica un modello:

        ```bash
        ollama pull gemma4
        ```

        Per l'accesso cloud ibrido, esegui `ollama signin` sullo stesso host.
      </Step>
      <Step title="Imposta una credenziale">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # host locale/LAN, qualsiasi valore è valido
        export OLLAMA_API_KEY="your-real-key"   # solo https://ollama.com
        ```

        Oppure nella configurazione: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Seleziona il modello">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Oppure nella configurazione:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modelli cloud tramite un host locale

`Cloud + locale` instrada sia i modelli locali sia quelli `:cloud` tramite un unico
host Ollama raggiungibile: questo è il flusso ibrido di Ollama e la modalità da
scegliere durante la configurazione quando vuoi entrambi.

OpenClaw richiede l'URL di base, rileva i modelli locali e verifica lo stato di
`ollama signin`. Quando l'accesso è stato effettuato, suggerisce i valori predefiniti
ospitati (`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Se
l'accesso non è stato effettuato, la configurazione rimane solo locale finché non esegui `ollama signin`.

Per l'accesso solo cloud senza un daemon locale, usa `openclaw onboard --auth-choice ollama-cloud` e consulta [Ollama Cloud](/it/providers/ollama-cloud): questo percorso non richiede `ollama signin` né un server in esecuzione:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

L'elenco dei modelli cloud mostrato durante `openclaw onboard` viene popolato in tempo reale da
`https://ollama.com/api/tags`, con un limite di 500 voci, in modo che il selettore rifletta
il catalogo ospitato corrente. Se `ollama.com` non è raggiungibile o non restituisce
modelli durante la configurazione, OpenClaw usa come ripiego il proprio elenco di suggerimenti
predefinito, affinché la configurazione iniziale possa comunque essere completata.

## Rilevamento dei modelli (provider implicito)

Quando `OLLAMA_API_KEY` (o un profilo di autenticazione) è impostato e non è definito né
`models.providers.ollama` né un altro provider personalizzato con `api: "ollama"`,
OpenClaw rileva i modelli da `http://127.0.0.1:11434`:

| Comportamento                 | Dettaglio                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interrogazione del catalogo   | `/api/tags`                                                                                                                                                                                                                                                                                                                               |
| Rilevamento delle funzionalità | La lettura non garantita di `/api/show` rileva `contextWindow`, i parametri `num_ctx` del Modelfile e le funzionalità (visione/strumenti/ragionamento)                                                                                                                                                                                       |
| Modelli con visione           | Una funzionalità `vision` restituita da `/api/show` indica che il modello supporta le immagini (`input: ["text", "image"]`)                                                                                                                                                                                                                |
| Rilevamento del ragionamento  | Usa la funzionalità `thinking` di `/api/show` quando disponibile; se Ollama omette le funzionalità, ricorre a un'euristica basata sul nome (`r1`, `reason`, `reasoning`, `think`). `glm-5.2:cloud` e `deepseek-v4-flash\|pro:cloud` vengono sempre considerati modelli di ragionamento, indipendentemente dalle funzionalità dichiarate. |
| Limiti dei token              | `maxTokens` usa per impostazione predefinita il limite massimo di token Ollama di OpenClaw                                                                                                                                                                                                                                                 |
| Costi                         | Tutti i costi sono `0`                                                                                                                                                                                                                                                                                                                    |

```bash
ollama list
openclaw models list
```

L'impostazione di `models.providers.ollama` con un array `models` esplicito, oppure di un
provider personalizzato con `api: "ollama"` e un `baseUrl` che non sia di local loopback, disabilita
il rilevamento automatico; i modelli devono quindi essere definiti manualmente (consulta
[Configurazione](#configuration)). Anche una voce `models.providers.ollama` indirizzata al
servizio ospitato `https://ollama.com` ignora il rilevamento, poiché i modelli Ollama Cloud
sono gestiti dal provider. I provider personalizzati di local loopback, come
`http://127.0.0.2:11434`, sono comunque considerati locali e mantengono attivo il rilevamento automatico.

Puoi usare un riferimento completo come `ollama/<pulled-model>:latest` senza una
voce `models.json` scritta manualmente; OpenClaw lo risolve in tempo reale. Per gli
host su cui è stato effettuato l'accesso, la selezione di un riferimento non elencato
`ollama/<model>:cloud` convalida quel modello esatto tramite `/api/show` e lo aggiunge
al catalogo di runtime soltanto se Ollama ne conferma i metadati; gli errori di battitura
continuano a generare un errore di modello sconosciuto.

### Test rapidi

Per una verifica testuale mirata che ignori l'intera superficie degli strumenti dell'agente:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Aggiungi `--file` con un'immagine per una verifica essenziale di un modello con visione (accetta PNG/JPEG/WebP;
i file che non sono immagini vengono rifiutati prima che Ollama venga chiamato; usa
`openclaw infer audio transcribe` per l'audio):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

Nessuno dei due percorsi carica gli strumenti di chat, la memoria o il contesto della sessione. Se la verifica riesce
mentre le normali risposte dell'agente non riescono, è probabile che il problema riguardi la capacità
del modello di gestire strumenti o agenti, non l'endpoint.

La selezione di un modello con `/model ollama/<model>` è una scelta esplicita dell'utente: se il
`baseUrl` configurato non è raggiungibile, la risposta successiva non riesce e restituisce l'errore
del provider, anziché passare silenziosamente a un altro modello configurato.

I processi Cron isolati aggiungono un controllo di sicurezza locale prima di avviare il turno dell'agente:
se il modello selezionato viene risolto in un provider Ollama locale, di rete privata o `.local`
e `/api/tags` non è raggiungibile, OpenClaw registra l'esecuzione come
`skipped`, includendo il modello nel testo dell'errore. Questo controllo dell'endpoint viene memorizzato
nella cache per 5 minuti per ogni host, così i processi Cron ripetuti diretti a un daemon arrestato non
avviano tutti richieste destinate a non riuscire.

Verifica in tempo reale:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Per Ollama Cloud, indirizza lo stesso test live all'endpoint ospitato (per impostazione predefinita ignora gli embedding; forzali con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, poiché una chiave cloud potrebbe non autorizzare `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Per aggiungere un modello, scaricalo: verrà rilevato automaticamente.

```bash
ollama pull mistral
```

## Inferenza locale sul Node

Gli agenti possono delegare una breve attività a un modello Ollama su un desktop associato o su un Node server. Il prompt e la risposta transitano sulla connessione autenticata esistente tra Gateway e Node; la richiesta viene eseguita sull'endpoint Ollama di loopback del Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Avvia Ollama sul Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Connetti l'host del Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Approva il dispositivo e i relativi comandi del Node sull'host del Gateway, quindi verifica:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Una prima connessione, o un aggiornamento che aggiunge comandi Ollama, può richiedere l'approvazione dei comandi del Node. Se il Node si connette senza dichiarare `ollama.models` e `ollama.chat`, controlla nuovamente `openclaw nodes pending`.

  </Step>
  <Step title="Usalo da un agente">
    Il plugin Ollama incluso espone lo strumento `node_inference`. Gli agenti chiamano prima `action: "discover"`, quindi `action: "run"` con un Node e un modello restituiti dal risultato (`run` può omettere il Node quando è connesso esattamente un solo Node compatibile). Ad esempio: "Individua i modelli Ollama sui miei Node, quindi usa il modello caricato più veloce per riassumere questo testo."
  </Step>
</Steps>

Il rilevamento legge `/api/tags`, controlla le funzionalità tramite `/api/show` e, quando disponibile, usa `/api/ps` per assegnare la priorità ai modelli già caricati. Restituisce soltanto i modelli locali che Ollama segnala come compatibili con la chat (funzionalità `completion`): le voci di Ollama Cloud e i modelli destinati esclusivamente agli embedding vengono esclusi. Ogni esecuzione disabilita il ragionamento del modello e limita per impostazione predefinita l'output a 512 token (limite massimo assoluto di 8192), a meno che la chiamata allo strumento non richieda un valore `maxTokens` diverso; alcuni modelli, ad esempio GPT-OSS, non supportano la disabilitazione del ragionamento e potrebbero comunque emettere token di ragionamento.

Per mantenere Ollama in esecuzione su un Node senza renderlo accessibile agli agenti:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Riavvia il Node (`openclaw node restart`, oppure arresta e riesegui `openclaw node run` per una sessione in primo piano). Il Node smette di dichiarare `ollama.models` e `ollama.chat`; Ollama stesso e il provider Ollama del Gateway non subiscono modifiche. Reimposta il valore su `true` e riavvia per riabilitare la funzionalità; dopo la riconnessione, una modifica alla superficie dei comandi potrebbe richiedere nuovamente l'approvazione tramite `openclaw nodes pending`.

Verifica direttamente i comandi del Node, senza un turno dell'agente:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` limita il tempo a disposizione del Node per eseguire il comando; `--timeout` limita la durata complessiva della chiamata al Gateway e deve essere maggiore.

L'inferenza locale sul Node usa sempre l'endpoint di loopback del Node stesso: non riutilizza un `models.providers.ollama.baseUrl` remoto o cloud configurato. I comandi del Node sono disponibili per impostazione predefinita sugli host Node macOS, Linux e Windows e rimangono soggetti alle normali regole di associazione e autorizzazione dei comandi del Node.

## Visione e descrizione delle immagini

Il plugin Ollama incluso registra Ollama come provider di comprensione dei contenuti multimediali compatibile con le immagini, consentendo a OpenClaw di instradare le richieste esplicite di descrizione delle immagini e le impostazioni predefinite configurate per i modelli di immagini attraverso modelli di visione Ollama locali o ospitati.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` deve essere un riferimento completo `<provider/model>`; quando è impostato, `infer image describe` prova prima quel modello, anziché ignorare la descrizione per i modelli che supportano già la visione nativa. Se la chiamata non riesce, OpenClaw può proseguire con `agents.defaults.imageModel.fallbacks`; gli errori di preparazione di file o URL causano un errore prima che venga tentato il fallback. Usa `infer image describe` per il flusso di comprensione delle immagini di OpenClaw e per l'`imageModel` configurato; usa `infer model run --file` per una verifica multimodale diretta con un prompt personalizzato.

Per rendere Ollama il provider predefinito di comprensione delle immagini per i contenuti multimediali in ingresso:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Preferisci il riferimento completo `ollama/<model>`. Un riferimento `imageModel` senza provider, come `qwen2.5vl:7b`, viene normalizzato in `ollama/qwen2.5vl:7b` soltanto quando quel modello esatto è elencato in `models.providers.ollama.models` con `input: ["text", "image"]` e nessun altro provider di immagini configurato espone lo stesso ID senza provider; in caso contrario, usa esplicitamente il prefisso del provider.

I modelli di visione locali più lenti possono richiedere un timeout per la comprensione delle immagini più lungo rispetto ai modelli cloud e, su hardware con risorse limitate, possono arrestarsi in modo anomalo se Ollama tenta di allocare l'intero contesto di visione dichiarato dal modello. Imposta un timeout per la funzionalità e limita `num_ctx`:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Questo timeout si applica alla comprensione delle immagini in ingresso e allo strumento esplicito `image`. `models.providers.ollama.timeoutSeconds` continua a controllare il limite della richiesta HTTP Ollama sottostante per le normali chiamate ai modelli.

Verifica live:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Se definisci manualmente `models.providers.ollama.models`, contrassegna esplicitamente i modelli di visione:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rifiuta le richieste di descrizione delle immagini per i modelli non contrassegnati come compatibili con le immagini. Con il rilevamento implicito, questa informazione deriva dalla funzionalità di visione restituita da `/api/show`.

## Configurazione

<Tabs>
  <Tab title="Di base (rilevamento implicito)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` è impostata, puoi omettere `apiKey` nella voce del provider; OpenClaw la inserisce per i controlli di disponibilità.
    </Tip>

  </Tab>

  <Tab title="Esplicita (modelli manuali)">
    Usa una configurazione esplicita per una distribuzione cloud ospitata, un host o una porta non predefiniti, finestre di contesto forzate oppure elenchi di modelli completamente manuali:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="URL di base personalizzato">
    La configurazione esplicita disabilita il rilevamento automatico, quindi i modelli devono essere elencati:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Non aggiungere `/v1`. Quel percorso seleziona la modalità compatibile con OpenAI, nella quale la chiamata degli strumenti non è affidabile.
    </Warning>

  </Tab>
</Tabs>

## Ricette comuni

Sostituisci gli ID dei modelli con i nomi esatti restituiti da `ollama list` o `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Modello locale con rilevamento automatico">
    Ollama sulla stessa macchina del Gateway, rilevato automaticamente:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Non aggiungere un blocco `models.providers.ollama` a meno che non siano necessari modelli manuali.

  </Accordion>

  <Accordion title="Host Ollama nella LAN con modelli manuali">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` rappresenta il budget di contesto di OpenClaw; `params.num_ctx` viene inviato a Ollama. Mantienili allineati quando l'hardware non è in grado di eseguire il modello con l'intero contesto dichiarato.

  </Accordion>

  <Accordion title="Solo Ollama Cloud">
    Nessun demone locale, modelli ospitati direttamente:

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    Per usare l'ID provider dedicato `ollama-cloud` al posto di questa struttura, consulta [Ollama Cloud](/it/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Cloud e locale tramite un demone autenticato">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Più host Ollama">
    ID provider personalizzati quando si esegue più di un server Ollama; ciascuno dispone
    di host, modelli, autenticazione e timeout propri.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw rimuove il prefisso del provider attivo (usando come ripiego un prefisso
    semplice `ollama/`) prima di chiamare Ollama, quindi `ollama-large/qwen3.5:27b`
    raggiunge Ollama come `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Profilo locale leggero del modello">
    Alcuni modelli locali gestiscono prompt semplici, ma hanno difficoltà con l'intera
    superficie degli strumenti dell'agente. Limita gli strumenti e il contesto prima di modificare
    le impostazioni globali di runtime:

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Usa `compat.supportsTools: false` solo quando il modello o il server
    presenta sistematicamente errori con gli schemi degli strumenti: questa opzione sacrifica le capacità dell'agente in favore della stabilità.
    `localModelLean` rimuove dalla superficie diretta dell'agente gli strumenti più pesanti per browser, cron, messaggi, generazione di contenuti multimediali,
    voce e PDF, salvo quando siano richiesti esplicitamente,
    e colloca i cataloghi più grandi dietro la ricerca degli strumenti. Non modifica
    il contesto di runtime né la modalità di ragionamento di Ollama. Abbinalo a `params.num_ctx` e
    `params.thinking: false` per i piccoli modelli di ragionamento in stile Qwen che entrano in ciclo o
    consumano il proprio budget nel ragionamento nascosto.

  </Accordion>
</AccordionGroup>

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

Gli ID provider personalizzati funzionano allo stesso modo: per un riferimento che usa il prefisso del provider
attivo, come `ollama-spark/qwen3:32b`, OpenClaw rimuove tale prefisso prima di
chiamare Ollama, inviando `qwen3:32b`.

Per i modelli locali lenti, preferisci una regolazione specifica del provider prima di aumentare il timeout
dell'intero runtime dell'agente:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` copre la richiesta HTTP al modello: configurazione della connessione, intestazioni,
streaming del corpo e interruzione totale protetta del recupero. `params.keep_alive` viene
inoltrato come `keep_alive` di livello superiore nelle richieste native `/api/chat`; impostalo per
ciascun modello quando il tempo di caricamento del primo turno è il collo di bottiglia.

### Verifica rapida

```bash
# Demone Ollama visibile a questa macchina
curl http://127.0.0.1:11434/api/tags

# Catalogo OpenClaw e modello selezionato
openclaw models list --provider ollama
openclaw models status

# Verifica rapida diretta del modello
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Per gli host remoti, sostituisci `127.0.0.1` con l'host di `baseUrl`. Se `curl`
funziona ma OpenClaw no, verifica se il Gateway viene eseguito su una
macchina, un contenitore o un account di servizio diverso.

## Ricerca web di Ollama

OpenClaw include **Ricerca web di Ollama** come provider `web_search`.

| Proprietà   | Dettaglio                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl` quando impostato, altrimenti `http://127.0.0.1:11434`; `https://ollama.com` usa direttamente l'API ospitata              |
| Autenticazione | Senza chiave per un host locale autenticato; `OLLAMA_API_KEY` o autenticazione del provider configurata per la ricerca diretta su `https://ollama.com` o per host protetti da autenticazione |
| Requisito   | Gli host locali o self-hosted devono essere in esecuzione e autenticati con `ollama signin`; la ricerca ospitata diretta richiede `baseUrl: "https://ollama.com"` più una vera chiave API |

Sceglilo durante `openclaw onboard` o `openclaw configure --section web`, oppure imposta:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Per la ricerca ospitata diretta tramite Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Per un host self-hosted, OpenClaw prova prima il proxy locale `/api/experimental/web_search`,
quindi usa come ripiego il percorso ospitato `/api/web_search` sullo stesso host; un
demone locale autenticato normalmente risponde tramite il proxy locale. Le chiamate dirette a
`https://ollama.com` usano sempre l'endpoint ospitato `/api/web_search`.

<Note>
Per la configurazione e il comportamento completi, consulta [Ricerca web di Ollama](/it/tools/ollama-search).
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità legacy compatibile con OpenAI">
    <Warning>
    **La chiamata degli strumenti non è affidabile in questa modalità.** Usala solo quando un proxy richiede il formato OpenAI e non dipendi dalla chiamata nativa degli strumenti.
    </Warning>

    Imposta esplicitamente `api: "openai-completions"` per un proxy dietro
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // valore predefinito: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Questa modalità potrebbe non supportare contemporaneamente lo streaming e la chiamata degli strumenti;
    potrebbe essere necessario impostare `params: { streaming: false }` sul modello.

    OpenClaw inserisce `options.num_ctx` per impostazione predefinita in questa modalità, affinché Ollama non
    ripieghi silenziosamente su un contesto di 4096 token. Se il proxy rifiuta
    campi `options` sconosciuti, disabilitalo:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Finestre di contesto">
    Per i modelli rilevati automaticamente, OpenClaw usa la finestra di contesto indicata da
    `/api/show`, inclusi i valori `PARAMETER num_ctx` più grandi provenienti da
    Modelfile personalizzati; altrimenti usa come ripiego la finestra di contesto Ollama
    predefinita di OpenClaw.

    `contextWindow`, `contextTokens` e `maxTokens` a livello di provider impostano
    i valori predefiniti per ogni modello di quel provider e possono essere sovrascritti per
    ciascun modello. `contextWindow` è il budget di prompt/compaction proprio di OpenClaw. Le richieste native
    `/api/chat` lasciano `options.num_ctx` non impostato, a meno che non si imposti
    esplicitamente `params.num_ctx`, quindi Ollama applica il proprio valore predefinito basato sul modello,
    su `OLLAMA_CONTEXT_LENGTH` o sulla VRAM; i valori `params.num_ctx` non validi, pari a zero, negativi
    o non finiti vengono ignorati. Se una configurazione precedente usava
    solo `contextWindow`/`maxTokens` per forzare il contesto della richiesta nativa, esegui
    `openclaw doctor --fix` per copiarli in `params.num_ctx`. L'adattatore
    compatibile con OpenAI continua a inserire `options.num_ctx` per impostazione predefinita in base a
    `params.num_ctx` o `contextWindow` configurato; disabilitalo con
    `injectNumCtxForOpenAICompat: false` se il servizio a monte rifiuta `options`.

    Le voci dei modelli nativi accettano inoltre le comuni opzioni di runtime Ollama in
    `params`, inoltrate come `options` native di `/api/chat`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` e `num_thread`.
    Alcune chiavi (`format`, `keep_alive`, `truncate`, `shift`) vengono inoltrate come
    campi della richiesta di livello superiore anziché come `options` annidate. OpenClaw inoltra
    solo queste chiavi di richiesta Ollama, quindi i parametri esclusivamente di runtime, come
    `streaming`, non vengono mai inviati a Ollama. Usa `params.think` (o
    `params.thinking`) per impostare `think` al livello superiore; `false` disabilita il
    ragionamento a livello API per i modelli di ragionamento in stile Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    Anche `agents.defaults.models["ollama/<model>"].params.num_ctx` per modello
    funziona; la voce esplicita del modello nel provider ha la precedenza se sono impostate entrambe.

  </Accordion>

  <Accordion title="Controllo del ragionamento">
    OpenClaw inoltra il ragionamento come previsto da Ollama: `think` al livello superiore, non
    `options.think`. I modelli rilevati automaticamente per i quali `/api/show` segnala una
    capacità `thinking` espongono `/think low`, `/think medium`, `/think high`
    e `/think max`; i modelli senza ragionamento espongono solo `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Oppure imposta un valore predefinito per il modello:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think`/`params.thinking` per modello può disabilitare o forzare il ragionamento
    dell'API per un modello specifico. OpenClaw conserva questa configurazione esplicita
    quando l'esecuzione attiva ha soltanto il valore predefinito implicito `off`; un comando
    di runtime diverso da off, come `/think medium`, continua ad avere la precedenza. Una richiesta
    di ragionamento con valore true non viene mai inviata a un modello contrassegnato esplicitamente
    con `reasoning: false`; una richiesta `think: false` viene sempre inviata.

  </Accordion>

  <Accordion title="Modelli di ragionamento">
    I modelli denominati `deepseek-r1`, `reasoning`, `reason` o `think` sono considerati
    per impostazione predefinita capaci di ragionamento, senza necessità di configurazione aggiuntiva:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Costi dei modelli">
    Ollama viene eseguito localmente ed è gratuito, quindi tutti i costi dei modelli sono `0` sia per
    i modelli rilevati automaticamente sia per quelli definiti manualmente.
  </Accordion>

  <Accordion title="Embedding della memoria">
    Il plugin Ollama incluso registra un provider di embedding della memoria per la
    [ricerca nella memoria](/it/concepts/memory). Usa l'URL di base e la chiave API di Ollama
    configurati, chiama `/api/embed` e, quando possibile, raggruppa più segmenti di memoria
    in un'unica richiesta `input`.

    Quando `proxy.enabled=true`, le richieste di embedding all'origine local loopback
    esatta dell'host, derivata dal `baseUrl` configurato, usano il percorso diretto protetto
    di OpenClaw anziché il proxy di inoltro gestito. Il nome host configurato deve essere
    esso stesso `localhost` o un indirizzo IP di loopback letterale: i nomi DNS che si
    risolvono semplicemente in loopback continuano a usare il percorso del proxy gestito. Gli host
    Ollama su LAN, tailnet, rete privata e rete pubblica restano sempre sul percorso del
    proxy gestito e i reindirizzamenti verso un altro host o un'altra porta non ereditano
    l'attendibilità. `proxy.loopbackMode: "proxy"` instrada comunque il traffico di loopback attraverso il
    proxy; `proxy.loopbackMode: "block"` lo nega prima della connessione:
    consulta [Proxy gestito](/it/security/network-proxy#gateway-loopback-mode).

    | Proprietà | Valore |
    | --- | --- |
    | Modello predefinito | `nomic-embed-text` |
    | Download automatico | Sì, se non è presente localmente |
    | Concorrenza inline predefinita | 1 (gli altri provider hanno valori predefiniti più elevati; aumentala con `nonBatchConcurrency` se l'host può sostenerla) |

    Gli embedding in fase di query usano prefissi di recupero per i modelli che li richiedono o
    li consigliano: `nomic-embed-text`, `qwen3-embedding` e
    `mxbai-embed-large`. I batch di documenti rimangono invariati, quindi gli indici esistenti non
    richiedono alcuna migrazione del formato.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Valore predefinito per Ollama. Aumentalo sugli host più potenti se la reindicizzazione è troppo lenta.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Per un host di embedding remoto, limita l'autenticazione a tale host:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configurazione dello streaming">
    Ollama usa per impostazione predefinita l'**API nativa** (`/api/chat`), che supporta
    contemporaneamente lo streaming e la chiamata degli strumenti, senza necessità di configurazione speciale.

    Per le richieste native, il controllo del ragionamento viene inoltrato direttamente: `/think off`
    e `openclaw agent --thinking off` inviano `think: false` al livello principale, a meno che
    non sia configurato un valore esplicito per `params.think`/`params.thinking`; `/think
    low|medium|high` invia la stringa corrispondente al livello di intensità; `/think max` corrisponde
    al livello massimo di Ollama, `think: "high"`.

    <Tip>
    Per usare invece l'endpoint compatibile con OpenAI, consulta «Modalità legacy compatibile con OpenAI» qui sopra: lo streaming e la chiamata degli strumenti potrebbero non funzionare insieme in tale modalità.
    </Tip>

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Ciclo di arresti anomali di WSL2 (riavvii ripetuti)">
    Su WSL2 con NVIDIA/CUDA, il programma di installazione Linux ufficiale di Ollama crea un'unità
    systemd `ollama.service` con `Restart=always`. Se tale servizio
    si avvia automaticamente e carica un modello basato su GPU durante l'avvio di WSL2, Ollama può bloccare
    la memoria dell'host durante il caricamento; il recupero della memoria di Hyper-V non riesce sempre a recuperare
    tali pagine, quindi Windows può terminare la VM WSL2, systemd riavvia
    Ollama e il ciclo si ripete.

    Indizi: riavvii o terminazioni ripetuti di WSL2, utilizzo elevato della CPU in `app.slice` o
    `ollama.service` subito dopo l'avvio di WSL2 e SIGTERM da systemd anziché
    dal terminatore OOM di Linux.

    OpenClaw registra un avviso all'avvio quando rileva WSL2, `ollama.service`
    abilitato con `Restart=always` e indicatori CUDA visibili.

    Mitigazione:

    ```bash
    sudo systemctl disable ollama
    ```

    Sul lato Windows, aggiungi quanto segue a `%USERPROFILE%\.wslconfig`, quindi esegui
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    In alternativa, riduci il tempo di mantenimento attivo oppure avvia Ollama manualmente solo quando necessario:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulta [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama non rilevato">
    Verifica che Ollama sia in esecuzione, che `OLLAMA_API_KEY` (o un profilo di autenticazione) sia impostato
    e che `models.providers.ollama` **non** sia definito esplicitamente:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Nessun modello disponibile">
    Scarica il modello localmente oppure definiscilo esplicitamente in
    `models.providers.ollama`:

    ```bash
    ollama list  # Mostra ciò che è installato
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Oppure un altro modello
    ```

  </Accordion>

  <Accordion title="Connessione rifiutata">
    ```bash
    # Verifica se Ollama è in esecuzione
    ps aux | grep ollama

    # Oppure riavvia Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="L'host remoto funziona con curl ma non con OpenClaw">
    Esegui la verifica dalla stessa macchina e dallo stesso runtime che eseguono il Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Cause comuni:

    - `baseUrl` punta a `localhost`, ma il Gateway viene eseguito in Docker o su un altro host.
    - L'URL usa `/v1`, selezionando il comportamento compatibile con OpenAI anziché quello nativo di Ollama.
    - L'host remoto richiede modifiche al firewall o al binding LAN.
    - Il modello è presente nel daemon del portatile, ma non in quello remoto.

  </Accordion>

  <Accordion title="Il modello restituisce il JSON degli strumenti come testo">
    In genere il provider è in modalità compatibile con OpenAI oppure il modello non è in grado di
    gestire gli schemi degli strumenti. Preferisci la modalità nativa:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Se un piccolo modello locale continua a non gestire correttamente gli schemi degli strumenti, imposta
    `compat.supportsTools: false` nella voce del modello e ripeti il test.

  </Accordion>

  <Accordion title="Kimi o GLM restituisce simboli illeggibili">
    Le risposte di Kimi/GLM in hosting costituite da lunghe sequenze di simboli non linguistici vengono
    considerate una chiamata al provider non riuscita anziché una risposta valida, in modo che
    intervenga la normale gestione dei nuovi tentativi, del fallback o degli errori, invece di salvare
    testo danneggiato nella sessione.

    Se il problema si ripresenta, acquisisci il nome del modello, il file della sessione corrente e
    indica se l'esecuzione ha usato `Cloud + Local` o `Cloud only`, quindi prova una nuova
    sessione e un modello di fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Il modello locale a freddo va in timeout">
    I modelli locali di grandi dimensioni possono richiedere molto tempo al primo caricamento. Limita il timeout al
    provider Ollama e, facoltativamente, mantieni il modello caricato tra un turno e l'altro:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Se l'host stesso è lento ad accettare le connessioni, `timeoutSeconds` estende anche
    il timeout di connessione protetto per questo provider.

  </Accordion>

  <Accordion title="Il modello con contesto ampio è troppo lento o esaurisce la memoria">
    Molti modelli dichiarano contesti più grandi di quelli che l'hardware può gestire
    agevolmente. Ollama nativo usa il proprio valore predefinito di runtime, a meno che
    non sia impostato `params.num_ctx`. Limita sia il budget di OpenClaw sia il contesto
    della richiesta Ollama per ottenere una latenza prevedibile del primo token:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Riduci `contextWindow` se OpenClaw invia un prompt troppo lungo. Riduci
    `params.num_ctx` se il contesto di runtime di Ollama è troppo grande per la macchina.
    Riduci `maxTokens` se la generazione dura troppo a lungo.

  </Accordion>
</AccordionGroup>

<Note>
Ulteriore assistenza: [Risoluzione dei problemi](/it/help/troubleshooting) e [Domande frequenti](/it/help/faq).
</Note>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/it/providers/ollama-cloud" icon="cloud">
    Configurazione esclusivamente cloud con il provider dedicato `ollama-cloud`.
  </Card>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
  <Card title="Ricerca web di Ollama" href="/it/tools/ollama-search" icon="magnifying-glass">
    Dettagli completi sulla configurazione e sul comportamento della ricerca web basata su Ollama.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
