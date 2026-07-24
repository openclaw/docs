---
read_when:
    - Sie möchten gespeicherte Transkriptzusammenfassungen im Terminal lesen
    - Sie benötigen den Pfad zu einer Markdown-Zusammenfassung der Transkripte
    - Sie debuggen das Speicherlayout der Kerntranskripte
summary: CLI-Referenz für `openclaw transcripts` (gespeicherte Transkripte auflisten, anzeigen und exportieren)
title: Transkript-CLI
x-i18n:
    generated_at: "2026-07-24T03:47:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c04ba637fb46ec271383b2f0d17655e18018e07f489c34dc3fd14ad926f27aa4
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Inspektions- und Exportbefehl für dauerhaft gespeicherte Besprechungstranskripte. Browser-Teilnehmer von Google Meet,
Microsoft Teams und Zoom erfassen automatisch Notizen;
das Agent-Tool `transcripts` unterstützt außerdem die Erfassung durch Provider und den manuellen Import.

Der kanonische Transkriptstatus befindet sich in der gemeinsam genutzten SQLite-Datenbank unter
`$OPENCLAW_STATE_DIR/state/openclaw.sqlite`. `show` und `path`
materialisieren explizit benutzerseitige Artefakte unter dem Statusverzeichnis:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Diese Dateien sind Exporte und kein zweiter Laufzeitspeicher. OpenClaw liest sie
während der Erfassung, Zusammenfassung oder Auflistung nicht wieder ein. Das standardmäßige Statusverzeichnis ist
`~/.openclaw`; überschreiben Sie es mit `OPENCLAW_STATE_DIR`. Das Datumsverzeichnis wird
aus der Startzeit der Sitzung abgeleitet; das Sitzungsverzeichnis ist ein dateisystemsicherer Slug,
der aus der Sitzungs-ID abgeleitet wird.

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

| Befehl                       | Beschreibung                                          |
| ----------------------------- | ---------------------------------------------------- |
| `list`                        | Gespeicherte Sitzungen auflisten.                                |
| `show <session>`              | `summary.md` ausgeben und materialisieren.                  |
| `path <session>`              | Den Pfad `summary.md` materialisieren und ausgeben.         |
| `path <session> --dir`        | Alle Artefakte materialisieren und ihr Verzeichnis ausgeben. |
| `path <session> --metadata`   | `metadata.json` materialisieren und ausgeben.               |
| `path <session> --transcript` | `transcript.jsonl` materialisieren und ausgeben.            |
| `--json`                      | Maschinenlesbare Ausgabe erzeugen (beliebiger Unterbefehl).      |

`<session>` akzeptiert entweder eine einfache Sitzungs-ID oder einen datumsqualifizierten Selektor
(`YYYY-MM-DD/<session>`). Verwenden Sie die qualifizierte Form, wenn dieselbe Sitzungs-ID
an mehr als einem Tag vorkommt, beispielsweise `openclaw transcripts show
2026-05-22/standup`. Standardmäßige Sitzungs-IDs enthalten einen Zeitstempel und ein zufälliges
Suffix; weisen Sie einer Sitzung nur dann eine feste ID zu, wenn diese ID innerhalb des Tages eindeutig ist.

## Ausgabe

`list` gibt pro Sitzung eine tabulatorgetrennte Zeile aus: Selektor, Startzeit, Titel,
Zusammenfassungspfad.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Wöchentliches Stand-up  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Der Selektor ist der sicherste Wert, der wieder an `show` oder `path` übergeben werden kann.

`list --json` gibt Objekte mit `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary` zurück.
Gespeicherte Quell-URLs von Besprechungen enthalten nur den Ursprung und den Pfad; Abfragezeichenfolgen,
Fragmente und eingebettete Anmeldedaten werden vor der Persistierung entfernt.

`show --json` gibt die gespeicherten Sitzungsmetadaten, den Selektor, das Sitzungsverzeichnis,
den Zusammenfassungspfad und den Markdown-Text der Zusammenfassung zurück.

`path --json` gibt den ausgewählten Pfad zurück und gibt an, ob dieses Artefakt
materialisiert werden konnte. Metadaten- und Transkriptexporte sind für eine gespeicherte
Sitzung immer vorhanden; ein Zusammenfassungspfad meldet `exists: false`, bis die Sitzung über eine Zusammenfassung verfügt.

## Viele Sitzungen pro Tag

Sitzungen werden zuerst nach Datum und dann nach Sitzungs-ID gruppiert. Zehn Besprechungen an einem Tag ergeben
zehn gleichgeordnete Ordner:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Verwenden Sie standardmäßig generierte IDs für die Automatisierung. Verwenden Sie eine feste ID wie `standup` nur,
wenn sie sich am selben Datum nicht wiederholt.

## Fehlende Zusammenfassungen

Live-Sitzungen speichern und materialisieren `summary.md`, wenn die Sitzung beendet wird;
importierte Transkripte tun dies unmittelbar nach dem Import. Eine Sitzung kann ohne
Zusammenfassung in `list` erscheinen, während die Erfassung noch aktiv ist, wenn ein Provider
beim Beenden fehlgeschlagen ist oder wenn Metadaten gespeichert wurden, bevor Äußerungen eingegangen sind.

Verwenden Sie `path <session> --transcript`, um das rohe, ausschließlich angehängte Transkript zu untersuchen,
oder führen Sie die Aktion `summarize` des Tools `transcripts` aus, um die Markdown-
Zusammenfassung neu zu generieren.

## Upgrade des veralteten Dateispeichers

OpenClaw-Versionen, die älter als der SQLite-Speicher sind, schrieben den kanonischen Laufzeitstatus
direkt unter `$OPENCLAW_STATE_DIR/transcripts/`. Führen Sie Folgendes aus:

```bash
openclaw doctor --fix
```

Doctor importiert den vollständigen veralteten Verzeichnisbaum in SQLite, überprüft Zeilenanzahl und
Reihenfolge, zeichnet Migrationsbelege auf und verschiebt den überprüften Quellverzeichnisbaum in ein
mit einem Zeitstempel versehenes Archiv `transcripts.migrated-*`. Laufzeitbefehle greifen nicht auf
die veralteten Dateien zurück. Bewahren Sie das Archiv auf, bis Sie die importierten
Sitzungen und alle Exporte, auf die Sie angewiesen sind, überprüft haben.

## Konfiguration

Die Erfassung von Besprechungstranskripten ist standardmäßig aktiviert. So deaktivieren Sie sie global:

```json
{
  "transcripts": {
    "enabled": false
  }
}
```

- `enabled` (Standardwert `true`): Aktiviert automatische Besprechungsnotizen, das Transkript-
Tool und konfigurierte Quellen für den automatischen Start. Setzen Sie den Wert auf `false`, wenn Besprechungsnotizen
nicht auf dem Host gespeichert werden sollen. Ein explizit angeforderter Besprechungsmodus
`transcribe` behält seinen vorhandenen begrenzten Live-Untertitelverlauf bei, schreibt jedoch
keine dauerhaften Zeilen, solange diese Einstellung falsch ist.
  Konfigurieren Sie Quellen für den automatischen Start mit `transcripts.autoStart`. Jeder Eintrag wird
  durch sein Vorhandensein aktiviert; lassen Sie einen Eintrag weg, um diese Quelle zu deaktivieren. `discord-voice`
  ist die mitgelieferte Quelle mit Unterstützung für automatischen Start und erfordert `guildId` und
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

Die IDs der Besprechungs-Provider sind `google-meet`, `teams` und `zoom`. Ihre Aliasse
sind `googlemeet`/`meet`, `teams-meetings`/`microsoft-teams`/`msteams` beziehungsweise
`zoom-meetings`. Besprechungs-Provider werden an eine bereits aktive
Besprechungsbot-Sitzung angehängt; normale Beitritte zu Besprechungen benötigen keinen Eintrag `autoStart`.
