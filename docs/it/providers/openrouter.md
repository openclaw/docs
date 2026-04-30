---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
    - Desideri usare OpenRouter per la generazione di immagini
    - Vuoi usare OpenRouter per la generazione di video
summary: Usa l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T09:09:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornisce una **API unificata** che instrada le richieste verso molti modelli dietro un singolo
endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

## Introduzione

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
provider e dei modelli disponibili, consulta [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi di fallback inclusi:

| Riferimento modello              | Note                              |
| --------------------------------- | --------------------------------- |
| `openrouter/auto`                 | Instradamento automatico OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 tramite MoonshotAI      |

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

OpenClaw invia richieste di immagini all'API di immagini per chat completions di OpenRouter con `modalities: ["image", "text"]`. I modelli di immagini Gemini ricevono suggerimenti `aspectRatio` e `resolution` supportati tramite `image_config` di OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` per i modelli di immagini OpenRouter più lenti; il parametro `timeoutMs` per chiamata dello strumento `image_generate` ha comunque la precedenza.

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

OpenClaw invia processi da testo a video e da immagine a video a OpenRouter, interroga
il `polling_url` restituito e scarica il video completato dagli
`unsigned_urls` di OpenRouter o dall'endpoint documentato per il contenuto del processo.
Le immagini di riferimento vengono inviate per impostazione predefinita come immagini del primo/ultimo fotogramma; le immagini
contrassegnate con `reference_image` vengono inviate come riferimenti di input OpenRouter. Il valore predefinito
incluso `google/veo-3.1-fast` dichiara le durate attualmente supportate di 4/6/8
secondi, le risoluzioni `720P`/`1080P` e i rapporti d'aspetto `16:9`/`9:16`.
Il video-to-video non è registrato per OpenRouter perché l'API upstream
di generazione video attualmente accetta testo e riferimenti di immagini.

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

## Autenticazione e intestazioni

OpenRouter usa internamente un token Bearer con la tua chiave API.

Nelle richieste OpenRouter reali (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
le intestazioni di attribuzione app documentate da OpenRouter:

| Intestazione              | Valore                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se reindirizzi il provider OpenRouter a un altro proxy o URL di base, OpenClaw
**non** inserisce quelle intestazioni specifiche di OpenRouter né i marcatori di cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Marcatori di cache Anthropic">
    Su rotte OpenRouter verificate, i riferimenti ai modelli Anthropic mantengono i
    marcatori Anthropic `cache_control` specifici di OpenRouter che OpenClaw usa per
    migliorare il riutilizzo della cache dei prompt nei blocchi di prompt di sistema/sviluppatore.
  </Accordion>

  <Accordion title="Iniezione di pensiero / ragionamento">
    Sulle rotte non `auto` supportate, OpenClaw mappa il livello di pensiero selezionato sui
    payload di ragionamento del proxy OpenRouter. I suggerimenti di modello non supportati e
    `openrouter/auto` saltano tale iniezione di ragionamento. Anche Hunter Alpha salta il
    ragionamento proxy per riferimenti a modelli configurati obsoleti, perché OpenRouter potrebbe
    restituire testo della risposta finale nei campi di ragionamento per quella rotta ritirata.
  </Accordion>

  <Accordion title="Modellazione delle richieste solo OpenAI">
    OpenRouter passa comunque attraverso il percorso compatibile con OpenAI in stile proxy, quindi
    la modellazione nativa delle richieste solo OpenAI, come `serviceTier`, `store` di Responses,
    payload compatibili con il ragionamento OpenAI e suggerimenti per la cache dei prompt, non viene inoltrata.
  </Accordion>

  <Accordion title="Rotte basate su Gemini">
    I riferimenti OpenRouter basati su Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanificazione delle firme di pensiero Gemini, ma non abilita la validazione nativa di replay Gemini
    né le riscritture bootstrap.
  </Accordion>

  <Accordion title="Metadati di instradamento del provider">
    Se passi l'instradamento del provider OpenRouter nei parametri del modello, OpenClaw lo inoltra
    come metadati di instradamento OpenRouter prima dell'esecuzione dei wrapper di stream condivisi.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
