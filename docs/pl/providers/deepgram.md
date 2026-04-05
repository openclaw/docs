---
read_when:
    - Chcesz używać Deepgram speech-to-text dla załączników audio
    - Potrzebujesz szybkiego przykładu konfiguracji Deepgram
summary: Transkrypcja Deepgram dla przychodzących notatek głosowych
title: Deepgram
x-i18n:
    generated_at: "2026-04-05T14:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (transkrypcja audio)

Deepgram to API speech-to-text. W OpenClaw jest używane do **transkrypcji przychodzącego audio/notatek głosowych**
przez `tools.media.audio`.

Po włączeniu OpenClaw przesyła plik audio do Deepgram i wstrzykuje transkrypcję
do pipeline’u odpowiedzi (`{{Transcript}}` + blok `[Audio]`). To **nie jest streaming**;
używany jest endpoint transkrypcji nagrań wstępnie zarejestrowanych.

Strona: [https://deepgram.com](https://deepgram.com)  
Dokumentacja: [https://developers.deepgram.com](https://developers.deepgram.com)

## Szybki start

1. Ustaw klucz API:

```
DEEPGRAM_API_KEY=dg_...
```

2. Włącz providera:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Opcje

- `model`: identyfikator modelu Deepgram (domyślnie: `nova-3`)
- `language`: wskazówka językowa (opcjonalnie)
- `tools.media.audio.providerOptions.deepgram.detect_language`: włącz wykrywanie języka (opcjonalnie)
- `tools.media.audio.providerOptions.deepgram.punctuate`: włącz interpunkcję (opcjonalnie)
- `tools.media.audio.providerOptions.deepgram.smart_format`: włącz inteligentne formatowanie (opcjonalnie)

Przykład z językiem:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Przykład z opcjami Deepgram:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Uwagi

- Uwierzytelnianie podąża za standardową kolejnością auth providerów; `DEEPGRAM_API_KEY` to najprostsza ścieżka.
- Nadpisuj endpointy lub nagłówki przez `tools.media.audio.baseUrl` i `tools.media.audio.headers`, gdy używasz proxy.
- Wynik podlega tym samym regułom audio co u innych providerów (limity rozmiaru, timeouty, wstrzykiwanie transkryptu).
