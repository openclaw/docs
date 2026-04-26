---
read_when:
    - Sie möchten Sitzungs-Routing und -Isolierung verstehen.
    - Sie möchten den DM-Bereich für Setups mit mehreren Benutzern konfigurieren.
    - Sie beheben Probleme bei täglichen oder Leerlauf-Sitzungsrücksetzungen.
summary: Wie OpenClaw Konversationssitzungen verwaltet
title: Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-26T11:27:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organisiert Konversationen in **Sitzungen**. Jede Nachricht wird anhand ihrer Herkunft an eine
Sitzung weitergeleitet -- DMs, Gruppenchats, Cron-Jobs usw.

## Wie Nachrichten weitergeleitet werden

| Quelle          | Verhalten                    |
| --------------- | ---------------------------- |
| Direktnachrichten | Standardmäßig gemeinsame Sitzung |
| Gruppenchats    | Pro Gruppe isoliert          |
| Räume/Channels  | Pro Raum isoliert            |
| Cron-Jobs       | Neue Sitzung pro Lauf        |
| Webhooks        | Pro Hook isoliert            |

## DM-Isolierung

Standardmäßig teilen sich alle DMs eine Sitzung für Kontinuität. Das ist für
Setups mit nur einem Benutzer in Ordnung.

<Warning>
Wenn mehrere Personen Ihrem Agenten Nachrichten senden können, aktivieren Sie die DM-Isolierung. Andernfalls teilen sich alle
Benutzer denselben Konversationskontext -- Alices private Nachrichten wären für Bob sichtbar.
</Warning>

**Die Lösung:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // nach Channel + Absender isolieren
  },
}
```

Weitere Optionen:

- `main` (Standard) -- alle DMs teilen sich eine Sitzung.
- `per-peer` -- nach Absender isolieren (kanalübergreifend).
- `per-channel-peer` -- nach Channel + Absender isolieren (empfohlen).
- `per-account-channel-peer` -- nach Account + Channel + Absender isolieren.

<Tip>
Wenn dieselbe Person Sie über mehrere Channels kontaktiert, verwenden Sie
`session.identityLinks`, um ihre Identitäten zu verknüpfen, damit sie sich eine Sitzung teilen.
</Tip>

Prüfen Sie Ihr Setup mit `openclaw security audit`.

## Sitzungslebenszyklus

Sitzungen werden wiederverwendet, bis sie ablaufen:

- **Tägliche Zurücksetzung** (Standard) -- neue Sitzung um 4:00 Uhr Ortszeit auf dem Gateway-
  Host. Die tägliche Frische basiert darauf, wann die aktuelle `sessionId` begonnen hat, nicht
  auf späteren Metadatenschreibvorgängen.
- **Leerlauf-Zurücksetzung** (optional) -- neue Sitzung nach einer Phase der Inaktivität. Setzen Sie
  `session.reset.idleMinutes`. Die Leerlauf-Frische basiert auf der letzten echten
  Benutzer-/Channel-Interaktion, daher halten Heartbeat-, Cron- und Exec-Systemereignisse die Sitzung nicht aktiv.
- **Manuelle Zurücksetzung** -- geben Sie `/new` oder `/reset` im Chat ein. `/new <model>` wechselt auch
  das Modell.

Wenn sowohl tägliche als auch Leerlauf-Zurücksetzungen konfiguriert sind, gilt die zuerst ablaufende.
Heartbeat-, Cron-, Exec- und andere Systemereignis-Turns können Sitzungsmetadaten schreiben,
aber diese Schreibvorgänge verlängern weder die Frische der täglichen noch der Leerlauf-Zurücksetzung. Wenn eine Zurücksetzung
die Sitzung weiterrollt, werden in der Warteschlange befindliche Hinweise zu Systemereignissen für die alte Sitzung
verworfen, damit veraltete Hintergrundaktualisierungen nicht dem ersten Prompt in
der neuen Sitzung vorangestellt werden.

Sitzungen mit einer aktiven providerseitigen CLI-Sitzung werden nicht durch den impliziten
täglichen Standard getrennt. Verwenden Sie `/reset` oder konfigurieren Sie `session.reset` explizit, wenn diese
Sitzungen per Timer ablaufen sollen.

## Wo der Zustand gespeichert wird

Der gesamte Sitzungszustand gehört dem **Gateway**. UI-Clients fragen das Gateway nach
Sitzungsdaten.

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkripte:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` führt getrennte Lebenszyklus-Zeitstempel:

- `sessionStartedAt`: wann die aktuelle `sessionId` begonnen hat; die tägliche Zurücksetzung verwendet dies.
- `lastInteractionAt`: letzte Benutzer-/Channel-Interaktion, die die Leerlauf-Lebensdauer verlängert.
- `updatedAt`: letzte Mutation der Store-Zeile; nützlich zum Auflisten und Bereinigen, aber nicht
  maßgeblich für die Frische täglicher/Leerlauf-Zurücksetzungen.

Ältere Zeilen ohne `sessionStartedAt` werden, wenn verfügbar, aus dem JSONL-
Sitzungs-Header des Transkripts aufgelöst. Wenn einer älteren Zeile auch `lastInteractionAt` fehlt,
fällt die Leerlauf-Frische auf die Startzeit dieser Sitzung zurück, nicht auf spätere Verwaltungs-Schreibvorgänge.

## Sitzungspflege

OpenClaw begrenzt den Sitzungsspeicher im Laufe der Zeit automatisch. Standardmäßig läuft es
im Modus `warn` (meldet, was bereinigt würde). Setzen Sie `session.maintenance.mode`
auf `"enforce"` für automatische Bereinigung:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Vorschau mit `openclaw sessions cleanup --dry-run`.

## Sitzungen prüfen

- `openclaw status` -- Pfad des Sitzungs-Stores und jüngste Aktivität.
- `openclaw sessions --json` -- alle Sitzungen (filtern mit `--active <minutes>`).
- `/status` im Chat -- Kontextnutzung, Modell und Umschalter.
- `/context list` -- was sich im System-Prompt befindet.

## Weiterführende Informationen

- [Session Pruning](/de/concepts/session-pruning) -- Tool-Ergebnisse trimmen
- [Compaction](/de/concepts/compaction) -- lange Konversationen zusammenfassen
- [Session Tools](/de/concepts/session-tool) -- Agenten-Tools für sitzungsübergreifende Arbeit
- [Session Management Deep Dive](/de/reference/session-management-compaction) --
  Store-Schema, Transkripte, Send-Richtlinie, Herkunftsmetadaten und erweiterte Konfiguration
- [Multi-Agent](/de/concepts/multi-agent) — Routing und Sitzungsisolierung über mehrere Agenten hinweg
- [Background Tasks](/de/automation/tasks) — wie getrennte Arbeit Task-Datensätze mit Sitzungsreferenzen erstellt
- [Channel Routing](/de/channels/channel-routing) — wie eingehende Nachrichten an Sitzungen weitergeleitet werden

## Verwandte Inhalte

- [Session pruning](/de/concepts/session-pruning)
- [Session tools](/de/concepts/session-tool)
- [Befehlswarteschlange](/de/concepts/queue)
