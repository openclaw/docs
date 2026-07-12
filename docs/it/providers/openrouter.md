---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
    - Vuoi usare OpenRouter per la generazione di immagini
    - Vuoi usare OpenRouter per la generazione musicale
    - Vuoi usare OpenRouter per la generazione di video
summary: Usa l'API unificata di OpenRouter per accedere a numerosi modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T07:25:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter instrada le richieste verso numerosi modelli tramite un'unica API e un'unica chiave. È
compatibile con OpenAI, quindi OpenClaw comunica con esso tramite lo stesso
trasporto in stile `openai-completions` utilizzato per gli altri provider proxy.

## Guida introduttiva

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Eseguire la configurazione iniziale OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw apre il flusso di accesso di OpenRouter nel browser (PKCE), scambia il
        codice con una chiave API OpenRouter e la memorizza nel profilo di
        autenticazione OpenRouter predefinito. Sugli host remoti o senza interfaccia grafica, OpenClaw mostra
        l'URL di accesso e chiede di incollare l'URL di reindirizzamento dopo aver effettuato l'accesso.
      </Step>
      <Step title="(Facoltativo) Passare a un modello specifico">
        La configurazione iniziale usa per impostazione predefinita `openrouter/auto`. È possibile scegliere in seguito un modello specifico:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Chiave API">
    <Steps>
      <Step title="Ottenere la chiave API">
        Creare una chiave API su [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Eseguire la configurazione iniziale con chiave API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Facoltativo) Passare a un modello specifico">
        La configurazione iniziale usa per impostazione predefinita `openrouter/auto`. È possibile scegliere in seguito un modello specifico:

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

## Riferimenti ai modelli

<Note>
I riferimenti ai modelli seguono il formato `openrouter/<provider>/<model>`. Per l'elenco completo dei
provider e dei modelli disponibili, consultare [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Modelli di riserva inclusi, utilizzati quando il rilevamento del catalogo in tempo reale non è disponibile:

| Riferimento al modello            | Note                              |
| --------------------------------- | --------------------------------- |
| `openrouter/auto`                 | Instradamento automatico OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 tramite MoonshotAI      |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 tramite MoonshotAI      |

Qualsiasi altro riferimento `openrouter/<provider>/<model>`, incluso
`openrouter/openrouter/fusion` (vedere [router Fusion](#fusion-router)), viene risolto
dinamicamente rispetto al catalogo dei modelli in tempo reale di OpenRouter.

## Generazione di immagini

OpenRouter può supportare lo strumento `image_generate`. Impostare un modello per immagini OpenRouter
in `agents.defaults.imageGenerationModel`:

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

OpenClaw invia le richieste di immagini all'API per immagini basata sul completamento delle chat di OpenRouter con
`modalities: ["image", "text"]`. I modelli per immagini Gemini ricevono inoltre
indicazioni `aspectRatio` e `resolution` tramite `image_config` di OpenRouter; gli altri
modelli per immagini non le ricevono. Utilizzare `agents.defaults.imageGenerationModel.timeoutMs` per
i modelli più lenti; il valore `timeoutMs` specificato per singola chiamata dello strumento `image_generate` ha comunque la precedenza.

## Generazione di video

OpenRouter può supportare lo strumento `video_generate` tramite la propria API asincrona
`/videos`. Impostare un modello video OpenRouter in
`agents.defaults.videoGenerationModel`:

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

OpenClaw invia processi di generazione da testo a video e da immagine a video, interroga periodicamente
il `polling_url` restituito e scarica il video completato dagli
`unsigned_urls` di OpenRouter o dall'endpoint dei contenuti del processo. Per impostazione predefinita, le immagini di riferimento vengono usate come
primo o ultimo fotogramma; le immagini contrassegnate con `reference_image` vengono invece inviate come
riferimenti di input. Il modello predefinito incluso `google/veo-3.1-fast` supporta durate di 4/6/8
secondi, risoluzioni `720P`/`1080P` e proporzioni `16:9`/`9:16`.
La generazione da video a video non è supportata: l'API a monte accetta solo riferimenti
testuali e immagini.

## Generazione di musica

OpenRouter può supportare lo strumento `music_generate` tramite l'output audio
dei completamenti delle chat. Impostare un modello audio OpenRouter in
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

Il provider musicale OpenRouter incluso usa per impostazione predefinita `google/lyria-3-pro-preview`
e rende disponibile anche `google/lyria-3-clip-preview`. OpenClaw invia `modalities:
["text", "audio"]`, riceve la risposta in streaming, raccoglie i frammenti audio e salva
il risultato come contenuto multimediale generato per la consegna al canale. I modelli Lyria accettano un'unica
immagine di riferimento tramite il parametro condiviso `music_generate image=...`.
L'audio in streaming, la conservazione della trascrizione e l'involucro derivato degli eventi SSE sono
limitati da `agents.defaults.mediaMaxMb` (il limite audio predefinito è 16 MB).

## Sintesi vocale

OpenRouter può fungere da provider TTS tramite il proprio endpoint compatibile con OpenAI
`/audio/speech`.

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

Se `messages.tts.providers.openrouter.apiKey` viene omesso, TTS utilizza come ripiego
`models.providers.openrouter.apiKey`, quindi `OPENROUTER_API_KEY`.

## Da voce a testo (audio in ingresso)

OpenRouter può trascrivere gli allegati vocali/audio in ingresso tramite il percorso condiviso
`tools.media.audio`, utilizzando il proprio endpoint STT (`/audio/transcriptions`).
Questo vale per qualsiasi Plugin di canale che inoltri contenuti vocali/audio in ingresso al
controllo preliminare di comprensione dei contenuti multimediali.

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

OpenClaw invia le richieste STT a OpenRouter come JSON con l'audio in base64 nel campo
`input_audio` (il contratto STT di OpenRouter), non come caricamenti di moduli OpenAI
multipart.

## Router Fusion

OpenRouter Fusion invia un riferimento modello OpenClaw a diversi modelli OpenRouter in
parallelo, fa valutare le loro risposte da OpenRouter e restituisce un'unica risposta finale
tramite il normale endpoint OpenRouter. Lo slug del modello upstream è
`openrouter/fusion`, quindi il riferimento modello OpenClaw include sia il prefisso del
provider OpenClaw sia lo spazio dei nomi OpenRouter upstream:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configura il gruppo di modelli e il giudice di Fusion tramite `params.extraBody` del modello;
questi campi vengono inoltrati direttamente nel corpo della richiesta di completamento chat
di OpenRouter. Fusion funziona con la configurazione iniziale sia tramite OAuth sia tramite
chiave API; se utilizzi OAuth, ometti la riga `env.OPENROUTER_API_KEY` seguente.

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

`analysis_models` è il gruppo parallelo; `model` nella configurazione del Plugin Fusion
è il modello giudice. Nei normali turni dell'agente o della chat, non impostare
`tool_choice` di primo livello su `"required"` per tentare di forzare Fusion: i turni
OpenClaw possono includere le proprie definizioni degli strumenti e una scelta obbligatoria
dello strumento di primo livello potrebbe selezionarne uno al posto del router Fusion.
Quando questa configurazione del Plugin Fusion è presente, OpenClaw aggiunge al prompt di
sistema una nota sanificata che elenca i modelli di analisi configurati e il modello giudice,
così l'agente può rispondere alle domande sul proprio gruppo Fusion. Gli altri campi
`extraBody` non vengono copiati nel prompt.

Fusion è più lento per progettazione: OpenRouter distribuisce il prompt a più modelli di
analisi, quindi esegue una fase di valutazione e sintesi; di conseguenza, la latenza è
superiore rispetto a una richiesta diretta a un singolo modello. Utilizzalo per risposte
ponderate e di alta qualità o per percorsi di escalation, non come impostazione predefinita
quando la latenza è un fattore critico. Mantieni ridotto il gruppo e scegli modelli di
analisi e giudizio più veloci per ottenere risposte più rapide.

Verifica un riferimento configurato con una singola chiamata locale:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Autenticazione e intestazioni

OpenRouter utilizza un token Bearer derivato dalla chiave API. OAuth di OpenRouter è un
flusso di accesso PKCE che emette una chiave API OpenRouter, pertanto OpenClaw memorizza il
risultato nello stesso profilo di autenticazione tramite chiave API `openrouter:default`
utilizzato per la configurazione manuale della chiave API.

Per accedere o ruotare la chiave memorizzata in un'installazione esistente senza ripetere
l'intera configurazione iniziale:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Nelle richieste OpenRouter verificate (`https://openrouter.ai/api/v1`), OpenClaw aggiunge
le intestazioni documentate da OpenRouter per l'attribuzione dell'applicazione:

| Intestazione              | Valore                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se reindirizzi il provider OpenRouter verso un altro proxy o URL di base, OpenClaw
**non** inserisce queste intestazioni specifiche di OpenRouter né i marcatori della cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Response caching">
    La memorizzazione nella cache delle risposte di OpenRouter è facoltativa. Abilitala per ciascun modello:

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
    la richiesta corrente e memorizza la risposta sostitutiva. Sono accettati gli alias
    in snake_case (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`), così come `responseCacheTtl` /
    `response_cache_ttl` senza il suffisso `Seconds`.

    Questa funzionalità è distinta dalla memorizzazione nella cache dei prompt del provider e dai
    marcatori Anthropic `cache_control` di OpenRouter. Si applica solo alle route
    `openrouter.ai` verificate, non agli URL di base di proxy personalizzati.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Nelle route OpenRouter verificate, i riferimenti ai modelli Anthropic mantengono i
    marcatori Anthropic `cache_control` di OpenRouter per migliorare il riutilizzo della cache
    dei prompt nei blocchi dei prompt di sistema e dello sviluppatore.
  </Accordion>

  <Accordion title="Prefill del ragionamento di Anthropic">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic con il ragionamento abilitato
    eliminano i turni finali di prefill dell'assistente prima che la richiesta raggiunga
    OpenRouter, in conformità al requisito di Anthropic secondo cui le conversazioni con ragionamento
    devono terminare con un turno dell'utente.
  </Accordion>

  <Accordion title="Inserimento del pensiero / ragionamento">
    Sulle route supportate diverse da `auto`, OpenClaw associa il livello di pensiero selezionato
    ai payload di ragionamento del proxy OpenRouter. `openrouter/auto` e le indicazioni di modelli
    non supportati non eseguono tale inserimento. Anche i riferimenti obsoleti a `openrouter/hunter-alpha`
    lo ignorano, perché su quella route ritirata OpenRouter poteva restituire il testo della risposta
    finale nei campi del ragionamento.
  </Accordion>

  <Accordion title="Riproduzione del ragionamento di DeepSeek V4">
    Sulle route OpenRouter verificate, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` compilano il campo `reasoning_content` mancante nei
    turni dell'assistente riprodotti, mantenendo le conversazioni di pensiero e utilizzo degli strumenti
    nel formato di continuazione richiesto da DeepSeek V4. OpenClaw invia i valori
    `reasoning.effort` supportati da OpenRouter per queste route: `xhigh`/`max` corrispondono a `xhigh`,
    mentre ogni altro livello diverso da disattivato corrisponde a `high`.
  </Accordion>

  <Accordion title="Definizione delle richieste esclusiva di OpenAI">
    OpenRouter opera attraverso il percorso compatibile con OpenAI in stile proxy, pertanto non vengono
    inoltrate le definizioni delle richieste esclusive dell'API nativa di OpenAI, come `serviceTier`,
    `store` di Responses, i payload di compatibilità del ragionamento OpenAI e le indicazioni per la cache dei prompt.
  </Accordion>

  <Accordion title="Route basate su Gemini">
    I riferimenti OpenRouter basati su Gemini rimangono sul percorso proxy-Gemini: OpenClaw mantiene
    la sanitizzazione delle firme di pensiero di Gemini, ma non abilita la convalida della riproduzione
    nativa di Gemini né le riscritture di bootstrap.
  </Accordion>

  <Accordion title="Metadati di instradamento del provider">
    OpenRouter supporta un oggetto di richiesta `provider` per l'instradamento del provider
    sottostante. Configura un criterio predefinito per tutte le richieste ai modelli di testo OpenRouter
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

    OpenClaw inoltra tale oggetto a OpenRouter come payload `provider` della richiesta.
    Utilizza i campi snake_case documentati da OpenRouter, tra cui `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` ed `enforce_distillable_text`.

    I parametri specifici del modello sostituiscono l'oggetto di instradamento comune al provider:

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

    Questo si applica solo alle route chat-completions di OpenRouter. Le route dirette di Anthropic,
    Google, OpenAI o di provider personalizzati ignorano i parametri di instradamento di OpenRouter.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
