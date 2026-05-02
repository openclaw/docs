---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
    - Vuoi utilizzare OpenRouter per la generazione di immagini
    - Vuoi usare OpenRouter per la generazione di video
summary: Usa l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T21:00:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornisce una **API unificata** che instrada le richieste a molti modelli dietro un singolo
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

## Riferimenti dei modelli

<Note>
I riferimenti dei modelli seguono il pattern `openrouter/<provider>/<model>`. Per l'elenco completo di
provider e modelli disponibili, consulta [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi di fallback inclusi:

| Riferimento modello              | Note                                    |
| --------------------------------- | --------------------------------------- |
| `openrouter/auto`                 | Instradamento automatico di OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 tramite MoonshotAI           |

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

OpenClaw invia job da testo a video e da immagine a video a OpenRouter, interroga
il `polling_url` restituito e scarica il video completato dagli
`unsigned_urls` di OpenRouter o dall'endpoint documentato del contenuto del job.
Le immagini di riferimento vengono inviate per impostazione predefinita come immagini del primo/ultimo frame; le immagini
contrassegnate con `reference_image` vengono inviate come riferimenti di input OpenRouter. Il
valore predefinito incluso `google/veo-3.1-fast` dichiara le durate attualmente supportate di 4/6/8
secondi, le risoluzioni `720P`/`1080P` e i rapporti d'aspetto `16:9`/`9:16`.
Da video a video non è registrato per OpenRouter perché l'API upstream di
generazione video attualmente accetta riferimenti testuali e immagini.

## Sintesi vocale

OpenRouter può anche essere usato come provider TTS tramite il suo endpoint
`/audio/speech` compatibile con OpenAI.

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

Nelle richieste OpenRouter reali (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
le intestazioni documentate di attribuzione dell'app di OpenRouter:

| Intestazione              | Valore                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se reindirizzi il provider OpenRouter a un altro proxy o URL di base, OpenClaw
**non** inserisce quelle intestazioni specifiche di OpenRouter né i marcatori cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Marcatori cache Anthropic">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic mantengono i
    marcatori `cache_control` Anthropic specifici di OpenRouter che OpenClaw usa per
    un migliore riutilizzo della prompt-cache sui blocchi di prompt di sistema/sviluppatore.
  </Accordion>

  <Accordion title="Prefill del ragionamento Anthropic">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic con ragionamento abilitato
    eliminano i turni finali di prefill dell'assistente prima che la richiesta raggiunga OpenRouter,
    rispettando il requisito di Anthropic secondo cui le conversazioni con ragionamento devono terminare con un turno utente.
  </Accordion>

  <Accordion title="Iniezione di thinking/ragionamento">
    Sulle route non `auto` supportate, OpenClaw mappa il livello di thinking selezionato su
    payload di ragionamento proxy di OpenRouter. I suggerimenti di modelli non supportati e
    `openrouter/auto` saltano questa iniezione di ragionamento. Anche Hunter Alpha salta
    il ragionamento proxy per riferimenti di modello configurati obsoleti perché OpenRouter potrebbe
    restituire testo di risposta finale nei campi di ragionamento per quella route ritirata.
  </Accordion>

  <Accordion title="Replay del ragionamento DeepSeek V4">
    Sulle route OpenRouter verificate, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` riempiono il `reasoning_content` mancante nei
    turni assistente riprodotti, così le conversazioni thinking/strumenti mantengono la
    forma di follow-up richiesta da DeepSeek V4.
  </Accordion>

  <Accordion title="Modellazione delle richieste solo OpenAI">
    OpenRouter passa ancora attraverso il percorso proxy compatibile con OpenAI, quindi
    la modellazione delle richieste nativa solo OpenAI, come `serviceTier`, Responses `store`,
    i payload compatibili con il ragionamento OpenAI e i suggerimenti di prompt-cache, non viene inoltrata.
  </Accordion>

  <Accordion title="Route supportate da Gemini">
    I riferimenti OpenRouter supportati da Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanificazione delle firme di pensiero Gemini, ma non abilita la validazione nativa del replay Gemini
    né le riscritture di bootstrap.
  </Accordion>

  <Accordion title="Metadati di instradamento del provider">
    Se passi l'instradamento del provider OpenRouter nei parametri del modello, OpenClaw lo inoltra
    come metadati di instradamento OpenRouter prima dell'esecuzione dei wrapper di stream condivisi.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
