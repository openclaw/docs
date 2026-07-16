---
read_when:
    - Si desidera eseguire OpenClaw con modelli cloud o locali tramite Ollama
    - Servono indicazioni per l'installazione e la configurazione di Ollama
    - Si desidera utilizzare i modelli di visione di Ollama per la comprensione delle immagini
summary: Eseguire OpenClaw con Ollama (modelli cloud e locali)
title: Ollama
x-i18n:
    generated_at: "2026-07-16T14:57:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw comunica con l'API nativa di Ollama (`/api/chat`), non con l'endpoint
compatibile con OpenAI `/v1`. Sono supportate tre modalità:

| Modalità       | Cosa utilizza                                                                     |
| -------------- | -------------------------------------------------------------------------------- |
| Cloud + locale | Un host Ollama raggiungibile, che serve modelli locali e, se è stato effettuato l'accesso, modelli `:cloud` |
| Solo cloud     | `https://ollama.com` direttamente, senza daemon locale                            |
| Solo locale    | Un host Ollama raggiungibile, solo modelli locali                                |

Per la configurazione solo cloud con l'id provider dedicato `ollama-cloud`, consultare
[Ollama Cloud](/it/providers/ollama-cloud). Utilizzare riferimenti `ollama-cloud/<model>` quando
si desidera mantenere l'instradamento cloud separato da un provider `ollama` locale.

<Warning>
Non utilizzare l'URL `/v1` compatibile con OpenAI (`http://host:11434/v1`). Interrompe le chiamate agli strumenti e i modelli possono emettere il JSON grezzo delle chiamate agli strumenti come testo normale. Utilizzare l'URL nativo: `baseUrl: "http://host:11434"` (senza `/v1`).
</Warning>

La chiave di configurazione canonica è `baseUrl`. È accettata anche `baseURL` per
gli esempi nello stile dell'SDK OpenAI, ma le nuove configurazioni devono utilizzare `baseUrl`.

## Regole di autenticazione

<AccordionGroup>
  <Accordion title="Host locali e LAN">
    Gli URL Ollama di loopback, rete privata, `.local` e con solo nome host non richiedono un vero token bearer. OpenClaw utilizza il marcatore `ollama-local` per questi casi.
  </Accordion>
  <Accordion title="Host remoti e Ollama Cloud">
    Gli host remoti pubblici e `https://ollama.com` richiedono una credenziale reale: `OLLAMA_API_KEY`, un profilo di autenticazione o la `apiKey` del provider. Per l'utilizzo diretto in hosting, preferire il provider `ollama-cloud`.
  </Accordion>
  <Accordion title="Id provider personalizzati">
    Un provider personalizzato con `api: "ollama"` segue le stesse regole. Ad esempio, un provider `ollama-remote` indirizzato a un host LAN privato può utilizzare `apiKey: "ollama-local"`; i sotto-agenti risolvono tale marcatore tramite l'hook del provider Ollama anziché considerarlo una credenziale mancante. `agents.defaults.memorySearch.provider` può anche puntare a un id provider personalizzato affinché gli embedding utilizzino quell'endpoint Ollama.
  </Accordion>
  <Accordion title="Profili di autenticazione">
    `auth-profiles.json` memorizza la credenziale per un id provider; inserire le impostazioni dell'endpoint (`baseUrl`, `api`, modelli, intestazioni, timeout) in `models.providers.<id>`. I vecchi file piatti come `{ "ollama-windows": { "apiKey": "ollama-local" } }` non sono un formato di runtime; `openclaw doctor --fix` li riscrive in un profilo canonico con chiave API `ollama-windows:default`, creando un backup. Un valore `baseUrl` in quel file precedente è superfluo e deve essere spostato nella configurazione del provider.
  </Accordion>
  <Accordion title="Ambito degli embedding di memoria">
    L'autenticazione bearer per gli embedding di memoria Ollama è limitata all'host per cui è stata dichiarata:

    - Una chiave a livello di provider viene inviata solo all'host di tale provider.
    - `agents.*.memorySearch.remote.apiKey` viene inviata solo al relativo host remoto per gli embedding.
    - Un semplice valore di ambiente `OLLAMA_API_KEY` viene trattato come convenzione di Ollama Cloud e, per impostazione predefinita, non viene inviato agli host locali o self-hosted.

  </Accordion>
</AccordionGroup>

## Introduzione

<Tabs>
  <Tab title="Configurazione guidata (consigliata)">
    <Steps>
      <Step title="Eseguire la configurazione guidata">
        ```bash
        openclaw onboard
        ```

        Selezionare **Ollama**, quindi scegliere una modalità: **Cloud + locale**, **Solo cloud** o **Solo locale**.

        In una nuova configurazione guidata, OpenClaw verifica innanzitutto l'host
        Ollama predefinito o configurato. Se un modello installato dichiara il supporto
        degli strumenti, la procedura di configurazione condivisa per CLI/macOS lo propone
        immediatamente e lo verifica con un completamento reale. Questa verifica automatica
        non scarica mai un modello; se non esiste alcun modello installato adatto, la configurazione
        guidata prosegue con il normale selettore di Ollama.
      </Step>
      <Step title="Selezionare un modello">
        `Cloud only` richiede `OLLAMA_API_KEY` e suggerisce valori predefiniti cloud in hosting. `Cloud + Local` e `Local only` richiedono un URL di base Ollama, individuano i modelli disponibili e scaricano automaticamente il modello locale selezionato se manca. Un tag `:latest` installato, come `gemma4:latest`, viene mostrato una sola volta anziché duplicare `gemma4`. `Cloud + Local` verifica inoltre se sull'host è stato effettuato l'accesso per l'accesso al cloud.
      </Step>
      <Step title="Verificare">
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

    `--custom-base-url` e `--custom-model-id` sono facoltativi; omettendoli vengono utilizzati l'host locale predefinito e il modello suggerito `gemma4`.

  </Tab>

  <Tab title="Configurazione manuale">
    <Steps>
      <Step title="Installare e avviare Ollama">
        Scaricarlo da [ollama.com/download](https://ollama.com/download), quindi scaricare un modello:

        ```bash
        ollama pull gemma4
        ```

        Per l'accesso cloud ibrido, eseguire `ollama signin` sullo stesso host.
      </Step>
      <Step title="Impostare una credenziale">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # host locale/LAN, qualsiasi valore funziona
        export OLLAMA_API_KEY="your-real-key"   # solo https://ollama.com
        ```

        Oppure nella configurazione: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Selezionare il modello">
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

`Cloud + Local` instrada sia i modelli locali sia quelli `:cloud` tramite un unico host
Ollama raggiungibile: questo è il flusso ibrido di Ollama e la modalità da scegliere durante la configurazione
quando si desiderano entrambi.

OpenClaw richiede l'URL di base, individua i modelli locali e verifica lo stato
`ollama signin`. Quando è stato effettuato l'accesso, suggerisce valori predefiniti in hosting
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Se
l'accesso non è stato effettuato, la configurazione rimane solo locale finché non si esegue `ollama signin`.

Per l'accesso solo cloud senza un daemon locale, utilizzare `openclaw onboard --auth-choice ollama-cloud` e consultare [Ollama Cloud](/it/providers/ollama-cloud): questo percorso non richiede `ollama signin` né un server in esecuzione:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

L'elenco dei modelli cloud mostrato durante `openclaw onboard` viene popolato in tempo reale da
`https://ollama.com/api/tags`, con un limite di 500 voci, affinché il selettore rifletta
il catalogo attualmente disponibile in hosting. Se `ollama.com` non è raggiungibile o non restituisce
modelli durante la configurazione, OpenClaw utilizza come fallback il proprio elenco di suggerimenti codificato,
consentendo comunque il completamento della configurazione guidata.

## Individuazione dei modelli (provider implicito)

Quando `OLLAMA_API_KEY` (o un profilo di autenticazione) è impostato e non è definito né
`models.providers.ollama` né un altro provider personalizzato con `api: "ollama"`,
OpenClaw individua i modelli da `http://127.0.0.1:11434`:

| Comportamento                   | Dettaglio                                                                                                                                                                                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query del catalogo              | `/api/tags`                                                                                                                                                                                                                                                                              |
| Rilevamento delle funzionalità  | `/api/show` legge, con il criterio del miglior tentativo, `contextWindow`, i parametri Modelfile `num_ctx` e le funzionalità (visione/strumenti/ragionamento)                                                                                                                    |
| Modelli di visione              | Una funzionalità `vision` da `/api/show` contrassegna il modello come compatibile con le immagini (`input: ["text", "image"]`)                                                                                                                                                           |
| Rilevamento del ragionamento    | Utilizza la funzionalità `thinking` da `/api/show`, quando disponibile; se Ollama omette le funzionalità, utilizza come fallback un'euristica basata sul nome (`r1`, `reason`, `reasoning`, `think`). `glm-5.2:cloud` e `deepseek-v4-flash\|pro:cloud` vengono sempre considerati modelli di ragionamento, indipendentemente dalle funzionalità dichiarate. |
| Limiti dei token                 | `maxTokens` utilizza per impostazione predefinita il limite massimo di token Ollama di OpenClaw                                                                                                                                                                                           |
| Costi                            | Tutti i costi sono `0`                                                                                                                                                                                                                                                           |

```bash
ollama list
openclaw models list
```

L'impostazione di `models.providers.ollama` con un array `models` esplicito, oppure di un
provider personalizzato con `api: "ollama"` e un `baseUrl` non di loopback, disabilita
l'individuazione automatica; i modelli devono quindi essere definiti manualmente (consultare
[Configurazione](#configuration)). Anche una voce `models.providers.ollama` indirizzata a
`https://ollama.com` in hosting ignora l'individuazione, poiché i modelli Ollama Cloud
sono gestiti dal provider. I provider personalizzati di loopback, come
`http://127.0.0.2:11434`, vengono comunque considerati locali e mantengono attiva l'individuazione automatica.

È possibile utilizzare un riferimento completo come `ollama/<pulled-model>:latest` senza una
voce `models.json` scritta manualmente; OpenClaw lo risolve in tempo reale. Per gli host
con accesso effettuato, la selezione di un riferimento `ollama/<model>:cloud` non elencato convalida quel
modello esatto tramite `/api/show` e lo aggiunge al catalogo di runtime solo se Ollama
conferma i metadati; gli errori di digitazione continuano a produrre un errore di modello sconosciuto.

### Smoke test

Per una verifica testuale circoscritta che ignora l'intera superficie degli strumenti dell'agente:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Aggiungere `--file` con un'immagine per una verifica essenziale di un modello di visione (accetta PNG/JPEG/WebP;
i file non di immagine vengono rifiutati prima della chiamata a Ollama; utilizzare
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

Nessuno dei due percorsi carica gli strumenti di chat, la memoria o il contesto della sessione. Se ha esito positivo
mentre le normali risposte dell'agente non riescono, il problema riguarda probabilmente la capacità del modello
di gestire strumenti o agenti, non l'endpoint.

La selezione di un modello con `/model ollama/<model>` è una scelta esatta dell'utente: se il valore
`baseUrl` configurato non è raggiungibile, la risposta successiva non riesce e restituisce l'errore del provider,
anziché utilizzare silenziosamente come fallback un altro modello configurato.

I processi Cron isolati aggiungono un controllo di sicurezza locale prima di avviare il turno dell'agente:
se il modello selezionato si risolve in un provider Ollama locale/rete privata/`.local`
e `/api/tags` non è raggiungibile, OpenClaw registra l'esecuzione come
`skipped` con il modello nel testo dell'errore. Questo controllo dell'endpoint viene memorizzato nella cache per
5 minuti per host, in modo che i processi Cron ripetuti contro un daemon arrestato non
avviino tutti richieste destinate a non riuscire.

Verifica in ambiente reale:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Per Ollama Cloud, indirizzare lo stesso test in ambiente reale all'endpoint ospitato (per impostazione predefinita
salta gli embedding; forzarli con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, poiché una
chiave cloud potrebbe non autorizzare `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Per aggiungere un modello, scaricarlo: verrà rilevato automaticamente.

```bash
ollama pull mistral
```

## Inferenza locale sul Node

Gli agenti possono delegare un'attività breve a un modello Ollama su un desktop associato o
su un Node server. Il prompt e la risposta attraversano la connessione autenticata
Gateway/Node esistente; la richiesta viene eseguita sull'endpoint Ollama di loopback del Node
(`http://127.0.0.1:11434`).

<Steps>
  <Step title="Avviare Ollama sul Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Connettere l'host del Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Approvare il dispositivo e i relativi comandi del Node sull'host Gateway, quindi verificare:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Una prima connessione, o un aggiornamento che aggiunge comandi Ollama, può attivare
    l'approvazione dei comandi del Node. Se il Node si connette senza pubblicizzare
    `ollama.models` e `ollama.chat`, controllare nuovamente `openclaw nodes pending`.

  </Step>
  <Step title="Utilizzarlo da un agente">
    Il Plugin Ollama incluso espone lo strumento `node_inference`. Gli agenti chiamano
    prima `action: "discover"`, quindi `action: "run"` con un Node e un modello inclusi
    nel risultato (`run` può omettere il Node quando è connesso esattamente un
    Node compatibile). Ad esempio: "Individua i modelli Ollama sui miei Node, quindi usa
    il modello caricato più veloce per riassumere questo testo."
  </Step>
</Steps>

Il rilevamento legge `/api/tags`, controlla le funzionalità `/api/show` e usa
`/api/ps`, quando disponibile, per classificare per primi i modelli già caricati. Restituisce solo
i modelli locali che Ollama indica come compatibili con la chat (funzionalità `completion`) —
le righe di Ollama Cloud e i modelli destinati esclusivamente agli embedding sono esclusi. Ogni esecuzione disabilita
il ragionamento del modello e imposta per l'output un valore predefinito di 512 token (limite massimo 8192), a meno che
la chiamata dello strumento non richieda un valore `maxTokens` diverso; alcuni modelli (ad esempio GPT-OSS)
non supportano la disabilitazione del ragionamento e potrebbero comunque emettere token di ragionamento.

Per mantenere Ollama in esecuzione su un Node senza esporlo agli agenti:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Riavviare il Node (`openclaw node restart`, oppure arrestare e rieseguire `openclaw node run`
per una sessione in primo piano). Il Node smette di pubblicizzare `ollama.models` e
`ollama.chat`; Ollama stesso e il provider Ollama del Gateway non subiscono modifiche.
Reimpostare il valore su `true` e riavviare per riattivare la funzionalità; una superficie dei comandi modificata
potrebbe richiedere nuovamente l'approvazione `openclaw nodes pending` dopo la riconnessione.

Verificare direttamente i comandi del Node, senza un turno dell'agente:

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

`--invoke-timeout` limita il tempo a disposizione del Node per eseguire il comando;
`--timeout` limita la chiamata complessiva del Gateway e deve essere maggiore.

L'inferenza locale sul Node usa sempre l'endpoint di loopback del Node stesso —
non riutilizza un `models.providers.ollama.baseUrl` remoto/cloud configurato. I
comandi del Node sono disponibili per impostazione predefinita sugli host Node macOS, Linux e Windows
e restano soggetti ai normali criteri di associazione e dei comandi del Node.

## Visione e descrizione delle immagini

Il Plugin Ollama incluso registra Ollama come provider di comprensione multimediale
compatibile con le immagini, consentendo a OpenClaw di instradare le richieste esplicite di descrizione
delle immagini e le impostazioni predefinite configurate per i modelli di immagini tramite modelli di visione Ollama
locali o ospitati.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` deve essere un riferimento `<provider/model>` completo; quando è impostato, `infer image
describe` prova prima quel modello anziché saltare la descrizione per i modelli
che supportano già la visione nativa. Se la chiamata non riesce, OpenClaw può continuare
tramite `agents.defaults.imageModel.fallbacks`; gli errori di preparazione di file/URL
causano un errore prima che venga tentato il fallback. Usare `infer image describe` per il flusso
di comprensione delle immagini di OpenClaw e il valore `imageModel` configurato; usare `infer model run
--file` per un test multimodale diretto con un prompt personalizzato.

Per impostare Ollama come provider predefinito di comprensione delle immagini per i contenuti multimediali in ingresso:

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

Preferire il riferimento `ollama/<model>` completo. Un riferimento `imageModel` senza prefisso, come
`qwen2.5vl:7b`, viene normalizzato in `ollama/qwen2.5vl:7b` solo quando quel modello esatto
è elencato in `models.providers.ollama.models` con
`input: ["text", "image"]` e nessun altro provider di immagini configurato espone lo
stesso ID senza prefisso; in caso contrario, usare esplicitamente il prefisso del provider.

I modelli di visione locali lenti possono richiedere un timeout di comprensione delle immagini più lungo rispetto
ai modelli cloud e possono arrestarsi in modo anomalo su hardware con risorse limitate se Ollama tenta di
allocare l'intero contesto di visione pubblicizzato del modello. Impostare un timeout per la funzionalità
e limitare `num_ctx`:

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

Questo timeout si applica alla comprensione delle immagini in ingresso e allo strumento esplicito
`image`. `models.providers.ollama.timeoutSeconds` controlla comunque il
limite della richiesta HTTP Ollama sottostante per le normali chiamate ai modelli.

Verifica in ambiente reale:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Se si definisce manualmente `models.providers.ollama.models`, contrassegnare esplicitamente
i modelli di visione:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rifiuta le richieste di descrizione delle immagini per i modelli non contrassegnati come
compatibili con le immagini. Con il rilevamento implicito, questa informazione deriva dalla funzionalità
di visione di `/api/show`.

## Configurazione

<Tabs>
  <Tab title="Di base (rilevamento implicito)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` è impostato, è possibile omettere `apiKey` nella voce del provider; OpenClaw lo inserisce per i controlli di disponibilità.
    </Tip>

  </Tab>

  <Tab title="Esplicita (modelli manuali)">
    Usare la configurazione esplicita per una configurazione cloud ospitata, un host/una porta non predefiniti, finestre di
    contesto forzate o elenchi di modelli completamente manuali:

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
            baseUrl: "http://ollama-host:11434", // Nessun /v1: URL dell'API nativa di Ollama
            api: "ollama", // Esplicito: garantisce il comportamento nativo di chiamata degli strumenti
            timeoutSeconds: 300, // Facoltativo: tempo più lungo per connessione/streaming dei modelli locali non ancora caricati
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Facoltativo: mantiene il modello caricato tra i turni
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

## Configurazioni comuni

Sostituire gli ID dei modelli con i nomi esatti ottenuti da `ollama list` o
`openclaw models list --provider ollama`.

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

    Non aggiungere un blocco `models.providers.ollama`, a meno che non siano necessari modelli manuali.

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

    `contextWindow` è il budget di contesto di OpenClaw; `params.num_ctx` viene inviato a
    Ollama. Mantenerli allineati quando l'hardware non è in grado di eseguire l'intero
    contesto pubblicizzato del modello.

  </Accordion>

  <Accordion title="Solo Ollama Cloud">
    Nessun daemon locale, modelli ospitati direttamente:

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

    Per l'ID provider dedicato `ollama-cloud` anziché questa struttura, vedere
    [Ollama Cloud](/it/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Cloud e locale tramite un daemon autenticato">
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
    ID provider personalizzati quando si esegue più di un server Ollama; ciascuno dispone di
    host, modelli, autenticazione e timeout propri.

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

    OpenClaw rimuove il prefisso del provider attivo (ripiegando su un prefisso
    `ollama/` semplice) prima di chiamare Ollama, quindi `ollama-large/qwen3.5:27b`
    raggiunge Ollama come `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Profilo essenziale per modelli locali">
    Alcuni modelli locali gestiscono prompt semplici, ma hanno difficoltà con l'intera
    superficie degli strumenti dell'agente. Limitare gli strumenti e il contesto prima di modificare le
    impostazioni globali del runtime:

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

    Usare `compat.supportsTools: false` solo quando il modello o il server presenta
    regolarmente errori con gli schemi degli strumenti: si sacrifica la capacità dell'agente in cambio di stabilità.
    `localModelLean` rimuove dalla superficie diretta dell'agente gli strumenti pesanti per browser,
    cron, messaggistica, generazione di contenuti multimediali, voce e PDF, salvo quando sono richiesti esplicitamente,
    e colloca i cataloghi più grandi dietro Tool Search. Non modifica il
    contesto di runtime o la modalità di ragionamento di Ollama. Abbinarlo a `params.num_ctx` e
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

Gli ID provider personalizzati funzionano nello stesso modo: per un riferimento che usa il prefisso del
provider attivo, come `ollama-spark/qwen3:32b`, OpenClaw rimuove tale prefisso prima di
chiamare Ollama, inviando `qwen3:32b`.

Per i modelli locali lenti, preferire l'ottimizzazione circoscritta al provider prima di aumentare il timeout
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

`timeoutSeconds` copre la richiesta HTTP del modello: configurazione della connessione, intestazioni,
streaming del corpo e interruzione totale protetta del recupero. `params.keep_alive` viene
inoltrato come `keep_alive` di primo livello nelle richieste native `/api/chat`; impostarlo per
modello quando il tempo di caricamento del primo turno costituisce il collo di bottiglia.

### Verifica rapida

```bash
# Daemon Ollama visibile da questa macchina
curl http://127.0.0.1:11434/api/tags

# Catalogo OpenClaw e modello selezionato
openclaw models list --provider ollama
openclaw models status

# Test rapido diretto del modello
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Rispondi esattamente con: ok"
```

Per gli host remoti, sostituire `127.0.0.1` con l'host `baseUrl`. Se `curl`
funziona ma OpenClaw no, verificare se il Gateway viene eseguito su una macchina,
un container o un account di servizio differente.

## Ricerca web di Ollama

OpenClaw include **Ricerca web di Ollama** come provider `web_search`.

| Proprietà   | Dettaglio                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl` se impostato, altrimenti `http://127.0.0.1:11434`; `https://ollama.com` usa direttamente l'API ospitata                          |
| Autenticazione | Senza chiave per un host locale autenticato; `OLLAMA_API_KEY` o l'autenticazione del provider configurata per la ricerca diretta `https://ollama.com` o per host protetti da autenticazione           |
| Requisito   | Gli host locali/auto-ospitati devono essere in esecuzione e autenticati con `ollama signin`; la ricerca ospitata diretta richiede `baseUrl: "https://ollama.com"` più una chiave API reale |

Selezionarlo durante `openclaw onboard` o `openclaw configure --section web`, oppure impostare:

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

Per un host auto-ospitato, OpenClaw prova prima il proxy locale `/api/experimental/web_search`,
quindi ripiega sul percorso ospitato `/api/web_search` sullo stesso host; un
daemon locale autenticato risponde normalmente tramite il proxy locale. Le chiamate dirette
`https://ollama.com` usano sempre l'endpoint ospitato `/api/web_search`.

<Note>
Per la configurazione e il comportamento completi, vedere [Ricerca web di Ollama](/it/tools/ollama-search).
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità legacy compatibile con OpenAI">
    <Warning>
    **La chiamata degli strumenti non è affidabile in questa modalità.** Usarla solo quando un proxy richiede il formato OpenAI e non si dipende dalla chiamata nativa degli strumenti.
    </Warning>

    Impostare `api: "openai-completions"` esplicitamente per un proxy dietro
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
    potrebbe essere necessario `params: { streaming: false }` sul modello.

    OpenClaw inserisce `options.num_ctx` per impostazione predefinita in questa modalità, in modo che Ollama
    non ripieghi silenziosamente su un contesto di 4096 token. Se il proxy rifiuta
    i campi `options` sconosciuti, disabilitarlo:

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
    Per i modelli rilevati automaticamente, OpenClaw usa la finestra di contesto indicata da `/api/show`,
    inclusi i valori `PARAMETER num_ctx` più grandi dei Modelfile
    personalizzati; altrimenti ripiega sulla finestra di contesto Ollama predefinita di OpenClaw.

    `contextWindow`, `contextTokens` e `maxTokens` a livello di provider impostano
    i valori predefiniti per ogni modello di tale provider e possono essere sovrascritti per
    modello. `contextWindow` è il budget di prompt/Compaction proprio di OpenClaw. Le richieste native
    `/api/chat` lasciano `options.num_ctx` non impostato, a meno che non si imposti
    esplicitamente `params.num_ctx`, quindi Ollama applica il proprio valore predefinito basato sul modello,
    su `OLLAMA_CONTEXT_LENGTH` o sulla VRAM; i valori `params.num_ctx` non validi, pari a zero, negativi
    o non finiti vengono ignorati. Se una configurazione precedente usava
    solo `contextWindow`/`maxTokens` per forzare il contesto delle richieste native, eseguire
    `openclaw doctor --fix` per copiarli in `params.num_ctx`. L'adattatore
    compatibile con OpenAI inserisce ancora `options.num_ctx` per impostazione predefinita dalla
    configurazione `params.num_ctx` o `contextWindow`; disabilitarlo con
    `injectNumCtxForOpenAICompat: false` se il servizio upstream rifiuta `options`.

    Le voci dei modelli nativi accettano anche le opzioni comuni del runtime Ollama in
    `params`, inoltrate come `options` `/api/chat` native: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` e `num_thread`.
    Alcune chiavi (`format`, `keep_alive`, `truncate`, `shift`) vengono inoltrate come
    campi di richiesta di primo livello anziché in `options`. OpenClaw inoltra
    solo queste chiavi di richiesta Ollama, quindi i parametri esclusivi del runtime come
    `streaming` non vengono mai inviati a Ollama. Usare `params.think` (o
    `params.thinking`) per impostare `think` di primo livello; `false` disabilita il
    ragionamento a livello di API per i modelli di ragionamento in stile Qwen.

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

    Funziona anche `agents.defaults.models["ollama/<model>"].params.num_ctx` per modello;
    la voce esplicita del modello del provider ha la precedenza se sono impostati entrambi.

  </Accordion>

  <Accordion title="Controllo del ragionamento">
    OpenClaw inoltra il ragionamento come previsto da Ollama: `think` di primo livello, non
    `options.think`. I modelli rilevati automaticamente il cui `/api/show` segnala una
    capacità `thinking` espongono `/think low`, `/think medium`, `/think high`
    e `/think max`; i modelli senza ragionamento espongono solo `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Oppure impostare un valore predefinito per il modello:

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

    Le impostazioni `params.think`/`params.thinking` per modello possono disabilitare o forzare il ragionamento
    dell'API per un modello specifico. OpenClaw conserva tale configurazione esplicita
    quando l'esecuzione attiva ha soltanto il valore predefinito implicito `off`; un comando
    di runtime diverso da off, come `/think medium`, continua ad avere la precedenza. Una richiesta
    di ragionamento con valore true non viene mai inviata a un modello contrassegnato esplicitamente
    come `reasoning: false`; una richiesta `think: false` viene sempre inviata a prescindere.

  </Accordion>

  <Accordion title="Modelli di ragionamento">
    I modelli denominati `deepseek-r1`, `reasoning`, `reason` o `think` vengono considerati
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
    Il Plugin Ollama incluso registra un provider di embedding della memoria per la
    [ricerca nella memoria](/it/concepts/memory). Utilizza l'URL di base e la chiave API
    di Ollama configurati, chiama `/api/embed` e raggruppa più segmenti di memoria in
    un'unica richiesta `input`, quando possibile.

    Quando `proxy.enabled=true`, le richieste di embedding dirette all'esatta
    origine di loopback locale dell'host derivata dal valore `baseUrl` configurato utilizzano il
    percorso diretto protetto di OpenClaw anziché il proxy di inoltro gestito. Il nome host
    configurato deve essere `localhost` o un indirizzo IP letterale di loopback: i nomi DNS
    che si limitano a risolversi in loopback continuano a utilizzare il percorso del proxy gestito. Gli host
    Ollama su LAN, tailnet, rete privata e rete pubblica rimangono sempre sul
    percorso del proxy gestito e i reindirizzamenti verso un altro host o un'altra porta non ereditano
    l'attendibilità. `proxy.loopbackMode: "proxy"` instrada comunque il traffico di loopback attraverso il
    proxy; `proxy.loopbackMode: "block"` lo nega prima della connessione:
    consultare [Proxy gestito](/it/security/network-proxy#gateway-loopback-mode).

    | Proprietà | Valore |
    | --- | --- |
    | Modello predefinito | `nomic-embed-text` |
    | Download automatico | Sì, se non è presente localmente |
    | Concorrenza inline predefinita | 1 (gli altri provider hanno un valore predefinito più alto; aumentarlo con `nonBatchConcurrency` se l'host è in grado di sostenerlo) |

    Gli embedding al momento della query utilizzano prefissi di recupero per i modelli che li richiedono o
    li consigliano: `nomic-embed-text`, `qwen3-embedding` e
    `mxbai-embed-large`. I batch di documenti rimangono invariati, pertanto gli indici esistenti non richiedono
    alcuna migrazione del formato.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Valore predefinito per Ollama. Aumentarlo su host più grandi se la reindicizzazione è troppo lenta.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Per un host di embedding remoto, limitare l'ambito dell'autenticazione a tale host:

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
    Ollama utilizza per impostazione predefinita l'**API nativa** (`/api/chat`), che supporta
    contemporaneamente streaming e chiamata degli strumenti, senza necessità di configurazione speciale.

    Per le richieste native, il controllo del ragionamento viene inoltrato direttamente: `/think off`
    e `openclaw agent --thinking off` inviano `think: false` al livello superiore, a meno che
    non sia configurato esplicitamente `params.think`/`params.thinking`; `/think
    low|medium|high` invia la stringa di intensità corrispondente; `/think max` corrisponde
    all'intensità massima di Ollama, `think: "high"`.

    <Tip>
    Per utilizzare invece l'endpoint compatibile con OpenAI, consultare la sezione "Modalità compatibile con OpenAI precedente": in tale modalità, lo streaming e la chiamata degli strumenti potrebbero non funzionare insieme.
    </Tip>

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Ciclo di arresti anomali di WSL2 (riavvii ripetuti)">
    In WSL2 con NVIDIA/CUDA, il programma di installazione ufficiale di Ollama per Linux crea un'unità
    systemd `ollama.service` con `Restart=always`. Se tale servizio
    si avvia automaticamente e carica un modello basato su GPU durante l'avvio di WSL2, Ollama può bloccare
    la memoria dell'host durante il caricamento; il recupero della memoria di Hyper-V non riesce sempre a recuperare
    tali pagine, quindi Windows può terminare la VM WSL2, systemd riavvia
    Ollama e il ciclo si ripete.

    Segnali: riavvii o arresti ripetuti di WSL2, utilizzo elevato della CPU in `app.slice` o
    `ollama.service` subito dopo l'avvio di WSL2 e SIGTERM da systemd anziché
    dall'OOM killer di Linux.

    OpenClaw registra un avviso all'avvio quando rileva WSL2, `ollama.service`
    abilitato con `Restart=always` e indicatori CUDA visibili.

    Mitigazione:

    ```bash
    sudo systemctl disable ollama
    ```

    Sul lato Windows, aggiungere quanto segue a `%USERPROFILE%\.wslconfig`, quindi eseguire
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    In alternativa, ridurre il keep-alive o avviare Ollama manualmente solo quando necessario:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consultare [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama non rilevato">
    Verificare che Ollama sia in esecuzione, che `OLLAMA_API_KEY` (o un profilo di autenticazione) sia impostato
    e che `models.providers.ollama` **non** sia definito esplicitamente:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Nessun modello disponibile">
    Scaricare il modello localmente oppure definirlo esplicitamente in
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
    Eseguire la verifica dalla stessa macchina e dallo stesso runtime che eseguono il Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Cause comuni:

    - `baseUrl` punta a `localhost`, ma il Gateway viene eseguito in Docker o su un altro host.
    - L'URL utilizza `/v1`, selezionando il comportamento compatibile con OpenAI anziché quello nativo di Ollama.
    - L'host remoto richiede modifiche al firewall o all'associazione LAN.
    - Il modello è presente nel demone del portatile, ma non in quello remoto.

  </Accordion>

  <Accordion title="Il modello restituisce il JSON degli strumenti come testo">
    In genere, il provider è in modalità compatibile con OpenAI oppure il modello non è in grado
    di gestire gli schemi degli strumenti. È preferibile la modalità nativa:

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

    Se un piccolo modello locale continua a non gestire correttamente gli schemi degli strumenti, impostare
    `compat.supportsTools: false` nella voce di tale modello ed eseguire nuovamente il test.

  </Accordion>

  <Accordion title="Kimi o GLM restituisce simboli illeggibili">
    Le risposte Kimi/GLM ospitate costituite da lunghe sequenze di simboli non linguistici vengono
    considerate chiamate al provider non riuscite anziché risposte riuscite, in modo che
    entrino in funzione i normali meccanismi di nuovo tentativo, fallback e gestione degli errori, evitando di salvare
    testo danneggiato nella sessione.

    Se il problema si ripresenta, acquisire il nome del modello, il file della sessione corrente e
    verificare se l'esecuzione ha utilizzato `Cloud + Local` o `Cloud only`, quindi provare una nuova
    sessione e un modello di fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Rispondi esattamente con: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Timeout del modello locale a freddo">
    I modelli locali di grandi dimensioni possono richiedere molto tempo per il primo caricamento. Limitare il timeout al
    provider Ollama e, facoltativamente, mantenere il modello caricato tra un turno e l'altro:

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

    Se l'host stesso è lento ad accettare connessioni, `timeoutSeconds`
    estende anche il timeout di connessione protetto per questo provider.

  </Accordion>

  <Accordion title="Il modello con contesto ampio è troppo lento o esaurisce la memoria">
    Molti modelli dichiarano contesti più ampi di quelli che l'hardware può gestire
    agevolmente. Ollama nativo utilizza il proprio valore predefinito di runtime, a meno che
    non sia impostato `params.num_ctx`. Limitare sia il budget di OpenClaw sia il contesto
    delle richieste di Ollama per ottenere una latenza prevedibile del primo token:

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

    Ridurre `contextWindow` se OpenClaw invia un prompt troppo grande. Ridurre
    `params.num_ctx` se il contesto di runtime di Ollama è troppo grande per la macchina.
    Ridurre `maxTokens` se la generazione dura troppo a lungo.

  </Accordion>
</AccordionGroup>

<Note>
Ulteriore assistenza: [Risoluzione dei problemi](/it/help/troubleshooting) e [Domande frequenti](/it/help/faq).
</Note>

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/it/providers/ollama-cloud" icon="cloud">
    Configurazione esclusivamente cloud con il provider `ollama-cloud` dedicato.
  </Card>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
  <Card title="Ricerca web con Ollama" href="/it/tools/ollama-search" icon="magnifying-glass">
    Dettagli completi sulla configurazione e sul comportamento della ricerca web basata su Ollama.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
