---
read_when:
    - Sie möchten Mistral-Modelle in OpenClaw verwenden
    - Sie möchten Voxtral-Echtzeittranskription für Sprachanrufe
    - Sie benötigen Onboarding für Mistral-API-Schlüssel und Modellreferenzen
summary: Mistral-Modelle und Voxtral-Transkription mit OpenClaw verwenden
title: Mistral
x-i18n:
    generated_at: "2026-05-06T07:01:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw enthält ein gebündeltes Mistral-Plugin, das vier Verträge registriert: Chat Completions, Medienverständnis (Voxtral-Batch-Transkription), Echtzeit-STT für Voice Call (Voxtral Realtime) und Memory Embeddings (`mistral-embed`).

| Eigenschaft             | Wert                                        |
| ----------------------- | ------------------------------------------- |
| Provider-ID             | `mistral`                                   |
| Plugin                  | gebündelt, `enabledByDefault: true`         |
| Auth-Umgebungsvariable  | `MISTRAL_API_KEY`                           |
| Onboarding-Flag         | `--auth-choice mistral-api-key`             |
| Direktes CLI-Flag       | `--mistral-api-key <key>`                   |
| API                     | OpenAI-kompatibel (`openai-completions`)    |
| Basis-URL               | `https://api.mistral.ai/v1`                 |
| Standardmodell          | `mistral/mistral-large-latest`              |
| Embedding-Modell        | `mistral-embed`                             |
| Voxtral-Batch           | `voxtral-mini-latest` (Audiotranskription)  |
| Voxtral Realtime        | `voxtral-mini-transcribe-realtime-2602`     |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel in der [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Oder übergeben Sie den Schlüssel direkt:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Standardmodell festlegen">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verfügbarkeit des Modells prüfen">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Integrierter LLM-Katalog

OpenClaw liefert derzeit diesen gebündelten Mistral-Katalog aus:

| Modellreferenz                  | Eingabe     | Kontext | Max. Ausgabe | Hinweise                                                         |
| -------------------------------- | ----------- | ------- | ------------ | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | Text, Bild  | 262,144 | 16,384       | Standardmodell                                                   |
| `mistral/mistral-medium-2508`    | Text, Bild  | 262,144 | 8,192        | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | Text, Bild  | 128,000 | 16,384       | Mistral Small 4; anpassbares Reasoning über API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | Text, Bild  | 128,000 | 32,768       | Pixtral                                                          |
| `mistral/codestral-latest`       | Text        | 256,000 | 4,096        | Coding                                                           |
| `mistral/devstral-medium-latest` | Text        | 262,144 | 32,768       | Devstral 2                                                       |
| `mistral/magistral-small`        | Text        | 128,000 | 40,000       | Reasoning aktiviert                                              |

## Audiotranskription (Voxtral)

Verwenden Sie Voxtral für Batch-Audiotranskription über die Pipeline für
Medienverständnis.

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

Das gebündelte `mistral`-Plugin registriert Voxtral Realtime als Streaming-STT-Provider
für Voice Call.

| Einstellung       | Konfigurationspfad                                                   | Standard                                |
| ----------------- | -------------------------------------------------------------------- | --------------------------------------- |
| API-Schlüssel     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Fällt auf `MISTRAL_API_KEY` zurück      |
| Modell            | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602` |
| Encoding          | `...mistral.encoding`                                                | `pcm_mulaw`                             |
| Sample-Rate       | `...mistral.sampleRate`                                              | `8000`                                  |
| Zielverzögerung   | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

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
OpenClaw setzt Mistral-Echtzeit-STT standardmäßig auf `pcm_mulaw` bei 8 kHz, damit Voice Call
Twilio-Medienframes direkt weiterleiten kann. Verwenden Sie `encoding: "pcm_s16le"` und eine
passende `sampleRate` nur, wenn Ihr Upstream-Stream bereits rohes PCM ist.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Anpassbares Reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` entspricht Mistral Small 4 und unterstützt [anpassbares Reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) in der Chat Completions API über `reasoning_effort` (`none` minimiert zusätzliches Denken in der Ausgabe; `high` zeigt vollständige Denkspuren vor der finalen Antwort an).

    OpenClaw ordnet die **thinking**-Stufe der Sitzung der API von Mistral zu:

    | OpenClaw-thinking-Stufe                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Andere gebündelte Mistral-Katalogmodelle verwenden diesen Parameter nicht. Verwenden Sie weiterhin `magistral-*`-Modelle, wenn Sie das native Reasoning-first-Verhalten von Mistral möchten.
    </Note>

  </Accordion>

  <Accordion title="Memory Embeddings">
    Mistral kann Memory Embeddings über `/v1/embeddings` bereitstellen (Standardmodell: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth und Basis-URL">
    - Mistral-Auth verwendet `MISTRAL_API_KEY` (Bearer-Header).
    - Die Provider-Basis-URL ist standardmäßig `https://api.mistral.ai/v1` und akzeptiert das standardmäßige OpenAI-kompatible Chat-Completions-Anfrageformat.
    - Das Standardmodell für Onboarding ist `mistral/mistral-large-latest`.
    - Überschreiben Sie die Basis-URL unter `models.providers.mistral.baseUrl` nur, wenn Mistral ausdrücklich einen regionalen Endpunkt veröffentlicht, den Sie benötigen.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Medienverständnis" href="/de/nodes/media-understanding" icon="microphone">
    Einrichtung der Audiotranskription und Provider-Auswahl.
  </Card>
</CardGroup>
