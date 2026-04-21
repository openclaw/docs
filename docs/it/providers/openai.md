---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi usare l'autenticazione con sottoscrizione Codex invece delle chiavi API
    - Hai bisogno di un comportamento di esecuzione dell'agente GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o sottoscrizione Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T08:28:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172beb28b099e3d71998458408c9a6b32b03790d2b016351f724bc3f0d9d3245
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI fornisce API per sviluppatori per i modelli GPT. OpenClaw supporta due percorsi di autenticazione:

- **Chiave API** — accesso diretto a OpenAI Platform con fatturazione basata sull'uso (modelli `openai/*`)
- **Sottoscrizione Codex** — accesso ChatGPT/Codex con login e sottoscrizione (modelli `openai-codex/*`)

OpenAI supporta esplicitamente l'uso di OAuth con sottoscrizione in strumenti e flussi di lavoro esterni come OpenClaw.

## Per iniziare

Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso API diretto e fatturazione basata sull'uso.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API dalla [dashboard di OpenAI Platform](https://platform.openai.com/api-keys).
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
    | `openai/gpt-5.4` | API diretta di OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API diretta di OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    L'accesso con login ChatGPT/Codex viene instradato tramite `openai-codex/*`, non `openai/*`.
    </Note>

    ### Esempio di configurazione

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

  <Tab title="Sottoscrizione Codex">
    **Ideale per:** usare la tua sottoscrizione ChatGPT/Codex invece di una chiave API separata. Codex cloud richiede l'accesso con login ChatGPT.

    <Steps>
      <Step title="Esegui OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui direttamente OAuth:

        ```bash
        openclaw models auth login --provider openai-codex
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
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | accesso Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | accesso Codex, dipende dai diritti disponibili |

    <Note>
    Questo percorso è intenzionalmente separato da `openai/gpt-5.4`. Usa `openai/*` con una chiave API per l'accesso diretto a Platform, e `openai-codex/*` per l'accesso tramite sottoscrizione Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Se l'onboarding riusa un login Codex CLI esistente, quelle credenziali restano gestite da Codex CLI. Alla scadenza, OpenClaw rilegge prima la sorgente Codex esterna e riscrive la credenziale aggiornata nello storage di Codex.
    </Tip>

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite del contesto runtime come valori separati.

    Per `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - limite predefinito runtime `contextTokens`: `272000`

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
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget di contesto runtime.
    </Note>

  </Tab>
</Tabs>

## Generazione di immagini

Il plugin bundled `openai` registra la generazione di immagini tramite lo strumento `image_generate`.

| Capacità                 | Valore                             |
| ------------------------ | ---------------------------------- |
| Modello predefinito      | `openai/gpt-image-1`               |
| Immagini massime per richiesta | 4                            |
| Modalità modifica        | Abilitata, fino a 5 immagini di riferimento |
| Override delle dimensioni | Supportati                        |
| Aspect ratio / risoluzione | Non inoltrati all'API OpenAI Images |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
Vedi [Image Generation](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione video

Il plugin bundled `openai` registra la generazione video tramite lo strumento `video_generate`.

| Capacità         | Valore                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                                |
| Modalità         | Text-to-video, image-to-video, modifica di un singolo video                       |
| Input di riferimento | 1 immagine o 1 video                                                          |
| Override delle dimensioni | Supportati                                                               |
| Altri override   | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

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
Vedi [Video Generation](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Contributo al prompt di GPT-5

OpenClaw aggiunge un contributo al prompt specifico di OpenAI per le esecuzioni della famiglia GPT-5 `openai/*` e `openai-codex/*`. Si trova nel plugin OpenAI bundled, si applica a id modello come `gpt-5`, `gpt-5.2`, `gpt-5.4` e `gpt-5.4-mini`, e non si applica ai modelli GPT-4.x più vecchi.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza dell'esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento specifico del canale per risposte e messaggi silenziosi resta nel prompt di sistema condiviso di OpenClaw e nella policy condivisa di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello separato dello stile di interazione amichevole è configurabile.

| Valore                 | Effetto                                      |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"`                 | Alias di `"friendly"`                        |
| `"off"`                | Disabilita solo il livello di stile amichevole |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
I valori non sono sensibili alle maiuscole/minuscole a runtime, quindi sia `"Off"` sia `"off"` disabilitano il livello di stile amichevole.
</Tip>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il plugin bundled `openai` registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per i messaggi vocali, `mp3` per i file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Usa `OPENAI_API_KEY` come fallback |
    | URL di base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Imposta `OPENAI_TTS_BASE_URL` per sostituire l'URL di base TTS senza influire sull'endpoint API della chat.
    </Note>

  </Accordion>

  <Accordion title="Trascrizione realtime">
    Il plugin bundled `openai` registra la trascrizione realtime per il plugin Voice Call.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Chiave API | `...openai.apiKey` | Usa `OPENAI_API_KEY` come fallback |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="Voce realtime">
    Il plugin bundled `openai` registra la voce realtime per il plugin Voice Call.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Chiave API | `...openai.apiKey` | Usa `OPENAI_API_KEY` come fallback |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di configurazione `azureEndpoint` e `azureDeployment`. Supporta il tool calling bidirezionale. Usa il formato audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto, WebSocket vs SSE">
    OpenClaw usa WebSocket-first con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - ritenta un errore iniziale WebSocket prima di passare a SSE
    - dopo un errore, contrassegna WebSocket come degradato per circa 60 secondi e usa SSE durante il raffreddamento
    - collega header stabili di identità di sessione e turno per retry e riconnessioni
    - normalizza i contatori di utilizzo (`input_tokens` / `prompt_tokens`) tra le varianti di trasporto

    | Valore | Comportamento |
    |-------|----------|
    | `"auto"` (predefinito) | Prima WebSocket, fallback SSE |
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
    // Disabilita il warm-up
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

  <Accordion title="Modalità rapida">
    OpenClaw espone un toggle condiviso della modalità rapida sia per `openai/*` sia per `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw mappa la modalità rapida all'elaborazione prioritaria OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità rapida non riscrive `reasoning` né `text.verbosity`.

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
    Gli override della sessione hanno la precedenza sulla configurazione. Cancellando l'override della sessione nella UI Sessions, la sessione torna al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Elaborazione prioritaria (service_tier)">
    L'API OpenAI espone l'elaborazione prioritaria tramite `service_tier`. Impostala per modello in OpenClaw:

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
    Per i modelli diretti OpenAI Responses (`openai/*` su `api.openai.com`), OpenClaw abilita automaticamente Compaction lato server:

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
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli diretti OpenAI Responses continuano a forzare `store: true` a meno che la compat non imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT agentica rigorosa">
    Per le esecuzioni della famiglia GPT-5 su `openai/*` e `openai-codex/*`, OpenClaw può usare un contratto di esecuzione embedded più rigoroso:

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
    - Non considera più un turno solo piano come progresso riuscito quando è disponibile un'azione di strumento
    - Ritenta il turno con uno steer act-now
    - Abilita automaticamente `update_plan` per lavoro sostanziale
    - Mostra uno stato bloccato esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni OpenAI e Codex della famiglia GPT-5. Gli altri provider e le famiglie di modelli più vecchie mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Percorsi nativi vs compatibili OpenAI">
    OpenClaw tratta in modo diverso gli endpoint diretti OpenAI, Codex e Azure OpenAI rispetto ai proxy generici compatibili OpenAI `/v1`:

    **Percorsi nativi** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano OpenAI `none`
    - Omettono il ragionamento disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano gli schemi degli strumenti in modalità strict per impostazione predefinita
    - Collegano header di attribuzione nascosti solo su host nativi verificati
    - Mantengono il request shaping solo OpenAI (`service_tier`, `store`, compat del ragionamento, suggerimenti per la cache del prompt)

    **Percorsi proxy/compatibili:**
    - Usano un comportamento compat più permissivo
    - Non forzano schemi di strumenti strict né header solo-nativi

    Azure OpenAI usa il trasporto nativo e il comportamento compat nativo, ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e auth" href="/it/gateway/authentication" icon="key">
    Dettagli auth e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
