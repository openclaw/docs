---
read_when:
    - Sie möchten Mistral-Modelle in OpenClaw verwenden
    - Sie möchten Voxtral-Echtzeit-Transkription für Sprachanrufe
    - Sie benötigen Onboarding für den Mistral-API-Schlüssel und Modellreferenzen
summary: Mistral-Modelle und Voxtral-Transkription mit OpenClaw verwenden
title: Mistral
x-i18n:
    generated_at: "2026-04-30T07:11:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw unterstützt Mistral sowohl für das Routing von Text-/Bildmodellen (`mistral/...`) als auch für
Audiotranskription über Voxtral im Rahmen der Medienverständnisfunktion.
Mistral kann außerdem für Memory-Embeddings verwendet werden (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Authentifizierung: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Erste Schritte

<Steps>
  <Step title="Get your API key">
    Erstellen Sie einen API-Schlüssel in der [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Oder übergeben Sie den Schlüssel direkt:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Integrierter LLM-Katalog

OpenClaw liefert derzeit diesen gebündelten Mistral-Katalog aus:

| Modellreferenz                   | Eingabe     | Kontext | Maximale Ausgabe | Hinweise                                                         |
| -------------------------------- | ----------- | ------- | ---------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | Text, Bild  | 262,144 | 16,384           | Standardmodell                                                   |
| `mistral/mistral-medium-2508`    | Text, Bild  | 262,144 | 8,192            | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | Text, Bild  | 128,000 | 16,384           | Mistral Small 4; anpassbares Reasoning über API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | Text, Bild  | 128,000 | 32,768           | Pixtral                                                          |
| `mistral/codestral-latest`       | Text        | 256,000 | 4,096            | Programmierung                                                   |
| `mistral/devstral-medium-latest` | Text        | 262,144 | 32,768           | Devstral 2                                                       |
| `mistral/magistral-small`        | Text        | 128,000 | 40,000           | Reasoning-aktiviert                                              |

## Audiotranskription (Voxtral)

Verwenden Sie Voxtral für die Batch-Audiotranskription über die
Medienverständnis-Pipeline.

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
Der Pfad für die Medientranskription verwendet `/v1/audio/transcriptions`. Das Standard-Audiomodell für Mistral ist `voxtral-mini-latest`.
</Tip>

## Streaming-STT für Voice Call

Das gebündelte `mistral`-Plugin registriert Voxtral Realtime als Streaming-STT-Provider
für Voice Call.

| Einstellung  | Konfigurationspfad                                                  | Standard                                |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API-Schlüssel | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Fällt auf `MISTRAL_API_KEY` zurück      |
| Modell       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Encoding     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Abtastrate   | `...mistral.sampleRate`                                                | `8000`                                  |
| Zielverzögerung | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw setzt Mistral-Realtime-STT standardmäßig auf `pcm_mulaw` bei 8 kHz, damit Voice Call
Twilio-Medienframes direkt weiterleiten kann. Verwenden Sie `encoding: "pcm_s16le"` und eine
passende `sampleRate` nur, wenn Ihr Upstream-Stream bereits rohes PCM ist.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Adjustable reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` ist Mistral Small 4 zugeordnet und unterstützt [anpassbares Reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) in der Chat Completions API über `reasoning_effort` (`none` minimiert zusätzliches Denken in der Ausgabe; `high` zeigt vollständige Denkspuren vor der finalen Antwort an).

    OpenClaw ordnet die **thinking**-Stufe der Sitzung der Mistral-API zu:

    | OpenClaw-thinking-Stufe                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Andere gebündelte Modelle im Mistral-Katalog verwenden diesen Parameter nicht. Verwenden Sie weiterhin `magistral-*`-Modelle, wenn Sie Mistrals natives, Reasoning-zentriertes Verhalten wünschen.
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral kann Memory-Embeddings über `/v1/embeddings` bereitstellen (Standardmodell: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - Mistral-Authentifizierung verwendet `MISTRAL_API_KEY`.
    - Die Provider-Basis-URL ist standardmäßig `https://api.mistral.ai/v1`.
    - Das Standardmodell beim Onboarding ist `mistral/mistral-large-latest`.
    - Z.AI verwendet Bearer-Authentifizierung mit Ihrem API-Schlüssel.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Media understanding" href="/de/nodes/media-understanding" icon="microphone">
    Einrichtung der Audiotranskription und Provider-Auswahl.
  </Card>
</CardGroup>
