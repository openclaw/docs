---
read_when:
    - Chcesz używać syntezy mowy Azure w odpowiedziach wychodzących
    - Potrzebne jest natywne generowanie wiadomości głosowych Ogg Opus za pomocą Azure Speech
summary: Synteza mowy Azure AI Speech dla odpowiedzi OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-07-16T19:03:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech to dołączony dostawca zamiany tekstu na mowę usługi Azure AI Speech. OpenClaw
wywołuje bezpośrednio interfejs REST API Azure Speech z użyciem SSML, generując pliki MP3 dla
standardowych odpowiedzi, natywne pliki Ogg/Opus dla wiadomości głosowych oraz dźwięk mulaw 8 kHz dla
kanałów telefonicznych, takich jak Voice Call. Żądanie przesyła format wyjściowy należący do dostawcy
za pośrednictwem nagłówka `X-Microsoft-OutputFormat`.

| Szczegół                | Wartość                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Identyfikator dostawcy  | `azure-speech` (alias: `azure`)                                                                |
| Witryna                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Dokumentacja            | [Zamiana tekstu na mowę za pomocą interfejsu Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Uwierzytelnianie        | `AZURE_SPEECH_KEY` oraz `AZURE_SPEECH_REGION`                                                                    |
| Domyślny głos           | `en-US-JennyNeural`                                                                                            |
| Domyślny plik wyjściowy | `audio-24khz-48kbitrate-mono-mp3`                                                                                            |
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
    za pomocą Azure Speech i dostarcza plik MP3 jako standardowy dźwięk albo Ogg/Opus, gdy
    kanał oczekuje wiadomości głosowej.
  </Step>
</Steps>

## Opcje konfiguracji

Wszystkie opcje znajdują się w sekcji `messages.tts.providers["azure-speech"]`.

| Opcja                   | Opis                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`      | Klucz zasobu Azure Speech. W razie braku używa `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` lub `SPEECH_KEY`. |
| `region`      | Region zasobu Azure Speech. W razie braku używa `AZURE_SPEECH_REGION` lub `SPEECH_REGION`.            |
| `endpoint`      | Opcjonalne zastąpienie punktu końcowego Azure Speech. W razie braku używa zaufanej wartości `AZURE_SPEECH_ENDPOINT`. |
| `baseUrl`      | Opcjonalne zastąpienie bazowego adresu URL Azure Speech.                                              |
| `voice`      | Wartość ShortName głosu Azure (domyślnie `en-US-JennyNeural`). Starszy alias: `voiceId`.      |
| `lang`      | Kod języka SSML (domyślnie `en-US`).                                                       |
| `outputFormat`      | Format wyjściowy pliku dźwiękowego (domyślnie `audio-24khz-48kbitrate-mono-mp3`).                                    |
| `voiceNoteOutputFormat`      | Format wyjściowy wiadomości głosowej (domyślnie `ogg-24khz-16bit-mono-opus`).                                  |
| `timeoutMs`      | Zastąpienie limitu czasu żądania w milisekundach. W razie braku używa globalnej wartości `messages.tts.timeoutMs`. |

Dostawca jest uznawany za skonfigurowanego po ustawieniu `apiKey` oraz jednej z wartości
`region`, `endpoint` lub `baseUrl`. Zmienne środowiskowe są sprawdzane tylko jako wartości
zastępcze dla nieustawionych kluczy konfiguracji. Pliki `.env` obszaru roboczego nie mogą ustawiać
`AZURE_SPEECH_ENDPOINT`; do routingu punktów końcowych należy używać środowiska procesu, globalnego pliku dotenv środowiska uruchomieniowego
lub jawnej konfiguracji.

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Azure Speech używa klucza zasobu Speech, a nie klucza Azure OpenAI. Klucz
    jest wysyłany jako `Ocp-Apim-Subscription-Key`; OpenClaw wyprowadza
    `https://<region>.tts.speech.microsoft.com` z `region`, chyba że podano
    `endpoint` lub `baseUrl`.
  </Accordion>
  <Accordion title="Nazwy głosów">
    Należy używać wartości `ShortName` głosu Azure Speech, na przykład
    `en-US-JennyNeural`. Dołączony dostawca może wyświetlać listę głosów za pośrednictwem
    tego samego zasobu Speech i odfiltrowuje głosy oznaczone jako przestarzałe, wycofane
    lub wyłączone.
  </Accordion>
  <Accordion title="Formaty wyjściowe dźwięku">
    Azure akceptuje formaty wyjściowe, takie jak `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` i `riff-24khz-16bit-mono-pcm`. OpenClaw
    żąda formatu Ogg/Opus dla miejsc docelowych `voice-note`, dzięki czemu kanały mogą wysyłać natywne
    wiadomości głosowe bez dodatkowej konwersji MP3, oraz wymusza
    `raw-8khz-8bit-mono-mulaw` dla miejsc docelowych telefonii.
  </Accordion>
  <Accordion title="Alias">
    `azure` jest akceptowany jako alias dostawcy w istniejącej konfiguracji, ale nowa
    konfiguracja powinna używać `azure-speech`, aby uniknąć pomylenia z dostawcami
    modeli Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Zamiana tekstu na mowę" href="/pl/tools/tts" icon="waveform-lines">
    Omówienie TTS, dostawców i konfiguracji `messages.tts`.
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
