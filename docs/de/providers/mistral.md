---
read_when:
    - Sie möchten Mistral-Modelle in OpenClaw verwenden
    - Sie möchten Voxtral-Echtzeittranskription für Sprachanrufe
    - Sie benötigen das Onboarding für Mistral-API-Schlüssel und Modellreferenzen
summary: Mistral-Modelle und Voxtral-Transkription mit OpenClaw verwenden
title: Mistral
x-i18n:
    generated_at: "2026-05-10T19:49:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw enthält ein gebündeltes Mistral-Plugin, das vier Verträge registriert: Chat-Vervollständigungen, Medienverständnis (Voxtral-Batch-Transkription), Echtzeit-STT für Voice Call (Voxtral Realtime) und Memory-Embeddings (`mistral-embed`).

| Eigenschaft      | Wert                                        |
| ---------------- | ------------------------------------------- |
| Provider-ID      | `mistral`                                   |
| Plugin           | gebündelt, `enabledByDefault: true`         |
| Auth-Env-Var     | `MISTRAL_API_KEY`                           |
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
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Integrierter LLM-Katalog

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
ist das aktuelle kombinierte Medium-Modell im gebündelten Katalog: 128B dichte Gewichte,
Text- und Bildeingabe, 256K Kontext, Function Calling, strukturierte Ausgabe, Coding
und anpassbares Reasoning über die Chat Completions API. Verwenden Sie
`mistral/mistral-medium-3-5`, wenn Sie Mistrals neueres vereinheitlichtes
Agentic-/Coding-Modell statt des Standardmodells `mistral/mistral-large-latest` möchten.

OpenClaw liefert derzeit diesen gebündelten Mistral-Katalog aus:

| Modellreferenz                  | Eingabe     | Kontext | Maximale Ausgabe | Hinweise                                                         |
| -------------------------------- | ----------- | ------- | ---------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | Text, Bild  | 262,144 | 16,384           | Standardmodell                                                   |
| `mistral/mistral-medium-2508`    | Text, Bild  | 262,144 | 8,192            | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | Text, Bild  | 262,144 | 8,192            | Mistral Medium 3.5; anpassbares Reasoning                        |
| `mistral/mistral-small-latest`   | Text, Bild  | 128,000 | 16,384           | Mistral Small 4; anpassbares Reasoning über API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | Text, Bild  | 128,000 | 32,768           | Pixtral                                                          |
| `mistral/codestral-latest`       | Text        | 256,000 | 4,096            | Coding                                                           |
| `mistral/devstral-medium-latest` | Text        | 262,144 | 32,768           | Devstral 2                                                       |
| `mistral/magistral-small`        | Text        | 128,000 | 40,000           | Reasoning-fähig                                                  |

Führen Sie nach dem Onboarding einen Smoke-Test für Medium 3.5 aus, ohne den Gateway zu starten:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

So durchsuchen Sie die gebündelte Katalogzeile, bevor Sie die Konfiguration ändern:

```bash
openclaw models list --all --provider mistral --plain
```

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

| Einstellung    | Konfigurationspfad                                                  | Standardwert                            |
| -------------- | ------------------------------------------------------------------- | --------------------------------------- |
| API-Schlüssel  | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Fällt auf `MISTRAL_API_KEY` zurück      |
| Modell         | `...mistral.model`                                                  | `voxtral-mini-transcribe-realtime-2602` |
| Encoding       | `...mistral.encoding`                                               | `pcm_mulaw`                             |
| Abtastrate     | `...mistral.sampleRate`                                             | `8000`                                  |
| Zielverzögerung | `...mistral.targetStreamingDelayMs`                                | `800`                                   |

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
  <Accordion title="Anpassbares Reasoning">
    `mistral/mistral-small-latest` (Mistral Small 4) und `mistral/mistral-medium-3-5` unterstützen [anpassbares Reasoning](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) in der Chat Completions API über `reasoning_effort` (`none` minimiert zusätzliches Denken in der Ausgabe; `high` zeigt vollständige Denkspuren vor der finalen Antwort). Mistral empfiehlt `reasoning_effort="high"` für agentische und Code-Anwendungsfälle mit Medium 3.5.

    OpenClaw ordnet die **thinking**-Stufe der Sitzung der Mistral-API zu:

    | OpenClaw-thinking-Stufe                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    Kombinieren Sie den Reasoning-Modus von Medium 3.5 nicht mit `temperature: 0`. Die Mistral-
    HTTP-API weist `reasoning_effort="high"` plus `temperature: 0` mit einer 400-
    Antwort zurück. Lassen Sie temperature unset, damit Mistral seinen Standardwert verwendet, oder folgen Sie
    den [empfohlenen Einstellungen für Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    und verwenden Sie `temperature: 0.7` für hohes Reasoning. Für deterministische direkte
    Antworten deaktivieren Sie thinking oder setzen es auf minimal, damit OpenClaw
    `reasoning_effort: "none"` sendet, bevor Sie temperature senken.
    </Warning>

    Beispiel für eine modellbezogene Konfiguration für Reasoning mit Medium 3.5:

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
    Andere gebündelte Mistral-Katalogmodelle verwenden diesen Parameter nicht. Verwenden Sie weiterhin `magistral-*`-Modelle, wenn Sie Mistrals natives Reasoning-first-Verhalten möchten.
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

  <Accordion title="Auth und Basis-URL">
    - Mistral-Auth verwendet `MISTRAL_API_KEY` (Bearer-Header).
    - Die Provider-Basis-URL ist standardmäßig `https://api.mistral.ai/v1` und akzeptiert die standardmäßige OpenAI-kompatible Request-Struktur für Chat-Vervollständigungen.
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
