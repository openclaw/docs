---
read_when:
    - Chcesz używać Gradium do zamiany tekstu na mowę
    - Potrzebna jest konfiguracja klucza API Gradium, głosu lub tokenu dyrektywy
summary: Używanie zamiany tekstu na mowę Gradium w OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-16T18:54:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) to dostawca zamiany tekstu na mowę dla OpenClaw. Generuje standardowe odpowiedzi dźwiękowe (WAV), dane wyjściowe Opus zgodne z wiadomościami głosowymi oraz dźwięk u-law 8 kHz dla interfejsów telefonicznych.

| Właściwość        | Wartość                              |
| ----------------- | ------------------------------------ |
| Identyfikator dostawcy | `gradium`                            |
| Uwierzytelnianie  | `GRADIUM_API_KEY` lub konfiguracja `apiKey` |
| Bazowy adres URL  | `https://api.gradium.ai` (domyślnie)   |
| Domyślny głos     | `Emma` (`YTpq7expH9539ERJ`)          |

## Instalacja pluginu

Gradium jest oficjalnym zewnętrznym pluginem. Zainstaluj go, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Konfiguracja początkowa

Utwórz klucz API Gradium, a następnie udostępnij go za pomocą zmiennej środowiskowej lub klucza konfiguracji. Konfiguracja ma pierwszeństwo przed zmienną środowiskową.

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

| Klucz                                           | Typ    | Opis                                                                                                    |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | ciąg znaków | Rozpoznany klucz API. Obsługuje `${ENV}` oraz odwołania do sekretów.                                                    |
| `messages.tts.providers.gradium.baseUrl`        | ciąg znaków | Adres URL HTTPS interfejsu API Gradium w `api.gradium.ai`. Końcowe ukośniki są usuwane. Wartość domyślna: `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | ciąg znaków | Domyślny identyfikator głosu używany, gdy dyrektywa nie określa innej wartości.                                            |

Format wyjściowy jest wybierany automatycznie na podstawie interfejsu docelowego (zobacz [Dane wyjściowe](#output)) i nie można go skonfigurować w `openclaw.json`.

## Głosy

| Nazwa              | Identyfikator głosu |
| ------------------ | ------------------- |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(domyślnie)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### Zmiana głosu dla poszczególnych wiadomości

Gdy aktywna polityka mowy zezwala na zmianę głosu, można zmienić głos bezpośrednio w treści za pomocą tokenu dyrektywy (wszystkie poniższe formy są równoważne i przyjmują natywny dla dostawcy identyfikator głosu):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Jeśli polityka mowy wyłącza zmianę głosu, dyrektywa jest przetwarzana, ale ignorowana.

## Dane wyjściowe

Format wyjściowy jest wybierany na podstawie interfejsu docelowego; dostawca nie generuje innych formatów.

| Cel                    | Format      | Rozszerzenie pliku | Częstotliwość próbkowania | Flaga zgodności z wiadomościami głosowymi |
| ---------------------- | ----------- | ------------------ | ------------------------- | ----------------------------------------- |
| Standardowy dźwięk     | `wav`       | `.wav`   | dostawca                  | nie                                       |
| Wiadomość głosowa      | `opus`      | `.opus`  | dostawca                  | tak                                       |
| Telefonia              | `ulaw_8000` | nie dotyczy        | 8 kHz                     | nie dotyczy                               |

## Kolejność automatycznego wyboru

Wśród skonfigurowanych dostawców TTS pozycja Gradium w kolejności automatycznego wyboru to `30`. Informacje o tym, jak OpenClaw wybiera aktywnego dostawcę, gdy `messages.tts.provider` nie jest przypięty, znajdują się w sekcji [Zamiana tekstu na mowę](/pl/tools/tts).

## Powiązane materiały

- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Przegląd multimediów](/pl/tools/media-overview)
