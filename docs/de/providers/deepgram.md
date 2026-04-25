---
read_when:
    - Sie möchten Deepgram Speech-to-Text für Audioanhänge.
    - Sie möchten Deepgram-Streaming-Transkription für Voice Call.
    - Sie benötigen ein kurzes Deepgram-Konfigurationsbeispiel.
summary: Deepgram-Transkription für eingehende Sprachnachrichten
title: Deepgram
x-i18n:
    generated_at: "2026-04-25T13:54:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
---

Deepgram ist eine Speech-to-Text-API. In OpenClaw wird sie für die Transkription eingehender
Audio-/Sprachnachrichten über `tools.media.audio` und für Streaming-STT in Voice Call
über `plugins.entries.voice-call.config.streaming` verwendet.

Für Batch-Transkription lädt OpenClaw die vollständige Audiodatei zu Deepgram hoch
und fügt das Transkript in die Antwortpipeline ein (`{{Transcript}}` +
`[Audio]`-Block). Für Streaming in Voice Call leitet OpenClaw Live-G.711-
u-law-Frames über Deepgrams WebSocket-Endpunkt `listen` weiter und gibt partielle oder
finale Transkripte aus, sobald Deepgram sie zurückliefert.

| Detail        | Wert                                                       |
| ------------- | ---------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                       |
| Dokumentation | [developers.deepgram.com](https://developers.deepgram.com) |
| Authentifizierung | `DEEPGRAM_API_KEY`                                     |
| Standardmodell | `nova-3`                                                  |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Fügen Sie Ihren Deepgram-API-Schlüssel zur Umgebung hinzu:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Audioprovier aktivieren">
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
  <Step title="Sprachnachricht senden">
    Senden Sie eine Audionachricht über einen beliebigen verbundenen Kanal. OpenClaw transkribiert sie
    über Deepgram und fügt das Transkript in die Antwortpipeline ein.
  </Step>
</Steps>

## Konfigurationsoptionen

| Option            | Pfad                                                         | Beschreibung                          |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram-Modell-ID (Standard: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Sprachhinweis (optional)              |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Spracherkennung aktivieren (optional) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Zeichensetzung aktivieren (optional)  |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Intelligente Formatierung aktivieren (optional) |

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

## Streaming-STT für Voice Call

Das gebündelte `deepgram`-Plugin registriert auch einen Echtzeit-Transkriptionsprovider
für das Voice Call-Plugin.

| Einstellung      | Konfigurationspfad                                                    | Standard                         |
| ---------------- | --------------------------------------------------------------------- | -------------------------------- |
| API-Schlüssel    | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Fällt auf `DEEPGRAM_API_KEY` zurück |
| Modell           | `...deepgram.model`                                                   | `nova-3`                         |
| Sprache          | `...deepgram.language`                                                | (nicht gesetzt)                  |
| Kodierung        | `...deepgram.encoding`                                                | `mulaw`                          |
| Abtastrate       | `...deepgram.sampleRate`                                              | `8000`                           |
| Endpointing      | `...deepgram.endpointingMs`                                           | `800`                            |
| Zwischenergebnisse | `...deepgram.interimResults`                                        | `true`                           |

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
Twilio-Medienframes direkt weitergeleitet werden können.
</Note>

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Die Authentifizierung folgt der standardmäßigen Auth-Reihenfolge für Provider. `DEEPGRAM_API_KEY` ist
    der einfachste Weg.
  </Accordion>
  <Accordion title="Proxy und benutzerdefinierte Endpunkte">
    Überschreiben Sie Endpunkte oder Header mit `tools.media.audio.baseUrl` und
    `tools.media.audio.headers`, wenn Sie einen Proxy verwenden.
  </Accordion>
  <Accordion title="Ausgabeverhalten">
    Die Ausgabe folgt denselben Audioregeln wie bei anderen Providern (Größenlimits, Timeouts,
    Transkript-Einfügung).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Media-Tools" href="/de/tools/media-overview" icon="photo-film">
    Überblick über die Audio-, Bild- und Videoverarbeitungspipeline.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der Einstellungen für Media-Tools.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Schritte zur Fehlerbehebung.
  </Card>
  <Card title="FAQ" href="/de/help/faq" icon="circle-question">
    Häufig gestellte Fragen zur Einrichtung von OpenClaw.
  </Card>
</CardGroup>
