---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
    - Vuoi usare OpenRouter per la generazione di immagini
    - Vuoi usare OpenRouter per la generazione musicale
    - Vuoi usare OpenRouter per la generazione di video
summary: Usa l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:41:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornisce una **API unificata** che instrada le richieste a molti modelli dietro un singolo
endpoint e una chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

## Per iniziare

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Esegui l'onboarding OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw apre il flusso di accesso dal browser di OpenRouter, scambia il codice
        PKCE con una chiave API OpenRouter e archivia quella chiave nel profilo di autenticazione
        OpenRouter predefinito. Sugli host remoti/headless, OpenClaw stampa l'URL
        di accesso e chiede di incollare l'URL di reindirizzamento dopo l'accesso.
      </Step>
      <Step title="(Facoltativo) Passa a un modello specifico">
        L'onboarding usa per impostazione predefinita `openrouter/auto`. Scegli un modello concreto in seguito:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Chiave API">
    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea una chiave API su [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Esegui l'onboarding con chiave API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Facoltativo) Passa a un modello specifico">
        L'onboarding usa per impostazione predefinita `openrouter/auto`. Scegli un modello concreto in seguito:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Esempio di configurazione

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Riferimenti dei modelli

<Note>
I riferimenti dei modelli seguono il pattern `openrouter/<provider>/<model>`. Per l'elenco completo di
provider e modelli disponibili, consulta [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi di fallback inclusi:

| Riferimento modello               | Note                                      |
| --------------------------------- | ----------------------------------------- |
| `openrouter/auto`                 | Instradamento automatico OpenRouter       |
| `openrouter/openrouter/fusion`    | Router OpenRouter Fusion                  |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 tramite MoonshotAI              |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 tramite MoonshotAI              |

## Generazione di immagini

OpenRouter può anche supportare lo strumento `image_generate`. Usa un modello immagine OpenRouter in `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw invia le richieste di immagine all'API immagini delle chat completions di OpenRouter con `modalities: ["image", "text"]`. I modelli immagine Gemini ricevono suggerimenti `aspectRatio` e `resolution` supportati tramite `image_config` di OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` per i modelli immagine OpenRouter più lenti; il parametro per chiamata `timeoutMs` dello strumento `image_generate` ha comunque la precedenza.

## Generazione di video

OpenRouter può anche supportare lo strumento `video_generate` tramite la sua API asincrona `/videos`. Usa un modello video OpenRouter in `agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw invia a OpenRouter job da testo a video e da immagine a video, esegue il polling
del `polling_url` restituito e scarica il video completato da
`unsigned_urls` di OpenRouter o dall'endpoint documentato dei contenuti del job.
Le immagini di riferimento vengono inviate per impostazione predefinita come immagini del primo/ultimo frame; le immagini
contrassegnate con `reference_image` vengono inviate come riferimenti di input OpenRouter. Il valore predefinito incluso
`google/veo-3.1-fast` dichiara le durate attualmente supportate di 4/6/8
secondi, le risoluzioni `720P`/`1080P` e i rapporti d'aspetto `16:9`/`9:16`.
Il video-to-video non è registrato per OpenRouter perché l'API upstream
di generazione video attualmente accetta testo e riferimenti immagine.

## Generazione musicale

OpenRouter può anche supportare lo strumento `music_generate` tramite l'output audio
delle chat completions. Usa un modello audio OpenRouter in
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Il provider musicale OpenRouter incluso usa per impostazione predefinita
`google/lyria-3-pro-preview` ed espone anche
`google/lyria-3-clip-preview`. OpenClaw invia `modalities: ["text",
"audio"]`, abilita lo streaming, raccoglie i chunk audio in streaming e salva
il risultato come media generato per la consegna sul canale. Le immagini di riferimento sono
accettate per i modelli Lyria tramite il parametro condiviso `music_generate image=...`.

## Sintesi vocale

OpenRouter può anche essere usato come provider TTS tramite il suo endpoint
compatibile con OpenAI `/audio/speech`.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Se `messages.tts.providers.openrouter.apiKey` viene omesso, TTS riutilizza
`models.providers.openrouter.apiKey`, poi `OPENROUTER_API_KEY`.

## Riconoscimento vocale (audio in ingresso)

OpenRouter può trascrivere allegati vocali/audio in ingresso tramite il percorso condiviso
`tools.media.audio` usando il suo endpoint STT (`/audio/transcriptions`).
Questo si applica a qualsiasi plugin di canale che inoltra voce/audio in ingresso alla
preflight di comprensione dei media.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw invia le richieste STT OpenRouter come JSON con audio base64 in
`input_audio` (contratto STT OpenRouter), non come caricamenti multipart di moduli OpenAI.

## Router Fusion

Usa OpenRouter Fusion quando vuoi che un unico riferimento modello OpenClaw chieda a più
modelli OpenRouter in parallelo, faccia valutare le loro risposte da OpenRouter e restituisca una
singola risposta finale tramite il normale endpoint del provider OpenRouter. Poiché
lo slug del modello upstream è `openrouter/fusion`, il riferimento modello OpenClaw include
sia il prefisso del provider OpenClaw sia il namespace OpenRouter upstream:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configura il pannello e il giudice di Fusion tramite `params.extraBody` del modello. Quei
campi vengono inoltrati nel corpo della richiesta chat-completions di OpenRouter. Fusion
funziona sia con l'onboarding OAuth OpenRouter sia con l'onboarding con chiave API; se usi
OAuth, ometti la riga `env.OPENROUTER_API_KEY` dall'esempio seguente.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

L'elenco `analysis_models` è il pannello parallelo, e `model` dentro la configurazione del plugin
Fusion è il modello giudice. Non impostare `tool_choice` di primo livello su
`"required"` nei normali turni agente/chat di OpenClaw per provare a forzare Fusion;
i turni OpenClaw possono includere definizioni di strumenti OpenClaw, e una scelta strumento richiesta
di primo livello può richiedere uno di quegli strumenti invece del router Fusion. Quando
questa configurazione del plugin Fusion è presente, OpenClaw aggiunge anche una nota
sanitizzata al prompt di sistema con i modelli di analisi configurati e il modello giudice, così
l'agente può rispondere a domande sul suo pannello Fusion corrente. Gli altri campi `extraBody`
non vengono copiati nel prompt.

Fusion è più lento per progettazione. OpenRouter può inviare lo stesso prompt OpenClaw a
più modelli di analisi e poi eseguire un passaggio finale di giudizio/sintesi, quindi la latenza è
di solito più alta rispetto a una richiesta diretta a modello singolo. Usa Fusion per risposte
deliberate e di alta qualità o per percorsi di escalation, non come predefinito per
chat sensibili alla latenza. Per risposte più rapide, mantieni piccolo il pannello e scegli
modelli di analisi e giudizio più veloci.

Testa il riferimento configurato con una chiamata locale one-shot al modello:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Autenticazione e header

OpenRouter usa internamente un token Bearer con la tua chiave API. OpenRouter
OAuth è un flusso di accesso PKCE che emette una chiave API OpenRouter, quindi OpenClaw archivia
il risultato come lo stesso profilo di autenticazione con chiave API `openrouter:default` usato dal
percorso di configurazione manuale con chiave API.

Per un'installazione esistente, accedi o ruota la chiave OpenRouter archiviata senza
rieseguire l'onboarding completo:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Usa `openclaw models auth login --provider openrouter --method api-key` quando
vuoi incollare una chiave creata manualmente su OpenRouter.

Nelle richieste OpenRouter reali (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
gli header di attribuzione dell'app documentati da OpenRouter:

| Header                    | Valore                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se reindirizzi il provider OpenRouter a un altro proxy o URL di base, OpenClaw
**non** inietta quegli header specifici di OpenRouter né i marker di cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Caching delle risposte">
    Il caching delle risposte OpenRouter è opt-in. Abilitalo per ogni modello OpenRouter con
    i parametri del modello:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw invia `X-OpenRouter-Cache: true` e, quando configurato,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` forza un aggiornamento per
    la richiesta corrente e archivia la risposta sostitutiva. Sono accettati anche gli alias snake_case
    (`response_cache`, `response_cache_ttl_seconds` e
    `response_cache_clear`).

    Questo è separato dal caching dei prompt del provider e dai marker
    Anthropic `cache_control` di OpenRouter. Viene applicato solo su route
    `openrouter.ai` verificate, non su URL di base di proxy personalizzati.

  </Accordion>

  <Accordion title="Marker di cache Anthropic">
    Sulle route OpenRouter verificate, i riferimenti dei modelli Anthropic mantengono i
    marker Anthropic `cache_control` specifici di OpenRouter che OpenClaw usa per
    un migliore riutilizzo della cache dei prompt sui blocchi prompt di sistema/sviluppatore.
  </Accordion>

  <Accordion title="Prefill del ragionamento Anthropic">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic con ragionamento abilitato
    rimuovono i turni finali di prefill dell'assistente prima che la richiesta raggiunga OpenRouter,
    in linea con il requisito di Anthropic secondo cui le conversazioni con ragionamento terminano con un turno
    utente.
  </Accordion>

  <Accordion title="Iniezione di thinking / ragionamento">
    Sulle route non `auto` supportate, OpenClaw mappa il livello di thinking selezionato ai
    payload di ragionamento del proxy OpenRouter. Gli hint di modello non supportati e
    `openrouter/auto` saltano quell'iniezione di ragionamento. Hunter Alpha salta inoltre il
    ragionamento del proxy per riferimenti a modelli configurati obsoleti perché OpenRouter potrebbe
    restituire testo di risposta finale nei campi di ragionamento per quella route ritirata.
  </Accordion>

  <Accordion title="Replay del ragionamento DeepSeek V4">
    Sulle route OpenRouter verificate, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` compilano il `reasoning_content` mancante nei
    turni assistente riprodotti, così le conversazioni con thinking/strumenti mantengono la
    forma di follow-up richiesta da DeepSeek V4. OpenClaw invia valori di
    `reasoning.effort` supportati da OpenRouter per queste route; i livelli inferiori non off vengono mappati a
    `high` e gli override `max` obsoleti vengono mappati a `xhigh`.
  </Accordion>

  <Accordion title="Modellazione delle richieste solo OpenAI">
    OpenRouter passa ancora attraverso il percorso in stile proxy compatibile con OpenAI, quindi
    la modellazione nativa delle richieste solo OpenAI, come `serviceTier`, Responses `store`,
    i payload di compatibilità del ragionamento OpenAI e gli hint della cache dei prompt non viene inoltrata.
  </Accordion>

  <Accordion title="Route basate su Gemini">
    I riferimenti OpenRouter basati su Gemini rimangono sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanificazione delle firme di pensiero Gemini, ma non abilita la convalida nativa del replay Gemini
    né le riscritture bootstrap.
  </Accordion>

  <Accordion title="Metadati di routing del provider">
    OpenRouter supporta un oggetto richiesta `provider` per il routing del provider
    sottostante. Configura una policy predefinita per tutte le richieste OpenRouter di modelli di testo
    con `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw inoltra quell'oggetto a OpenRouter come payload `provider` della richiesta.
    Usa i campi snake_case documentati da OpenRouter, inclusi `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` e `enforce_distillable_text`.

    I parametri per modello sovrascrivono comunque l'oggetto di routing valido per tutto il provider:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Questo si applica solo alle route OpenRouter chat-completions. Le route dirette Anthropic,
    Google, OpenAI o provider personalizzati ignorano i parametri di routing OpenRouter.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo di configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
