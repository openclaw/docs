---
read_when:
    - Sie möchten Gradium für die Text-zu-Sprache-Umwandlung verwenden
    - Sie benötigen einen Gradium-API-Schlüssel, eine Stimme oder eine Direktiven-Token-Konfiguration
summary: Gradium-Text-to-Speech in OpenClaw verwenden
title: Gradium
x-i18n:
    generated_at: "2026-07-24T05:19:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5536426eb6d3c8f24c04643b033ebb519a1f2f9df9d97c917ced1c7e23ad180d
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) ist ein Text-to-Speech-Provider für OpenClaw. Er erzeugt standardmäßige Audioantworten (WAV), mit Sprachnachrichten kompatible Opus-Ausgaben und 8-kHz-u-law-Audio für Telefonie-Oberflächen.

| Eigenschaft    | Wert                                 |
| -------------- | ------------------------------------ |
| Provider-ID    | `gradium`                   |
| Authentifizierung | `GRADIUM_API_KEY` oder Konfiguration `apiKey` |
| Basis-URL      | `https://api.gradium.ai` (Standard)        |
| Standardstimme | `Emma` (`YTpq7expH9539ERJ`) |

## Plugin installieren

Gradium ist ein offizielles externes Plugin. Installieren Sie es und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Einrichtung

Erstellen Sie einen Gradium-API-Schlüssel und stellen Sie ihn anschließend über eine Umgebungsvariable oder den Konfigurationsschlüssel bereit. Die Konfiguration hat Vorrang vor der Umgebungsvariable.

<Tabs>
  <Tab title="Umgebungsvariable">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Konfigurationsschlüssel">
    ```json5
    {
      tts: {
        auto: "always",
        provider: "gradium",
        providers: {
          gradium: {
            apiKey: "${GRADIUM_API_KEY}",
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Konfiguration

```json5
{
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
}
```

| Schlüssel                              | Typ    | Beschreibung                                                                                            |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `tts.providers.gradium.apiKey`                    | string | Aufgelöster API-Schlüssel. Unterstützt `${ENV}` und Secret-Referenzen.                       |
| `tts.providers.gradium.baseUrl`                    | string | HTTPS-URL der Gradium-API unter `api.gradium.ai`. Abschließende Schrägstriche werden entfernt. Standard: `https://api.gradium.ai`. |
| `tts.providers.gradium.speakerVoiceId`                    | string | Standardmäßig verwendete Stimm-ID, wenn keine Direktivenüberschreibung vorhanden ist.                  |

Das Ausgabeformat wird automatisch anhand der Zieloberfläche ausgewählt (siehe [Ausgabe](#output)) und kann in `openclaw.json` nicht konfiguriert werden.

## Stimmen

| Name               | Stimm-ID           |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(Standard)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### Stimme pro Nachricht überschreiben

Wenn die aktive Sprachrichtlinie Stimmüberschreibungen zulässt, können Sie die Stimme inline mit einem Direktiven-Token wechseln (alle folgenden Varianten sind gleichwertig und erwarten eine Provider-native Stimm-ID):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Wenn die Sprachrichtlinie Stimmüberschreibungen deaktiviert, wird die Direktive verarbeitet, aber ignoriert.

## Ausgabe

Das Ausgabeformat wird anhand der Zieloberfläche ausgewählt; der Provider synthetisiert keine anderen Formate.

| Ziel           | Format      | Dateierweiterung | Abtastrate | Sprachkompatibilitäts-Flag |
| -------------- | ----------- | ---------------- | ---------- | -------------------------- |
| Standardaudio  | `wav` | `.wav` | Provider   | nein                       |
| Sprachnachricht | `opus` | `.opus` | Provider   | ja                         |
| Telefonie      | `ulaw_8000` | nicht zutreffend | 8 kHz      | nicht zutreffend           |

## Reihenfolge der automatischen Auswahl

Unter den konfigurierten TTS-Providern hat Gradium bei der automatischen Auswahl die Position `30`. Unter [Text-to-Speech](/de/tools/tts) erfahren Sie, wie OpenClaw den aktiven Provider auswählt, wenn `tts.provider` nicht festgelegt ist.

## Verwandte Themen

- [Text-to-Speech](/de/tools/tts)
- [Medienübersicht](/de/tools/media-overview)
