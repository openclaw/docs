---
read_when:
    - Sie möchten Deepgram Speech-to-Text für Audioanhänge.
    - Sie möchten Deepgram-Streaming-Transkription für Voice Call.
    - Sie benötigen ein schnelles Deepgram-Konfigurationsbeispiel.
summary: Deepgram-Transkription für eingehende Sprachnotizen
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T06:33:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddc55436ebae295db9bd979765fbccab3ba7f25a6f5354a4e7964d151faffa22
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Audiotranskription)

Deepgram ist eine Speech-to-Text-API. In OpenClaw wird sie für die Transkription eingehender
Audio-/Sprachnotizen über `tools.media.audio` und für Streaming-STT in Voice Call
über `plugins.entries.voice-call.config.streaming` verwendet.

Für Batch-Transkription lädt OpenClaw die vollständige Audiodatei zu Deepgram
hoch und injiziert das Transkript in die Antwort-Pipeline (`{{Transcript}}` +
Block `[Audio]`). Für Voice-Call-Streaming leitet OpenClaw Live-G.711-
u-law-Frames über den WebSocket-Endpunkt `listen` von Deepgram weiter und gibt partielle oder
finale Transkripte aus, sobald Deepgram sie zurückliefert.

| Detail        | Wert                                                       |
| ------------- | ---------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                       |
| Doku          | [developers.deepgram.com](https://developers.deepgram.com) |
| Auth          | `DEEPGRAM_API_KEY`                                         |
| Standardmodell | `nova-3`                                                  |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel setzen">
    Fügen Sie Ihren Deepgram-API-Schlüssel zur Umgebung hinzu:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Audio-Provider aktivieren">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Eine Sprachnotiz senden">
    Senden Sie eine Audionachricht über einen beliebigen verbundenen Kanal. OpenClaw transkribiert sie
    über Deepgram und injiziert das Transkript in die Antwort-Pipeline.
  </Step>
</Steps>

## Konfigurationsoptionen

| Option            | Pfad                                                         | Beschreibung                         |
| ----------------- | ------------------------------------------------------------ | ------------------------------------ |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram-Modell-ID (Standard: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Sprachhinweis (optional)             |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Spracherkennung aktivieren (optional) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Zeichensetzung aktivieren (optional) |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Smart Formatting aktivieren (optional) |

<Tabs>
  <Tab title="Mit Sprachhinweis">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Mit Deepgram-Optionen">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice-Call-Streaming-STT

Das gebündelte Plugin `deepgram` registriert außerdem einen Realtime-Transkriptions-Provider
für das Voice-Call-Plugin.

| Einstellung      | Konfigurationspfad                                                   | Standard                           |
| ---------------- | -------------------------------------------------------------------- | ---------------------------------- |
| API-Schlüssel    | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Fällt auf `DEEPGRAM_API_KEY` zurück |
| Modell           | `...deepgram.model`                                                  | `nova-3`                           |
| Sprache          | `...deepgram.language`                                               | (nicht gesetzt)                    |
| Kodierung        | `...deepgram.encoding`                                               | `mulaw`                            |
| Abtastrate       | `...deepgram.sampleRate`                                             | `8000`                             |
| Endpointing      | `...deepgram.endpointingMs`                                          | `800`                              |
| Zwischenergebnisse | `...deepgram.interimResults`                                      | `true`                             |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call empfängt Telefonie-Audio als 8-kHz-G.711-u-law. Der Deepgram-
Streaming-Provider verwendet standardmäßig `encoding: "mulaw"` und `sampleRate: 8000`, sodass
Twilio-Media-Frames direkt weitergeleitet werden können.
</Note>

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Die Authentifizierung folgt der Standardreihenfolge für Provider-Authentifizierung. `DEEPGRAM_API_KEY` ist
    der einfachste Weg.
  </Accordion>
  <Accordion title="Proxy und benutzerdefinierte Endpunkte">
    Überschreiben Sie Endpunkte oder Header mit `tools.media.audio.baseUrl` und
    `tools.media.audio.headers`, wenn Sie einen Proxy verwenden.
  </Accordion>
  <Accordion title="Ausgabeverhalten">
    Die Ausgabe folgt denselben Audioregeln wie bei anderen Providern (Größenlimits, Timeouts,
    Transkriptinjektion).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Media-Tools" href="/tools/media" icon="photo-film">
    Übersicht über die Pipeline für Audio-, Bild- und Videoverarbeitung.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich Einstellungen für Media-Tools.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Schritte zum Debuggen.
  </Card>
  <Card title="FAQ" href="/de/help/faq" icon="circle-question">
    Häufig gestellte Fragen zur Einrichtung von OpenClaw.
  </Card>
</CardGroup>
