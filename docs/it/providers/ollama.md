---
read_when:
    - Vuoi eseguire OpenClaw con modelli cloud o locali tramite Ollama
    - Hai bisogno di una guida all'installazione e alla configurazione di Ollama
    - Vuoi modelli di visione Ollama per la comprensione delle immagini
summary: Eseguire OpenClaw con Ollama (modelli nel cloud e locali)
title: Ollama
x-i18n:
    generated_at: "2026-04-30T09:09:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw si integra con l'API nativa di Ollama (`/api/chat`) per modelli cloud ospitati e server Ollama locali/autogestiti. Puoi usare Ollama in tre modalità: `Cloud + Local` tramite un host Ollama raggiungibile, `Cloud only` verso `https://ollama.com`, oppure `Local only` verso un host Ollama raggiungibile.

<Warning>
**Utenti Ollama remoti**: non usare l'URL compatibile con OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Questo interrompe le chiamate agli strumenti e i modelli potrebbero produrre JSON di strumenti grezzo come testo normale. Usa invece l'URL dell'API nativa di Ollama: `baseUrl: "http://host:11434"` (senza `/v1`).
</Warning>

La configurazione del provider Ollama usa `baseUrl` come chiave canonica. OpenClaw accetta anche `baseURL` per compatibilità con esempi in stile OpenAI SDK, ma le nuove configurazioni dovrebbero preferire `baseUrl`.

## Regole di autenticazione

<AccordionGroup>
  <Accordion title="Host locali e LAN">
    Gli host Ollama locali e LAN non richiedono un token bearer reale. OpenClaw usa il marcatore locale `ollama-local` solo per URL di base Ollama loopback, di rete privata, `.local` e con nome host semplice.
  </Accordion>
  <Accordion title="Host remoti e Ollama Cloud">
    Gli host pubblici remoti e Ollama Cloud (`https://ollama.com`) richiedono una credenziale reale tramite `OLLAMA_API_KEY`, un profilo di autenticazione o `apiKey` del provider.
  </Accordion>
  <Accordion title="ID provider personalizzati">
    Gli ID provider personalizzati che impostano `api: "ollama"` seguono le stesse regole. Per esempio, un provider `ollama-remote` che punta a un host Ollama su LAN privata può usare `apiKey: "ollama-local"` e i sub-agent risolveranno quel marcatore tramite l'hook del provider Ollama invece di trattarlo come una credenziale mancante. Anche la ricerca in memoria può impostare `agents.defaults.memorySearch.provider` su quell'ID provider personalizzato, così gli embedding usano l'endpoint Ollama corrispondente.
  </Accordion>
  <Accordion title="Profili di autenticazione">
    `auth-profiles.json` archivia la credenziale per un ID provider. Inserisci le impostazioni dell'endpoint (`baseUrl`, `api`, ID modello, intestazioni, timeout) in `models.providers.<id>`. I vecchi file di profilo di autenticazione piatti, come `{ "ollama-windows": { "apiKey": "ollama-local" } }`, non sono un formato runtime; esegui `openclaw doctor --fix` per riscriverli nel profilo canonico con chiave API `ollama-windows:default` con un backup. `baseUrl` in quel file è rumore di compatibilità e dovrebbe essere spostato nella configurazione del provider.
  </Accordion>
  <Accordion title="Ambito degli embedding di memoria">
    Quando Ollama viene usato per gli embedding di memoria, l'autenticazione bearer è limitata all'host in cui è stata dichiarata:

    - Una chiave a livello di provider viene inviata solo all'host Ollama di quel provider.
    - `agents.*.memorySearch.remote.apiKey` viene inviata solo al relativo host di embedding remoto.
    - Un valore env puro `OLLAMA_API_KEY` viene trattato come convenzione di Ollama Cloud, e per impostazione predefinita non viene inviato a host locali o autogestiti.

  </Accordion>
</AccordionGroup>

## Per iniziare

Scegli il metodo di configurazione e la modalità che preferisci.

<Tabs>
  <Tab title="Onboarding (consigliato)">
    **Ideale per:** il percorso più rapido verso una configurazione Ollama cloud o locale funzionante.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard
        ```

        Seleziona **Ollama** dall'elenco dei provider.
      </Step>
      <Step title="Scegli la modalità">
        - **Cloud + Local** — host Ollama locale più modelli cloud instradati tramite quell'host
        - **Cloud only** — modelli Ollama ospitati tramite `https://ollama.com`
        - **Local only** — solo modelli locali

      </Step>
      <Step title="Seleziona un modello">
        `Cloud only` richiede `OLLAMA_API_KEY` e suggerisce valori predefiniti cloud ospitati. `Cloud + Local` e `Local only` chiedono un URL di base Ollama, rilevano i modelli disponibili e scaricano automaticamente il modello locale selezionato se non è ancora disponibile. Quando Ollama segnala un tag `:latest` installato, come `gemma4:latest`, la configurazione mostra quel modello installato una sola volta invece di mostrare sia `gemma4` sia `gemma4:latest` o scaricare di nuovo l'alias senza tag. `Cloud + Local` verifica anche se quell'host Ollama ha eseguito l'accesso per l'accesso cloud.
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Modalità non interattiva

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Facoltativamente, specifica un URL di base o un modello personalizzato:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configurazione manuale">
    **Ideale per:** pieno controllo sulla configurazione cloud o locale.

    <Steps>
      <Step title="Scegli cloud o locale">
        - **Cloud + Local**: installa Ollama, accedi con `ollama signin` e instrada le richieste cloud tramite quell'host
        - **Cloud only**: usa `https://ollama.com` con una `OLLAMA_API_KEY`
        - **Local only**: installa Ollama da [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Scarica un modello locale (solo locale)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Abilita Ollama per OpenClaw">
        Per `Cloud only`, usa la tua `OLLAMA_API_KEY` reale. Per configurazioni basate su host, funziona qualsiasi valore segnaposto:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Ispeziona e imposta il modello">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Oppure imposta il valore predefinito nella configurazione:

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

## Modelli cloud

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` usa un host Ollama raggiungibile come punto di controllo sia per i modelli locali sia per quelli cloud. Questo è il flusso ibrido preferito da Ollama.

    Usa **Cloud + Local** durante la configurazione. OpenClaw richiede l'URL di base Ollama, rileva i modelli locali da quell'host e verifica se l'host ha eseguito l'accesso per l'accesso cloud con `ollama signin`. Quando l'host ha eseguito l'accesso, OpenClaw suggerisce anche valori predefiniti cloud ospitati come `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud`.

    Se l'host non ha ancora eseguito l'accesso, OpenClaw mantiene la configurazione solo locale finché non esegui `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` viene eseguito contro l'API ospitata di Ollama su `https://ollama.com`.

    Usa **Cloud only** durante la configurazione. OpenClaw richiede `OLLAMA_API_KEY`, imposta `baseUrl: "https://ollama.com"` e inizializza l'elenco dei modelli cloud ospitati. Questo percorso **non** richiede un server Ollama locale né `ollama signin`.

    L'elenco dei modelli cloud mostrato durante `openclaw onboard` viene popolato live da `https://ollama.com/api/tags`, con un limite di 500 voci, così il selettore riflette il catalogo ospitato corrente invece di un set iniziale statico. Se `ollama.com` non è raggiungibile o non restituisce modelli al momento della configurazione, OpenClaw ripiega sui suggerimenti hardcoded precedenti, così l'onboarding viene comunque completato.

  </Tab>

  <Tab title="Local only">
    In modalità solo locale, OpenClaw rileva i modelli dall'istanza Ollama configurata. Questo percorso è per server Ollama locali o autogestiti.

    Attualmente OpenClaw suggerisce `gemma4` come valore locale predefinito.

  </Tab>
</Tabs>

## Rilevamento dei modelli (provider implicito)

Quando imposti `OLLAMA_API_KEY` (o un profilo di autenticazione) e **non** definisci `models.providers.ollama` o un altro provider remoto personalizzato con `api: "ollama"`, OpenClaw rileva i modelli dall'istanza Ollama locale su `http://127.0.0.1:11434`.

| Comportamento        | Dettaglio                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query catalogo       | Interroga `/api/tags`                                                                                                                                                |
| Rilevamento capacità | Usa lookup `/api/show` best-effort per leggere `contextWindow`, i parametri Modelfile `num_ctx` espansi e capacità incluse visione/strumenti                         |
| Modelli visione      | I modelli con una capacità `vision` segnalata da `/api/show` vengono contrassegnati come capaci di immagini (`input: ["text", "image"]`), quindi OpenClaw inietta automaticamente immagini nel prompt |
| Rilevamento ragionamento | Usa le capacità di `/api/show` quando disponibili, incluso `thinking`; ripiega su un'euristica basata sul nome del modello (`r1`, `reasoning`, `think`) quando Ollama omette le capacità |
| Limiti token         | Imposta `maxTokens` sul limite massimo di token predefinito di Ollama usato da OpenClaw                                                                              |
| Costi                | Imposta tutti i costi a `0`                                                                                                                                          |

Questo evita voci modello manuali mantenendo il catalogo allineato con l'istanza Ollama locale. Puoi usare un riferimento completo come `ollama/<pulled-model>:latest` in `infer model run` locale; OpenClaw risolve quel modello installato dal catalogo live di Ollama senza richiedere una voce `models.json` scritta a mano.

Per gli host Ollama con accesso effettuato, alcuni modelli `:cloud` potrebbero essere utilizzabili tramite `/api/chat`
e `/api/show` prima di comparire in `/api/tags`. Quando selezioni esplicitamente un
riferimento completo `ollama/<model>:cloud`, OpenClaw valida quel modello mancante esatto con
`/api/show` e lo aggiunge al catalogo runtime solo se Ollama conferma i metadati
del modello. Gli errori di battitura continuano a fallire come modelli sconosciuti invece di essere creati automaticamente.

```bash
# See what models are available
ollama list
openclaw models list
```

Per uno smoke test ristretto di generazione di testo che evita l'intera superficie degli strumenti dell'agente,
usa `infer model run` locale con un riferimento completo a un modello Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Quel percorso usa comunque il provider configurato di OpenClaw, l'autenticazione e il trasporto
nativo di Ollama, ma non avvia un turno di agente chat né carica contesto MCP/strumenti. Se
riesce mentre le normali risposte dell'agente falliscono, risolvi poi i problemi di capacità del modello
per prompt/strumenti dell'agente.

Per uno smoke test ristretto di un modello visione sullo stesso percorso leggero, aggiungi uno o più
file immagine a `infer model run`. Questo invia prompt e immagine direttamente al
modello visione Ollama selezionato senza caricare strumenti chat, memoria o contesto
di sessione precedente:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` accetta file rilevati come `image/*`, inclusi input comuni PNG,
JPEG e WebP. I file non immagine vengono rifiutati prima che Ollama venga chiamato.
Per il riconoscimento vocale, usa invece `openclaw infer audio transcribe`.

Quando cambi una conversazione con `/model ollama/<model>`, OpenClaw tratta
questa come una selezione utente esatta. Se il `baseUrl` Ollama configurato non è
raggiungibile, la risposta successiva fallisce con l'errore del provider invece di rispondere silenziosamente
da un altro modello di fallback configurato.

I processi Cron isolati eseguono un controllo di sicurezza locale aggiuntivo prima di avviare il
turno dell'agente. Se il modello selezionato si risolve in un provider Ollama locale, di rete privata o `.local`
e `/api/tags` non è raggiungibile, OpenClaw registra quell'esecuzione Cron
come `skipped` con il `ollama/<model>` selezionato nel testo dell'errore. Il preflight
dell'endpoint viene memorizzato nella cache per 5 minuti, quindi più processi Cron puntati allo stesso
daemon Ollama arrestato non avviano tutti richieste di modello destinate a fallire.

Verifica live il percorso di testo locale, il percorso di stream nativo e gli embeddings rispetto a
Ollama locale con:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Per aggiungere un nuovo modello, scaricalo semplicemente con Ollama:

```bash
ollama pull mistral
```

Il nuovo modello verrà rilevato automaticamente e sarà disponibile per l'uso.

<Note>
Se imposti esplicitamente `models.providers.ollama`, o configuri un provider remoto personalizzato come `models.providers.ollama-cloud` con `api: "ollama"`, il rilevamento automatico viene saltato e devi definire i modelli manualmente. I provider personalizzati loopback come `http://127.0.0.2:11434` vengono comunque trattati come locali. Vedi la sezione di configurazione esplicita qui sotto.
</Note>

## Visione e descrizione delle immagini

Il plugin Ollama incluso registra Ollama come provider di comprensione multimediale con supporto per immagini. Questo consente a OpenClaw di instradare richieste esplicite di descrizione immagini e valori predefiniti configurati per modelli immagine tramite modelli di visione Ollama locali o ospitati.

Per la visione locale, scarica un modello che supporta le immagini:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Poi verifica con la CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` deve essere un riferimento completo `<provider/model>`. Quando è impostato, `openclaw infer image describe` esegue direttamente quel modello invece di saltare la descrizione perché il modello supporta la visione nativa.

Usa `infer image describe` quando vuoi il flusso del provider di comprensione immagini di OpenClaw, `agents.defaults.imageModel` configurato e la forma dell'output di descrizione immagini. Usa `infer model run --file` quando vuoi una prova grezza di modello multimodale con un prompt personalizzato e una o più immagini.

Per rendere Ollama il modello predefinito di comprensione immagini per i contenuti multimediali in ingresso, configura `agents.defaults.imageModel`:

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

Preferisci il riferimento completo `ollama/<model>`. Se lo stesso modello è elencato sotto `models.providers.ollama.models` con `input: ["text", "image"]` e nessun altro provider di immagini configurato espone quell'ID modello senza prefisso, OpenClaw normalizza anche un riferimento `imageModel` senza prefisso come `qwen2.5vl:7b` in `ollama/qwen2.5vl:7b`. Se più di un provider di immagini configurato ha lo stesso ID senza prefisso, usa esplicitamente il prefisso del provider.

I modelli di visione locali lenti possono richiedere un timeout di comprensione immagini più lungo rispetto ai modelli cloud. Possono anche andare in crash o arrestarsi quando Ollama tenta di allocare l'intero contesto di visione dichiarato su hardware limitato. Imposta un timeout di capability e limita `num_ctx` nella voce del modello quando ti serve solo un normale turno di descrizione immagini:

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

Questo timeout si applica alla comprensione delle immagini in ingresso e allo strumento esplicito `image` che l'agente può chiamare durante un turno. `models.providers.ollama.timeoutSeconds` a livello di provider controlla comunque la protezione della richiesta HTTP Ollama sottostante per le normali chiamate al modello.

Verifica live lo strumento esplicito per immagini rispetto a Ollama locale con:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Se definisci manualmente `models.providers.ollama.models`, contrassegna i modelli di visione con il supporto per input immagine:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rifiuta le richieste di descrizione immagini per modelli non contrassegnati come compatibili con le immagini. Con il rilevamento implicito, OpenClaw legge questo dato da Ollama quando `/api/show` segnala una capability di visione.

## Configurazione

<Tabs>
  <Tab title="Di base (rilevamento implicito)">
    Il percorso di abilitazione più semplice solo locale passa tramite variabile d'ambiente:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` è impostato, puoi omettere `apiKey` nella voce del provider e OpenClaw lo compilerà per i controlli di disponibilità.
    </Tip>

  </Tab>

  <Tab title="Esplicita (modelli manuali)">
    Usa la configurazione esplicita quando vuoi una configurazione cloud ospitata, Ollama gira su un altro host/porta, vuoi forzare finestre di contesto o liste di modelli specifiche, oppure vuoi definizioni di modello completamente manuali.

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
    Se Ollama è in esecuzione su un host o una porta diversi (la configurazione esplicita disabilita il rilevamento automatico, quindi definisci i modelli manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
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
    Non aggiungere `/v1` all'URL. Il percorso `/v1` usa la modalità compatibile con OpenAI, in cui le chiamate agli strumenti non sono affidabili. Usa l'URL di base Ollama senza suffisso di percorso.
    </Warning>

  </Tab>
</Tabs>

## Ricette comuni

Usa questi esempi come punti di partenza e sostituisci gli ID modello con i nomi esatti da `ollama list` o `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Modello locale con rilevamento automatico">
    Usa questo quando Ollama gira sulla stessa macchina del Gateway e vuoi che OpenClaw rilevi automaticamente i modelli installati.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Questo percorso mantiene la configurazione minima. Non aggiungere un blocco `models.providers.ollama` a meno che tu non voglia definire i modelli manualmente.

  </Accordion>

  <Accordion title="Host Ollama LAN con modelli manuali">
    Usa URL Ollama nativi per gli host LAN. Non aggiungere `/v1`.

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

    `contextWindow` è il budget di contesto lato OpenClaw. `params.num_ctx` viene inviato a Ollama per la richiesta. Mantienili allineati quando il tuo hardware non può eseguire l'intero contesto dichiarato del modello.

  </Accordion>

  <Accordion title="Solo Ollama Cloud">
    Usa questo quando non esegui un daemon locale e vuoi modelli Ollama ospitati direttamente.

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

  </Accordion>

  <Accordion title="Cloud più locale tramite un daemon autenticato">
    Usa questo quando un daemon Ollama locale o LAN è autenticato con `ollama signin` e deve servire sia modelli locali sia modelli `:cloud`.

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
    Usa ID provider personalizzati quando hai più di un server Ollama. Ogni provider ha host, modelli, autenticazione, timeout e riferimenti modello propri.

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

    Quando OpenClaw invia la richiesta, il prefisso del provider attivo viene rimosso, quindi `ollama-large/qwen3.5:27b` arriva a Ollama come `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Profilo di modello locale leggero">
    Alcuni modelli locali possono rispondere a prompt semplici ma avere difficoltà con l'intera superficie degli strumenti agente. Inizia limitando strumenti e contesto prima di modificare le impostazioni runtime globali.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
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

    Usa `compat.supportsTools: false` solo quando il modello o il server fallisce in modo affidabile sugli schemi degli strumenti. Scambia capacità dell'agente con stabilità.
    `localModelLean` rimuove gli strumenti browser, Cron e messaggi dalla superficie dell'agente, ma non modifica il contesto di runtime o la modalità di pensiero di Ollama. Abbinalo a `params.num_ctx` esplicito e `params.thinking: false` per piccoli modelli di pensiero in stile Qwen che entrano in loop o consumano il budget di risposta nel ragionamento nascosto.

  </Accordion>
</AccordionGroup>

### Selezione del modello

Una volta configurati, tutti i tuoi modelli Ollama sono disponibili:

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

Sono supportati anche gli id provider Ollama personalizzati. Quando un riferimento di modello usa il prefisso del provider attivo, come `ollama-spark/qwen3:32b`, OpenClaw rimuove solo quel prefisso prima di chiamare Ollama, così il server riceve `qwen3:32b`.

Per modelli locali lenti, preferisci la regolazione delle richieste con ambito provider prima di aumentare il timeout di runtime dell'intero agente:

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

`timeoutSeconds` si applica alla richiesta HTTP del modello, inclusi configurazione della connessione, header, streaming del body e interruzione totale della fetch protetta. `params.keep_alive` viene inoltrato a Ollama come `keep_alive` di primo livello nelle richieste native `/api/chat`; impostalo per modello quando il tempo di caricamento del primo turno è il collo di bottiglia.

### Verifica rapida

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Per gli host remoti, sostituisci `127.0.0.1` con l'host usato in `baseUrl`. Se `curl` funziona ma OpenClaw no, controlla se il Gateway viene eseguito su una macchina, un contenitore o un account di servizio diverso.

## Ricerca web Ollama

OpenClaw supporta **Ricerca web Ollama** come provider `web_search` integrato.

| Proprietà   | Dettaglio                                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa il tuo host Ollama configurato (`models.providers.ollama.baseUrl` quando impostato, altrimenti `http://127.0.0.1:11434`); `https://ollama.com` usa direttamente l'API ospitata |
| Auth        | Senza chiave per host Ollama locali con accesso effettuato; `OLLAMA_API_KEY` o auth del provider configurata per la ricerca diretta su `https://ollama.com` o host protetti da auth |
| Requisito   | Gli host locali/self-hosted devono essere in esecuzione e con accesso effettuato tramite `ollama signin`; la ricerca ospitata diretta richiede `baseUrl: "https://ollama.com"` più una vera chiave API Ollama |

Scegli **Ricerca web Ollama** durante `openclaw onboard` o `openclaw configure --section web`, oppure imposta:

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

Per un daemon locale con accesso effettuato, OpenClaw usa il proxy `/api/experimental/web_search` del daemon. Per `https://ollama.com`, chiama direttamente l'endpoint ospitato `/api/web_search`.

<Note>
Per i dettagli completi di configurazione e comportamento, consulta [Ricerca web Ollama](/it/tools/ollama-search).
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **La chiamata degli strumenti non è affidabile in modalità compatibile con OpenAI.** Usa questa modalità solo se hai bisogno del formato OpenAI per un proxy e non dipendi dal comportamento nativo di chiamata degli strumenti.
    </Warning>

    Se invece devi usare l'endpoint compatibile con OpenAI (per esempio dietro un proxy che supporta solo il formato OpenAI), imposta esplicitamente `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Questa modalità potrebbe non supportare streaming e chiamata degli strumenti contemporaneamente. Potresti dover disabilitare lo streaming con `params: { streaming: false }` nella configurazione del modello.

    Quando `api: "openai-completions"` viene usato con Ollama, OpenClaw inserisce `options.num_ctx` per impostazione predefinita, così Ollama non ripiega silenziosamente su una finestra di contesto 4096. Se il tuo proxy/upstream rifiuta campi `options` sconosciuti, disabilita questo comportamento:

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

  <Accordion title="Context windows">
    Per i modelli scoperti automaticamente, OpenClaw usa la finestra di contesto riportata da Ollama quando disponibile, inclusi i valori `PARAMETER num_ctx` più grandi dai Modelfile personalizzati. Altrimenti ripiega sulla finestra di contesto Ollama predefinita usata da OpenClaw.

    Puoi impostare valori predefiniti a livello di provider per `contextWindow`, `contextTokens` e `maxTokens` per ogni modello sotto quel provider Ollama, quindi sovrascriverli per modello quando necessario. `contextWindow` è il budget di prompt e Compaction di OpenClaw. Le richieste native Ollama lasciano `options.num_ctx` non impostato a meno che tu non configuri esplicitamente `params.num_ctx`, così Ollama può applicare il proprio modello, `OLLAMA_CONTEXT_LENGTH` o il valore predefinito basato sulla VRAM. Per limitare o forzare il contesto di runtime per richiesta di Ollama senza ricostruire un Modelfile, imposta `params.num_ctx`; i valori non validi, zero, negativi e non finiti vengono ignorati. L'adattatore Ollama compatibile con OpenAI inserisce ancora `options.num_ctx` per impostazione predefinita da `params.num_ctx` o `contextWindow` configurati; disabilitalo con `injectNumCtxForOpenAICompat: false` se il tuo upstream rifiuta `options`.

    Le voci dei modelli Ollama nativi accettano anche le opzioni comuni di runtime Ollama sotto `params`, incluse `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` e `use_mmap`. OpenClaw inoltra solo chiavi di richiesta Ollama, quindi i parametri di runtime OpenClaw come `streaming` non vengono passati a Ollama. Usa `params.think` o `params.thinking` per inviare `think` Ollama di primo livello; `false` disabilita il pensiero a livello API per modelli di pensiero in stile Qwen.

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

    Funziona anche `agents.defaults.models["ollama/<model>"].params.num_ctx` per modello. Se sono configurati entrambi, la voce esplicita del modello del provider prevale sul valore predefinito dell'agente.

  </Accordion>

  <Accordion title="Thinking control">
    Per i modelli Ollama nativi, OpenClaw inoltra il controllo del pensiero come Ollama si aspetta: `think` di primo livello, non `options.think`. I modelli scoperti automaticamente la cui risposta `/api/show` include la capacità `thinking` espongono `/think low`, `/think medium`, `/think high` e `/think max`; i modelli senza pensiero espongono solo `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Puoi anche impostare un valore predefinito del modello:

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

    `params.think` o `params.thinking` per modello può disabilitare o forzare il pensiero API Ollama per uno specifico modello configurato. OpenClaw preserva quei parametri espliciti del modello quando l'esecuzione attiva ha solo il valore predefinito implicito `off`; i comandi di runtime diversi da off, come `/think medium`, sovrascrivono comunque l'esecuzione attiva.

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw tratta i modelli con nomi come `deepseek-r1`, `reasoning` o `think` come capaci di ragionamento per impostazione predefinita.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Non è necessaria alcuna configurazione aggiuntiva. OpenClaw li contrassegna automaticamente.

  </Accordion>

  <Accordion title="Model costs">
    Ollama è gratuito e viene eseguito localmente, quindi tutti i costi dei modelli sono impostati a 0 $. Questo si applica sia ai modelli scoperti automaticamente sia a quelli definiti manualmente.
  </Accordion>

  <Accordion title="Memory embeddings">
    Il Plugin Ollama integrato registra un provider di embedding per la memoria per
    [ricerca in memoria](/it/concepts/memory). Usa l'URL base Ollama configurato
    e la chiave API, chiama l'endpoint corrente `/api/embed` di Ollama e raggruppa
    più frammenti di memoria in un'unica richiesta `input` quando possibile.

    | Proprietà          | Valore              |
    | ------------------ | ------------------- |
    | Modello predefinito | `nomic-embed-text`  |
    | Pull automatico    | Sì — il modello di embedding viene scaricato automaticamente se non è presente localmente |

    Gli embedding al momento della query usano prefissi di recupero per i modelli che li richiedono o li raccomandano, inclusi `nomic-embed-text`, `qwen3-embedding` e `mxbai-embed-large`. I batch di documenti di memoria restano grezzi, così gli indici esistenti non richiedono una migrazione di formato.

    Per selezionare Ollama come provider di embedding per la ricerca in memoria:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Per un host di embedding remoto, mantieni l'auth con ambito limitato a quell'host:

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
    L'integrazione Ollama di OpenClaw usa per impostazione predefinita la **API Ollama nativa** (`/api/chat`), che supporta pienamente streaming e chiamata agli strumenti contemporaneamente. Non è necessaria alcuna configurazione speciale.

    Per le richieste native `/api/chat`, OpenClaw inoltra anche il controllo del ragionamento direttamente a Ollama: `/think off` e `openclaw agent --thinking off` inviano `think: false` al livello principale, a meno che non sia configurato un valore esplicito del modello `params.think`/`params.thinking`, mentre `/think low|medium|high` invia la stringa di impegno `think` corrispondente al livello principale. `/think max` viene mappato al massimo impegno nativo di Ollama, `think: "high"`.

    <Tip>
    Se devi usare l'endpoint compatibile con OpenAI, consulta la sezione "Modalità legacy compatibile con OpenAI" sopra. Streaming e chiamata agli strumenti potrebbero non funzionare contemporaneamente in quella modalità.
    </Tip>

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Ciclo di arresti anomali WSL2 (riavvii ripetuti)">
    Su WSL2 con NVIDIA/CUDA, il programma di installazione Linux ufficiale di Ollama crea un'unità systemd `ollama.service` con `Restart=always`. Se quel servizio si avvia automaticamente e carica un modello con GPU durante l'avvio di WSL2, Ollama può bloccare la memoria dell'host mentre il modello viene caricato. Il recupero della memoria di Hyper-V non riesce sempre a recuperare quelle pagine bloccate, quindi Windows può terminare la VM WSL2, systemd avvia di nuovo Ollama e il ciclo si ripete.

    Prove comuni:

    - riavvii o terminazioni ripetute di WSL2 dal lato Windows
    - CPU elevata in `app.slice` o `ollama.service` poco dopo l'avvio di WSL2
    - SIGTERM da systemd invece di un evento OOM-killer Linux

    OpenClaw registra un avviso di avvio quando rileva WSL2, `ollama.service` abilitato con `Restart=always` e marcatori CUDA visibili.

    Mitigazione:

    ```bash
    sudo systemctl disable ollama
    ```

    Aggiungilo a `%USERPROFILE%\.wslconfig` sul lato Windows, quindi esegui `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Imposta un keep-alive più breve nell'ambiente del servizio Ollama, oppure avvia Ollama manualmente solo quando ti serve:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulta [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama non rilevato">
    Assicurati che Ollama sia in esecuzione, di aver impostato `OLLAMA_API_KEY` (o un profilo di autenticazione) e di **non** aver definito una voce esplicita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifica che la API sia accessibile:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Nessun modello disponibile">
    Se il tuo modello non è elencato, scarica il modello localmente oppure definiscilo esplicitamente in `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connessione rifiutata">
    Controlla che Ollama sia in esecuzione sulla porta corretta:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="L'host remoto funziona con curl ma non con OpenClaw">
    Verifica dalla stessa macchina e dallo stesso runtime che esegue il Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Cause comuni:

    - `baseUrl` punta a `localhost`, ma il Gateway viene eseguito in Docker o su un altro host.
    - L'URL usa `/v1`, che seleziona il comportamento compatibile con OpenAI invece di Ollama nativo.
    - L'host remoto richiede modifiche al firewall o al binding LAN sul lato Ollama.
    - Il modello è presente sul daemon del tuo laptop ma non sul daemon remoto.

  </Accordion>

  <Accordion title="Il modello restituisce il JSON degli strumenti come testo">
    Questo di solito significa che il provider sta usando la modalità compatibile con OpenAI o che il modello non riesce a gestire gli schemi degli strumenti.

    Preferisci la modalità Ollama nativa:

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

    Se un piccolo modello locale continua a non riuscire con gli schemi degli strumenti, imposta `compat.supportsTools: false` su quella voce del modello e riprova.

  </Accordion>

  <Accordion title="Kimi o GLM restituisce simboli illeggibili">
    Le risposte ospitate di Kimi/GLM che sono lunghe sequenze di simboli non linguistici vengono trattate come output del provider non riuscito invece che come risposta riuscita dell'assistente. Questo consente alla normale logica di nuovo tentativo, fallback o gestione degli errori di subentrare senza salvare il testo corrotto nella sessione.

    Se succede ripetutamente, acquisisci il nome grezzo del modello, il file della sessione corrente e se l'esecuzione ha usato `Cloud + Local` o `Cloud only`, quindi prova una nuova sessione e un modello di fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Il modello locale a freddo va in timeout">
    I modelli locali di grandi dimensioni possono richiedere un lungo caricamento iniziale prima che lo streaming inizi. Mantieni il timeout limitato al provider Ollama e, facoltativamente, chiedi a Ollama di mantenere il modello caricato tra un turno e l'altro:

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

    Se l'host stesso è lento ad accettare connessioni, `timeoutSeconds` estende anche il timeout di connessione Undici protetto per questo provider.

  </Accordion>

  <Accordion title="Il modello con contesto ampio è troppo lento o esaurisce la memoria">
    Molti modelli Ollama dichiarano contesti più grandi di quanto il tuo hardware possa eseguire comodamente. Ollama nativo usa il valore predefinito del contesto runtime di Ollama, a meno che non imposti `params.num_ctx`. Limita sia il budget di OpenClaw sia il contesto della richiesta Ollama quando vuoi una latenza prevedibile del primo token:

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

    Abbassa prima `contextWindow` se OpenClaw sta inviando troppo prompt. Abbassa `params.num_ctx` se Ollama sta caricando un contesto runtime troppo grande per la macchina. Abbassa `maxTokens` se la generazione dura troppo a lungo.

  </Accordion>
</AccordionGroup>

<Note>
Altre informazioni: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
  <Card title="Ricerca Web Ollama" href="/it/tools/ollama-search" icon="magnifying-glass">
    Configurazione completa e dettagli del comportamento per la ricerca Web basata su Ollama.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
