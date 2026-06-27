---
read_when:
    - Sie möchten Azure Speech-Synthese für ausgehende Antworten
    - Sie benötigen native Sprachnotiz-Ausgabe im Format Ogg Opus von Azure Speech
summary: Azure AI Speech Text-zu-Sprache für OpenClaw-Antworten
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:02:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech ist ein Text-zu-Sprache-Provider von Azure AI Speech. In OpenClaw
synthetisiert er ausgehende Antwort-Audiodateien standardmäßig als MP3, natives
Ogg/Opus für Sprachnachrichten und 8-kHz-mulaw-Audio für Telefoniekanäle wie
Sprachanruf.

OpenClaw verwendet die Azure Speech REST API direkt mit SSML und sendet das
Provider-eigene Ausgabeformat über `X-Microsoft-OutputFormat`.

| Detail                  | Wert                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Website                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Dokumentation           | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Authentifizierung       | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Standardstimme          | `en-US-JennyNeural`                                                                                            |
| Standard-Dateiausgabe   | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Standard-Sprachnachrichtendatei | `ogg-24khz-16bit-mono-opus`                                                                            |

## Erste Schritte

<Steps>
  <Step title="Create an Azure Speech resource">
    Erstellen Sie im Azure-Portal eine Speech-Ressource. Kopieren Sie **KEY 1**
    aus Resource Management > Keys and Endpoint und kopieren Sie den
    Ressourcenstandort, zum Beispiel `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Select Azure Speech in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    Senden Sie eine Antwort über einen beliebigen verbundenen Kanal. OpenClaw
    synthetisiert das Audio mit Azure Speech und liefert MP3 für Standardaudio
    oder Ogg/Opus, wenn der Kanal eine Sprachnachricht erwartet.
  </Step>
</Steps>

## Konfigurationsoptionen

| Option                  | Pfad                                                        | Beschreibung                                                                                              |
| ----------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Azure Speech-Ressourcenschlüssel. Fällt auf `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` oder `SPEECH_KEY` zurück. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Azure Speech-Ressourcenregion. Fällt auf `AZURE_SPEECH_REGION` oder `SPEECH_REGION` zurück.              |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Optionale Überschreibung des Azure Speech-Endpunkts bzw. der Basis-URL.                                  |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Optionale Überschreibung der Azure Speech-Basis-URL.                                                     |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | Azure-Stimmen-ShortName (Standard `en-US-JennyNeural`). Legacy-Alias: `voice`.                           |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML-Sprachcode (Standard `en-US`).                                                                      |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Ausgabeformat für Audiodateien (Standard `audio-24khz-48kbitrate-mono-mp3`).                             |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Ausgabeformat für Sprachnachrichten (Standard `ogg-24khz-16bit-mono-opus`).                              |

## Hinweise

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech verwendet einen Speech-Ressourcenschlüssel, keinen Azure
    OpenAI-Schlüssel. Der Schlüssel wird als `Ocp-Apim-Subscription-Key`
    gesendet; OpenClaw leitet `https://<region>.tts.speech.microsoft.com` aus
    `region` ab, sofern Sie nicht `endpoint` oder `baseUrl` angeben.
  </Accordion>
  <Accordion title="Voice names">
    Verwenden Sie den Azure Speech-Stimmenwert `ShortName`, zum Beispiel
    `en-US-JennyNeural`. Der gebündelte Provider kann Stimmen über dieselbe
    Speech-Ressource auflisten und filtert Stimmen heraus, die als veraltet
    oder ausgemustert markiert sind.
  </Accordion>
  <Accordion title="Audio outputs">
    Azure akzeptiert Ausgabeformate wie `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` und `riff-24khz-16bit-mono-pcm`. OpenClaw
    fordert Ogg/Opus für `voice-note`-Ziele an, damit Kanäle native
    Sprachblasen ohne zusätzliche MP3-Konvertierung senden können.
  </Accordion>
  <Accordion title="Alias">
    `azure` wird als Provider-Alias für bestehende PRs und Benutzerkonfigurationen
    akzeptiert, neue Konfigurationen sollten jedoch `azure-speech` verwenden,
    um Verwechslungen mit Azure OpenAI-Modell-Providern zu vermeiden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/de/tools/tts" icon="waveform-lines">
    TTS-Übersicht, Provider und `messages.tts`-Konfiguration.
  </Card>
  <Card title="Configuration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich `messages.tts`-Einstellungen.
  </Card>
  <Card title="Providers" href="/de/providers" icon="grid">
    Alle gebündelten OpenClaw-Provider.
  </Card>
  <Card title="Troubleshooting" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Debugging-Schritte.
  </Card>
</CardGroup>
