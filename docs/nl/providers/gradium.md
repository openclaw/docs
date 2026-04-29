---
read_when:
    - Je wilt Gradium gebruiken voor tekst-naar-spraak
    - Je hebt een Gradium API-sleutel of spraakconfiguratie nodig
summary: Gebruik tekst-naar-spraak van Gradium in OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-29T23:10:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 16
---

Gradium is een meegeleverde tekst-naar-spraakprovider voor OpenClaw. Het kan normale audioreacties, Opus-uitvoer die compatibel is met spraaknotities, en 8 kHz u-law-audio voor telefonieoppervlakken genereren.

## Configuratie

Maak een Gradium API-sleutel aan en stel deze vervolgens beschikbaar aan OpenClaw:

```bash
export GRADIUM_API_KEY="gsk_..."
```

Je kunt de sleutel ook opslaan in de configuratie onder `messages.tts.providers.gradium.apiKey`.

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

## Stemmen

| Naam      | Stem-ID            |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Standaardstem: Emma.

## Uitvoer

- Audiobestandreacties gebruiken WAV.
- Spraaknotitiereacties gebruiken Opus en zijn gemarkeerd als stemcompatibel.
- Telefoniesynthese gebruikt `ulaw_8000` op 8 kHz.

## Gerelateerd

- [Tekst-naar-spraak](/nl/tools/tts)
- [Media-overzicht](/nl/tools/media-overview)
