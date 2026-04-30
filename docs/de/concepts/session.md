---
read_when:
    - Sie möchten Session-Routing und Isolation verstehen
    - Sie möchten den DM-Geltungsbereich für Mehrbenutzer-Setups konfigurieren
    - Sie beheben Fehler bei täglichen oder inaktivitätsbedingten Sitzungszurücksetzungen
summary: Wie OpenClaw Konversationssitzungen verwaltet
title: Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-30T06:51:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organisiert Unterhaltungen in **Sitzungen**. Jede Nachricht wird anhand
ihrer Herkunft an eine Sitzung weitergeleitet -- DMs, Gruppenchats, Cron-Jobs
usw.

## Wie Nachrichten weitergeleitet werden

| Quelle          | Verhalten                              |
| --------------- | -------------------------------------- |
| Direktnachrichten | Standardmäßig gemeinsame Sitzung     |
| Gruppenchats    | Pro Gruppe isoliert                    |
| Räume/Kanäle    | Pro Raum isoliert                      |
| Cron-Jobs       | Neue Sitzung pro Lauf                  |
| Webhooks        | Pro Hook isoliert                      |

## DM-Isolation

Standardmäßig teilen sich alle DMs eine Sitzung, um Kontinuität zu gewährleisten.
Das ist für Setups mit nur einem Benutzer in Ordnung.

<Warning>
Wenn mehrere Personen Ihrem Agenten Nachrichten senden können, aktivieren Sie
die DM-Isolation. Ohne sie teilen sich alle Benutzer denselben
Unterhaltungskontext -- Alices private Nachrichten wären für Bob sichtbar.
</Warning>

**Die Lösung:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // nach Kanal + Absender isolieren
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
`session.identityLinks`, um ihre Identitäten zu verknüpfen, damit sie eine
Sitzung teilen.
</Tip>

### Verknüpfte Kanäle andocken

Dock-Befehle ermöglichen es einem Benutzer, die Antwortroute der aktuellen
Direktchat-Sitzung auf einen anderen verknüpften Kanal zu verschieben, ohne eine
neue Sitzung zu starten. Beispiele, Konfiguration und Fehlerbehebung finden Sie
unter [Channel-Docking](/de/concepts/channel-docking).

Überprüfen Sie Ihr Setup mit `openclaw security audit`.

## Sitzungslebenszyklus

Sitzungen werden wiederverwendet, bis sie ablaufen:

- **Tägliches Zurücksetzen** (Standard) -- neue Sitzung um 4:00 Uhr Ortszeit auf
  dem Gateway-Host. Die tägliche Aktualität basiert darauf, wann die aktuelle
  `sessionId` gestartet wurde, nicht auf späteren Metadaten-Schreibvorgängen.
- **Zurücksetzen bei Inaktivität** (optional) -- neue Sitzung nach einer Phase
  der Inaktivität. Legen Sie `session.reset.idleMinutes` fest. Die Aktualität
  bei Inaktivität basiert auf der letzten echten Benutzer-/Kanalinteraktion, sodass
  Heartbeat-, Cron- und Exec-Systemereignisse die Sitzung nicht aktiv halten.
- **Manuelles Zurücksetzen** -- geben Sie im Chat `/new` oder `/reset` ein.
  `/new <model>` wechselt auch das Modell.

Wenn sowohl tägliches Zurücksetzen als auch Zurücksetzen bei Inaktivität
konfiguriert sind, gilt der zuerst ablaufende Wert. Heartbeat-, Cron-, Exec- und
andere Systemereignis-Turns können Sitzungsmetadaten schreiben, aber diese
Schreibvorgänge verlängern nicht die Aktualität für das tägliche Zurücksetzen
oder das Zurücksetzen bei Inaktivität. Wenn ein Zurücksetzen die Sitzung
wechselt, werden eingereihte Systemereignis-Hinweise für die alte Sitzung
verworfen, damit veraltete Hintergrundaktualisierungen nicht dem ersten Prompt
in der neuen Sitzung vorangestellt werden.

Sitzungen mit einer aktiven provider-eigenen CLI-Sitzung werden nicht durch den
impliziten täglichen Standard getrennt. Verwenden Sie `/reset` oder konfigurieren
Sie `session.reset` explizit, wenn diese Sitzungen nach einem Timer ablaufen
sollen.

## Speicherort des Zustands

Der gesamte Sitzungszustand gehört dem **Gateway**. UI-Clients fragen den
Gateway nach Sitzungsdaten ab.

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkripte:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` speichert separate Lebenszyklus-Zeitstempel:

- `sessionStartedAt`: wann die aktuelle `sessionId` begann; das tägliche Zurücksetzen verwendet diesen Wert.
- `lastInteractionAt`: letzte Benutzer-/Kanalinteraktion, die die Inaktivitäts-Lebensdauer verlängert.
- `updatedAt`: letzte Mutation der Store-Zeile; nützlich zum Auflisten und Bereinigen, aber nicht maßgeblich für die Aktualität des täglichen Zurücksetzens oder des Zurücksetzens bei Inaktivität.

Ältere Zeilen ohne `sessionStartedAt` werden, sofern verfügbar, aus dem
Sitzungsheader des JSONL-Transkripts aufgelöst. Wenn einer älteren Zeile auch
`lastInteractionAt` fehlt, fällt die Aktualität bei Inaktivität auf diese
Startzeit der Sitzung zurück, nicht auf spätere Buchhaltungs-Schreibvorgänge.

## Sitzungswartung

OpenClaw begrenzt den Sitzungsspeicher im Laufe der Zeit automatisch.
Standardmäßig läuft dies im Modus `warn` (meldet, was bereinigt würde). Setzen
Sie `session.maintenance.mode` für automatische Bereinigung auf `"enforce"`:

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

Für produktionsgroße `maxEntries`-Grenzen verwenden Gateway-Laufzeit-Schreibvorgänge einen kleinen High-Water-Puffer und bereinigen stapelweise wieder bis zur konfigurierten Obergrenze. Dadurch wird vermieden, dass bei jeder isolierten Cron-Sitzung eine vollständige Store-Bereinigung ausgeführt wird. `openclaw sessions cleanup --enforce` wendet die Obergrenze sofort an.

Vorschau mit `openclaw sessions cleanup --dry-run`.

## Sitzungen prüfen

- `openclaw status` -- Pfad des Sitzungs-Stores und aktuelle Aktivität.
- `openclaw sessions --json` -- alle Sitzungen (mit `--active <minutes>` filtern).
- `/status` im Chat -- Kontextnutzung, Modell und Umschalter.
- `/context list` -- was im System-Prompt enthalten ist.

## Weiterführende Informationen

- [Sitzungsbereinigung](/de/concepts/session-pruning) -- Tool-Ergebnisse kürzen
- [Compaction](/de/concepts/compaction) -- lange Unterhaltungen zusammenfassen
- [Sitzungstools](/de/concepts/session-tool) -- Agent-Tools für sitzungsübergreifende Arbeit
- [Ausführliche Sitzungsverwaltung](/de/reference/session-management-compaction) --
  Store-Schema, Transkripte, Senderichtlinie, Ursprungsmetadaten und erweiterte Konfiguration
- [Multi-Agent](/de/concepts/multi-agent) — Routing und Sitzungsisolation über Agenten hinweg
- [Hintergrundaufgaben](/de/automation/tasks) — wie losgelöste Arbeit Aufgabeneinträge mit Sitzungsreferenzen erstellt
- [Kanalrouting](/de/channels/channel-routing) — wie eingehende Nachrichten an Sitzungen weitergeleitet werden

## Verwandt

- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Sitzungstools](/de/concepts/session-tool)
- [Befehlswarteschlange](/de/concepts/queue)
