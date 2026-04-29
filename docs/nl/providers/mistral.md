---
read_when:
    - Je wilt Mistral-modellen gebruiken in OpenClaw
    - Je wilt realtime Voxtral-transcriptie voor Spraakoproep
    - Je hebt onboarding voor de Mistral-API-sleutel en modelreferenties nodig
summary: Gebruik Mistral-modellen en Voxtral-transcriptie met OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-29T23:11:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw ondersteunt Mistral voor zowel routering van tekst-/beeldmodellen (`mistral/...`) als
audiotranscriptie via Voxtral in media-inzicht.
Mistral kan ook worden gebruikt voor geheugen-embeddings (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Authenticatie: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Aan de slag

<Steps>
  <Step title="Haal je API-sleutel op">
    Maak een API-sleutel aan in de [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Of geef de sleutel direct door:

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

OpenClaw levert momenteel deze gebundelde Mistral-catalogus mee:

| Modelref                         | Invoer      | Context | Maximale uitvoer | Opmerkingen                                                      |
| -------------------------------- | ----------- | ------- | ---------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, beeld | 262,144 | 16,384           | Standaardmodel                                                   |
| `mistral/mistral-medium-2508`    | tekst, beeld | 262,144 | 8,192            | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | tekst, beeld | 128,000 | 16,384           | Mistral Small 4; aanpasbaar redeneren via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | tekst, beeld | 128,000 | 32,768           | Pixtral                                                          |
| `mistral/codestral-latest`       | tekst       | 256,000 | 4,096            | Coderen                                                          |
| `mistral/devstral-medium-latest` | tekst       | 262,144 | 32,768           | Devstral 2                                                       |
| `mistral/magistral-small`        | tekst       | 128,000 | 40,000           | Redeneren ingeschakeld                                           |

## Audiotranscriptie (Voxtral)

Gebruik Voxtral voor batchgewijze audiotranscriptie via de pipeline voor
media-inzicht.

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
Het pad voor mediatranscriptie gebruikt `/v1/audio/transcriptions`. Het standaard audiomodel voor Mistral is `voxtral-mini-latest`.
</Tip>

## Streaming-STT voor Voice Call

De gebundelde `mistral` Plugin registreert Voxtral Realtime als een
streaming-STT-provider voor Voice Call.

| Instelling   | Configuratiepad                                                       | Standaard                               |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API-sleutel  | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Valt terug op `MISTRAL_API_KEY`         |
| Model        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codering     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Samplefrequentie | `...mistral.sampleRate`                                           | `8000`                                  |
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
OpenClaw stelt Mistral realtime STT standaard in op `pcm_mulaw` bij 8 kHz, zodat Voice Call
Twilio-mediaframes direct kan doorsturen. Gebruik `encoding: "pcm_s16le"` en een
bijpassende `sampleRate` alleen als je upstream-stream al ruwe PCM is.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Aanpasbaar redeneren (mistral-small-latest)">
    `mistral/mistral-small-latest` wordt gekoppeld aan Mistral Small 4 en ondersteunt [aanpasbaar redeneren](https://docs.mistral.ai/capabilities/reasoning/adjustable) in de Chat Completions API via `reasoning_effort` (`none` minimaliseert extra nadenken in de uitvoer; `high` toont volledige denksporen vóór het definitieve antwoord).

    OpenClaw koppelt het **thinking**-niveau van de sessie aan de API van Mistral:

    | OpenClaw-thinkingniveau                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Andere gebundelde Mistral-catalogusmodellen gebruiken deze parameter niet. Blijf `magistral-*`-modellen gebruiken wanneer je Mistrals native gedrag voor redeneren eerst wilt.
    </Note>

  </Accordion>

  <Accordion title="Geheugen-embeddings">
    Mistral kan geheugen-embeddings leveren via `/v1/embeddings` (standaardmodel: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Authenticatie en basis-URL">
    - Mistral-authenticatie gebruikt `MISTRAL_API_KEY`.
    - De basis-URL van de provider is standaard `https://api.mistral.ai/v1`.
    - Het standaardmodel voor onboarding is `mistral/mistral-large-latest`.
    - Z.AI gebruikt Bearer-authenticatie met je API-sleutel.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Media-inzicht" href="/nl/nodes/media-understanding" icon="microphone">
    Instelling van audiotranscriptie en providerselectie.
  </Card>
</CardGroup>
