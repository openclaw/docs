---
read_when:
    - Sie möchten Gradium für Text-to-Speech
    - Sie benötigen einen Gradium-API-Schlüssel, eine Stimme oder eine Direktive-Token-Konfiguration
summary: Gradium-Text-to-Speech in OpenClaw verwenden
title: Gradium
x-i18n:
    generated_at: "2026-05-10T19:49:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c79da6ec63532061a8112965a679f1113bbefcc91ee00def8153dd39b5b5e58
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) ist ein gebündelter Text-to-Speech-Provider für OpenClaw. Das Plugin kann normale Audioantworten (WAV), mit Sprachnotizen kompatible Opus-Ausgabe und 8-kHz-u-law-Audio für Telefonie-Oberflächen erzeugen.

| Eigenschaft      | Wert                                 |
| ---------------- | ------------------------------------ |
| Provider-ID      | `gradium`                            |
| Authentifizierung | `GRADIUM_API_KEY` oder Konfiguration `apiKey` |
| Basis-URL        | `https://api.gradium.ai` (Standard)  |
| Standardstimme   | `Emma` (`YTpq7expH9539ERJ`)          |

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
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Schlüssel                                | Typ    | Beschreibung                                                                                 |
| ---------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`  | string | Aufgelöster API-Schlüssel. Unterstützt `${ENV}` und Secret-Referenzen.                       |
| `messages.tts.providers.gradium.baseUrl` | string | Überschreibt den API-Ursprung. Abschließende Schrägstriche werden entfernt. Standard ist `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.voiceId` | string | Standardstimmen-ID, die verwendet wird, wenn keine Direktivenüberschreibung vorhanden ist.   |

Das Ausgabeaudioformat wird von der Runtime automatisch basierend auf der Zieloberfläche ausgewählt und ist nicht über `openclaw.json` konfigurierbar. Siehe unten [Ausgabe](#output).

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

### Stimmenüberschreibung pro Nachricht

Wenn die aktive Sprachrichtlinie Stimmenüberschreibungen erlaubt, können Sie Stimmen inline mit einem Direktiven-Token wechseln. Alle diese Angaben werden zur selben `voiceId`-Überschreibung aufgelöst:

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Wenn die Sprachrichtlinie Stimmenüberschreibungen deaktiviert, wird die Direktive verbraucht, aber ignoriert.

## Ausgabe

Die Runtime wählt das Ausgabeformat anhand der Zieloberfläche aus. Der Provider erzeugt derzeit keine anderen Formate.

| Ziel            | Format      | Dateiendung | Abtastrate | Mit Stimme kompatibles Flag |
| --------------- | ----------- | ----------- | ---------- | --------------------------- |
| Standardaudio   | `wav`       | `.wav`      | Provider   | nein                        |
| Sprachnotiz     | `opus`      | `.opus`     | Provider   | ja                          |
| Telefonie       | `ulaw_8000` | n/a         | 8 kHz      | n/a                         |

## Reihenfolge der automatischen Auswahl

Unter den konfigurierten TTS-Providern hat Gradium die automatische Auswahlreihenfolge `30`. Unter [Text-to-Speech](/de/tools/tts) erfahren Sie, wie OpenClaw den aktiven Provider auswählt, wenn `messages.tts.provider` nicht festgelegt ist.

## Verwandte Themen

- [Text-to-Speech](/de/tools/tts)
- [Medienübersicht](/de/tools/media-overview)
