---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
    - Vuoi usare OpenRouter per la generazione di immagini
    - Vuoi utilizzare OpenRouter per la generazione di video
summary: Usa l'API unificata di OpenRouter per accedere a numerosi modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T08:32:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f7c6f9c77e2a62866fdeaa65667d3871930be2ce22a638accdb8baa76220fd
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornisce una **API unificata** che instrada le richieste a molti modelli dietro un singolo
endpoint e una chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

## Per iniziare

<Steps>
  <Step title="Get your API key">
    Crea una chiave API su [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
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
I riferimenti ai modelli seguono il modello `openrouter/<provider>/<model>`. Per l'elenco completo dei
provider e dei modelli disponibili, consulta [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi di fallback inclusi:

| Riferimento modello              | Note                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Instradamento automatico OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 tramite MoonshotAI |

## Generazione di immagini

OpenRouter può anche supportare lo strumento `image_generate`. Usa un modello di immagini OpenRouter in `agents.defaults.imageGenerationModel`:

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

OpenClaw invia richieste di immagini all'API di immagini delle chat completions di OpenRouter con `modalities: ["image", "text"]`. I modelli di immagini Gemini ricevono suggerimenti supportati per `aspectRatio` e `resolution` tramite `image_config` di OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` per i modelli di immagini OpenRouter più lenti; il parametro `timeoutMs` per singola chiamata dello strumento `image_generate` ha comunque la precedenza.

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
il `polling_url` restituito e scarica il video completato dagli
`unsigned_urls` di OpenRouter o dall'endpoint documentato per il contenuto del job.
Le immagini di riferimento vengono inviate per impostazione predefinita come immagini del primo/ultimo fotogramma; le immagini
contrassegnate con `reference_image` vengono inviate come riferimenti di input OpenRouter. Il valore predefinito
incluso `google/veo-3.1-fast` dichiara le durate attualmente supportate di 4/6/8
secondi, le risoluzioni `720P`/`1080P` e i rapporti d'aspetto `16:9`/`9:16`.
Video-to-video non è registrato per OpenRouter perché l'API upstream
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

## Autenticazione e header

OpenRouter usa internamente un token Bearer con la tua chiave API.

Nelle richieste OpenRouter reali (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
gli header documentati di attribuzione dell'app di OpenRouter:

| Header                    | Valore                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se reindirizzi il provider OpenRouter a un altro proxy o URL di base, OpenClaw
**non** inserisce quegli header specifici di OpenRouter né i marker cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic mantengono i
    marker Anthropic `cache_control` specifici di OpenRouter che OpenClaw usa per
    un migliore riutilizzo della prompt-cache sui blocchi di prompt system/developer.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic con reasoning abilitato
    eliminano i turni finali di prefill dell'assistente prima che la richiesta raggiunga OpenRouter,
    rispettando il requisito di Anthropic secondo cui le conversazioni di reasoning terminano con un turno
    utente.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Sulle route non `auto` supportate, OpenClaw mappa il livello di thinking selezionato sui
    payload di reasoning del proxy OpenRouter. Gli hint dei modelli non supportati e
    `openrouter/auto` saltano questa iniezione di reasoning. Hunter Alpha salta anche il
    reasoning del proxy per riferimenti modello configurati obsoleti perché OpenRouter potrebbe
    restituire testo di risposta finale nei campi di reasoning per quella route ritirata.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter passa comunque attraverso il percorso in stile proxy compatibile con OpenAI, quindi
    lo shaping delle richieste nativo solo OpenAI come `serviceTier`, Responses `store`,
    i payload compatibili con il reasoning OpenAI e gli hint di prompt-cache non vengono inoltrati.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    I riferimenti OpenRouter basati su Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la pulizia delle thought-signature Gemini, ma non abilita la validazione nativa del replay Gemini
    o le riscritture di bootstrap.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Se passi il routing provider di OpenRouter nei parametri del modello, OpenClaw lo inoltra
    come metadati di routing OpenRouter prima che vengano eseguiti i wrapper condivisi dello stream.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
