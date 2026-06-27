---
read_when:
    - Chcesz używać syntezy mowy Azure Speech dla odpowiedzi wychodzących
    - Potrzebujesz natywnego wyjścia notatki głosowej Ogg Opus z Azure Speech
summary: Text-to-speech Azure AI Speech dla odpowiedzi OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:10:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech to dostawca zamiany tekstu na mowę Azure AI Speech. W OpenClaw
syntetyzuje dźwięk odpowiedzi wychodzących domyślnie jako MP3, natywne Ogg/Opus dla notatek
głosowych oraz dźwięk mulaw 8 kHz dla kanałów telefonicznych, takich jak połączenie głosowe.

OpenClaw używa bezpośrednio Azure Speech REST API z SSML i wysyła
format wyjściowy należący do dostawcy przez `X-Microsoft-OutputFormat`.

| Szczegół               | Wartość                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Witryna                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Dokumentacja            | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Uwierzytelnianie        | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Domyślny głos           | `en-US-JennyNeural`                                                                                            |
| Domyślne wyjście pliku  | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Domyślny plik notatki głosowej | `ogg-24khz-16bit-mono-opus`                                                                                    |

## Pierwsze kroki

<Steps>
  <Step title="Create an Azure Speech resource">
    W portalu Azure utwórz zasób Speech. Skopiuj **KEY 1** z
    Resource Management > Keys and Endpoint oraz skopiuj lokalizację zasobu,
    taką jak `eastus`.

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
    Wyślij odpowiedź przez dowolny połączony kanał. OpenClaw syntetyzuje dźwięk
    za pomocą Azure Speech i dostarcza MP3 dla standardowego dźwięku albo Ogg/Opus, gdy
    kanał oczekuje notatki głosowej.
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja                   | Ścieżka                                                     | Opis                                                                                                  |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Klucz zasobu Azure Speech. Wraca do `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` lub `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Region zasobu Azure Speech. Wraca do `AZURE_SPEECH_REGION` lub `SPEECH_REGION`.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Opcjonalne zastąpienie punktu końcowego/bazowego URL Azure Speech.                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Opcjonalne zastąpienie bazowego URL Azure Speech.                                                              |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | `ShortName` głosu Azure (domyślnie `en-US-JennyNeural`). Starszy alias: `voice`.                           |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Kod języka SSML (domyślnie `en-US`).                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Format wyjściowy pliku audio (domyślnie `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Format wyjściowy notatki głosowej (domyślnie `ogg-24khz-16bit-mono-opus`).                                       |

## Uwagi

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech używa klucza zasobu Speech, a nie klucza Azure OpenAI. Klucz
    jest wysyłany jako `Ocp-Apim-Subscription-Key`; OpenClaw wyprowadza
    `https://<region>.tts.speech.microsoft.com` z `region`, chyba że
    podasz `endpoint` lub `baseUrl`.
  </Accordion>
  <Accordion title="Voice names">
    Użyj wartości `ShortName` głosu Azure Speech, na przykład
    `en-US-JennyNeural`. Dołączony dostawca może wyświetlać głosy przez ten
    sam zasób Speech i odfiltrowuje głosy oznaczone jako przestarzałe lub wycofane.
  </Accordion>
  <Accordion title="Audio outputs">
    Azure akceptuje formaty wyjściowe, takie jak `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` i `riff-24khz-16bit-mono-pcm`. OpenClaw
    żąda Ogg/Opus dla celów `voice-note`, aby kanały mogły wysyłać natywne
    dymki głosowe bez dodatkowej konwersji MP3.
  </Accordion>
  <Accordion title="Alias">
    `azure` jest akceptowany jako alias dostawcy dla istniejących PR-ów i konfiguracji użytkownika,
    ale nowa konfiguracja powinna używać `azure-speech`, aby uniknąć pomylenia z dostawcami
    modeli Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/pl/tools/tts" icon="waveform-lines">
    Omówienie TTS, dostawcy i konfiguracja `messages.tts`.
  </Card>
  <Card title="Configuration" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawienia `messages.tts`.
  </Card>
  <Card title="Providers" href="/pl/providers" icon="grid">
    Wszyscy dołączeni dostawcy OpenClaw.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
</CardGroup>
