---
read_when:
    - Du möchtest Mistral-Modelle in OpenClaw verwenden
    - Du möchtest Voxtral-Realtime-Transkription für Voice Call verwenden
    - Du brauchst Onboarding für den Mistral-API-Key und Modell-Refs
summary: Mistral-Modelle und Voxtral-Transkription mit OpenClaw verwenden
title: Mistral
x-i18n:
    generated_at: "2026-04-23T06:34:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8aec3c47fee12588b28ea2b652b89f0ff136399d25ca47174d7cb6e7b5d5d97f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw unterstützt Mistral sowohl für das Routing von Text-/Bildmodellen (`mistral/...`) als auch
für Audiotranskription über Voxtral im Medienverständnis.
Mistral kann auch für Memory-Embeddings verwendet werden (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Erste Schritte

<Steps>
  <Step title="API-Key abrufen">
    Erstelle einen API-Key in der [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Oder den Schlüssel direkt übergeben:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Ein Standardmodell festlegen">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Integrierter LLM-Katalog

OpenClaw liefert derzeit diesen gebündelten Mistral-Katalog aus:

| Modell-Ref                       | Eingabe     | Kontext | Max. Ausgabe | Hinweise                                                         |
| -------------------------------- | ----------- | ------- | ------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | Text, Bild  | 262,144 | 16,384        | Standardmodell                                                   |
| `mistral/mistral-medium-2508`    | Text, Bild  | 262,144 | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | Text, Bild  | 128,000 | 16,384        | Mistral Small 4; anpassbares Reasoning über API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | Text, Bild  | 128,000 | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`       | Text        | 256,000 | 4,096         | Coding                                                           |
| `mistral/devstral-medium-latest` | Text        | 262,144 | 32,768        | Devstral 2                                                       |
| `mistral/magistral-small`        | Text        | 128,000 | 40,000        | Reasoning aktiviert                                              |

## Audiotranskription (Voxtral)

Verwende Voxtral für Batch-Audiotranskription über die Pipeline für Medienverständnis.

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
Der Medien-Transkriptionspfad verwendet `/v1/audio/transcriptions`. Das Standard-Audiomodell für Mistral ist `voxtral-mini-latest`.
</Tip>

## Streaming-STT für Voice Call

Das gebündelte Plugin `mistral` registriert Voxtral Realtime als Streaming-STT-Provider
für Voice Call.

| Einstellung   | Konfigurationspfad                                                       | Standard                                  |
| ------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| API-Key       | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`   | Fällt auf `MISTRAL_API_KEY` zurück        |
| Modell        | `...mistral.model`                                                       | `voxtral-mini-transcribe-realtime-2602`   |
| Encoding      | `...mistral.encoding`                                                    | `pcm_mulaw`                               |
| Samplerate    | `...mistral.sampleRate`                                                  | `8000`                                    |
| Zielverzögerung | `...mistral.targetStreamingDelayMs`                                    | `800`                                     |

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
OpenClaw verwendet für Mistral-Realtime-STT standardmäßig `pcm_mulaw` bei 8 kHz, sodass Voice Call
Twilio-Medienframes direkt weiterleiten kann. Verwende `encoding: "pcm_s16le"` und eine
passende `sampleRate` nur, wenn dein Upstream-Stream bereits rohes PCM ist.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Anpassbares Reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` wird auf Mistral Small 4 abgebildet und unterstützt [anpassbares Reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) auf der Chat-Completions-API über `reasoning_effort` (`none` minimiert zusätzliches Thinking in der Ausgabe; `high` zeigt vollständige Thinking-Traces vor der endgültigen Antwort an).

    OpenClaw bildet die Session-**Thinking**-Stufe auf die Mistral-API ab:

    | OpenClaw-Thinking-Stufe                         | Mistral `reasoning_effort` |
    | ----------------------------------------------- | -------------------------- |
    | **off** / **minimal**                           | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Andere gebündelte Modelle im Mistral-Katalog verwenden diesen Parameter nicht. Verwende weiterhin Modelle `magistral-*`, wenn du das native, reasoning-first Verhalten von Mistral möchtest.
    </Note>

  </Accordion>

  <Accordion title="Memory-Embeddings">
    Mistral kann Memory-Embeddings über `/v1/embeddings` bereitstellen (Standardmodell: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth und Base-URL">
    - Mistral-Auth verwendet `MISTRAL_API_KEY`.
    - Die Base-URL des Providers ist standardmäßig `https://api.mistral.ai/v1`.
    - Das Standardmodell für Onboarding ist `mistral/mistral-large-latest`.
    - z.ai verwendet Bearer-Auth mit deinem API-Key.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Medienverständnis" href="/tools/media-understanding" icon="microphone">
    Einrichtung der Audiotranskription und Auswahl des Providers.
  </Card>
</CardGroup>
