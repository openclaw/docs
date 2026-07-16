---
read_when:
    - Sie möchten Deepgram Speech-to-Text für Audioanhänge verwenden
    - Sie möchten die Deepgram-Streaming-Transkription für Voice Call verwenden
    - Sie benötigen ein kurzes Deepgram-Konfigurationsbeispiel
summary: Deepgram-Transkription für eingehende Sprachnachrichten
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T13:31:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram ist eine Speech-to-Text-API. OpenClaw verwendet sie für die Transkription eingehender Audio- und Sprachnachrichten
über `tools.media.audio` sowie für das Streaming-STT von Voice Call
über `plugins.entries.voice-call.config.streaming`.

Bei der Batch-Transkription wird die vollständige Audiodatei zu Deepgram hochgeladen und
das Transkript in die Antwortpipeline eingefügt (`{{Transcript}}`- + `[Audio]`-Block).
Das Voice-Call-Streaming leitet G.711-u-law-Frames in Echtzeit über Deepgrams
WebSocket-Endpunkt `listen` weiter und gibt vorläufige bzw. endgültige Transkripte aus, sobald Deepgram
sie zurückgibt.

| Detail        | Wert                                                       |
| ------------- | ---------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                       |
| Dokumentation | [developers.deepgram.com](https://developers.deepgram.com) |
| Authentifizierung | `DEEPGRAM_API_KEY`                                         |
| Standardmodell | `nova-3`                                                   |

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
    Senden Sie eine Audionachricht über einen beliebigen verbundenen Kanal. OpenClaw transkribiert sie
    über Deepgram und fügt das Transkript in die Antwortpipeline ein.
  </Step>
</Steps>

## Konfigurationsoptionen

| Option     | Pfad                                  | Beschreibung                           |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram-Modell-ID (Standard: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Sprachhinweis (optional)              |

`providerOptions.deepgram` führt zusätzliche Abfrageparameter direkt mit der
Deepgram-Anfrage `/listen` zusammen, sodass jeder von Deepgram unterstützte Parametername funktioniert
(zum Beispiel `detect_language`, `punctuate`, `smart_format`):

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

Das mitgelieferte Plugin `deepgram` registriert außerdem einen Provider für Echtzeittranskription
für das Voice-Call-Plugin.

| Einstellung     | Konfigurationspfad                                                      | Standard                                     |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| API-Schlüssel   | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Fällt auf `DEEPGRAM_API_KEY` zurück             |
| Basis-URL       | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` oder öffentliche API von Deepgram |
| Modell          | `...deepgram.model`                                                     | `nova-3`                                     |
| Sprache         | `...deepgram.language`                                                  | (nicht festgelegt)                            |
| Kodierung       | `...deepgram.encoding`                                                  | `mulaw`                                      |
| Abtastrate      | `...deepgram.sampleRate`                                                | `8000`                                       |
| Endpunkterkennung | `...deepgram.endpointingMs`                                             | `800`                                        |
| Zwischenergebnisse | `...deepgram.interimResults`                                            | `true`                                       |

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

Legen Sie für einen [benutzerdefinierten Deepgram-Endpunkt](https://developers.deepgram.com/reference/custom-endpoints)
`baseUrl` auf die Endpunktwurzel fest, einschließlich eines etwaigen Basispfads, jedoch ohne `/listen`.
Echtzeitendpunkte akzeptieren `http://`, `https://`, `ws://` und `wss://`. HTTP
wird WS, HTTPS wird WSS zugeordnet, und explizite WebSocket-Schemata bleiben unverändert.
Fehlerhafte URLs und andere Schemata führen beim Einrichten der Sitzung zu einem Fehler.

<Note>
Voice Call empfängt Telefonieaudio als G.711 u-law mit 8 kHz. Der Deepgram-
Streaming-Provider verwendet standardmäßig `encoding: "mulaw"` und `sampleRate: 8000`, sodass
Twilio-Medienframes direkt weitergeleitet werden können.
</Note>

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Die Authentifizierung folgt der standardmäßigen Authentifizierungsreihenfolge des Providers. `DEEPGRAM_API_KEY` ist
    der einfachste Weg.
  </Accordion>
  <Accordion title="Proxy und benutzerdefinierte Endpunkte">
    Überschreiben Sie bei Verwendung eines Proxys Endpunkte oder Header mit `tools.media.audio.baseUrl` und
    `tools.media.audio.headers`.
  </Accordion>
  <Accordion title="Ausgabeverhalten">
    Die Ausgabe folgt denselben Audioregeln wie bei anderen Providern (Größenbeschränkungen, Zeitüberschreitungen,
    Einfügen des Transkripts).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Medienwerkzeuge" href="/de/tools/media-overview" icon="photo-film">
    Übersicht über die Verarbeitungspipeline für Audio, Bilder und Videos.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der Einstellungen für Medienwerkzeuge.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Schritte zur Fehlerdiagnose.
  </Card>
  <Card title="FAQ" href="/de/help/faq" icon="circle-question">
    Häufig gestellte Fragen zur Einrichtung von OpenClaw.
  </Card>
</CardGroup>
