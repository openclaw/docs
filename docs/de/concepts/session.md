---
read_when:
    - Sie möchten Sitzungsrouting und -isolierung verstehen
    - Sie möchten den DM-Bereich für Mehrbenutzer-Setups konfigurieren
    - Sie debuggen tägliche oder durch Inaktivität ausgelöste Sitzungszurücksetzungen
summary: Wie OpenClaw Konversationssitzungen verwaltet
title: Sitzungsverwaltung
x-i18n:
    generated_at: "2026-07-12T15:20:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw leitet jede eingehende Nachricht abhängig von ihrer Herkunft an eine
**Sitzung** weiter: Direktnachrichten, Gruppenchats, Cron-Jobs usw. Der gesamte
Sitzungsstatus wird vom **Gateway** verwaltet; UI-Clients fragen Sitzungsdaten
beim Gateway ab.

## So werden Nachrichten weitergeleitet

| Quelle          | Verhalten                         |
| --------------- | --------------------------------- |
| Direktnachrichten | Standardmäßig gemeinsame Sitzung |
| Gruppenchats     | Für jede Gruppe isoliert          |
| Räume/Kanäle     | Für jeden Raum isoliert           |
| Cron-Jobs        | Neue Sitzung bei jedem Durchlauf  |
| Webhooks         | Für jeden Hook isoliert           |

## Isolierung von Direktnachrichten

Standardmäßig teilen sich alle Direktnachrichten eine Sitzung, um den Kontext
beizubehalten. Dies ist für Einzelbenutzerkonfigurationen ausreichend.

<Warning>
Wenn mehrere Personen Ihrem Agenten Nachrichten senden können, aktivieren Sie
die Isolierung von Direktnachrichten. Andernfalls teilen sich alle Benutzer
denselben Unterhaltungskontext, sodass Alices private Nachrichten für Bob
sichtbar wären.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // nach Kanal + Absender isolieren
  },
}
```

Optionen für `session.dmScope`:

| Wert                       | Verhalten                                           |
| -------------------------- | --------------------------------------------------- |
| `main` (Standardwert)      | Alle Direktnachrichten teilen sich eine Sitzung     |
| `per-peer`                 | Nach Absender kanalübergreifend isolieren           |
| `per-channel-peer`         | Nach Kanal + Absender isolieren (empfohlen)          |
| `per-account-channel-peer` | Nach Konto + Kanal + Absender isolieren              |

<Tip>
Wenn dieselbe Person Sie über mehrere Kanäle kontaktiert, verwenden Sie
`session.identityLinks`, um ihre Identitäten einer kanonischen Peer-ID
zuzuordnen, sodass sie eine Sitzung teilen.
</Tip>

### Verknüpfte Kanäle andocken

Dock-Befehle verschieben die Antwortroute der aktuellen Direktchat-Sitzung zu
einem anderen verknüpften Kanal, ohne eine neue Sitzung zu starten. Beispiele,
Konfiguration und Informationen zur Fehlerbehebung finden Sie unter
[Kanäle andocken](/de/concepts/channel-docking).

Überprüfen Sie Ihre Konfiguration mit `openclaw security audit`.

## Sitzungslebenszyklus

Sitzungen werden wiederverwendet, bis sie gemäß `session.reset` ablaufen:

- **Tägliches Zurücksetzen** (standardmäßig `mode: "daily"`) – neue Sitzung zu
  einer konfigurierten lokalen Stunde (`session.reset.atHour`, Standardwert `4`,
  0–23) auf dem Gateway-Host. Die tägliche Aktualität richtet sich danach, wann
  die aktuelle `sessionId` gestartet wurde, nicht nach späteren Schreibvorgängen
  für Metadaten.
- **Zurücksetzen bei Inaktivität** (`mode: "idle"`) – neue Sitzung nach
  `session.reset.idleMinutes` Minuten Inaktivität. Die Aktualität bei Inaktivität
  richtet sich nach der letzten tatsächlichen Benutzer-/Kanalinteraktion,
  sodass Heartbeat-, Cron- und Exec-Systemereignisse die Sitzung nicht aktiv
  halten.
- **Manuelles Zurücksetzen** – geben Sie im Chat `/new` oder `/reset` ein.
  `/new <model>` wechselt außerdem das Modell.

Wenn sowohl tägliches Zurücksetzen als auch Zurücksetzen bei Inaktivität
konfiguriert sind, gilt die Bedingung, die zuerst eintritt. Durchläufe für
Heartbeat-, Cron-, Exec- und andere Systemereignisse können Sitzungsmetadaten
schreiben, doch diese Schreibvorgänge verlängern weder die tägliche Aktualität
noch die Aktualität bei Inaktivität. Wenn beim Zurücksetzen eine neue Sitzung
erstellt wird, werden Hinweise zu Systemereignissen in der Warteschlange für
die alte Sitzung verworfen, damit veraltete Hintergrundaktualisierungen nicht
der ersten Eingabeaufforderung der neuen Sitzung vorangestellt werden.

Sitzungen mit einer aktiven, vom Provider verwalteten CLI-Sitzung werden nicht
durch den impliziten täglichen Standardwert beendet. Verwenden Sie `/reset`
oder konfigurieren Sie `session.reset` explizit, wenn diese Sitzungen nach
einem Zeitplan ablaufen sollen.

Überschreiben Sie den Standardwert je Chattyp oder Kanal:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` unterstützt `direct` (Legacy-Alias `dm`), `group` und `thread`.
Das veraltete `session.idleMinutes` auf oberster Ebene funktioniert weiterhin als Kompatibilitätsalias für
einen Standardwert im Inaktivitätsmodus, wenn kein `session.reset`-/`resetByType`-Block festgelegt ist.

## Speicherort des Zustands

- **Laufzeit-Sitzungszeilen:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Archivierte Transkriptdateien:** `~/.openclaw/agents/<agentId>/sessions/`
- **Legacy-Quelle für die Zeilenmigration:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Die Sitzungszeilen in der agentenspezifischen SQLite-Datenbank speichern separate
Lebenszyklus-Zeitstempel:

- `sessionStartedAt`: Zeitpunkt, zu dem die aktuelle `sessionId` begann; die tägliche Zurücksetzung verwendet diesen Wert.
- `lastInteractionAt`: letzte Benutzer-/Kanalinteraktion, die die Inaktivitätsdauer verlängert.
- `updatedAt`: letzte Änderung der Speicherzeile; nützlich für Auflistung und Bereinigung, aber nicht
  maßgeblich für die Aktualität täglicher/inaktivitätsbedingter Zurücksetzungen.

Während der Migration von älteren Installationen importieren der Gateway-Start und `openclaw doctor
--fix` Legacy-Zeilen aus `sessions.json` und den aktiven JSONL-Transkriptverlauf automatisch in
SQLite. Zeilen ohne `sessionStartedAt` werden, sofern verfügbar, anhand des
JSONL-Sitzungsheaders des Legacy-Transkripts aufgelöst. Wenn einer älteren Zeile außerdem
`lastInteractionAt` fehlt, basiert die Aktualität für die Inaktivität auf diesem Sitzungsstartzeitpunkt,
nicht auf späteren Verwaltungs-Schreibvorgängen. Verwenden Sie `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` und die [Doctor-Migrationssequenz
](/de/cli/doctor#session-sqlite-migration), wenn Sie explizite
Inspektions- oder Validierungsnachweise benötigen.

## Sitzungswartung

OpenClaw begrenzt den Sitzungsspeicher im Laufe der Zeit über `session.maintenance`; die
Standardwerte sind dargestellt:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" führt die Bereinigung durch; "warn" meldet nur
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Bei für den Produktionseinsatz dimensionierten `maxEntries`-Grenzwerten verwenden Schreibvorgänge der Gateway-Laufzeit einen kleinen
Höchststands-Puffer und bereinigen den Bestand stapelweise wieder bis zur konfigurierten Obergrenze.
Lesevorgänge im Sitzungsspeicher bereinigen oder begrenzen Einträge während des Gateway-Starts nicht, sodass
beim Start und bei isolierten Cron-Sitzungen keine vollständige Speicherbereinigung anfällt.
`openclaw sessions cleanup --enforce` wendet die Obergrenze sofort an.

Gateway-Prüfsitzungen für Modellläufe sind standardmäßig kurzlebig. Zeilen, die
`agent:*:explicit:model-run-<uuid>` entsprechen, verwenden eine feste Aufbewahrungsdauer von `24h`, die Bereinigung ist jedoch
druckgesteuert: Veraltete Prüfzeilen werden nur entfernt, wenn der Wartungs-/Obergrenzendruck
für Sitzungseinträge erreicht ist; dies erfolgt vor dem allgemeineren Altersgrenzwert
für veraltete Einträge und der Eintragsobergrenze. Normale direkte, Gruppen-, Thread-, Cron-, Hook-, Heartbeat-,
ACP- und Subagenten-Sitzungen übernehmen diese Aufbewahrungsdauer von 24 Stunden nicht.

Die Wartung erhält dauerhafte externe Konversationsverweise, einschließlich Gruppen-
und Thread-bezogener Chatsitzungen, während synthetische Cron-,
Hook-, Heartbeat-, ACP- und Subagenten-Einträge weiterhin veralten können.

Wenn Sie zuvor DM-Isolierung verwendet und `session.dmScope` später wieder auf
`main` gesetzt haben, können Sie veraltete Peer-Schlüssel-basierte DM-Zeilen mit
`openclaw sessions cleanup --dry-run --fix-dm-scope` in der Vorschau anzeigen. Durch Anwenden desselben Flags
werden diese alten Direkt-DM-Zeilen außer Betrieb genommen und ihre Transkripte als gelöschte
Archive aufbewahrt.

Zeigen Sie jeden Wartungslauf mit `openclaw sessions cleanup --dry-run` in der Vorschau an.

## Sitzungen prüfen

| Befehl                     | Anzeige                                         |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | Sitzungsspeicherpfad und letzte Aktivität       |
| `openclaw sessions --json` | Alle Sitzungen (mit `--active <minutes>` filtern) |
| `/status` im Chat          | Kontextnutzung, Modell und Umschalter           |
| `/context list`            | Inhalt des System-Prompts                       |

## Weiterführende Informationen

- [Sitzungssuche](/concepts/session-search) - Volltextabruf über frühere Transkripte hinweg
- [Sitzungsbereinigung](/de/concepts/session-pruning) - Kürzen von Werkzeugergebnissen
- [Compaction](/de/concepts/compaction) - Zusammenfassen langer Konversationen
- [Sitzungswerkzeuge](/de/concepts/session-tool) - Agentenwerkzeuge für sitzungsübergreifende Arbeit
- [Sitzungsverwaltung im Detail](/de/reference/session-management-compaction) -
  Speicherschema, Transkripte, Senderichtlinie, Ursprungsmetadaten und erweiterte Konfiguration
- [Multi-Agenten-System](/de/concepts/multi-agent) - Routing und Sitzungsisolierung zwischen Agenten
- [Hintergrundaufgaben](/de/automation/tasks) - wie losgelöste Arbeit Aufgabendatensätze mit Sitzungsreferenzen erstellt
- [Kanal-Routing](/de/channels/channel-routing) - wie eingehende Nachrichten an Sitzungen weitergeleitet werden

## Verwandte Themen

- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Sitzungswerkzeuge](/de/concepts/session-tool)
- [Befehlswarteschlange](/de/concepts/queue)
