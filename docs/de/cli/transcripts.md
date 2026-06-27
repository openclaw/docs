---
read_when:
    - Sie möchten gespeicherte Transkriptzusammenfassungen im Terminal lesen
    - Sie benötigen den Pfad zu einer Markdown-Zusammenfassung der Transkripte.
    - Sie debuggen das Speicherlayout der Kern-Transkripte
summary: CLI-Referenz für `openclaw transcripts` (gespeicherte Transkripte auflisten, anzeigen und lokalisieren)
title: Transkripte-CLI
x-i18n:
    generated_at: "2026-06-27T17:21:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Prüfen Sie Transkripte, die vom zentralen `transcripts`-Tool von OpenClaw geschrieben wurden. Diese CLI ist
schreibgeschützt; Erfassung, Import und Zusammenfassung gehören zum Agent-Tool und
zu den konfigurierten Auto-Start-Quellen.

Verwenden Sie die CLI, wenn Sie die Notizen von gestern finden, die Markdown-Datei in
einem Editor öffnen, ein Transkript an ein anderes Tool übergeben oder debuggen möchten,
wo eine Sitzung auf der Festplatte gelandet ist. Sie startet oder stoppt keine Erfassung.

Artefakte liegen unter dem OpenClaw-State-Verzeichnis:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Das Standard-State-Verzeichnis ist `~/.openclaw`; setzen Sie `OPENCLAW_STATE_DIR`, um ein
anderes zu verwenden. Das Datumsverzeichnis stammt aus der Startzeit der Sitzung, und das
Sitzungsverzeichnis ist ein sicheres Dateisystemsegment, das aus der Sitzungs-ID abgeleitet wird.

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

- `list`: gespeicherte Sitzungen, datumqualifizierten Selektor, Startzeit, Titel und `summary.md`-Pfad auflisten.
- `show <session>`: die gespeicherte `summary.md` ausgeben.
- `path <session>`: den `summary.md`-Pfad ausgeben.
- `path <session> --dir`: das Sitzungsverzeichnis ausgeben.
- `path <session> --metadata`: `metadata.json` ausgeben.
- `path <session> --transcript`: `transcript.jsonl` ausgeben.
- `--json`: maschinenlesbare Ausgabe ausgeben.

Wenn sich eine menschenlesbare Sitzungs-ID über mehrere Tage wiederholt, verwenden Sie den datumqualifizierten Selektor
aus `list`, zum Beispiel `openclaw transcripts show 2026-05-22/standup`.
Standard-Sitzungs-IDs enthalten einen Zeitstempel und ein zufälliges Suffix; konfigurieren Sie feste
Sitzungs-IDs nur, wenn sie innerhalb des Tages eindeutig sind.

## Ausgabe

`list` gibt eine Sitzung pro Zeile aus:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Die Ausgabe ist tabulatorgetrennt. Die Spalten sind Selektor, Startzeit, Titel und
Zusammenfassungspfad. Der Selektor ist der sicherste Wert, um ihn an `show` oder `path` zurückzugeben.

`list --json` gibt Objekte mit folgenden Feldern aus:

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` gibt die gespeicherten Sitzungsmetadaten, den Selektor, das Sitzungsverzeichnis,
den Zusammenfassungspfad und den Markdown-Text der Zusammenfassung zurück. `path --json` gibt den ausgewählten Pfad
und zurück, ob diese Datei existiert.

## Viele Meetings pro Tag

Transcripts gruppiert Sitzungen nach Datum und dann nach Sitzungs-ID. Zehn Meetings an einem
Tag werden zu zehn Geschwisterordnern:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Verwenden Sie für die meisten Automatisierungen die standardmäßig generierten IDs. Verwenden Sie eine feste ID wie `standup`
nur, wenn dieselbe ID am selben Datum nicht zweimal verwendet wird.

## Fehlende Zusammenfassungen

Live-Sitzungen schreiben `summary.md`, wenn die Sitzung stoppt. Importierte Transkripte
schreiben `summary.md` unmittelbar nach dem Import. Eine Sitzung kann dennoch in
`list` ohne Zusammenfassung erscheinen, wenn die Erfassung aktiv ist, ein Provider beim Stoppen fehlgeschlagen ist
oder Metadaten geschrieben wurden, bevor Äußerungen eingegangen sind.

Verwenden Sie `path <session> --transcript`, um das nur erweiterte Transkript zu prüfen, und verwenden Sie
die `summarize`-Aktion des `transcripts`-Tools, um die Markdown-Zusammenfassung neu zu generieren.

## Konfiguration

Die Transkripterfassung ist opt-in, da Live-Quellen Meeting-Audio beitreten und aufzeichnen können.
Aktivieren Sie das Tool mit dem obersten `transcripts.enabled`:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

Konfigurieren Sie Auto-Start-Quellen mit `transcripts.autoStart` in `openclaw.json`.
Jeder Eintrag wird durch seine Anwesenheit aktiviert; lassen Sie einen Eintrag weg, um diese Quelle zu deaktivieren.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
