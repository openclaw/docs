---
read_when:
    - Sie möchten Session-Routing und Isolation verstehen
    - Sie möchten den DM-Bereich für Mehrbenutzer-Setups konfigurieren
    - Sie debuggen tägliche oder inaktive Sitzungs-Resets
summary: Wie OpenClaw Konversationssitzungen verwaltet
title: Sitzungsverwaltung
x-i18n:
    generated_at: "2026-06-27T17:26:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organisiert Unterhaltungen in **Sitzungen**. Jede Nachricht wird anhand ihrer Herkunft einer
Sitzung zugeordnet -- DMs, Gruppenchats, Cron-Jobs usw.

## Wie Nachrichten geroutet werden

| Quelle          | Verhalten                  |
| --------------- | ------------------------- |
| Direktnachrichten | Standardmäßig gemeinsame Sitzung |
| Gruppenchats     | Pro Gruppe isoliert        |
| Räume/Kanäle  | Pro Raum isoliert         |
| Cron-Jobs       | Frische Sitzung pro Lauf     |
| Webhooks        | Pro Hook isoliert         |

## DM-Isolation

Standardmäßig teilen sich alle DMs aus Kontinuitätsgründen eine Sitzung. Das ist für
Ein-Benutzer-Setups in Ordnung.

<Warning>
Wenn mehrere Personen Ihrem Agent Nachrichten senden können, aktivieren Sie die DM-Isolation. Ohne sie teilen
sich alle Benutzer denselben Unterhaltungskontext -- Alice' private Nachrichten wären für
Bob sichtbar.
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
Wenn dieselbe Person Sie über mehrere Kanäle kontaktiert, verwenden Sie
`session.identityLinks`, um ihre Identitäten zu verknüpfen, damit sie eine Sitzung teilen.
</Tip>

### Verknüpfte Kanäle andocken

Dock-Befehle ermöglichen es einem Benutzer, die Antwortroute der aktuellen Direct-Chat-Sitzung zu
einem anderen verknüpften Kanal zu verschieben, ohne eine neue Sitzung zu starten. Siehe
[Channel-Docking](/de/concepts/channel-docking) für Beispiele, Konfiguration und
Fehlerbehebung.

Prüfen Sie Ihr Setup mit `openclaw security audit`.

## Sitzungslebenszyklus

Sitzungen werden wiederverwendet, bis sie ablaufen:

- **Tägliches Zurücksetzen** (Standard) -- neue Sitzung um 4:00 Uhr lokaler Zeit auf dem Gateway-
  Host. Die tägliche Aktualität basiert darauf, wann die aktuelle `sessionId` gestartet wurde, nicht
  auf späteren Metadaten-Schreibvorgängen.
- **Zurücksetzen bei Inaktivität** (optional) -- neue Sitzung nach einem Zeitraum der Inaktivität. Setzen
  Sie `session.reset.idleMinutes`. Die Inaktivitätsaktualität basiert auf der letzten echten
  Benutzer-/Kanalinteraktion, sodass Heartbeat-, Cron- und Exec-Systemereignisse die Sitzung nicht
  am Leben halten.
- **Manuelles Zurücksetzen** -- geben Sie `/new` oder `/reset` im Chat ein. `/new <model>` wechselt außerdem
  das Modell.

Wenn sowohl tägliches Zurücksetzen als auch Zurücksetzen bei Inaktivität konfiguriert sind, gilt, was zuerst abläuft.
Heartbeat-, Cron-, Exec- und andere Systemereignis-Turns können Sitzungsmetadaten schreiben,
aber diese Schreibvorgänge verlängern die Aktualität für tägliches Zurücksetzen oder Inaktivität nicht. Wenn ein Reset
die Sitzung weiterdreht, werden wartende Systemereignis-Hinweise für die alte Sitzung
verworfen, damit veraltete Hintergrund-Updates nicht dem ersten Prompt in
der neuen Sitzung vorangestellt werden.

Sitzungen mit einer aktiven Provider-eigenen CLI-Sitzung werden nicht durch den impliziten
täglichen Standard abgeschnitten. Verwenden Sie `/reset` oder konfigurieren Sie `session.reset` explizit, wenn diese
Sitzungen per Timer ablaufen sollen.

## Wo der Zustand gespeichert wird

Der gesamte Sitzungszustand gehört dem **Gateway**. UI-Clients fragen den Gateway nach
Sitzungsdaten ab.

- **Speicher:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkripte:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` speichert getrennte Lebenszyklus-Zeitstempel:

- `sessionStartedAt`: wann die aktuelle `sessionId` begann; das tägliche Zurücksetzen verwendet dies.
- `lastInteractionAt`: letzte Benutzer-/Kanalinteraktion, die die Inaktivitätsdauer verlängert.
- `updatedAt`: letzte Store-Zeilenmutation; nützlich für Auflistung und Bereinigung, aber nicht
  maßgeblich für die Aktualität von täglichem Zurücksetzen/Inaktivität.

Ältere Zeilen ohne `sessionStartedAt` werden, sofern verfügbar, aus dem JSONL-
Sitzungsheader des Transkripts aufgelöst. Wenn einer älteren Zeile auch `lastInteractionAt` fehlt,
fällt die Inaktivitätsaktualität auf diese Sitzungsstartzeit zurück, nicht auf spätere Buchhaltungs-
Schreibvorgänge.

## Sitzungswartung

OpenClaw begrenzt den Sitzungsspeicher im Laufe der Zeit automatisch. Standardmäßig läuft es
im Modus `enforce` und wendet die Bereinigung während der Wartung an. Setzen Sie
`session.maintenance.mode` auf `"warn"`, um zu melden, was bereinigt würde, ohne den Store/die Dateien zu verändern:

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

Für produktionsgroße `maxEntries`-Grenzen verwenden Gateway-Laufzeit-Schreibvorgänge einen kleinen High-Water-Puffer und bereinigen stapelweise zurück auf die konfigurierte Obergrenze. Lesevorgänge aus dem Sitzungsspeicher beschneiden oder begrenzen Einträge beim Gateway-Start nicht. Dadurch wird vermieden, bei jedem Start oder jeder isolierten Cron-Sitzung eine vollständige Store-Bereinigung auszuführen. `openclaw sessions cleanup --enforce` wendet die Obergrenze sofort an.

Gateway-Modelllauf-Probesitzungen sind standardmäßig kurzlebig. Passende Zeilen mit
strikten expliziten Schlüsseln wie `agent:*:explicit:model-run-<uuid>` verwenden eine feste `24h`-
Aufbewahrung, aber die Bereinigung ist druckgesteuert: Sie entfernt veraltete Probe-Zeilen nur, wenn
Wartungs-/Obergrenzendruck für Sitzungseinträge erreicht ist. Wenn die Modelllauf-Bereinigung läuft,
läuft sie vor dem allgemeineren Alters-Cutoff für veraltete Einträge und der Eintragsobergrenze. Normale Direct-,
Gruppen-, Thread-, Cron-, Hook-, Heartbeat-, ACP- und Sub-Agent-Sitzungen erben
diese 24h-Aufbewahrung nicht.

Die Wartung bewahrt dauerhafte externe Unterhaltungspointer, einschließlich Gruppen-
sitzungen und thread-bezogener Chat-Sitzungen, während synthetische Cron-,
Hook-, Heartbeat-, ACP- und Sub-Agent-Einträge weiterhin altern und entfernt werden können.

Wenn Sie zuvor Direct-Message-Isolation verwendet und `session.dmScope` später wieder auf `main`
zurückgesetzt haben, zeigen Sie veraltete Peer-Keyed-DM-Zeilen mit
`openclaw sessions cleanup --dry-run --fix-dm-scope` in der Vorschau an. Wenn Sie dasselbe Flag anwenden,
werden diese alten Direct-DM-Zeilen außer Betrieb genommen und ihre Transkripte als gelöschte
Archive behalten.

Vorschau mit `openclaw sessions cleanup --dry-run`.

## Sitzungen prüfen

- `openclaw status` -- Pfad des Sitzungsspeichers und letzte Aktivität.
- `openclaw sessions --json` -- alle Sitzungen (mit `--active <minutes>` filtern).
- `/status` im Chat -- Kontextnutzung, Modell und Umschalter.
- `/context list` -- was im System-Prompt enthalten ist.

## Weiterführende Informationen

- [Session Pruning](/de/concepts/session-pruning) -- Kürzen von Tool-Ergebnissen
- [Compaction](/de/concepts/compaction) -- Zusammenfassen langer Unterhaltungen
- [Sitzungs-Tools](/de/concepts/session-tool) -- Agent-Tools für sitzungsübergreifende Arbeit
- [Deep Dive zur Sitzungsverwaltung](/de/reference/session-management-compaction) --
  Store-Schema, Transkripte, Senderichtlinie, Ursprungsmetadaten und erweiterte Konfiguration
- [Multi-Agent](/de/concepts/multi-agent) — Routing und Sitzungsisolation über Agenten hinweg
- [Hintergrundaufgaben](/de/automation/tasks) — wie losgelöste Arbeit Aufgaben-Datensätze mit Sitzungsreferenzen erstellt
- [Kanal-Routing](/de/channels/channel-routing) — wie eingehende Nachrichten zu Sitzungen geroutet werden

## Verwandt

- [Session Pruning](/de/concepts/session-pruning)
- [Sitzungs-Tools](/de/concepts/session-tool)
- [Befehlswarteschlange](/de/concepts/queue)
