---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire i modelli tramite OpenRouter in OpenClaw
    - Vuoi utilizzare OpenRouter per la generazione di immagini
    - Vuoi usare OpenRouter per la generazione di video
summary: Usa l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T07:08:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornisce una **API unificata** che indirizza le richieste a molti modelli dietro un unico
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
I riferimenti ai modelli seguono il pattern `openrouter/<provider>/<model>`. Per l'elenco completo dei
provider e dei modelli disponibili, consulta [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi di fallback inclusi:

| Riferimento modello              | Note                                  |
| --------------------------------- | ------------------------------------- |
| `openrouter/auto`                 | Instradamento automatico OpenRouter   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 tramite MoonshotAI          |

## Generazione di immagini

OpenRouter può anche alimentare lo strumento `image_generate`. Usa un modello di immagine OpenRouter in `agents.defaults.imageGenerationModel`:

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

OpenClaw invia le richieste di immagini all'API immagini delle completions chat di OpenRouter con `modalities: ["image", "text"]`. I modelli di immagini Gemini ricevono suggerimenti `aspectRatio` e `resolution` supportati tramite `image_config` di OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` per i modelli di immagini OpenRouter più lenti; il parametro `timeoutMs` per singola chiamata dello strumento `image_generate` ha comunque la precedenza.

## Generazione di video

OpenRouter può anche alimentare lo strumento `video_generate` tramite la sua API asincrona `/videos`. Usa un modello video OpenRouter in `agents.defaults.videoGenerationModel`:

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

OpenClaw invia processi text-to-video e image-to-video a OpenRouter, interroga
il `polling_url` restituito e scarica il video completato da
`unsigned_urls` di OpenRouter o dall'endpoint documentato del contenuto del processo.
Per impostazione predefinita, le immagini di riferimento vengono inviate come immagini del primo/ultimo frame; le immagini
contrassegnate con `reference_image` vengono inviate come riferimenti di input OpenRouter. Il default incluso
`google/veo-3.1-fast` dichiara le durate attualmente supportate di 4/6/8
secondi, le risoluzioni `720P`/`1080P` e i rapporti d'aspetto `16:9`/`9:16`.
Video-to-video non è registrato per OpenRouter perché l'API upstream
di generazione video attualmente accetta testo e riferimenti immagine.

## Sintesi vocale

OpenRouter può anche essere usato come provider TTS tramite il suo endpoint compatibile con OpenAI
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

Nelle richieste reali a OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
gli header documentati di attribuzione app di OpenRouter:

| Header                    | Valore                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se reindirizzi il provider OpenRouter a qualche altro proxy o URL di base, OpenClaw
**non** inietta quegli header specifici di OpenRouter né i marcatori di cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Response caching">
    La cache delle risposte OpenRouter è facoltativa. Abilitala per singolo modello OpenRouter con
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

    Questo è separato dalla cache dei prompt del provider e dai marcatori
    `cache_control` Anthropic di OpenRouter. Viene applicato solo sulle route
    `openrouter.ai` verificate, non sugli URL di base di proxy personalizzati.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic mantengono i
    marcatori Anthropic `cache_control` specifici di OpenRouter che OpenClaw usa per
    riutilizzare meglio la cache dei prompt sui blocchi di prompt system/developer.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic con reasoning abilitato
    rimuovono i turni finali di prefill dell'assistente prima che la richiesta raggiunga OpenRouter,
    rispettando il requisito di Anthropic secondo cui le conversazioni con reasoning terminino con un
    turno dell'utente.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Sulle route non `auto` supportate, OpenClaw mappa il livello di thinking selezionato sui
    payload di reasoning del proxy OpenRouter. I suggerimenti di modello non supportati e
    `openrouter/auto` saltano questa iniezione di reasoning. Hunter Alpha salta anche il
    reasoning proxy per riferimenti a modelli configurati obsoleti perché OpenRouter potrebbe
    restituire testo di risposta finale nei campi di reasoning per quella route ritirata.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    Sulle route OpenRouter verificate, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` compilano il `reasoning_content` mancante nei
    turni assistente riprodotti, così le conversazioni thinking/tool mantengono la
    forma di follow-up richiesta da DeepSeek V4.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter passa comunque attraverso il percorso proxy compatibile con OpenAI, quindi
    il request shaping nativo solo OpenAI, come `serviceTier`, Responses `store`,
    i payload compatibili con il reasoning OpenAI e i suggerimenti per la cache dei prompt, non viene inoltrato.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    I riferimenti OpenRouter basati su Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanificazione delle firme di pensiero Gemini, ma non abilita la validazione del replay Gemini
    nativa né le riscritture di bootstrap.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Se passi il routing del provider OpenRouter nei parametri del modello, OpenClaw lo inoltra
    come metadati di routing OpenRouter prima dell'esecuzione dei wrapper di stream condivisi.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo alla configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
