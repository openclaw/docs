---
read_when:
    - Sie möchten Azure-Speech-Synthese für ausgehende Antworten.
    - Sie benötigen native Ogg-Opus-Sprachnachrichten-Ausgabe aus Azure Speech.
summary: Azure AI Speech Text-to-Speech für OpenClaw-Antworten
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:37:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech ist ein Azure AI Speech Text-to-Speech-Anbieter. In OpenClaw
synthetisiert er ausgehende Antwort-Audiodaten standardmäßig als MP3, natives Ogg/Opus für Sprach-
nachrichten und 8-kHz-Mulaw-Audio für Telefonie-Kanäle wie Voice Call.

OpenClaw verwendet die Azure-Speech-REST-API direkt mit SSML und sendet das
anbieterdefinierte Ausgabeformat über `X-Microsoft-OutputFormat`.

| Detail                  | Wert                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Website                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Dokumentation           | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Authentifizierung       | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Standardstimme          | `en-US-JennyNeural`                                                                                            |
| Standard-Dateiausgabe   | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Standard-Sprachnachricht-Datei | `ogg-24khz-16bit-mono-opus`                                                                            |

## Erste Schritte

<Steps>
  <Step title="Eine Azure-Speech-Ressource erstellen">
    Erstellen Sie im Azure-Portal eine Speech-Ressource. Kopieren Sie **KEY 1** aus
    Resource Management > Keys and Endpoint und kopieren Sie den Ressourcenstandort,
    zum Beispiel `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Azure Speech in messages.tts auswählen">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Eine Nachricht senden">
    Senden Sie eine Antwort über einen beliebigen verbundenen Kanal. OpenClaw synthetisiert das Audio
    mit Azure Speech und liefert MP3 für Standard-Audio oder Ogg/Opus, wenn
    der Kanal eine Sprachnachricht erwartet.
  </Step>
</Steps>

## Konfigurationsoptionen

| Option                  | Pfad                                                        | Beschreibung                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Schlüssel der Azure-Speech-Ressource. Fällt auf `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` oder `SPEECH_KEY` zurück. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Region der Azure-Speech-Ressource. Fällt auf `AZURE_SPEECH_REGION` oder `SPEECH_REGION` zurück.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Optionales Override für Azure-Speech-Endpunkt/Basis-URL.                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Optionales Override für die Azure-Speech-Basis-URL.                                                              |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | Azure-Sprach-`ShortName` (Standard `en-US-JennyNeural`).                                                  |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML-Sprachcode (Standard `en-US`).                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Audio-Datei-Ausgabeformat (Standard `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Ausgabeformat für Sprachnachrichten (Standard `ogg-24khz-16bit-mono-opus`).                                       |

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Azure Speech verwendet einen Schlüssel für die Speech-Ressource, keinen Azure-OpenAI-Schlüssel. Der Schlüssel
    wird als `Ocp-Apim-Subscription-Key` gesendet; OpenClaw leitet
    `https://<region>.tts.speech.microsoft.com` aus `region` ab, sofern Sie nicht
    `endpoint` oder `baseUrl` angeben.
  </Accordion>
  <Accordion title="Stimmnamen">
    Verwenden Sie den Azure-Speech-`ShortName` der Stimme, zum Beispiel
    `en-US-JennyNeural`. Der gebündelte Anbieter kann Stimmen über dieselbe
    Speech-Ressource auflisten und filtert Stimmen heraus, die als deprecated oder retired markiert sind.
  </Accordion>
  <Accordion title="Audioausgaben">
    Azure akzeptiert Ausgabeformate wie `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` und `riff-24khz-16bit-mono-pcm`. OpenClaw
    fordert für Ziele vom Typ `voice-note` Ogg/Opus an, damit Kanäle native
    Sprachblasen ohne zusätzliche MP3-Konvertierung senden können.
  </Accordion>
  <Accordion title="Alias">
    `azure` wird als Anbieter-Alias für bestehende PRs und Nutzerkonfigurationen akzeptiert,
    aber neue Konfigurationen sollten `azure-speech` verwenden, um Verwechslungen mit Azure-
    OpenAI-Modellanbietern zu vermeiden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="waveform-lines">
    TTS-Überblick, Anbieter und Konfiguration von `messages.tts`.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der Einstellungen für `messages.tts`.
  </Card>
  <Card title="Anbieter" href="/de/providers" icon="grid">
    Alle gebündelten OpenClaw-Anbieter.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Schritte zur Fehlerdiagnose.
  </Card>
</CardGroup>
