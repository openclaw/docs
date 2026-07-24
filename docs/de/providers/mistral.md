---
read_when:
    - Sie möchten Mistral-Modelle in OpenClaw verwenden
    - Sie möchten Voxtral-Echtzeittranskription für Sprachanrufe.
    - Sie benötigen das Onboarding für den Mistral-API-Schlüssel und Modellreferenzen
summary: Mistral-Modelle und Voxtral-Transkription mit OpenClaw verwenden
title: Mistral
x-i18n:
    generated_at: "2026-07-24T04:53:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 23f0ebb664a37cadefb65b7f531cecd3bdfaa4ff5426cb665e305f8f03f0b0ab
    source_path: providers/mistral.md
    workflow: 16
---

Das gebündelte Plugin `mistral` registriert vier Verträge: Chat-Vervollständigungen, Medienverständnis (Voxtral-Batch-Transkription), Echtzeit-STT für Voice Call (Voxtral Realtime) und Memory-Embeddings (`mistral-embed`).

| Eigenschaft       | Wert                                        |
| ----------------- | ------------------------------------------- |
| Provider-ID       | `mistral`                          |
| Plugin            | gebündelt, standardmäßig aktiviert          |
| Auth-Umgebungsvariable | `MISTRAL_API_KEY`                     |
| Onboarding-Flag   | `--auth-choice mistral-api-key`                          |
| Direktes CLI-Flag | `--mistral-api-key <key>`                          |
| API               | OpenAI-kompatibel (`openai-completions`)      |
| Basis-URL         | `https://api.mistral.ai/v1`                          |
| Standardmodell    | `mistral/mistral-large-latest`                          |
| Embedding-Modell  | `mistral-embed`                          |
| Voxtral-Batch     | `voxtral-mini-latest` (Audiotranskription)     |
| Voxtral-Echtzeit  | `voxtral-mini-transcribe-realtime-2602`                          |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie in der [Mistral Console](https://console.mistral.ai/) einen API-Schlüssel.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Alternativ können Sie den Schlüssel direkt übergeben:

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

| Modellreferenz                   | Eingabe     | Kontext | Max. Ausgabe | Hinweise                                              |
| -------------------------------- | ----------- | ------- | ------------ | ----------------------------------------------------- |
| `mistral/mistral-large-latest`               | Text, Bild  | 262,144 | 16,384       | Standardmodell                                        |
| `mistral/mistral-medium-2508`               | Text, Bild  | 262,144 | 8,192        | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`               | Text, Bild  | 262,144 | 8,192        | Mistral Medium 3.5; anpassbares Reasoning             |
| `mistral/mistral-small-latest`               | Text, Bild  | 262,144 | 16,384       | neuestes Mistral Small 4; anpassbares `reasoning_effort` |
| `mistral/mistral-small-2603`               | Text, Bild  | 262,144 | 16,384       | festgelegtes Mistral Small 4; anpassbares `reasoning_effort` |
| `mistral/pixtral-large-latest`               | Text, Bild  | 128,000 | 32,768       | Pixtral                                               |
| `mistral/codestral-latest`               | Text        | 256,000 | 4,096        | Programmierung                                        |
| `mistral/devstral-medium-latest`               | Text        | 262,144 | 32,768       | Devstral 2                                            |
| `mistral/magistral-small`               | Text        | 128,000 | 40,000       | Reasoning-fähig                                       |

Sehen Sie sich vor einer Konfigurationsänderung den Eintrag im gebündelten Katalog an:

```bash
openclaw models list --all --provider mistral --plain
```

Führen Sie einen Smoke-Test eines Modells durch, ohne den Gateway zu starten:

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
Der Pfad für die Medientranskription verwendet `/v1/audio/transcriptions`. Das Standard-Audiomodell für Mistral ist `voxtral-mini-latest`.
</Tip>

## Streaming-STT für Voice Call

Das gebündelte Plugin `mistral` registriert Voxtral Realtime als Streaming-STT-Provider für Voice Call.

| Einstellung     | Konfigurationspfad                                                    | Standardwert                            |
| --------------- | --------------------------------------------------------------------- | --------------------------------------- |
| API-Schlüssel   | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`                                                    | Fällt auf `MISTRAL_API_KEY` zurück     |
| Modell          | `...mistral.model`                                                    | `voxtral-mini-transcribe-realtime-2602`                      |
| Kodierung       | `...mistral.encoding`                                                    | `pcm_mulaw`                      |
| Abtastrate      | `...mistral.sampleRate`                                                    | `8000`                      |
| Zielverzögerung | `...mistral.targetStreamingDelayMs`                                                    | `800`                      |

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
OpenClaw verwendet für Mistral-Echtzeit-STT standardmäßig `pcm_mulaw` bei 8 kHz, damit Voice Call Twilio-Medienframes direkt weiterleiten kann. Verwenden Sie `encoding: "pcm_s16le"` und eine passende `sampleRate` nur, wenn Ihr vorgelagerter Stream bereits aus Roh-PCM besteht.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Anpassbares Reasoning">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` und `mistral/mistral-medium-3-5` unterstützen [anpassbares Reasoning](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) in der Chat-Completions-API über `reasoning_effort` (`none` minimiert zusätzliches Nachdenken in der Ausgabe; `high` zeigt vor der endgültigen Antwort vollständige Gedankenspuren an).

    OpenClaw ordnet die **Thinking**-Stufe der Sitzung der Mistral-API zu:

    | OpenClaw-Thinking-Stufe                                               | Mistral `reasoning_effort` |
    | --------------------------------------------------------------------- | --------------------------- |
    | **aus** / **minimal**                                                 | `none`          |
    | **niedrig** / **mittel** / **hoch** / **xhigh** / **adaptiv** / **max** | `high`        |

    <Warning>
    Vermeiden Sie es, den Reasoning-Modus von Medium 3.5 mit `temperature: 0` zu kombinieren; Berichten zufolge lehnt die Mistral-HTTP-API `reasoning_effort="high"` zusammen mit `temperature: 0` mit einer 400-Antwort ab. Lassen Sie die Temperatur ungesetzt oder deaktivieren beziehungsweise minimieren Sie Thinking, damit OpenClaw `reasoning_effort: "none"` sendet, bevor Sie eine niedrige Temperatur festlegen.
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
    Andere gebündelte Modelle im Mistral-Katalog verwenden diesen Parameter nicht. Verwenden Sie weiterhin `magistral-*`-Modelle, wenn Sie das native, auf Reasoning ausgerichtete Verhalten von Mistral wünschen.
    </Note>

  </Accordion>

  <Accordion title="Memory-Embeddings">
    Mistral kann Memory-Embeddings über `/v1/embeddings` bereitstellen (Standardmodell: `mistral-embed`):

    ```json5
    {
      memory: {
        search: { provider: "mistral" },
      },
    }
    ```

  </Accordion>

  <Accordion title="Authentifizierung und Basis-URL">
    - Die Mistral-Authentifizierung verwendet `MISTRAL_API_KEY` (Bearer-Header).
    - Die Basis-URL des Providers ist standardmäßig `https://api.mistral.ai/v1` und akzeptiert die standardmäßige OpenAI-kompatible Anfrageform für Chat-Vervollständigungen.
    - Das Standardmodell für das Onboarding ist `mistral/mistral-large-latest`.
    - Überschreiben Sie die Basis-URL unter `models.providers.mistral.baseUrl` nur, wenn Mistral ausdrücklich einen von Ihnen benötigten regionalen Endpunkt veröffentlicht.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern und Modellreferenzen sowie Konfiguration des Failover-Verhaltens.
  </Card>
  <Card title="Medienverständnis" href="/de/nodes/media-understanding" icon="microphone">
    Einrichtung der Audiotranskription und Auswahl des Providers.
  </Card>
</CardGroup>
