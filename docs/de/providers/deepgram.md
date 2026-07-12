---
read_when:
    - Sie möchten Deepgram Speech-to-Text für Audioanhänge verwenden
    - Sie möchten die Deepgram-Streaming-Transkription für Sprachanrufe.
    - Sie benötigen ein kurzes Deepgram-Konfigurationsbeispiel.
summary: Deepgram-Transkription für eingehende Sprachnachrichten
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T02:03:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram ist eine Speech-to-Text-API. OpenClaw verwendet sie für die Transkription eingehender Audio- und Sprachnachrichten über `tools.media.audio` sowie für das Streaming-STT von Voice Call über `plugins.entries.voice-call.config.streaming`.

Bei der Batch-Transkription wird die vollständige Audiodatei zu Deepgram hochgeladen und das Transkript in die Antwort-Pipeline eingefügt (`{{Transcript}}` + `[Audio]`-Block). Beim Voice-Call-Streaming werden G.711-u-law-Frames in Echtzeit über Deepgrams WebSocket-Endpunkt `listen` weitergeleitet und vorläufige sowie endgültige Transkripte ausgegeben, sobald Deepgram sie zurückgibt.

| Detail        | Wert                                                       |
| ------------- | ---------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                       |
| Dokumentation | [developers.deepgram.com](https://developers.deepgram.com) |
| Authentifizierung | `DEEPGRAM_API_KEY`                                     |
| Standardmodell | `nova-3`                                                  |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    ```bash
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
  <Step title="Sprachnachricht senden">
    Senden Sie eine Audionachricht über einen beliebigen verbundenen Kanal. OpenClaw transkribiert sie über Deepgram und fügt das Transkript in die Antwort-Pipeline ein.
  </Step>
</Steps>

## Konfigurationsoptionen

| Option     | Pfad                                  | Beschreibung                                  |
| ---------- | ------------------------------------- | --------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram-Modell-ID (Standard: `nova-3`)       |
| `language` | `tools.media.audio.models[].language` | Sprachhinweis (optional)                      |

`providerOptions.deepgram` führt zusätzliche Abfrageparameter direkt mit der Deepgram-Anfrage an `/listen` zusammen. Daher kann jeder von Deepgram unterstützte Parametername verwendet werden (beispielsweise `detect_language`, `punctuate`, `smart_format`):

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

Das mitgelieferte `deepgram`-Plugin registriert außerdem einen Echtzeit-Transkriptions-Provider für das Voice-Call-Plugin.

| Einstellung          | Konfigurationspfad                                                      | Standardwert                          |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| API-Schlüssel        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Fällt auf `DEEPGRAM_API_KEY` zurück   |
| Modell               | `...deepgram.model`                                                     | `nova-3`                              |
| Sprache              | `...deepgram.language`                                                  | (nicht festgelegt)                    |
| Kodierung            | `...deepgram.encoding`                                                  | `mulaw`                               |
| Abtastrate           | `...deepgram.sampleRate`                                                | `8000`                                |
| Endpunkterkennung    | `...deepgram.endpointingMs`                                             | `800`                                 |
| Zwischenergebnisse   | `...deepgram.interimResults`                                            | `true`                                |

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
Voice Call empfängt Telefonie-Audio als G.711 u-law mit 8 kHz. Der Deepgram-Streaming-Provider verwendet standardmäßig `encoding: "mulaw"` und `sampleRate: 8000`, sodass Twilio-Medienframes direkt weitergeleitet werden können.
</Note>

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Die Authentifizierung folgt der standardmäßigen Reihenfolge für die Provider-Authentifizierung. `DEEPGRAM_API_KEY` ist der einfachste Weg.
  </Accordion>
  <Accordion title="Proxy und benutzerdefinierte Endpunkte">
    Überschreiben Sie bei Verwendung eines Proxys Endpunkte oder Header mit `tools.media.audio.baseUrl` und `tools.media.audio.headers`.
  </Accordion>
  <Accordion title="Ausgabeverhalten">
    Die Ausgabe folgt denselben Audioregeln wie bei anderen Providern (Größenbeschränkungen, Zeitüberschreitungen, Einfügen des Transkripts).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Medienwerkzeuge" href="/de/tools/media-overview" icon="photo-film">
    Übersicht über die Pipeline zur Verarbeitung von Audio, Bildern und Videos.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der Einstellungen für Medienwerkzeuge.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Schritte zur Fehlerdiagnose.
  </Card>
  <Card title="Häufig gestellte Fragen" href="/de/help/faq" icon="circle-question">
    Häufig gestellte Fragen zur Einrichtung von OpenClaw.
  </Card>
</CardGroup>
