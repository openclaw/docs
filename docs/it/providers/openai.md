---
read_when:
    - Vuoi usare modelli OpenAI in OpenClaw
    - Vuoi usare l'autenticazione con abbonamento Codex invece delle API key
    - Hai bisogno di un comportamento di esecuzione dell'agente GPT-5 più rigoroso
summary: Usa OpenAI tramite API key o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T08:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d847e53c2faee5363071dfdcb1f4150b64577674161e000844f579482198d1
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI fornisce API per sviluppatori per i modelli GPT. OpenClaw supporta due percorsi di autenticazione:

  - **API key** — accesso diretto alla OpenAI Platform con fatturazione a consumo (modelli `openai/*`)
  - **Abbonamento Codex** — accesso con sign-in ChatGPT/Codex e abbonamento (modelli `openai-codex/*`)

  OpenAI supporta esplicitamente l'uso di OAuth con abbonamento in strumenti e flussi di lavoro esterni come OpenClaw.

  ## Copertura delle funzionalità OpenClaw

  | Capacità OpenAI          | Surface OpenClaw                           | Stato                                                  |
  | ------------------------ | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses         | provider di modelli `openai/<model>`      | Sì                                                     |
  | Modelli con abbonamento Codex | provider di modelli `openai-codex/<model>` | Sì                                                     |
  | Ricerca web lato server  | strumento Native OpenAI Responses         | Sì, quando la ricerca web è abilitata e nessun provider è fissato |
  | Immagini                 | `image_generate`                          | Sì                                                     |
  | Video                    | `video_generate`                          | Sì                                                     |
  | Sintesi vocale           | `messages.tts.provider: "openai"` / `tts` | Sì                                                     |
  | Speech-to-text batch     | `tools.media.audio` / comprensione dei media | Sì                                                  |
  | Speech-to-text in streaming | Voice Call `streaming.provider: "openai"` | Sì                                                  |
  | Voce realtime            | Voice Call `realtime.provider: "openai"`  | Sì                                                     |
  | Embedding                | provider di embedding per la memoria      | Sì                                                     |

  ## Per iniziare

  Scegli il tuo metodo di autenticazione preferito e segui i passaggi di configurazione.

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Ideale per:** accesso API diretto e fatturazione a consumo.

    <Steps>
      <Step title="Ottieni la tua API key">
        Crea o copia una API key dalla [dashboard OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Riferimento modello | Percorso | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API OpenAI Platform diretta | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API OpenAI Platform diretta | `OPENAI_API_KEY` |

    <Note>
    Il sign-in ChatGPT/Codex viene instradato tramite `openai-codex/*`, non `openai/*`.
    </Note>

    ### Esempio di config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark` sul percorso API diretto. Le richieste live all'API OpenAI rifiutano quel modello. Spark è solo Codex.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex invece di una API key separata. Codex cloud richiede il sign-in ChatGPT.

    <Steps>
      <Step title="Esegui OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui direttamente OAuth:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili ai callback, aggiungi `--device-code` per accedere con un flusso device-code di ChatGPT invece del callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Imposta il modello predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Riferimento modello | Percorso | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | sign-in Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | sign-in Codex (dipende dai diritti) |

    <Note>
    Questo percorso è intenzionalmente separato da `openai/gpt-5.4`. Usa `openai/*` con una API key per l'accesso diretto alla Platform e `openai-codex/*` per l'accesso con abbonamento Codex.
    </Note>

    ### Esempio di config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth via browser (predefinito) o con il flusso device-code sopra — OpenClaw gestisce le credenziali risultanti nel proprio archivio auth dell'agente.
    </Note>

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto del runtime come valori separati.

    Per `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - limite `contextTokens` di runtime predefinito: `272000`

    Il limite predefinito più piccolo offre in pratica caratteristiche migliori di latenza e qualità. Sostituiscilo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget di contesto del runtime.
    </Note>

  </Tab>
</Tabs>

## Generazione di immagini

Il Plugin incluso `openai` registra la generazione di immagini tramite lo strumento `image_generate`.

| Capacità                | Valore                             |
| ----------------------- | ---------------------------------- |
| Modello predefinito     | `openai/gpt-image-2`               |
| Numero massimo di immagini per richiesta | 4                      |
| Modalità modifica       | Abilitata (fino a 5 immagini di riferimento) |
| Override di dimensione  | Supportati, incluse dimensioni 2K/4K |
| Rapporto d'aspetto / risoluzione | Non inoltrati all'API OpenAI Images |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Vedi [Image Generation](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

`gpt-image-2` è il valore predefinito sia per la generazione text-to-image di OpenAI sia per il
modifica di immagini. `gpt-image-1` resta utilizzabile come override esplicito del modello, ma i nuovi
flussi di lavoro di immagini OpenAI dovrebbero usare `openai/gpt-image-2`.

Genera:

```
/tool image_generate model=openai/gpt-image-2 prompt="Un poster di lancio raffinato per OpenClaw su macOS" size=3840x2160 count=1
```

Modifica:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserva la forma dell'oggetto, cambia il materiale in vetro traslucido" image=/path/to/reference.png size=1024x1536
```

## Generazione video

Il Plugin incluso `openai` registra la generazione video tramite lo strumento `video_generate`.

| Capacità       | Valore                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                              |
| Modalità       | Text-to-video, image-to-video, modifica di singolo video                          |
| Input di riferimento | 1 immagine o 1 video                                                          |
| Override di dimensione | Supportati                                                                  |
| Altri override | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Vedi [Video Generation](/it/tools/video-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra i provider. Si applica per ID modello, quindi `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` e altri riferimenti GPT-5 compatibili ricevono lo stesso overlay. I vecchi modelli GPT-4.x non lo ricevono.

Il provider incluso dell'harness Codex nativo (`codex/*`) usa lo stesso comportamento GPT-5 e lo stesso overlay Heartbeat tramite le istruzioni sviluppatore dell'app-server Codex, quindi le sessioni `codex/gpt-5.x` mantengono la stessa continuità di esecuzione e le stesse indicazioni proattive Heartbeat anche se Codex gestisce il resto del prompt dell'harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza di esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento specifico del canale per risposta e messaggi silenziosi resta nel prompt di sistema condiviso di OpenClaw e nella policy di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello separato dello stile di interazione amichevole è configurabile.

| Valore                 | Effetto                                     |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello dello stile di interazione amichevole |
| `"on"`                 | Alias di `"friendly"`                       |
| `"off"`                | Disabilita solo il livello di stile amichevole |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
I valori non distinguono tra maiuscole e minuscole a runtime, quindi sia `"Off"` sia `"off"` disabilitano il livello di stile amichevole.
</Tip>

<Note>
Il legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è impostata.
</Note>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il Plugin incluso `openai` registra la sintesi vocale per la surface `messages.tts`.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per note vocali, `mp3` per file |
    | API key | `messages.tts.providers.openai.apiKey` | Fallback a `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelli disponibili: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voci disponibili: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Imposta `OPENAI_TTS_BASE_URL` per sovrascrivere il base URL TTS senza influire sull'endpoint API della chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il Plugin incluso `openai` registra lo speech-to-text batch tramite
    la surface di trascrizione della comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Percorso di input: upload file audio multipart
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi segmenti dei canali vocali Discord e
      allegati audio dei canali

    Per forzare OpenAI per la trascrizione audio in ingresso:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Gli hint di lingua e prompt vengono inoltrati a OpenAI quando forniti dalla
    config audio media condivisa o dalla richiesta di trascrizione per chiamata.

  </Accordion>

  <Accordion title="Trascrizione realtime">
    Il Plugin incluso `openai` registra la trascrizione realtime per il Plugin Voice Call.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Fallback a `OPENAI_API_KEY` |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Questo provider di streaming è per il percorso di trascrizione realtime di Voice Call; la voce Discord attualmente registra segmenti brevi e usa invece il percorso batch di trascrizione `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce realtime">
    Il Plugin incluso `openai` registra la voce realtime per il Plugin Voice Call.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Fallback a `OPENAI_API_KEY` |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di config `azureEndpoint` e `azureDeployment`. Supporta la chiamata di strumenti bidirezionale. Usa il formato audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa WebSocket-first con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - Riprova un errore WebSocket iniziale prima di ripiegare su SSE
    - Dopo un errore, contrassegna WebSocket come degradato per ~60 secondi e usa SSE durante il cool-down
    - Collega header stabili di identità della sessione e del turno per retry e riconnessioni
    - Normalizza i contatori di utilizzo (`input_tokens` / `prompt_tokens`) tra varianti di trasporto

    | Valore | Comportamento |
    |-------|----------|
    | `"auto"` (predefinito) | WebSocket prima, fallback SSE |
    | `"sse"` | Forza solo SSE |
    | `"websocket"` | Forza solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentazione OpenAI correlata:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw abilita per impostazione predefinita il warm-up WebSocket per `openai/*` per ridurre la latenza del primo turno.

    ```json5
    // Disabilita warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

<a id="openai-fast-mode"></a>

  <Accordion title="Modalità veloce">
    OpenClaw espone un toggle condiviso della modalità veloce sia per `openai/*` sia per `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando abilitata, OpenClaw mappa la modalità veloce all'elaborazione prioritaria OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità veloce non riscrive `reasoning` o `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Gli override di sessione hanno priorità sulla config. Cancellare l'override di sessione nella UI Sessions riporta la sessione al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Elaborazione prioritaria (service_tier)">
    L'API di OpenAI espone l'elaborazione prioritaria tramite `service_tier`. Impostala per modello in OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valori supportati: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` viene inoltrato solo agli endpoint OpenAI nativi (`api.openai.com`) e agli endpoint Codex nativi (`chatgpt.com/backend-api`). Se instradi uno dei due provider tramite un proxy, OpenClaw lascia `service_tier` invariato.
    </Warning>

  </Accordion>

  <Accordion title="Compaction lato server (Responses API)">
    Per i modelli diretti OpenAI Responses (`openai/*` su `api.openai.com`), OpenClaw abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che la compat del modello imposti `supportsStore: false`)
    - Inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (oppure `80000` quando non disponibile)

    <Tabs>
      <Tab title="Abilita esplicitamente">
        Utile per endpoint compatibili come Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Soglia personalizzata">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Disabilita">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli diretti OpenAI Responses continuano comunque a forzare `store: true` a meno che la compat non imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT agentica rigorosa">
    Per le esecuzioni della famiglia GPT-5 su `openai/*` e `openai-codex/*`, OpenClaw può usare un contratto di esecuzione incorporato più rigoroso:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Con `strict-agentic`, OpenClaw:
    - Non considera più un turno con solo piano come progresso riuscito quando è disponibile un'azione strumento
    - Riprova il turno con uno steer ad agire subito
    - Abilita automaticamente `update_plan` per lavori sostanziali
    - Espone uno stato esplicito di blocco se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni OpenAI e Codex della famiglia GPT-5. Gli altri provider e le famiglie di modelli più vecchie mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Percorsi nativi vs compatibili con OpenAI">
    OpenClaw tratta gli endpoint diretti OpenAI, Codex e Azure OpenAI in modo diverso dai proxy generici compatibili con OpenAI `/v1`:

    **Percorsi nativi** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort OpenAI `none`
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano per default gli schemi degli strumenti in modalità strict
    - Allegano header di attribuzione nascosti solo su host nativi verificati
    - Mantengono la modellazione di richieste solo OpenAI (`service_tier`, `store`, reasoning-compat, hint della cache del prompt)

    **Percorsi proxy/compatibili:**
    - Usano un comportamento di compatibilità più permissivo
    - Non forzano schemi di strumenti strict né header solo nativi

    Azure OpenAI usa trasporto nativo e comportamento di compatibilità nativo ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
