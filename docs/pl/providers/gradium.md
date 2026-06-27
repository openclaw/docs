---
read_when:
    - Chcesz używać Gradium do zamiany tekstu na mowę
    - Potrzebujesz konfiguracji klucza API Gradium, głosu lub tokenu dyrektywy
summary: Używanie zamiany tekstu na mowę Gradium w OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) jest dostawcą zamiany tekstu na mowę dla OpenClaw. Plugin może renderować zwykłe odpowiedzi audio (WAV), wyjście Opus zgodne z notatkami głosowymi oraz dźwięk u-law 8 kHz dla powierzchni telefonicznych.

| Właściwość       | Wartość                              |
| ------------- | ------------------------------------ |
| Identyfikator dostawcy | `gradium`                            |
| Uwierzytelnianie          | `GRADIUM_API_KEY` lub konfiguracja `apiKey` |
| Bazowy URL      | `https://api.gradium.ai` (domyślnie)   |
| Domyślny głos | `Emma` (`YTpq7expH9539ERJ`)          |

## Zainstaluj Plugin

Zainstaluj oficjalny Plugin, a następnie zrestartuj Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Konfiguracja

Utwórz klucz API Gradium, a następnie udostępnij go OpenClaw za pomocą zmiennej środowiskowej albo klucza konfiguracji.

<Tabs>
  <Tab title="Zmienna środowiskowa">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Klucz konfiguracji">
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

Plugin najpierw sprawdza rozpoznany `apiKey`, a następnie wraca do zmiennej środowiskowej `GRADIUM_API_KEY`.

## Konfiguracja

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Klucz                                             | Typ   | Opis                                                                                   |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Rozpoznany klucz API. Obsługuje `${ENV}` i odwołania do sekretów.                                          |
| `messages.tts.providers.gradium.baseUrl`        | string | Nadpisuje origin API. Końcowe ukośniki są usuwane. Domyślnie `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | Domyślny identyfikator głosu używany, gdy nie ma nadpisania dyrektywą.                                  |

Format wyjściowego dźwięku jest wybierany automatycznie przez runtime na podstawie docelowej powierzchni i nie można go skonfigurować w `openclaw.json`. Zobacz [Wyjście](#output) poniżej.

## Głosy

| Nazwa      | Identyfikator głosu           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Domyślny głos: Emma.

### Nadpisanie głosu dla pojedynczej wiadomości

Gdy aktywna polityka mowy zezwala na nadpisania głosu, możesz przełączać głosy w treści za pomocą tokenu dyrektywy. Użyj `speakerVoiceId` dla natywnych identyfikatorów głosu dostawcy.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Jeśli polityka mowy wyłącza nadpisania głosu, dyrektywa zostaje przetworzona, ale zignorowana.

## Wyjście

Runtime wybiera format wyjściowy na podstawie docelowej powierzchni. Dostawca obecnie nie syntetyzuje innych formatów.

| Cel         | Format      | Rozszerzenie pliku | Częstotliwość próbkowania | Flaga zgodności z głosem |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| Standardowy dźwięk | `wav`       | `.wav`   | dostawca    | nie                    |
| Notatka głosowa     | `opus`      | `.opus`  | dostawca    | tak                   |
| Telefonia      | `ulaw_8000` | n/d      | 8 kHz       | n/d                   |

## Kolejność automatycznego wyboru

Wśród skonfigurowanych dostawców TTS kolejność automatycznego wyboru Gradium to `30`. Zobacz [Zamiana tekstu na mowę](/pl/tools/tts), aby dowiedzieć się, jak OpenClaw wybiera aktywnego dostawcę, gdy `messages.tts.provider` nie jest przypięty.

## Powiązane

- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Przegląd multimediów](/pl/tools/media-overview)
