---
read_when:
    - Sie möchten Inworld-Sprachsynthese für ausgehende Antworten
    - Sie benötigen PCM-Telefonie oder OGG_OPUS-Sprachnotizausgabe von Inworld
summary: Inworld Streaming-Text-to-Speech für OpenClaw-Antworten
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld ist ein Streaming-Text-to-Speech-Provider (TTS). In OpenClaw
synthetisiert er Audio für ausgehende Antworten (standardmäßig MP3, OGG_OPUS für Sprachnotizen)
sowie PCM-Audio für Telefoniekanäle wie Voice Call.

OpenClaw sendet Anfragen an den Streaming-TTS-Endpunkt von Inworld, setzt die
zurückgegebenen base64-Audio-Chunks zu einem einzelnen Puffer zusammen und übergibt das Ergebnis
an die Standard-Pipeline für Antwort-Audio.

| Detail        | Wert                                                        |
| ------------- | ----------------------------------------------------------- |
| Website       | [inworld.ai](https://inworld.ai)                            |
| Dokumentation | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Auth          | `INWORLD_API_KEY` (HTTP Basic, Base64-Dashboard-Anmeldedaten) |
| Standardstimme | `Sarah`                                                    |
| Standardmodell | `inworld-tts-1.5-max`                                      |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Kopieren Sie die Anmeldedaten aus Ihrem Inworld-Dashboard (Workspace > API Keys)
    und setzen Sie sie als Umgebungsvariable. Der Wert wird unverändert als HTTP-Basic-
    Anmeldedatum gesendet. Kodieren Sie ihn also nicht erneut in Base64 und wandeln Sie ihn
    nicht in ein Bearer-Token um.

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
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Eine Nachricht senden">
    Senden Sie eine Antwort über einen beliebigen verbundenen Kanal. OpenClaw synthetisiert das
    Audio mit Inworld und liefert es als MP3 aus (oder als OGG_OPUS, wenn der Kanal
    eine Sprachnotiz erwartet).
  </Step>
</Steps>

## Konfigurationsoptionen

| Option        | Pfad                                         | Beschreibung                                                    |
| ------------- | -------------------------------------------- | --------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64-Dashboard-Anmeldedaten. Greift auf `INWORLD_API_KEY` zurück. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Überschreibt die Inworld-API-`baseUrl` (Standard `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Kennung der Stimme (Standard `Sarah`).                          |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID des TTS-Modells (Standard `inworld-tts-1.5-max`).            |
| `temperature` | `messages.tts.providers.inworld.temperature` | Sampling-Temperatur `0..2` (optional).                          |

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Inworld verwendet HTTP-Basic-Authentifizierung mit einer einzelnen Base64-kodierten Zeichenfolge
    für Anmeldedaten. Kopieren Sie sie unverändert aus dem Inworld-Dashboard. Der Provider sendet
    sie als `Authorization: Basic <apiKey>` ohne weitere Kodierung. Kodieren Sie sie also nicht
    selbst in Base64 und übergeben Sie kein Token im Bearer-Stil.
    Unter [Hinweise zur TTS-Authentifizierung](/de/tools/tts#inworld-primary) finden Sie denselben Hinweis.
  </Accordion>
  <Accordion title="Modelle">
    Unterstützte Modell-IDs: `inworld-tts-1.5-max` (Standard),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audioausgaben">
    Antworten verwenden standardmäßig MP3. Wenn das Kanalziel `voice-note` ist,
    fordert OpenClaw bei Inworld `OGG_OPUS` an, damit das Audio als native
    Sprachblase abgespielt wird. Telefonie-Synthese verwendet rohes `PCM` mit 22050 Hz, um
    die Telefonie-Bridge zu speisen.
  </Accordion>
  <Accordion title="Benutzerdefinierte Endpunkte">
    Überschreiben Sie den API-Host mit `messages.tts.providers.inworld.baseUrl`.
    Nachgestellte Schrägstriche werden entfernt, bevor Anfragen gesendet werden.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="waveform-lines">
    TTS-Übersicht, Provider und Konfiguration von `messages.tts`.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der Einstellungen für `messages.tts`.
  </Card>
  <Card title="Provider" href="/de/providers" icon="grid">
    Alle gebündelten OpenClaw Provider.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Schritte zur Fehlerbehebung.
  </Card>
</CardGroup>
