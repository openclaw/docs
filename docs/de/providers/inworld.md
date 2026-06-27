---
read_when:
    - Sie möchten Inworld-Sprachsynthese für ausgehende Antworten
    - Sie benötigen PCM-Telefonie oder OGG_OPUS-Sprachnotiz-Ausgabe von Inworld
summary: Inworld-Streaming-Text-to-Speech für OpenClaw-Antworten
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:04:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld ist ein Streaming-Text-to-Speech-(TTS)-Provider. In OpenClaw
synthetisiert er ausgehendes Antwort-Audio (standardmäßig MP3, OGG_OPUS für Sprachnotizen)
und PCM-Audio für Telefoniekanäle wie Voice Call.

OpenClaw sendet an Inworlds Streaming-TTS-Endpunkt, fügt die
zurückgegebenen base64-Audio-Chunks zu einem einzelnen Buffer zusammen und übergibt das Ergebnis an
die standardmäßige Antwort-Audio-Pipeline.

| Eigenschaft   | Wert                                                            |
| ------------- | --------------------------------------------------------------- |
| Provider-ID   | `inworld`                                                       |
| Plugin        | offizielles externes Paket                                      |
| Vertrag       | `speechProviders` (nur TTS)                                     |
| Auth-Env-Var  | `INWORLD_API_KEY` (HTTP Basic, Base64-Dashboard-Anmeldedaten)   |
| Basis-URL     | `https://api.inworld.ai`                                        |
| Standardstimme | `Sarah`                                                        |
| Standardmodell | `inworld-tts-1.5-max`                                          |
| Ausgabe       | MP3 (Standard), OGG_OPUS (Sprachnotizen), PCM 22050 Hz (Telefonie) |
| Website       | [inworld.ai](https://inworld.ai)                                |
| Doku          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Kopieren Sie die Anmeldedaten aus Ihrem Inworld-Dashboard (Workspace > API Keys)
    und legen Sie sie als Env-Var fest. Der Wert wird unverändert als HTTP-Basic-
    Anmeldedaten gesendet. Codieren Sie ihn daher nicht erneut mit Base64 und wandeln Sie ihn nicht in ein Bearer-
    Token um.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Inworld in messages.tts auswählen">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Nachricht senden">
    Senden Sie eine Antwort über einen beliebigen verbundenen Kanal. OpenClaw synthetisiert das
    Audio mit Inworld und liefert es als MP3 aus (oder als OGG_OPUS, wenn der Kanal
    eine Sprachnotiz erwartet).
  </Step>
</Steps>

## Konfigurationsoptionen

| Option           | Pfad                                            | Beschreibung                                                      |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Base64-Dashboard-Anmeldedaten. Fällt auf `INWORLD_API_KEY` zurück. |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Überschreibt die Basis-URL der Inworld-API (Standard `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Stimmkennung (Standard `Sarah`).                                  |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | TTS-Modell-ID (Standard `inworld-tts-1.5-max`).                   |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Sampling-Temperatur `0..2` (optional).                            |

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Inworld verwendet HTTP-Basic-Auth mit einer einzelnen Base64-codierten
    Anmeldedatenzeichenfolge. Kopieren Sie sie unverändert aus dem Inworld-Dashboard. Der Provider sendet
    sie als `Authorization: Basic <apiKey>` ohne weitere Codierung. Codieren Sie sie daher
    nicht selbst mit Base64 und übergeben Sie kein Bearer-artiges Token.
    Siehe [TTS-Auth-Hinweise](/de/tools/tts#inworld-primary) für denselben Hinweis.
  </Accordion>
  <Accordion title="Modelle">
    Unterstützte Modell-IDs: `inworld-tts-1.5-max` (Standard),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audioausgaben">
    Antworten verwenden standardmäßig MP3. Wenn das Kanalziel `voice-note` ist,
    fordert OpenClaw bei Inworld `OGG_OPUS` an, damit das Audio als native
    Sprachblase wiedergegeben wird. Telefoniesynthese verwendet rohes `PCM` mit 22050 Hz, um
    die Telefonie-Bridge zu speisen.
  </Accordion>
  <Accordion title="Benutzerdefinierte Endpunkte">
    Überschreiben Sie den API-Host mit `messages.tts.providers.inworld.baseUrl`.
    Abschließende Schrägstriche werden entfernt, bevor Anfragen gesendet werden.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="waveform-lines">
    TTS-Übersicht, Provider und `messages.tts`-Konfiguration.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich `messages.tts`-Einstellungen.
  </Card>
  <Card title="Provider" href="/de/providers" icon="grid">
    Alle unterstützten OpenClaw-Provider.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Debugging-Schritte.
  </Card>
</CardGroup>
