---
read_when:
    - Sie möchten Sitzungsrouting und -isolierung verstehen.
    - Sie möchten den DM-Bereich für Multi-User-Setups konfigurieren.
summary: Wie OpenClaw Gesprächssitzungen verwaltet
title: Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-23T06:28:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# Sitzungsverwaltung

OpenClaw organisiert Unterhaltungen in **Sitzungen**. Jede Nachricht wird zu
einer Sitzung geleitet, basierend darauf, woher sie stammt -- aus DMs, Gruppenchats, Cron-Jobs usw.

## Wie Nachrichten geroutet werden

| Quelle          | Verhalten                    |
| --------------- | ---------------------------- |
| Direktnachrichten | Standardmäßig gemeinsame Sitzung |
| Gruppenchats    | Pro Gruppe isoliert          |
| Räume/Channels  | Pro Raum isoliert            |
| Cron-Jobs       | Neue Sitzung pro Ausführung  |
| Webhooks        | Pro Hook isoliert            |

## DM-Isolierung

Standardmäßig teilen sich alle DMs eine Sitzung, um Kontinuität zu wahren. Das ist für
Single-User-Setups in Ordnung.

<Warning>
Wenn mehrere Personen Ihrem Agenten Nachrichten senden können, aktivieren Sie die DM-Isolierung. Andernfalls teilen sich alle
Benutzer denselben Gesprächskontext -- Alices private Nachrichten wären für Bob sichtbar.
</Warning>

**Die Lösung:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
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
`session.identityLinks`, um ihre Identitäten zu verknüpfen, sodass sie sich eine Sitzung teilen.
</Tip>

Überprüfen Sie Ihr Setup mit `openclaw security audit`.

## Sitzungslebenszyklus

Sitzungen werden wiederverwendet, bis sie ablaufen:

- **Tägliches Zurücksetzen** (Standard) -- neue Sitzung um 4:00 Uhr Ortszeit auf dem Gateway-
  Host.
- **Leerlauf-Zurücksetzen** (optional) -- neue Sitzung nach einer Zeit ohne Aktivität. Setzen Sie
  `session.reset.idleMinutes`.
- **Manuelles Zurücksetzen** -- geben Sie `/new` oder `/reset` im Chat ein. `/new <model>` wechselt außerdem
  das Modell.

Wenn sowohl tägliches als auch Leerlauf-Zurücksetzen konfiguriert sind, gilt jeweils das zuerst eintretende.

Sitzungen mit einer aktiven, dem Provider gehörenden CLI-Sitzung werden nicht durch den impliziten
täglichen Standard getrennt. Verwenden Sie `/reset` oder konfigurieren Sie `session.reset` explizit, wenn diese
Sitzungen zeitgesteuert ablaufen sollen.

## Wo der Status gespeichert wird

Der gesamte Sitzungsstatus gehört dem **Gateway**. UI-Clients fragen das Gateway nach
Sitzungsdaten ab.

- **Speicher:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkripte:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Sitzungspflege

OpenClaw begrenzt den Sitzungsspeicher im Lauf der Zeit automatisch. Standardmäßig läuft es
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

- `openclaw status` -- Pfad des Sitzungsspeichers und aktuelle Aktivität.
- `openclaw sessions --json` -- alle Sitzungen (mit `--active <minutes>` filtern).
- `/status` im Chat -- Kontextnutzung, Modell und Schalter.
- `/context list` -- was sich im System-Prompt befindet.

## Weiterführende Informationen

- [Session Pruning](/de/concepts/session-pruning) -- Kürzen von Tool-Ergebnissen
- [Compaction](/de/concepts/compaction) -- Zusammenfassen langer Unterhaltungen
- [Session Tools](/de/concepts/session-tool) -- Agent-Tools für sitzungsübergreifende Arbeit
- [Detaillierte Einführung in die Sitzungsverwaltung](/de/reference/session-management-compaction) --
  Speicherschema, Transkripte, Senderichtlinie, Ursprungsmetadaten und erweiterte Konfiguration
- [Multi-Agent](/de/concepts/multi-agent) — Routing und Sitzungsisolierung über Agenten hinweg
- [Hintergrundaufgaben](/de/automation/tasks) — wie entkoppelte Arbeit Aufgabenaufzeichnungen mit Sitzungsreferenzen erstellt
- [Channel-Routing](/de/channels/channel-routing) — wie eingehende Nachrichten zu Sitzungen geroutet werden
