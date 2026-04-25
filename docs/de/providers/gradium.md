---
read_when:
    - Sie möchten Gradium für Text-to-Speech verwenden.
    - Sie benötigen einen Gradium-API-Schlüssel oder eine Sprachkonfiguration.
summary: Gradium Text-to-Speech in OpenClaw verwenden
title: Gradium
x-i18n:
    generated_at: "2026-04-25T13:54:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium ist ein gebündelter Text-to-Speech-Anbieter für OpenClaw. Er kann normale Audioantworten, mit Sprachnachrichten kompatible Opus-Ausgabe und 8-kHz-u-law-Audio für Telefonie-Oberflächen erzeugen.

## Einrichtung

Erstellen Sie einen Gradium-API-Schlüssel und machen Sie ihn dann für OpenClaw verfügbar:

```bash
export GRADIUM_API_KEY="gsk_..."
```

Sie können den Schlüssel auch in der Konfiguration unter `messages.tts.providers.gradium.apiKey` speichern.

## Konfiguration

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

## Stimmen

| Name      | Sprach-ID          |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Standardstimme: Emma.

## Ausgabe

- Antworten als Audiodatei verwenden WAV.
- Antworten als Sprachnotiz verwenden Opus und sind als sprachkompatibel gekennzeichnet.
- Telefonsynthese verwendet `ulaw_8000` bei 8 kHz.

## Verwandt

- [Text-to-Speech](/de/tools/tts)
- [Medienübersicht](/de/tools/media-overview)
