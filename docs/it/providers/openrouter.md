---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
    - Vuoi usare OpenRouter per la generazione di immagini
    - Vuoi utilizzare OpenRouter per la generazione di video
summary: Usa l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:48:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un unico
endpoint e una chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API su [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Esegui l'onboarding">
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
I riferimenti ai modelli seguono lo schema `openrouter/<provider>/<model>`. Per l'elenco completo dei
provider e modelli disponibili, consulta [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi di fallback inclusi:

| Riferimento modello              | Note                             |
| --------------------------------- | -------------------------------- |
| `openrouter/auto`                 | Instradamento automatico OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 tramite MoonshotAI     |

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

OpenClaw invia le richieste di immagini all'API immagini per completamenti chat di OpenRouter con `modalities: ["image", "text"]`. I modelli immagine Gemini ricevono suggerimenti `aspectRatio` e `resolution` supportati tramite `image_config` di OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` per i modelli immagine OpenRouter più lenti; il parametro per chiamata `timeoutMs` dello strumento `image_generate` ha comunque la precedenza.

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

OpenClaw invia job da testo a video e da immagine a video a OpenRouter, interroga
il `polling_url` restituito e scarica il video completato da
`unsigned_urls` di OpenRouter o dall'endpoint documentato del contenuto del job.
Le immagini di riferimento vengono inviate per impostazione predefinita come immagini del primo/ultimo fotogramma; le immagini
contrassegnate con `reference_image` vengono inviate come riferimenti di input OpenRouter. Il
valore predefinito incluso `google/veo-3.1-fast` dichiara le durate attualmente supportate di 4/6/8
secondi, le risoluzioni `720P`/`1080P` e i rapporti di aspetto `16:9`/`9:16`.
Il video-to-video non è registrato per OpenRouter perché l'API upstream
di generazione video attualmente accetta testo e riferimenti immagine.

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
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Se `messages.tts.providers.openrouter.apiKey` viene omesso, TTS riutilizza
`models.providers.openrouter.apiKey`, poi `OPENROUTER_API_KEY`.

## Autenticazione e intestazioni

OpenRouter usa internamente un token Bearer con la tua chiave API.

Sulle richieste OpenRouter reali (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
le intestazioni di attribuzione app documentate da OpenRouter:

| Intestazione              | Valore                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se reindirizzi il provider OpenRouter verso un altro proxy o URL di base, OpenClaw
**non** inserisce quelle intestazioni specifiche di OpenRouter né i marker di cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Memorizzazione nella cache delle risposte">
    La memorizzazione nella cache delle risposte OpenRouter è opt-in. Abilitala per singolo modello OpenRouter con
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
    la richiesta corrente e memorizza la risposta sostitutiva. Sono accettati anche gli alias snake_case
    (`response_cache`, `response_cache_ttl_seconds` e
    `response_cache_clear`).

    Questa funzionalità è distinta dalla cache dei prompt del provider e dai marker
    Anthropic `cache_control` di OpenRouter. Viene applicata solo sulle route
    `openrouter.ai` verificate, non sugli URL di base di proxy personalizzati.

  </Accordion>

  <Accordion title="Marker di cache Anthropic">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic mantengono i
    marker Anthropic `cache_control` specifici di OpenRouter che OpenClaw usa per
    migliorare il riutilizzo della cache dei prompt sui blocchi di prompt di sistema/sviluppatore.
  </Accordion>

  <Accordion title="Prefill del ragionamento Anthropic">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic con ragionamento abilitato
    eliminano i turni finali di prefill dell'assistente prima che la richiesta raggiunga OpenRouter,
    rispettando il requisito di Anthropic secondo cui le conversazioni con ragionamento terminino con un turno utente.
  </Accordion>

  <Accordion title="Iniezione di pensiero / ragionamento">
    Sulle route non `auto` supportate, OpenClaw mappa il livello di pensiero selezionato ai
    payload di ragionamento del proxy OpenRouter. I suggerimenti di modello non supportati e
    `openrouter/auto` saltano tale iniezione di ragionamento. Anche Hunter Alpha salta
    il ragionamento proxy per riferimenti a modelli configurati obsoleti perché OpenRouter potrebbe
    restituire testo della risposta finale nei campi di ragionamento per quella route ritirata.
  </Accordion>

  <Accordion title="Replay del ragionamento DeepSeek V4">
    Sulle route OpenRouter verificate, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` completano il `reasoning_content` mancante nei
    turni assistente riprodotti, così le conversazioni con pensiero/strumenti mantengono la
    forma di follow-up richiesta da DeepSeek V4. OpenClaw invia i valori
    `reasoning_effort` supportati da OpenRouter per queste route; `xhigh` è il livello pubblicizzato
    più alto, e gli override obsoleti `max` vengono mappati a `xhigh`.
  </Accordion>

  <Accordion title="Adattamento delle richieste solo OpenAI">
    OpenRouter passa ancora attraverso il percorso compatibile con OpenAI in stile proxy, quindi
    gli adattamenti delle richieste nativi solo OpenAI, come `serviceTier`, Responses `store`,
    i payload compatibili con il ragionamento OpenAI e i suggerimenti di cache dei prompt, non vengono inoltrati.
  </Accordion>

  <Accordion title="Route supportate da Gemini">
    I riferimenti OpenRouter supportati da Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanificazione delle firme di pensiero Gemini, ma non abilita la validazione del replay
    nativa Gemini né le riscritture di bootstrap.
  </Accordion>

  <Accordion title="Metadati di instradamento del provider">
    Se passi l'instradamento del provider OpenRouter nei parametri del modello, OpenClaw lo inoltra
    come metadati di instradamento OpenRouter prima dell'esecuzione dei wrapper di streaming condivisi.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo alla configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
