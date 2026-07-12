---
read_when:
    - Sie möchten gespeicherte Transkriptzusammenfassungen im Terminal lesen
    - Sie benötigen den Pfad zu einer Markdown-Zusammenfassung der Transkripte.
    - Sie debuggen das Speicherlayout der Kerntranskripte
summary: CLI-Referenz für `openclaw transcripts` (gespeicherte Transkripte auflisten, anzeigen und lokalisieren)
title: Transkript-CLI
x-i18n:
    generated_at: "2026-07-12T15:15:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Schreibgeschützter Inspektor für Transkripte, die vom Agent-Tool `transcripts` geschrieben wurden.
Erfassung, Import und Zusammenfassung erfolgen über dieses Tool, nicht über diese CLI.

Artefakte befinden sich im Zustandsverzeichnis:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Das standardmäßige Zustandsverzeichnis ist `~/.openclaw`; überschreiben Sie es mit `OPENCLAW_STATE_DIR`.
Das Datumsverzeichnis wird aus der Startzeit der Sitzung abgeleitet; das Sitzungsverzeichnis ist
ein dateisystemsicherer Slug, der aus der Sitzungs-ID abgeleitet wird.

## Befehle

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| Befehl                        | Beschreibung                                         |
| ----------------------------- | ---------------------------------------------------- |
| `list`                        | Gespeicherte Sitzungen auflisten.                    |
| `show <session>`              | Die gespeicherte `summary.md` ausgeben.              |
| `path <session>`              | Den Pfad zu `summary.md` ausgeben.                   |
| `path <session> --dir`        | Das Sitzungsverzeichnis ausgeben.                    |
| `path <session> --metadata`   | `metadata.json` ausgeben.                            |
| `path <session> --transcript` | `transcript.jsonl` ausgeben.                         |
| `--json`                      | Maschinenlesbare Ausgabe erzeugen (jeder Unterbefehl). |

`<session>` akzeptiert entweder eine reine Sitzungs-ID oder einen datumsqualifizierten Selektor
(`YYYY-MM-DD/<session>`). Verwenden Sie die qualifizierte Form, wenn dieselbe Sitzungs-ID
an mehr als einem Tag vorkommt, zum Beispiel `openclaw transcripts show
2026-05-22/standup`. Standardmäßige Sitzungs-IDs enthalten einen Zeitstempel und ein zufälliges
Suffix; weisen Sie einer Sitzung nur dann eine feste ID zu, wenn diese ID innerhalb des Tages eindeutig ist.

## Ausgabe

`list` gibt pro Sitzung eine tabulatorgetrennte Zeile aus: Selektor, Startzeit, Titel,
Zusammenfassungspfad.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Wöchentliches Stand-up  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Der Selektor ist der sicherste Wert, den Sie wieder an `show` oder `path` übergeben können.

`list --json` gibt Objekte mit `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary` zurück.

`show --json` gibt die gespeicherten Sitzungsmetadaten, den Selektor, das Sitzungs-
verzeichnis, den Zusammenfassungspfad und den Markdown-Text der Zusammenfassung zurück.

`path --json` gibt den ausgewählten Pfad zurück und ob diese Datei vorhanden ist.

## Viele Sitzungen pro Tag

Sitzungen werden zuerst nach Datum und dann nach Sitzungs-ID gruppiert. Aus zehn Besprechungen an einem Tag werden
zehn gleichgeordnete Ordner:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Verwenden Sie für Automatisierungen standardmäßig generierte IDs. Verwenden Sie eine feste ID wie `standup` nur,
wenn sie am selben Datum nicht erneut vorkommt.

## Fehlende Zusammenfassungen

Live-Sitzungen schreiben `summary.md`, wenn die Sitzung beendet wird; importierte Transkripte
schreiben sie unmittelbar nach dem Import. Eine Sitzung kann ohne
Zusammenfassung in `list` erscheinen, solange die Erfassung noch aktiv ist, wenn ein Provider beim Beenden fehlgeschlagen ist oder wenn
Metadaten geschrieben wurden, bevor Äußerungen eingegangen sind.

Verwenden Sie `path <session> --transcript`, um das rohe, nur durch Anhängen erweiterte Transkript zu prüfen,
oder führen Sie die Aktion `summarize` des Tools `transcripts` aus, um die Markdown-
Zusammenfassung neu zu erzeugen.

## Konfiguration

Die Erfassung ist optional (Live-Quellen können beitreten und Besprechungsaudio aufzeichnen). Aktivieren Sie sie
mit:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (Standardwert `false`): das Tool aktivieren.
- `maxUtterances` (Standardwert `2000`, begrenzt auf 1-10000): Größe des Äußerungspuffers pro
  Sitzung.

Konfigurieren Sie automatisch gestartete Quellen mit `transcripts.autoStart`. Jeder Eintrag wird
durch sein Vorhandensein aktiviert; lassen Sie einen Eintrag weg, um diese Quelle zu deaktivieren. `discord-voice`
ist die gebündelte Quelle mit Unterstützung für automatischen Start und erfordert `guildId` und
`channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
