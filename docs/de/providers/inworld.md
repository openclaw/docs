---
read_when:
    - Sie möchten Inworld-Sprachsynthese für ausgehende Antworten
    - Sie benötigen PCM-Telefonie- oder OGG_OPUS-Sprachnotiz-Ausgabe von Inworld
summary: Inworld-Streaming-Text-to-Speech für OpenClaw-Antworten
title: Inworld
x-i18n:
    generated_at: "2026-05-06T07:01:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld ist ein Streaming-Text-to-Speech-Provider (TTS). In OpenClaw
synthetisiert er ausgehendes Antwort-Audio (standardmäßig MP3, OGG_OPUS für Sprachnachrichten)
und PCM-Audio für Telefoniekanäle wie Voice Call.

OpenClaw sendet Anfragen an den Streaming-TTS-Endpunkt von Inworld, verkettet die
zurückgegebenen Base64-Audio-Chunks zu einem einzelnen Puffer und übergibt das Ergebnis an
die standardmäßige Antwort-Audio-Pipeline.

| Eigenschaft   | Wert                                                            |
| ------------- | --------------------------------------------------------------- |
| Provider-ID   | `inworld`                                                       |
| Plugin        | mitgeliefert, `enabledByDefault: true`                          |
| Kontrakt      | `speechProviders` (nur TTS)                                     |
| Auth-Env-Var  | `INWORLD_API_KEY` (HTTP Basic, Base64-Dashboard-Zugangsdaten)   |
| Basis-URL     | `https://api.inworld.ai`                                        |
| Standardstimme | `Sarah`                                                        |
| Standardmodell | `inworld-tts-1.5-max`                                          |
| Ausgabe       | MP3 (Standard), OGG_OPUS (Sprachnachrichten), PCM 22050 Hz (Telefonie) |
| Website       | [inworld.ai](https://inworld.ai)                                |
| Dokumentation | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Kopieren Sie die Zugangsdaten aus Ihrem Inworld-Dashboard (Workspace > API Keys)
    und legen Sie sie als Env-Var fest. Der Wert wird unverändert als HTTP-Basic-
    Zugangsdaten gesendet. Kodieren Sie ihn daher nicht erneut mit Base64 und wandeln Sie ihn
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
  <Step title="Nachricht senden">
    Senden Sie eine Antwort über einen beliebigen verbundenen Kanal. OpenClaw synthetisiert das
    Audio mit Inworld und liefert es als MP3 aus (oder als OGG_OPUS, wenn der Kanal
    eine Sprachnachricht erwartet).
  </Step>
</Steps>

## Konfigurationsoptionen

| Option        | Pfad                                         | Beschreibung                                                     |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64-Dashboard-Zugangsdaten. Fällt auf `INWORLD_API_KEY` zurück. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Überschreibt die Inworld-API-Basis-URL (Standard `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Stimmkennung (Standard `Sarah`).                                 |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS-Modell-ID (Standard `inworld-tts-1.5-max`).                  |
| `temperature` | `messages.tts.providers.inworld.temperature` | Sampling-Temperatur `0..2` (optional).                           |

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Inworld verwendet HTTP-Basic-Authentifizierung mit einer einzelnen Base64-kodierten
    Zeichenfolge für Zugangsdaten. Kopieren Sie sie unverändert aus dem Inworld-Dashboard. Der Provider sendet
    sie als `Authorization: Basic <apiKey>` ohne weitere Kodierung. Kodieren Sie sie daher
    nicht selbst mit Base64 und übergeben Sie kein Bearer-artiges Token.
    Siehe [TTS-Authentifizierungshinweise](/de/tools/tts#inworld-primary) für denselben Hinweis.
  </Accordion>
  <Accordion title="Modelle">
    Unterstützte Modell-IDs: `inworld-tts-1.5-max` (Standard),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audioausgaben">
    Antworten verwenden standardmäßig MP3. Wenn das Kanalziel `voice-note` ist,
    fordert OpenClaw bei Inworld `OGG_OPUS` an, damit das Audio als native
    Sprachblase abgespielt wird. Die Telefoniesynthese verwendet rohes `PCM` mit 22050 Hz, um
    die Telefonie-Bridge zu speisen.
  </Accordion>
  <Accordion title="Benutzerdefinierte Endpunkte">
    Überschreiben Sie den API-Host mit `messages.tts.providers.inworld.baseUrl`.
    Abschließende Schrägstriche werden entfernt, bevor Anfragen gesendet werden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="waveform-lines">
    TTS-Übersicht, Provider und `messages.tts`-Konfiguration.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich `messages.tts`-Einstellungen.
  </Card>
  <Card title="Provider" href="/de/providers" icon="grid">
    Alle mitgelieferten OpenClaw-Provider.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Debugging-Schritte.
  </Card>
</CardGroup>
