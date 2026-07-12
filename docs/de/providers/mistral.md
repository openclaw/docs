---
read_when:
    - Sie möchten Mistral-Modelle in OpenClaw verwenden
    - Sie möchten die Voxtral-Echtzeittranskription für Sprachanrufe.
    - Sie benötigen das Onboarding für den Mistral-API-Schlüssel und Modellreferenzen
summary: Mistral-Modelle und Voxtral-Transkription mit OpenClaw verwenden
title: Mistral
x-i18n:
    generated_at: "2026-07-12T15:54:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Das gebündelte `mistral`-Plugin registriert vier Verträge: Chat Completions, Medienverständnis (Voxtral-Batch-Transkription), Echtzeit-STT für Voice Call (Voxtral Realtime) und Speicher-Embeddings (`mistral-embed`).

| Eigenschaft      | Wert                                        |
| ---------------- | ------------------------------------------- |
| Provider-ID      | `mistral`                                   |
| Plugin           | gebündelt, standardmäßig aktiviert          |
| Auth-Umgebungsvariable | `MISTRAL_API_KEY`                     |
| Onboarding-Flag  | `--auth-choice mistral-api-key`             |
| Direktes CLI-Flag | `--mistral-api-key <key>`                  |
| API              | OpenAI-kompatibel (`openai-completions`)    |
| Basis-URL        | `https://api.mistral.ai/v1`                 |
| Standardmodell   | `mistral/mistral-large-latest`              |
| Embedding-Modell | `mistral-embed`                             |
| Voxtral-Batch    | `voxtral-mini-latest` (Audiotranskription)  |
| Voxtral-Echtzeit | `voxtral-mini-transcribe-realtime-2602`     |

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
  <Step title="Verfügbarkeit des Modells überprüfen">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Integrierter LLM-Katalog

| Modellreferenz                   | Eingabe     | Kontext | Maximale Ausgabe | Hinweise                                              |
| -------------------------------- | ----------- | ------- | ---------------- | ----------------------------------------------------- |
| `mistral/mistral-large-latest`   | Text, Bild  | 262,144 | 16,384           | Standardmodell                                        |
| `mistral/mistral-medium-2508`    | Text, Bild  | 262,144 | 8,192            | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`     | Text, Bild  | 262,144 | 8,192            | Mistral Medium 3.5; anpassbares Reasoning             |
| `mistral/mistral-small-latest`   | Text, Bild  | 262,144 | 16,384           | Neueste Version von Mistral Small 4; anpassbarer `reasoning_effort` |
| `mistral/mistral-small-2603`     | Text, Bild  | 262,144 | 16,384           | Festgelegte Version von Mistral Small 4; anpassbarer `reasoning_effort` |
| `mistral/pixtral-large-latest`   | Text, Bild  | 128,000 | 32,768           | Pixtral                                               |
| `mistral/codestral-latest`       | Text        | 256,000 | 4,096            | Programmierung                                        |
| `mistral/devstral-medium-latest` | Text        | 262,144 | 32,768           | Devstral 2                                            |
| `mistral/magistral-small`        | Text        | 128,000 | 40,000           | Reasoning-fähig                                       |

Prüfen Sie vor einer Konfigurationsänderung den entsprechenden Eintrag im gebündelten Katalog:

```bash
openclaw models list --all --provider mistral --plain
```

Führen Sie einen Smoke-Test für ein Modell aus, ohne den Gateway zu starten:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Antworte exakt mit: mistral-ok" \
  --json
```

## Audiotranskription (Voxtral)

Verwenden Sie Voxtral für die Batch-Audiotranskription über die Pipeline für Medienverständnis:

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
Der Medien-Transkriptionspfad verwendet `/v1/audio/transcriptions`. Das standardmäßige Audiomodell für Mistral ist `voxtral-mini-latest`.
</Tip>

## Streaming-STT für Voice Call

Das gebündelte `mistral`-Plugin registriert Voxtral Realtime als Streaming-STT-Provider für Voice Call.

| Einstellung      | Konfigurationspfad                                                    | Standardwert                            |
| ---------------- | --------------------------------------------------------------------- | --------------------------------------- |
| API-Schlüssel    | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Fällt auf `MISTRAL_API_KEY` zurück      |
| Modell           | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Kodierung        | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Abtastrate       | `...mistral.sampleRate`                                                | `8000`                                  |
| Zielverzögerung  | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw verwendet für Mistral-Echtzeit-STT standardmäßig `pcm_mulaw` bei 8 kHz, sodass Voice Call Twilio-Medienframes direkt weiterleiten kann. Verwenden Sie `encoding: "pcm_s16le"` und eine passende `sampleRate` nur, wenn Ihr vorgelagerter Stream bereits aus rohem PCM besteht.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Anpassbares Reasoning">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` und `mistral/mistral-medium-3-5` unterstützen über `reasoning_effort` [anpassbares Reasoning](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) in der Chat-Completions-API (`none` minimiert zusätzliches Denken in der Ausgabe; `high` zeigt vollständige Denkspuren vor der endgültigen Antwort).

    OpenClaw ordnet die **Thinking**-Stufe der Sitzung der Mistral-API zu:

    | OpenClaw-Thinking-Stufe                                               | Mistral `reasoning_effort` |
    | --------------------------------------------------------------------- | -------------------------- |
    | **aus** / **minimal**                                                 | `none`                     |
    | **niedrig** / **mittel** / **hoch** / **xhigh** / **adaptiv** / **maximal** | `high`               |

    <Warning>
    Vermeiden Sie es, den Reasoning-Modus von Medium 3.5 mit `temperature: 0` zu kombinieren. Berichten zufolge lehnt die Mistral-HTTP-API `reasoning_effort="high"` zusammen mit `temperature: 0` mit einer 400-Antwort ab. Lassen Sie die Temperatur nicht gesetzt oder deaktivieren bzw. minimieren Sie Thinking, sodass OpenClaw `reasoning_effort: "none"` sendet, bevor Sie eine niedrige Temperatur festlegen.
    </Warning>

    Beispiel einer modellspezifischen Konfiguration für das Reasoning von Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Andere gebündelte Modelle des Mistral-Katalogs verwenden diesen Parameter nicht. Verwenden Sie weiterhin `magistral-*`-Modelle, wenn Sie das native, auf Reasoning ausgerichtete Verhalten von Mistral wünschen.
    </Note>

  </Accordion>

  <Accordion title="Speicher-Embeddings">
    Mistral kann Speicher-Embeddings über `/v1/embeddings` bereitstellen (Standardmodell: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Authentifizierung und Basis-URL">
    - Die Mistral-Authentifizierung verwendet `MISTRAL_API_KEY` (Bearer-Header).
    - Die Provider-Basis-URL ist standardmäßig `https://api.mistral.ai/v1` und akzeptiert das standardmäßige OpenAI-kompatible Anfrageformat für Chat Completions.
    - Das Standardmodell für das Onboarding ist `mistral/mistral-large-latest`.
    - Überschreiben Sie die Basis-URL unter `models.providers.mistral.baseUrl` nur, wenn Mistral ausdrücklich einen benötigten regionalen Endpunkt veröffentlicht.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Medienverständnis" href="/de/nodes/media-understanding" icon="microphone">
    Einrichtung der Audiotranskription und Provider-Auswahl.
  </Card>
</CardGroup>
