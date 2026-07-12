---
read_when:
    - Chcesz używać syntezy mowy Azure w odpowiedziach wychodzących
    - Potrzebujesz natywnego formatu Ogg Opus dla wiadomości głosowych generowanych przez Azure Speech
summary: Synteza mowy z tekstu Azure AI Speech dla odpowiedzi OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-07-12T15:31:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech to dołączony dostawca zamiany tekstu na mowę oparty na usłudze Azure AI Speech. OpenClaw
wywołuje interfejs REST API Azure Speech bezpośrednio przy użyciu SSML, generując pliki MP3 dla
standardowych odpowiedzi, natywne pliki Ogg/Opus dla wiadomości głosowych oraz dźwięk mulaw 8 kHz dla
kanałów telefonicznych, takich jak Voice Call. Żądanie przesyła format wyjściowy należący do dostawcy
w nagłówku `X-Microsoft-OutputFormat`.

| Szczegół                        | Wartość                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Identyfikator dostawcy          | `azure-speech` (alias: `azure`)                                                                                |
| Witryna                         | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Dokumentacja                    | [REST API zamiany tekstu na mowę](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Uwierzytelnianie                | `AZURE_SPEECH_KEY` oraz `AZURE_SPEECH_REGION`                                                                  |
| Domyślny głos                   | `en-US-JennyNeural`                                                                                            |
| Domyślny format pliku           | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Domyślny plik wiadomości głosowej | `ogg-24khz-16bit-mono-opus`                                                                                  |

## Pierwsze kroki

<Steps>
  <Step title="Utwórz zasób Azure Speech">
    W portalu Azure utwórz zasób Speech. Skopiuj **KEY 1** z sekcji
    Resource Management > Keys and Endpoint oraz lokalizację zasobu,
    na przykład `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Wybierz Azure Speech w messages.tts">
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
  <Step title="Wyślij wiadomość">
    Wyślij odpowiedź przez dowolny połączony kanał. OpenClaw generuje dźwięk
    za pomocą Azure Speech i dostarcza plik MP3 jako standardowy dźwięk lub
    Ogg/Opus, gdy kanał oczekuje wiadomości głosowej.
  </Step>
</Steps>

## Opcje konfiguracji

Wszystkie opcje znajdują się w `messages.tts.providers["azure-speech"]`.

| Opcja                   | Opis                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `apiKey`                | Klucz zasobu Azure Speech. Wartość zapasowa to `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` lub `SPEECH_KEY`.     |
| `region`                | Region zasobu Azure Speech. Wartość zapasowa to `AZURE_SPEECH_REGION` lub `SPEECH_REGION`.                      |
| `endpoint`              | Opcjonalne nadpisanie punktu końcowego Azure Speech. Wartość zapasowa to `AZURE_SPEECH_ENDPOINT`.               |
| `baseUrl`               | Opcjonalne nadpisanie bazowego adresu URL Azure Speech.                                                        |
| `voice`                 | Wartość ShortName głosu Azure (domyślnie `en-US-JennyNeural`). Starszy alias: `voiceId`.                        |
| `lang`                  | Kod języka SSML (domyślnie `en-US`).                                                                           |
| `outputFormat`          | Format wyjściowego pliku dźwiękowego (domyślnie `audio-24khz-48kbitrate-mono-mp3`).                             |
| `voiceNoteOutputFormat` | Format wyjściowy wiadomości głosowej (domyślnie `ogg-24khz-16bit-mono-opus`).                                   |
| `timeoutMs`             | Nadpisanie limitu czasu żądania w milisekundach. Wartość zapasowa to globalne ustawienie `messages.tts.timeoutMs`. |

Dostawcę uznaje się za skonfigurowanego po ustawieniu `apiKey` oraz jednej z opcji:
`region`, `endpoint` lub `baseUrl`. Zmienne środowiskowe są sprawdzane wyłącznie jako
wartości zapasowe dla nieustawionych kluczy konfiguracji.

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Azure Speech używa klucza zasobu Speech, a nie klucza Azure OpenAI. Klucz
    jest wysyłany jako `Ocp-Apim-Subscription-Key`; OpenClaw tworzy adres
    `https://<region>.tts.speech.microsoft.com` na podstawie `region`, chyba że
    podasz `endpoint` lub `baseUrl`.
  </Accordion>
  <Accordion title="Nazwy głosów">
    Użyj wartości `ShortName` głosu Azure Speech, na przykład
    `en-US-JennyNeural`. Dołączony dostawca może wyświetlić listę głosów za
    pośrednictwem tego samego zasobu Speech i odfiltrowuje głosy oznaczone jako
    przestarzałe, wycofane lub wyłączone.
  </Accordion>
  <Accordion title="Formaty dźwięku">
    Azure akceptuje formaty wyjściowe, takie jak `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` i `riff-24khz-16bit-mono-pcm`. OpenClaw
    żąda formatu Ogg/Opus dla miejsc docelowych `voice-note`, dzięki czemu kanały
    mogą wysyłać natywne dymki wiadomości głosowych bez dodatkowej konwersji MP3,
    oraz wymusza `raw-8khz-8bit-mono-mulaw` dla miejsc docelowych telefonii.
  </Accordion>
  <Accordion title="Alias">
    `azure` jest akceptowany jako alias dostawcy w istniejącej konfiguracji, ale
    nowa konfiguracja powinna używać `azure-speech`, aby uniknąć pomyłek
    z dostawcami modeli Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Zamiana tekstu na mowę" href="/pl/tools/tts" icon="waveform-lines">
    Omówienie TTS, dostawcy i konfiguracja `messages.tts`.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawień `messages.tts`.
  </Card>
  <Card title="Dostawcy" href="/pl/providers" icon="grid">
    Wszyscy dołączeni dostawcy OpenClaw.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
</CardGroup>
