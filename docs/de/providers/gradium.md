---
read_when:
    - Sie möchten Gradium für Text-to-Speech
    - Sie benötigen eine Konfiguration für Gradium-API-Schlüssel, Stimme oder Direktiven-Token
summary: Gradium-Text-to-Speech in OpenClaw verwenden
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:04:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) ist ein Text-to-Speech-Provider für OpenClaw. Das Plugin kann normale Audioantworten (WAV), mit Sprachnotizen kompatible Opus-Ausgabe und 8-kHz-u-law-Audio für Telefonie-Oberflächen erzeugen.

| Eigenschaft    | Wert                                 |
| -------------- | ------------------------------------ |
| Provider-ID    | `gradium`                            |
| Auth           | `GRADIUM_API_KEY` oder config `apiKey` |
| Basis-URL      | `https://api.gradium.ai` (Standard)  |
| Standardstimme | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie dann den Gateway neu:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Einrichtung

Erstellen Sie einen Gradium-API-Schlüssel und stellen Sie ihn OpenClaw dann entweder über eine Umgebungsvariable oder den Konfigurationsschlüssel bereit.

<Tabs>
  <Tab title="Umgebungsvariable">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Konfigurationsschlüssel">
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

Das Plugin prüft zuerst den aufgelösten `apiKey` und fällt auf die Umgebungsvariable `GRADIUM_API_KEY` zurück.

## Konfiguration

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

| Schlüssel                                       | Typ    | Beschreibung                                                                                 |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Aufgelöster API-Schlüssel. Unterstützt `${ENV}` und secret refs.                             |
| `messages.tts.providers.gradium.baseUrl`        | string | Überschreibt den API-Ursprung. Abschließende Schrägstriche werden entfernt. Standard ist `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | Standard-Stimmen-ID, die verwendet wird, wenn keine Direktivenüberschreibung vorhanden ist.   |

Das Ausgabeaudioformat wird von der Runtime automatisch anhand der Zieloberfläche ausgewählt und ist nicht über `openclaw.json` konfigurierbar. Siehe [Ausgabe](#output) unten.

## Stimmen

| Name      | Stimmen-ID         |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Standardstimme: Emma.

### Stimmüberschreibung pro Nachricht

Wenn die aktive Sprachrichtlinie Stimmüberschreibungen erlaubt, können Sie Stimmen inline mit einem Direktiven-Token wechseln. Verwenden Sie `speakerVoiceId` für Provider-native Stimmen-IDs.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Wenn die Sprachrichtlinie Stimmüberschreibungen deaktiviert, wird die Direktive verarbeitet, aber ignoriert.

## Ausgabe

Die Runtime wählt das Ausgabeformat anhand der Zieloberfläche aus. Der Provider synthetisiert derzeit keine anderen Formate.

| Ziel           | Format      | Dateiendung | Abtastrate | Sprachnotiz-kompatibles Flag |
| -------------- | ----------- | ----------- | ---------- | ---------------------------- |
| Standardaudio  | `wav`       | `.wav`      | Provider   | nein                         |
| Sprachnotiz    | `opus`      | `.opus`     | Provider   | ja                           |
| Telefonie      | `ulaw_8000` | n/a         | 8 kHz      | n/a                          |

## Reihenfolge der automatischen Auswahl

Unter den konfigurierten TTS-Providern hat Gradium die automatische Auswahlreihenfolge `30`. Unter [Text-to-Speech](/de/tools/tts) erfahren Sie, wie OpenClaw den aktiven Provider auswählt, wenn `messages.tts.provider` nicht festgelegt ist.

## Verwandte Themen

- [Text-to-Speech](/de/tools/tts)
- [Medienübersicht](/de/tools/media-overview)
