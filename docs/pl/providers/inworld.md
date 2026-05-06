---
read_when:
    - Chcesz używać syntezy mowy Inworld do odpowiedzi wychodzących
    - Potrzebujesz wyjścia z Inworld w formacie telefonii PCM lub notatki głosowej OGG_OPUS
summary: Strumieniowa zamiana tekstu na mowę Inworld dla odpowiedzi OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-05-06T09:27:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld jest dostawcą strumieniowego przetwarzania tekstu na mowę (TTS). W OpenClaw
syntetyzuje wychodzący dźwięk odpowiedzi (domyślnie MP3, OGG_OPUS dla notatek głosowych)
oraz dźwięk PCM dla kanałów telefonicznych, takich jak Voice Call.

OpenClaw wysyła żądania do strumieniowego punktu końcowego TTS Inworld, łączy
zwrócone fragmenty audio base64 w pojedynczy bufor i przekazuje wynik do
standardowego potoku dźwięku odpowiedzi.

| Właściwość       | Wartość                                                         |
| ---------------- | --------------------------------------------------------------- |
| Identyfikator dostawcy | `inworld`                                                |
| Plugin           | wbudowany, `enabledByDefault: true`                             |
| Kontrakt         | `speechProviders` (tylko TTS)                                   |
| Zmienna środowiskowa uwierzytelniania | `INWORLD_API_KEY` (HTTP Basic, poświadczenie Base64 z panelu) |
| Bazowy URL       | `https://api.inworld.ai`                                        |
| Domyślny głos    | `Sarah`                                                         |
| Domyślny model   | `inworld-tts-1.5-max`                                           |
| Wyjście          | MP3 (domyślnie), OGG_OPUS (notatki głosowe), PCM 22050 Hz (telefonia) |
| Witryna          | [inworld.ai](https://inworld.ai)                                |
| Dokumentacja     | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Skopiuj poświadczenie z panelu Inworld (Workspace > API Keys)
    i ustaw je jako zmienną środowiskową. Wartość jest wysyłana dosłownie jako
    poświadczenie HTTP Basic, więc nie koduj jej ponownie w Base64 ani nie
    konwertuj jej na token bearer.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Wybierz Inworld w messages.tts">
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
  <Step title="Wyślij wiadomość">
    Wyślij odpowiedź przez dowolny połączony kanał. OpenClaw syntetyzuje
    dźwięk za pomocą Inworld i dostarcza go jako MP3 (lub OGG_OPUS, gdy kanał
    oczekuje notatki głosowej).
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja         | Ścieżka                                      | Opis                                                              |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Poświadczenie Base64 z panelu. Używa zastępczo `INWORLD_API_KEY`. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Nadpisuje bazowy URL API Inworld (domyślnie `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identyfikator głosu (domyślnie `Sarah`).                          |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Identyfikator modelu TTS (domyślnie `inworld-tts-1.5-max`).       |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura próbkowania `0..2` (opcjonalnie).                     |

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Inworld używa uwierzytelniania HTTP Basic z pojedynczym ciągiem
    poświadczenia zakodowanym w Base64. Skopiuj go dosłownie z panelu
    Inworld. Dostawca wysyła go jako `Authorization: Basic <apiKey>` bez
    żadnego dalszego kodowania, więc nie koduj go samodzielnie w Base64 i nie
    przekazuj tokenu w stylu bearer. Zobacz [uwagi dotyczące uwierzytelniania TTS](/pl/tools/tts#inworld-primary),
    aby uzyskać to samo ostrzeżenie.
  </Accordion>
  <Accordion title="Modele">
    Obsługiwane identyfikatory modeli: `inworld-tts-1.5-max` (domyślnie),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Wyjścia audio">
    Odpowiedzi domyślnie używają MP3. Gdy docelowym typem kanału jest `voice-note`,
    OpenClaw prosi Inworld o `OGG_OPUS`, aby dźwięk był odtwarzany jako natywna
    dymka głosowa. Synteza telefoniczna używa surowego `PCM` przy 22050 Hz, aby
    zasilać most telefoniczny.
  </Accordion>
  <Accordion title="Niestandardowe punkty końcowe">
    Nadpisz host API za pomocą `messages.tts.providers.inworld.baseUrl`.
    Końcowe ukośniki są usuwane przed wysłaniem żądań.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Tekst na mowę" href="/pl/tools/tts" icon="waveform-lines">
    Przegląd TTS, dostawcy i konfiguracja `messages.tts`.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawienia `messages.tts`.
  </Card>
  <Card title="Dostawcy" href="/pl/providers" icon="grid">
    Wszyscy wbudowani dostawcy OpenClaw.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
</CardGroup>
