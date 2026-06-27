---
read_when:
    - Chcesz syntezy mowy Inworld dla odpowiedzi wychodzących
    - Potrzebujesz wyjścia telefonii PCM albo notatki głosowej OGG_OPUS z Inworld
summary: Strumieniowa synteza mowy Inworld dla odpowiedzi OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:12:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld jest dostawcą strumieniowego tekstu na mowę (TTS). W OpenClaw
syntetyzuje wychodzące odpowiedzi audio (domyślnie MP3, OGG_OPUS dla notatek głosowych)
oraz dźwięk PCM dla kanałów telefonicznych, takich jak Voice Call.

OpenClaw wysyła żądania do strumieniowego punktu końcowego TTS Inworld,
łączy zwrócone fragmenty audio base64 w jeden bufor i przekazuje wynik do
standardowego potoku odpowiedzi audio.

| Właściwość          | Wartość                                                              |
| ------------------- | -------------------------------------------------------------------- |
| Identyfikator dostawcy | `inworld`                                                         |
| Plugin              | oficjalny pakiet zewnętrzny                                          |
| Kontrakt            | `speechProviders` (tylko TTS)                                        |
| Zmienna env uwierzytelniania | `INWORLD_API_KEY` (HTTP Basic, poświadczenie Base64 z panelu) |
| Bazowy URL          | `https://api.inworld.ai`                                             |
| Domyślny głos       | `Sarah`                                                              |
| Domyślny model      | `inworld-tts-1.5-max`                                                |
| Wyjście             | MP3 (domyślnie), OGG_OPUS (notatki głosowe), PCM 22050 Hz (telefonia) |
| Strona              | [inworld.ai](https://inworld.ai)                                     |
| Dokumentacja        | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)           |

## Zainstaluj plugin

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Set your API key">
    Skopiuj poświadczenie z panelu Inworld (Workspace > API Keys)
    i ustaw je jako zmienną env. Wartość jest wysyłana dosłownie jako
    poświadczenie HTTP Basic, więc nie koduj jej ponownie w Base64 ani nie
    konwertuj jej na token typu bearer.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Select Inworld in messages.tts">
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
  <Step title="Send a message">
    Wyślij odpowiedź przez dowolny połączony kanał. OpenClaw syntetyzuje
    dźwięk za pomocą Inworld i dostarcza go jako MP3 (lub OGG_OPUS, gdy kanał
    oczekuje notatki głosowej).
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja            | Ścieżka                                         | Opis                                                              |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Poświadczenie Base64 z panelu. Awaryjnie używa `INWORLD_API_KEY`. |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Nadpisuje bazowy URL API Inworld (domyślnie `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Identyfikator głosu (domyślnie `Sarah`).                          |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | Identyfikator modelu TTS (domyślnie `inworld-tts-1.5-max`).        |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Temperatura próbkowania `0..2` (opcjonalnie).                     |

## Uwagi

<AccordionGroup>
  <Accordion title="Authentication">
    Inworld używa uwierzytelniania HTTP Basic z jednym ciągiem poświadczenia
    zakodowanym w Base64. Skopiuj go dosłownie z panelu Inworld. Dostawca
    wysyła go jako `Authorization: Basic <apiKey>` bez żadnego dalszego kodowania,
    więc nie koduj go samodzielnie w Base64 i nie przekazuj tokena w stylu bearer.
    Zobacz [uwagi dotyczące uwierzytelniania TTS](/pl/tools/tts#inworld-primary), aby
    zapoznać się z tym samym wyróżnieniem.
  </Accordion>
  <Accordion title="Models">
    Obsługiwane identyfikatory modeli: `inworld-tts-1.5-max` (domyślny),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audio outputs">
    Odpowiedzi domyślnie używają MP3. Gdy celem kanału jest `voice-note`,
    OpenClaw prosi Inworld o `OGG_OPUS`, aby dźwięk był odtwarzany jako natywny
    dymek głosowy. Synteza telefoniczna używa surowego `PCM` przy 22050 Hz, aby
    zasilać most telefoniczny.
  </Accordion>
  <Accordion title="Custom endpoints">
    Nadpisz host API za pomocą `messages.tts.providers.inworld.baseUrl`.
    Końcowe ukośniki są usuwane przed wysłaniem żądań.
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
    Wszyscy obsługiwani dostawcy OpenClaw.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
</CardGroup>
