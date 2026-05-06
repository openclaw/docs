---
read_when:
    - Je wilt Mistral-modellen in OpenClaw gebruiken
    - Je wilt Voxtral-realtimetranscriptie voor Spraakoproep
    - Je hebt onboarding voor Mistral-API-sleutels en modelverwijzingen nodig
summary: Mistral-modellen en Voxtral-transcriptie gebruiken met OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T09:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw bevat een gebundelde Mistral-Plugin die vier contracten registreert: chatvoltooiingen, mediabegrip (Voxtral-batchtranscriptie), realtime STT voor Voice Call (Voxtral Realtime) en geheugenembeddings (`mistral-embed`).

| Eigenschap       | Waarde                                      |
| ---------------- | ------------------------------------------- |
| Provider-id      | `mistral`                                   |
| Plugin           | gebundeld, `enabledByDefault: true`         |
| Auth-env-var     | `MISTRAL_API_KEY`                           |
| Onboarding-vlag  | `--auth-choice mistral-api-key`             |
| Directe CLI-vlag | `--mistral-api-key <key>`                   |
| API              | OpenAI-compatibel (`openai-completions`)    |
| Basis-URL        | `https://api.mistral.ai/v1`                 |
| Standaardmodel   | `mistral/mistral-large-latest`              |
| Embeddingmodel   | `mistral-embed`                             |
| Voxtral-batch    | `voxtral-mini-latest` (audiotranscriptie)   |
| Voxtral-realtime | `voxtral-mini-transcribe-realtime-2602`     |

## Aan de slag

<Steps>
  <Step title="Haal je API-sleutel op">
    Maak een API-sleutel aan in de [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Of geef de sleutel direct mee:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Stel een standaardmodel in">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Ingebouwde LLM-catalogus

OpenClaw levert momenteel deze gebundelde Mistral-catalogus:

| Modelref                         | Invoer      | Context | Max. uitvoer | Opmerkingen                                                     |
| -------------------------------- | ----------- | ------- | ------------ | --------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, beeld | 262,144 | 16,384       | Standaardmodel                                                  |
| `mistral/mistral-medium-2508`    | tekst, beeld | 262,144 | 8,192        | Mistral Medium 3.1                                              |
| `mistral/mistral-small-latest`   | tekst, beeld | 128,000 | 16,384       | Mistral Small 4; instelbare redenatie via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | tekst, beeld | 128,000 | 32,768       | Pixtral                                                         |
| `mistral/codestral-latest`       | tekst       | 256,000 | 4,096        | Coderen                                                         |
| `mistral/devstral-medium-latest` | tekst       | 262,144 | 32,768       | Devstral 2                                                      |
| `mistral/magistral-small`        | tekst       | 128,000 | 40,000       | Redeneren ingeschakeld                                          |

## Audiotranscriptie (Voxtral)

Gebruik Voxtral voor batchgewijze audiotranscriptie via de pijplijn voor
mediabegrip.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Het pad voor mediatranscriptie gebruikt `/v1/audio/transcriptions`. Het standaardaudiomodel voor Mistral is `voxtral-mini-latest`.
</Tip>

## Streaming-STT voor Voice Call

De gebundelde `mistral`-Plugin registreert Voxtral Realtime als streaming-STT-provider voor Voice Call.

| Instelling    | Configuratiepad                                                       | Standaard                               |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| API-sleutel   | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Valt terug op `MISTRAL_API_KEY`         |
| Model         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codering      | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Samplefrequentie | `...mistral.sampleRate`                                             | `8000`                                  |
| Doelvertraging | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw stelt Mistral realtime-STT standaard in op `pcm_mulaw` bij 8 kHz, zodat Voice Call
Twilio-mediaframes direct kan doorsturen. Gebruik `encoding: "pcm_s16le"` en een
overeenkomende `sampleRate` alleen als je upstream-stream al ruwe PCM is.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Instelbare redenatie (mistral-small-latest)">
    `mistral/mistral-small-latest` verwijst naar Mistral Small 4 en ondersteunt [instelbare redenatie](https://docs.mistral.ai/capabilities/reasoning/adjustable) op de Chat Completions-API via `reasoning_effort` (`none` minimaliseert extra denkstappen in de uitvoer; `high` toont volledige denksporen vóór het uiteindelijke antwoord).

    OpenClaw koppelt het **thinking**-niveau van de sessie aan de API van Mistral:

    | OpenClaw-thinkingniveau                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Andere gebundelde Mistral-catalogusmodellen gebruiken deze parameter niet. Blijf `magistral-*`-modellen gebruiken wanneer je het native reasoning-first-gedrag van Mistral wilt.
    </Note>

  </Accordion>

  <Accordion title="Geheugenembeddings">
    Mistral kan geheugenembeddings leveren via `/v1/embeddings` (standaardmodel: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth en basis-URL">
    - Mistral-auth gebruikt `MISTRAL_API_KEY` (Bearer-header).
    - De basis-URL van de provider is standaard `https://api.mistral.ai/v1` en accepteert de standaard OpenAI-compatibele aanvraagvorm voor chat-completions.
    - Het standaardmodel voor onboarding is `mistral/mistral-large-latest`.
    - Overschrijf de basis-URL onder `models.providers.mistral.baseUrl` alleen wanneer Mistral expliciet een regionale endpoint publiceert die je nodig hebt.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Mediabegrip" href="/nl/nodes/media-understanding" icon="microphone">
    Instelling van audiotranscriptie en providerselectie.
  </Card>
</CardGroup>
