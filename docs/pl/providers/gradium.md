---
read_when:
    - Potrzebujesz Gradium do zamiany tekstu na mowę
    - Potrzebujesz klucza API Gradium, głosu lub konfiguracji tokena dyrektywy
summary: Używanie syntezy mowy Gradium w OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-05-10T19:51:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c79da6ec63532061a8112965a679f1113bbefcc91ee00def8153dd39b5b5e58
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) jest dołączonym dostawcą zamiany tekstu na mowę dla OpenClaw. Plugin może generować zwykłe odpowiedzi audio (WAV), wyjście Opus zgodne z notatkami głosowymi oraz audio 8 kHz u-law dla powierzchni telefonicznych.

| Właściwość            | Wartość                              |
| --------------------- | ------------------------------------ |
| Identyfikator dostawcy | `gradium`                            |
| Uwierzytelnianie      | `GRADIUM_API_KEY` lub config `apiKey` |
| Bazowy URL            | `https://api.gradium.ai` (domyślnie) |
| Domyślny głos         | `Emma` (`YTpq7expH9539ERJ`)          |

## Konfiguracja

Utwórz klucz API Gradium, a następnie udostępnij go OpenClaw za pomocą zmiennej środowiskowej albo klucza config.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Plugin najpierw sprawdza rozwiązany `apiKey`, a w razie jego braku używa zmiennej środowiskowej `GRADIUM_API_KEY`.

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Klucz                                    | Typ    | Opis                                                                                               |
| ---------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`  | string | Rozwiązany klucz API. Obsługuje `${ENV}` i referencje do sekretów.                                 |
| `messages.tts.providers.gradium.baseUrl` | string | Nadpisuje źródło API. Końcowe ukośniki są usuwane. Domyślnie `https://api.gradium.ai`.             |
| `messages.tts.providers.gradium.voiceId` | string | Domyślny identyfikator głosu używany, gdy nie ma nadpisania dyrektywą.                             |

Format wyjściowego audio jest wybierany automatycznie przez środowisko uruchomieniowe na podstawie powierzchni docelowej i nie można go konfigurować z `openclaw.json`. Zobacz [Wyjście](#output) poniżej.

## Głosy

| Nazwa     | Identyfikator głosu |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Domyślny głos: Emma.

### Nadpisanie głosu dla wiadomości

Gdy aktywna polityka mowy zezwala na nadpisywanie głosu, możesz przełączać głosy bezpośrednio w treści za pomocą tokenu dyrektywy. Wszystkie poniższe warianty rozwiązują się do tego samego nadpisania `voiceId`:

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Jeśli polityka mowy wyłącza nadpisywanie głosu, dyrektywa jest zużywana, ale ignorowana.

## Wyjście

Środowisko uruchomieniowe wybiera format wyjściowy na podstawie powierzchni docelowej. Dostawca obecnie nie syntetyzuje innych formatów.

| Cel              | Format      | Rozszerzenie pliku | Częstotliwość próbkowania | Flaga zgodności z głosem |
| ---------------- | ----------- | ------------------ | ------------------------- | ------------------------ |
| Standardowe audio | `wav`       | `.wav`             | dostawca                  | nie                      |
| Notatka głosowa  | `opus`      | `.opus`            | dostawca                  | tak                      |
| Telefonia        | `ulaw_8000` | n/a                | 8 kHz                     | n/a                      |

## Kolejność automatycznego wyboru

Wśród skonfigurowanych dostawców TTS kolejność automatycznego wyboru Gradium to `30`. Zobacz [Zamiana tekstu na mowę](/pl/tools/tts), aby dowiedzieć się, jak OpenClaw wybiera aktywnego dostawcę, gdy `messages.tts.provider` nie jest przypięty.

## Powiązane

- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Przegląd multimediów](/pl/tools/media-overview)
