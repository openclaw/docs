---
read_when:
    - Chcesz używać syntezy mowy Inworld w odpowiedziach wychodzących
    - Potrzebujesz z Inworld wyjścia audio telefonicznego PCM lub notatki głosowej OGG_OPUS
summary: Strumieniowa zamiana tekstu na mowę Inworld dla odpowiedzi OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T15:34:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld to dostawca strumieniowej syntezy mowy (TTS). W OpenClaw syntetyzuje dźwięk odpowiedzi wychodzących (domyślnie MP3, OGG_OPUS dla wiadomości głosowych) oraz surowy dźwięk PCM dla kanałów telefonicznych, takich jak Voice Call.

OpenClaw wysyła żądania do strumieniowego punktu końcowego TTS Inworld, łączy zwrócone fragmenty dźwięku zakodowane w base64 w jeden bufor i przekazuje wynik do standardowego potoku dźwięku odpowiedzi.

| Właściwość         | Wartość                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| Identyfikator dostawcy | `inworld`                                                            |
| Plugin             | oficjalny pakiet zewnętrzny (`@openclaw/inworld-speech`)                  |
| Kontrakt           | `speechProviders` (tylko TTS)                                             |
| Zmienna środowiskowa uwierzytelniania | `INWORLD_API_KEY` (HTTP Basic, dane uwierzytelniające z panelu w formacie Base64) |
| Bazowy adres URL   | `https://api.inworld.ai`                                                  |
| Domyślny głos      | `Sarah`                                                                  |
| Domyślny model     | `inworld-tts-1.5-max`                                                     |
| Format wyjściowy   | MP3 (domyślnie), OGG_OPUS (wiadomości głosowe), PCM 22050 Hz (telefonia) |
| Witryna            | [inworld.ai](https://inworld.ai)                                          |
| Dokumentacja       | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)                |

## Instalowanie pluginu

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Skopiuj dane uwierzytelniające z panelu Inworld (Workspace > API Keys) i ustaw je jako zmienną środowiskową. Wartość jest wysyłana bez zmian jako dane uwierzytelniające HTTP Basic, dlatego nie koduj jej ponownie w formacie Base64 ani nie przekształcaj w token typu bearer.

    ```bash
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
    Wyślij odpowiedź przez dowolny połączony kanał. OpenClaw syntetyzuje dźwięk za pomocą Inworld i dostarcza go jako MP3 (lub OGG_OPUS, gdy kanał oczekuje wiadomości głosowej).
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja         | Ścieżka                                      | Opis                                                                        |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Dane uwierzytelniające z panelu w formacie Base64. W razie braku używa `INWORLD_API_KEY`. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Zastępuje bazowy adres URL API Inworld (domyślnie `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identyfikator głosu (domyślnie `Sarah`). Starszy alias: `speakerVoiceId`.    |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Identyfikator modelu TTS (domyślnie `inworld-tts-1.5-max`).                  |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura próbkowania, od `0` (wyłącznie) do `2` (opcjonalna).             |

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Inworld używa uwierzytelniania HTTP Basic z jednym ciągiem danych uwierzytelniających zakodowanym w Base64. Skopiuj go bez zmian z panelu Inworld. Dostawca wysyła go jako `Authorization: Basic <apiKey>` bez dodatkowego kodowania, dlatego nie koduj go samodzielnie w formacie Base64 ani nie przekazuj tokenu typu bearer. To samo zastrzeżenie znajdziesz w [uwagach dotyczących uwierzytelniania TTS](/pl/tools/tts#inworld-primary).
  </Accordion>
  <Accordion title="Modele">
    Obsługiwane identyfikatory modeli: `inworld-tts-1.5-max` (domyślny), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Formaty wyjściowe dźwięku">
    Odpowiedzi domyślnie używają formatu MP3. Gdy docelowym typem kanału jest `voice-note`, OpenClaw żąda od Inworld formatu `OGG_OPUS`, aby dźwięk był odtwarzany jako natywna wiadomość głosowa. Synteza dla telefonii używa surowego formatu `PCM` z częstotliwością 22050 Hz, aby zasilać most telefoniczny.
  </Accordion>
  <Accordion title="Niestandardowe punkty końcowe">
    Zastąp host API za pomocą `messages.tts.providers.inworld.baseUrl`. Końcowe ukośniki są usuwane przed wysłaniem żądań.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Synteza mowy" href="/pl/tools/tts" icon="waveform-lines">
    Omówienie TTS, dostawcy i konfiguracja `messages.tts`.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawień `messages.tts`.
  </Card>
  <Card title="Dostawcy" href="/pl/providers" icon="grid">
    Wszyscy obsługiwani dostawcy OpenClaw.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
</CardGroup>
