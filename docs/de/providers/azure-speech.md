---
read_when:
    - Sie möchten Azure Speech-Synthese für ausgehende Antworten verwenden
    - Sie benötigen eine native Sprachnotiz-Ausgabe im Ogg-Opus-Format von Azure Speech
summary: Azure AI Speech-Text-zu-Sprache für OpenClaw-Antworten
title: Azure-Sprachausgabe
x-i18n:
    generated_at: "2026-07-12T15:51:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech ist ein gebündelter Text-zu-Sprache-Provider von Azure AI Speech. OpenClaw
ruft die Azure Speech REST API direkt mit SSML auf und synthetisiert MP3 für
Standardantworten, natives Ogg/Opus für Sprachnachrichten und 8-kHz-mulaw für
Telefoniekanäle wie Voice Call. Die Anfrage übermittelt das vom Provider verwaltete
Ausgabeformat über den Header `X-Microsoft-OutputFormat`.

| Detail                       | Wert                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Provider-ID                  | `azure-speech` (Alias: `azure`)                                                                                |
| Website                      | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Dokumentation                | [Speech REST Text-zu-Sprache](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Authentifizierung            | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Standardstimme               | `en-US-JennyNeural`                                                                                            |
| Standarddateiausgabe         | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Standard-Sprachnachrichtendatei | `ogg-24khz-16bit-mono-opus`                                                                                 |

## Erste Schritte

<Steps>
  <Step title="Eine Azure-Speech-Ressource erstellen">
    Erstellen Sie im Azure-Portal eine Speech-Ressource. Kopieren Sie **KEY 1** aus
    Resource Management > Keys and Endpoint und kopieren Sie den Ressourcenstandort,
    beispielsweise `eastus`.

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
    mit Azure Speech und liefert MP3 für Standardaudio oder Ogg/Opus, wenn
    der Kanal eine Sprachnachricht erwartet.
  </Step>
</Steps>

## Konfigurationsoptionen

Alle Optionen befinden sich unter `messages.tts.providers["azure-speech"]`.

| Option                  | Beschreibung                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apiKey`                | Schlüssel der Azure-Speech-Ressource. Fällt auf `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` oder `SPEECH_KEY` zurück. |
| `region`                | Region der Azure-Speech-Ressource. Fällt auf `AZURE_SPEECH_REGION` oder `SPEECH_REGION` zurück.                |
| `endpoint`              | Optionale Überschreibung des Azure-Speech-Endpunkts. Fällt auf `AZURE_SPEECH_ENDPOINT` zurück.                 |
| `baseUrl`               | Optionale Überschreibung der Azure-Speech-Basis-URL.                                                            |
| `voice`                 | ShortName der Azure-Stimme (Standard: `en-US-JennyNeural`). Veralteter Alias: `voiceId`.                       |
| `lang`                  | SSML-Sprachcode (Standard: `en-US`).                                                                            |
| `outputFormat`          | Ausgabeformat für Audiodateien (Standard: `audio-24khz-48kbitrate-mono-mp3`).                                  |
| `voiceNoteOutputFormat` | Ausgabeformat für Sprachnachrichten (Standard: `ogg-24khz-16bit-mono-opus`).                                   |
| `timeoutMs`             | Überschreibung des Anfrage-Timeouts in Millisekunden. Fällt auf den globalen Wert `messages.tts.timeoutMs` zurück. |

Der Provider gilt als konfiguriert, sobald `apiKey` sowie eine der Optionen
`region`, `endpoint` oder `baseUrl` festgelegt ist. Umgebungsvariablen werden nur als Rückfalloption
für nicht festgelegte Konfigurationsschlüssel geprüft.

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Azure Speech verwendet einen Speech-Ressourcenschlüssel, keinen Azure-OpenAI-Schlüssel. Der Schlüssel
    wird als `Ocp-Apim-Subscription-Key` gesendet; OpenClaw leitet
    `https://<region>.tts.speech.microsoft.com` aus `region` ab, sofern Sie nicht
    `endpoint` oder `baseUrl` angeben.
  </Accordion>
  <Accordion title="Sprachnamen">
    Verwenden Sie den `ShortName`-Wert der Azure-Speech-Stimme, zum Beispiel
    `en-US-JennyNeural`. Der mitgelieferte Provider kann Stimmen über dieselbe
    Speech-Ressource auflisten und filtert Stimmen heraus, die als veraltet, eingestellt
    oder deaktiviert gekennzeichnet sind.
  </Accordion>
  <Accordion title="Audioausgaben">
    Azure akzeptiert Ausgabeformate wie `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` und `riff-24khz-16bit-mono-pcm`. OpenClaw
    fordert für `voice-note`-Ziele Ogg/Opus an, damit Kanäle native
    Sprachnachrichten ohne zusätzliche MP3-Konvertierung senden können, und erzwingt
    `raw-8khz-8bit-mono-mulaw` für Telefonieziele.
  </Accordion>
  <Accordion title="Alias">
    `azure` wird für bestehende Konfigurationen als Provider-Alias akzeptiert, neue
    Konfigurationen sollten jedoch `azure-speech` verwenden, um Verwechslungen mit Azure-OpenAI-
    Modell-Providern zu vermeiden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Text-zu-Sprache" href="/de/tools/tts" icon="waveform-lines">
    TTS-Übersicht, Provider und `messages.tts`-Konfiguration.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der `messages.tts`-Einstellungen.
  </Card>
  <Card title="Provider" href="/de/providers" icon="grid">
    Alle mitgelieferten OpenClaw-Provider.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Schritte zur Fehlerdiagnose.
  </Card>
</CardGroup>
