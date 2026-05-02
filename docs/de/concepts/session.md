---
read_when:
    - Sie möchten Sitzungsrouting und Isolation verstehen
    - Sie möchten den DM-Geltungsbereich für Mehrbenutzer-Setups konfigurieren
    - Sie debuggen tägliche oder inaktivitätsbedingte Sitzungszurücksetzungen
summary: Wie OpenClaw Konversationssitzungen verwaltet
title: Sitzungsverwaltung
x-i18n:
    generated_at: "2026-05-02T06:32:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organisiert Unterhaltungen in **Sitzungen**. Jede Nachricht wird basierend darauf, woher sie stammt, an eine Sitzung weitergeleitet: DMs, Gruppenchats, Cron-Jobs usw.

## So werden Nachrichten weitergeleitet

| Quelle          | Verhalten                       |
| --------------- | -------------------------------- |
| Direktnachrichten | Standardmäßig geteilte Sitzung |
| Gruppenchats    | Pro Gruppe isoliert             |
| Räume/Kanäle    | Pro Raum isoliert               |
| Cron-Jobs       | Neue Sitzung pro Lauf           |
| Webhooks        | Pro Hook isoliert               |

## DM-Isolierung

Standardmäßig teilen sich alle DMs aus Gründen der Kontinuität eine Sitzung. Das ist für Einzelbenutzer-Setups in Ordnung.

<Warning>
Wenn mehrere Personen Ihrem Agenten Nachrichten senden können, aktivieren Sie die DM-Isolierung. Andernfalls teilen sich alle Benutzer denselben Unterhaltungskontext: Alices private Nachrichten wären für Bob sichtbar.
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
- `per-channel-peer` -- nach Kanal + Absender isolieren (empfohlen).
- `per-account-channel-peer` -- nach Konto + Kanal + Absender isolieren.

<Tip>
Wenn dieselbe Person Sie über mehrere Kanäle kontaktiert, verwenden Sie `session.identityLinks`, um ihre Identitäten zu verknüpfen, damit sie eine Sitzung teilen.
</Tip>

### Verknüpfte Kanäle andocken

Dock-Befehle ermöglichen es einem Benutzer, die Antwortroute der aktuellen Direktchat-Sitzung in einen anderen verknüpften Kanal zu verschieben, ohne eine neue Sitzung zu starten. Beispiele, Konfiguration und Fehlerbehebung finden Sie unter [Kanal-Docking](/de/concepts/channel-docking).

Überprüfen Sie Ihr Setup mit `openclaw security audit`.

## Sitzungslebenszyklus

Sitzungen werden wiederverwendet, bis sie ablaufen:

- **Tägliches Zurücksetzen** (Standard) -- neue Sitzung um 4:00 Uhr lokaler Zeit auf dem Gateway-Host. Die tägliche Aktualität basiert darauf, wann die aktuelle `sessionId` gestartet wurde, nicht auf späteren Metadatenschreibvorgängen.
- **Zurücksetzen bei Inaktivität** (optional) -- neue Sitzung nach einem Zeitraum ohne Aktivität. Legen Sie `session.reset.idleMinutes` fest. Die Inaktivitätsaktualität basiert auf der letzten echten Benutzer-/Kanalinteraktion, sodass Heartbeat-, Cron- und Exec-Systemereignisse die Sitzung nicht am Leben halten.
- **Manuelles Zurücksetzen** -- geben Sie `/new` oder `/reset` im Chat ein. `/new <model>` wechselt außerdem das Modell.

Wenn sowohl tägliches Zurücksetzen als auch Zurücksetzen bei Inaktivität konfiguriert sind, gilt das Ereignis, das zuerst abläuft. Heartbeat-, Cron-, Exec- und andere Systemereignis-Turns können Sitzungsmetadaten schreiben, aber diese Schreibvorgänge verlängern nicht die Aktualität für tägliches Zurücksetzen oder Zurücksetzen bei Inaktivität. Wenn ein Zurücksetzen die Sitzung wechselt, werden eingereihte Systemereignis-Hinweise für die alte Sitzung verworfen, damit veraltete Hintergrundaktualisierungen nicht dem ersten Prompt in der neuen Sitzung vorangestellt werden.

Sitzungen mit einer aktiven Provider-eigenen CLI-Sitzung werden nicht durch den impliziten täglichen Standard beendet. Verwenden Sie `/reset` oder konfigurieren Sie `session.reset` explizit, wenn diese Sitzungen zeitgesteuert ablaufen sollen.

## Wo der Zustand gespeichert wird

Der gesamte Sitzungszustand gehört dem **Gateway**. UI-Clients fragen das Gateway nach Sitzungsdaten ab.

- **Speicher:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkripte:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` führt separate Lebenszyklus-Zeitstempel:

- `sessionStartedAt`: wann die aktuelle `sessionId` begann; das tägliche Zurücksetzen verwendet diesen Wert.
- `lastInteractionAt`: letzte Benutzer-/Kanalinteraktion, die die Inaktivitätslebensdauer verlängert.
- `updatedAt`: letzte Änderung der Speicherzeile; nützlich für Auflistung und Bereinigung, aber nicht maßgeblich für die Aktualität von täglichem Zurücksetzen oder Zurücksetzen bei Inaktivität.

Ältere Zeilen ohne `sessionStartedAt` werden, sofern verfügbar, aus dem JSONL-Sitzungskopf des Transkripts aufgelöst. Wenn einer älteren Zeile auch `lastInteractionAt` fehlt, fällt die Inaktivitätsaktualität auf diese Sitzungsstartzeit zurück, nicht auf spätere Verwaltungs-Schreibvorgänge.

## Sitzungswartung

OpenClaw begrenzt den Sitzungsspeicher im Laufe der Zeit automatisch. Standardmäßig läuft dies im Modus `warn` (meldet, was bereinigt würde). Setzen Sie `session.maintenance.mode` für automatische Bereinigung auf `"enforce"`:

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

Für produktionsgroße `maxEntries`-Grenzen verwenden Gateway-Laufzeitschreibvorgänge einen kleinen Hochwasserpuffer und bereinigen stapelweise wieder bis zur konfigurierten Obergrenze. Lesevorgänge des Sitzungsspeichers beschneiden oder begrenzen während des Gateway-Starts keine Einträge. Dadurch wird vermieden, bei jedem Start oder jeder isolierten Cron-Sitzung eine vollständige Speicherbereinigung auszuführen. `openclaw sessions cleanup --enforce` wendet die Obergrenze sofort an.

Die Wartung bewahrt dauerhafte externe Unterhaltungspointer, einschließlich Gruppensitzungen und Thread-bezogener Chat-Sitzungen, während synthetische Cron-, Hook-, Heartbeat-, ACP- und Sub-Agent-Einträge weiterhin altern und entfernt werden können.

Vorschau mit `openclaw sessions cleanup --dry-run`.

## Sitzungen prüfen

- `openclaw status` -- Pfad zum Sitzungsspeicher und letzte Aktivität.
- `openclaw sessions --json` -- alle Sitzungen (mit `--active <minutes>` filtern).
- `/status` im Chat -- Kontextnutzung, Modell und Umschalter.
- `/context list` -- was im System-Prompt enthalten ist.

## Weiterführende Informationen

- [Sitzungsbereinigung](/de/concepts/session-pruning) -- Tool-Ergebnisse kürzen
- [Compaction](/de/concepts/compaction) -- lange Unterhaltungen zusammenfassen
- [Sitzungs-Tools](/de/concepts/session-tool) -- Agenten-Tools für sitzungsübergreifende Arbeit
- [Tiefer Einblick in die Sitzungsverwaltung](/de/reference/session-management-compaction) -- Speicherschema, Transkripte, Senderichtlinie, Ursprungsmetadaten und erweiterte Konfiguration
- [Multi-Agent](/de/concepts/multi-agent) — Routing und Sitzungsisolierung über Agenten hinweg
- [Hintergrundaufgaben](/de/automation/tasks) — wie losgelöste Arbeit Aufgabendatensätze mit Sitzungsreferenzen erstellt
- [Kanal-Routing](/de/channels/channel-routing) — wie eingehende Nachrichten an Sitzungen weitergeleitet werden

## Verwandt

- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Sitzungs-Tools](/de/concepts/session-tool)
- [Befehlswarteschlange](/de/concepts/queue)
