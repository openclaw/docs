---
read_when:
    - Sie möchten das Sitzungsrouting und die Sitzungsisolierung verstehen
    - Sie möchten den Direktnachrichten-Bereich für Mehrbenutzerkonfigurationen festlegen
    - Sie debuggen tägliche oder durch Inaktivität ausgelöste Sitzungszurücksetzungen
summary: Wie OpenClaw Konversationssitzungen verwaltet
title: Sitzungsverwaltung
x-i18n:
    generated_at: "2026-07-24T04:54:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: de85fe5a623bdbc6d5564d822b39e9077a582b0816b62ab30d2f7245bd097000
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw leitet jede eingehende Nachricht abhängig von ihrer Herkunft an eine **Sitzung** weiter:
Direktnachrichten, Gruppenchats, Cron-Aufträge usw. Der gesamte Sitzungsstatus gehört dem
**Gateway**; UI-Clients fragen Sitzungsdaten beim Gateway ab.

Informationen zur Standardeinstellung für persönliche Agenten – eine fortlaufende, von allen Ihren
Direktnachrichtenkanälen gemeinsam genutzte Unterhaltung, in die Gruppenaktivitäten und Hintergrundarbeiten einfließen – finden Sie unter
[Die Hauptsitzung](/concepts/main-session).

## Weiterleitung von Nachrichten

| Quelle             | Verhalten                            |
| ------------------ | ------------------------------------ |
| Direktnachrichten  | Standardmäßig gemeinsame Sitzung     |
| Gruppenchats       | Für jede Gruppe isoliert             |
| Räume/Kanäle       | Für jeden Raum isoliert              |
| Cron-Aufträge      | Neue Sitzung bei jedem Durchlauf      |
| Webhooks           | Für jeden Hook isoliert               |

## Isolierung von Direktnachrichten

Standardmäßig verwenden alle Direktnachrichten für eine durchgängige Unterhaltung dieselbe Sitzung. Dies eignet sich
für Einrichtungen mit nur einer Person.

<Warning>
Wenn mehrere Personen Ihrem Agenten Nachrichten senden können, aktivieren Sie die Isolierung von Direktnachrichten. Andernfalls
teilen sich alle Personen denselben Unterhaltungskontext, sodass Alices private Nachrichten
für Bob sichtbar wären.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Optionen für `session.dmScope`:

| Wert                       | Verhalten                                                        |
| -------------------------- | ---------------------------------------------------------------- |
| `main` (Standard)           | Alle Direktnachrichten teilen sich die [Hauptsitzung](/concepts/main-session) |
| `per-peer`                 | Kanalübergreifend nach Absender isolieren                         |
| `per-channel-peer`         | Nach Kanal und Absender isolieren (empfohlen)                     |
| `per-account-channel-peer` | Nach Konto, Kanal und Absender isolieren                          |

<Tip>
Wenn dieselbe Person Sie über mehrere Kanäle kontaktiert, verwenden Sie
`session.identityLinks`, um ihre Identitäten einer einzigen kanonischen Peer-ID zuzuordnen, sodass
sie dieselbe Sitzung verwenden.
</Tip>

### Verknüpfte Kanäle andocken

Andockbefehle verschieben die Antwortroute der aktuellen Direktchat-Sitzung zu einem anderen
verknüpften Kanal, ohne eine neue Sitzung zu beginnen. Beispiele, Konfiguration und
Fehlerbehebung finden Sie unter [Kanäle andocken](/de/concepts/channel-docking).

Überprüfen Sie Ihre Einrichtung mit `openclaw security audit`.

## Inkognito-Sitzungen

Inkognito-Sitzungen sind nur über den Bildschirm **Neuer Thread** der Control UI verfügbar. Aktivieren Sie **Inkognito**, bevor Sie den Thread beginnen, damit sein Sitzungseintrag, Transkript und Compaction-Status statt auf dem Datenträger im Prozessspeicher verbleiben. Der Thread verschwindet beim Neustart des Gateway, führt die automatische Speicherleerung von OpenClaw nicht aus und erstellt kein Transkriptarchiv, wenn Sie ihn zurücksetzen oder löschen. Codex-gestützte Ausführungen starten ihren Harness-Thread ebenfalls im flüchtigen Modus, sodass Codex keine Rollout- oder lokalen Sitzungsstatusdateien schreibt; andere Modell-Provider verwenden HTTP-APIs und speichern in OpenClaw kein lokales Provider-Transkript.

Das Segment `incognito-` ist für Dashboard-, Subagent- und verborgene interne Sitzungsschlüssel reserviert; `openclaw doctor --fix` benennt kollidierende dauerhafte Legacy-Schlüssel um.

Inkognito schränkt die normalen Werkzeuge des Agenten nicht ein. Eine ausdrückliche Aufforderung zum Speichern von Informationen oder jeder werkzeuggesteuerte Schreibvorgang in eine Datei kann weiterhin Daten außerhalb des Inkognito-Sitzungsspeichers dauerhaft speichern. Ihr konfigurierter Modell-Provider verarbeitet weiterhin die von Ihnen gesendeten Nachrichten, die Diagnoseprotokollierung bleibt unverändert und OpenClaw zeichnet weiterhin inhaltsfreie Audit-Metadaten wie HMAC-Referenzen auf.

Auf Gateways mit mehreren Personen sind Inkognito-Threads nur für Verbindungen mit Administratorberechtigung sichtbar und erscheinen niemals über die Agentensitzungswerkzeuge oder die Transkriptsuche einer anderen Sitzung. Dies schützt sie vor der Speicherung und vor anderen durch das Gateway vermittelten Personen, nicht jedoch vor dem Eigentümer des Gateway oder dem Prozessbetreiber, die Live-Sitzungen jederzeit beobachten können.

## Sitzungsübergreifendes Erinnern

Separate Transkripte steuern den lokalen Verlauf jeder Unterhaltung. Bei einem persönlichen
oder vollständig vertrauenswürdigen Agenten fügt `memory.search.rememberAcrossConversations: true`
einen optionalen Abrufschritt über die anderen privaten
Unterhaltungen dieses Agenten hinweg hinzu; ihre Transkripte werden dadurch nicht zusammengeführt.

Private direkte und dauerhafte, ausdrücklich über die UI geführte Unterhaltungen können einander relevanten
Kontext bereitstellen. Gruppen und Kanäle bleiben in beide Richtungen getrennt:
Ihre Transkripte dienen nicht als Quellen für private Erinnerungen, und Antworten in diesen
Unterhaltungen erhalten keinen Kontext aus privaten Transkripten. Die aktuelle
Unterhaltung wird ebenfalls ausgeschlossen, da ihr Verlauf bereits geladen ist.

Diese Einstellung ändert weder Sitzungsschlüssel, Geltungsbereich von Direktnachrichten, Weiterleitung oder Zustellung noch
`tools.sessions.visibility`. Der gemeinsame Arbeitsbereichsspeicher in `MEMORY.md` und
`memory/*.md` behält ebenfalls sein bestehendes Verhalten bei. Der aktuelle Speicher-Provider
muss den geschützten Abruf privater Transkripte unterstützen; Kontext-Engines wie
Lossless Claw bleiben unabhängig und können parallel dazu ausgeführt werden. Einrichtung
und Laufzeitdetails finden Sie unter [Active Memory](/de/concepts/active-memory#remember-across-conversations).

## Lebenszyklus von Sitzungen

Sitzungen werden wiederverwendet, bis Sie sie manuell zurücksetzen oder eine automatische Rücksetzrichtlinie aktivieren:

- **Kein automatisches Zurücksetzen** (Standard `mode: "none"`) – Sitzungen behalten dieselbe
  `sessionId`; Compaction verwaltet den aktiven Kontext, während die Unterhaltung wächst.
- **Tägliches Zurücksetzen** (`mode: "daily"`) – aktiviert eine neue Sitzung zu einer konfigurierten lokalen
  Stunde (`session.reset.atHour`, Standard `4`, 0-23) auf dem Gateway-Host. Die tägliche
  Aktualität richtet sich danach, wann die aktuelle `sessionId` begonnen hat, nicht nach späteren
  Schreibvorgängen für Metadaten.
- **Zurücksetzen bei Inaktivität** (`mode: "idle"`) – aktiviert nach `session.reset.idleMinutes`
  Inaktivität eine neue Sitzung. Die Aktualität bei Inaktivität richtet sich nach der letzten tatsächlichen
  Interaktion einer Person oder eines Kanals, sodass Heartbeat-, Cron- und Exec-Systemereignisse die
  Sitzung nicht aktiv halten.
- **Manuelles Zurücksetzen** – geben Sie im Chat `/new` oder `/reset` ein. `/new <model>`
  wechselt außerdem das Modell.

Wenn sowohl tägliches Zurücksetzen als auch Zurücksetzen bei Inaktivität konfiguriert sind, gilt die zuerst ablaufende Bedingung.
Heartbeat-, Cron-, Exec- und andere Systemereignis-Durchläufe können Sitzungsmetadaten schreiben,
diese Schreibvorgänge verlängern jedoch nicht die Aktualität für tägliches Zurücksetzen oder Zurücksetzen bei Inaktivität. Wenn ein Zurücksetzen
die Sitzung wechselt, werden in der Warteschlange befindliche Systemereignis-Hinweise für die alte Sitzung
verworfen, damit veraltete Hintergrundaktualisierungen nicht dem ersten Prompt der
neuen Sitzung vorangestellt werden.

Sitzungen mit einer aktiven, dem Provider gehörenden CLI-Sitzung verwenden ebenfalls standardmäßig
kein automatisches Zurücksetzen. Verwenden Sie `/reset` oder konfigurieren Sie `session.reset` ausdrücklich, wenn diese Sitzungen
nach einer festgelegten Zeit ablaufen sollen.

Aktivieren Sie automatische Rücksetzungen global und überschreiben Sie sie anschließend nach Chattyp oder Kanal:

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

`resetByType` unterstützt `direct`, `group` und `thread`. Doctor migriert veraltete `dm`-Einträge zu `direct` und `session.idleMinutes` zu `session.reset.idleMinutes`; das Schema lehnt beide außer Betrieb genommenen Formen ab.

## Speicherort des Status

- **Laufzeit-Sitzungszeilen:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Archivierte Transkriptdateien:** `~/.openclaw/agents/<agentId>/sessions/`
- **Quelle für die Migration von Legacy-Zeilen:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Die Sitzungszeilen in der agentenspezifischen SQLite-Datenbank speichern getrennte Zeitstempel
für den Lebenszyklus:

- `sessionStartedAt`: Zeitpunkt, zu dem die aktuelle `sessionId` begann; wird für das tägliche Zurücksetzen verwendet.
- `lastInteractionAt`: letzte Interaktion einer Person oder eines Kanals, die die Lebensdauer bei Inaktivität verlängert.
- `updatedAt`: letzte Änderung der Speicherzeile; nützlich für Auflistung und Bereinigung, aber nicht
  maßgeblich für die Aktualität beim täglichen Zurücksetzen oder Zurücksetzen bei Inaktivität.

Während der Migration von älteren Installationen importieren der Gateway-Start und `openclaw doctor
--fix` automatisch veraltete `sessions.json`-Zeilen und den aktuellen JSONL-Transkriptverlauf in
SQLite. Zeilen ohne `sessionStartedAt` werden nach Möglichkeit anhand des
Sitzungs-Headers des veralteten JSONL-Transkripts aufgelöst. Wenn einer älteren Zeile außerdem
`lastInteractionAt` fehlt, greift die Aktualität bei Inaktivität auf den Startzeitpunkt dieser Sitzung zurück,
nicht auf spätere verwaltungstechnische Schreibvorgänge. Verwenden Sie `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` und die [Doctor-Migrationssequenz
](/de/cli/doctor#session-sqlite-migration), wenn Sie ausdrückliche
Inspektions- oder Validierungsnachweise benötigen.

## Sitzungswartung

OpenClaw begrenzt den Sitzungsspeicher im Zeitverlauf über `session.maintenance`; dargestellt sind die
Standardwerte:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" applies cleanup; "warn" only reports
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Bei für den Produktivbetrieb ausgelegten Grenzwerten für `maxEntries` verwenden Schreibvorgänge der Gateway-Laufzeit einen kleinen
Hochwasserpuffer und bereinigen den Speicher stapelweise wieder bis zur konfigurierten Obergrenze.
Lesevorgänge im Sitzungsspeicher bereinigen oder begrenzen während des Gateway-Starts keine Einträge, sodass
beim Start und bei isolierten Cron-Sitzungen keine vollständige Speicherbereinigung anfällt.
`openclaw sessions cleanup --enforce` wendet die Obergrenze sofort an.

Gateway-Testsitzungen für Modellausführungen sind standardmäßig kurzlebig. Zeilen, die
`agent:*:explicit:model-run-<uuid>` entsprechen, verwenden eine feste Aufbewahrungsdauer von `24h`, die Bereinigung ist jedoch
druckgesteuert: Veraltete Testzeilen werden nur entfernt, wenn der Wartungs- oder
Kapazitätsdruck für Sitzungseinträge erreicht ist. Dies erfolgt vor dem umfassenderen
Altersgrenzwert für veraltete Einträge und der Eintragsobergrenze. Normale Direkt-, Gruppen-, Thread-, Cron-, Hook-, Heartbeat-,
ACP- und Subagent-Sitzungen übernehmen diese Aufbewahrungsdauer von 24h nicht.

Bei der Wartung bleiben dauerhafte externe Unterhaltungszeiger erhalten, einschließlich Gruppen-
sitzungen und Thread-bezogener Chatsitzungen, während synthetische Cron-, Hook-, Heartbeat-,
ACP- und Subagent-Einträge weiterhin altern und entfernt werden können.

Archivierte Sitzungen wurden von Personen abgelegt und sind von jedem automatischen Wartungs-
pfad ausgenommen, einschließlich altersbedingter Bereinigung, Eintragsobergrenzen, Bereinigung von Modellausführungen und
Verdrängung aufgrund des Datenträgerbudgets. Sie bleiben archiviert, bis Sie ihre Archivierung aufheben oder sie ausdrücklich
löschen.

Wenn Sie zuvor die Isolierung von Direktnachrichten verwendet und `session.dmScope` später wieder auf
`main` gesetzt haben, zeigen Sie veraltete Peer-schlüsselbasierte Direktnachrichtenzeilen mit
`openclaw sessions cleanup --dry-run --fix-dm-scope` in einer Vorschau an. Die Anwendung desselben Flags
setzt diese alten Direktnachrichtenzeilen außer Betrieb und bewahrt ihre Transkripte als gelöschte
Archive auf.

Zeigen Sie jeden Wartungsdurchlauf mit `openclaw sessions cleanup --dry-run` in einer Vorschau an.

## Sitzungen prüfen

| Befehl                     | Anzeige                                                   |
| -------------------------- | --------------------------------------------------------- |
| `openclaw status`          | Pfad des Sitzungsspeichers und letzte Aktivität           |
| `openclaw sessions --json` | Alle Sitzungen (mit `--active <minutes>` filtern) |
| `/status` im Chat          | Kontextnutzung, Modell und Umschalter                     |
| `/context list`            | Inhalt des System-Prompts                                 |

## Weiterführende Informationen

- [Sitzungssuche](/de/concepts/session-search) – Volltextabruf über frühere Transkripte hinweg
- [Sitzungsbereinigung](/de/concepts/session-pruning) – Kürzen von Werkzeugergebnissen
- [Compaction](/de/concepts/compaction) – Zusammenfassen langer Unterhaltungen
- [Sitzungswerkzeuge](/de/concepts/session-tool) – Agentenwerkzeuge für sitzungsübergreifende Arbeit
- [Vertiefung zur Sitzungsverwaltung](/de/reference/session-management-compaction) –
  Speicherschema, Transkripte, Senderichtlinie, Ursprungsmetadaten und erweiterte Konfiguration
- [Multi-Agent](/de/concepts/multi-agent) – Weiterleitung und Sitzungsisolierung über Agenten hinweg
- [Hintergrundaufgaben](/de/automation/tasks) – wie losgelöste Arbeit Aufgabendatensätze mit Sitzungsreferenzen erstellt
- [Kanalweiterleitung](/de/channels/channel-routing) – wie eingehende Nachrichten an Sitzungen weitergeleitet werden

## Verwandte Themen

- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Sitzungswerkzeuge](/de/concepts/session-tool)
- [Befehlswarteschlange](/de/concepts/queue)
