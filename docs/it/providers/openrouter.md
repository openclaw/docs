---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
    - Vuoi usare OpenRouter per la generazione di immagini
summary: Usa l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T18:22:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un singolo
endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL base.

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
    L'onboarding usa per impostazione predefinita `openrouter/auto`. Scegli in seguito un modello concreto:

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
I riferimenti ai modelli seguono il pattern `openrouter/<provider>/<model>`. Per l'elenco completo di
provider e modelli disponibili, vedi [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi bundled di fallback:

| Model ref                            | Note                              |
| ------------------------------------ | --------------------------------- |
| `openrouter/auto`                    | Routing automatico OpenRouter     |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 tramite MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | Route OpenRouter Healer Alpha     |
| `openrouter/openrouter/hunter-alpha` | Route OpenRouter Hunter Alpha     |

## Generazione di immagini

OpenRouter può anche fare da backend per lo strumento `image_generate`. Usa un modello immagine OpenRouter in `agents.defaults.imageGenerationModel`:

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

OpenClaw invia le richieste di immagini all'API immagini chat completions di OpenRouter con `modalities: ["image", "text"]`. I modelli immagine Gemini ricevono gli hint supportati `aspectRatio` e `resolution` tramite `image_config` di OpenRouter. Usa `agents.defaults.imageGenerationModel.timeoutMs` per i modelli immagine OpenRouter più lenti; il parametro `timeoutMs` per chiamata dello strumento `image_generate` ha comunque la precedenza.

## Text-to-speech

OpenRouter può essere usato anche come provider TTS tramite il suo endpoint
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

Se `messages.tts.providers.openrouter.apiKey` è omesso, TTS riusa
`models.providers.openrouter.apiKey`, poi `OPENROUTER_API_KEY`.

## Autenticazione e header

OpenRouter usa internamente un token Bearer con la tua chiave API.

Nelle vere richieste OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
gli header di attribuzione app documentati da OpenRouter:

| Header                    | Valore                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se punti di nuovo il provider OpenRouter verso un altro proxy o URL base, OpenClaw
**non** inietta quegli header specifici di OpenRouter né i marker della cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Marker della cache Anthropic">
    Sulle route OpenRouter verificate, i riferimenti a modelli Anthropic mantengono i
    marker `cache_control` Anthropic specifici di OpenRouter che OpenClaw usa per
    un migliore riuso della cache dei prompt nei blocchi di prompt system/developer.
  </Accordion>

  <Accordion title="Iniezione di thinking / reasoning">
    Sulle route supportate non `auto`, OpenClaw mappa il livello di thinking selezionato ai
    payload di reasoning del proxy OpenRouter. Gli hint di modello non supportati e
    `openrouter/auto` saltano quell'iniezione di reasoning.
  </Accordion>

  <Accordion title="Request shaping solo OpenAI">
    OpenRouter continua a passare attraverso il percorso compatibile OpenAI in stile proxy, quindi
    il request shaping nativo solo OpenAI, come `serviceTier`, `store` di Responses,
    payload di compatibilità del reasoning OpenAI e hint della cache dei prompt, non viene inoltrato.
  </Accordion>

  <Accordion title="Route basate su Gemini">
    I riferimenti OpenRouter basati su Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanitizzazione della thought-signature di Gemini, ma non abilita la validazione di replay
    nativa di Gemini né le riscritture bootstrap.
  </Accordion>

  <Accordion title="Metadati di routing del provider">
    Se passi il routing del provider OpenRouter sotto i parametri del modello, OpenClaw lo inoltra
    come metadati di routing OpenRouter prima che vengano eseguiti i wrapper di stream condivisi.
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
