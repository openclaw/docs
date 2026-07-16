---
read_when:
    - Sie möchten wissen, ob beim Neustart des Gateways laufende Agentenaufgaben verloren gehen.
    - Ein Agentenlauf wurde durch einen Neustart, einen Absturz oder ein erneutes Laden der Konfiguration unterbrochen
    - Sie debuggen die automatische Sitzungswiederherstellung, nachdem das Gateway wieder verfügbar ist
summary: 'Was einen Neustart oder Absturz des Gateways übersteht: Unterbrochene Agent-Durchläufe werden automatisch fortgesetzt, Subagenten und Hintergrundaufgaben werden wiederhergestellt, und ausstehende Zustellungen werden abgearbeitet'
title: Neustartwiederherstellung
x-i18n:
    generated_at: "2026-07-16T12:50:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Ein Neustart des Gateways führt nicht zum Verlust des Agent-Status. Unterhaltungen, Transkripte,
geplante Aufträge, Datensätze zu Hintergrundaufgaben und ausgehende Nachrichten in der Warteschlange
werden alle auf der Festplatte gespeichert. Arbeit, die während eines Durchlaufs unterbrochen wurde,
wird automatisch erkannt und fortgesetzt, nachdem das Gateway wieder verfügbar ist. Es ist kein
manueller Eingriff erforderlich und nichts muss konfiguriert werden: Die Wiederherstellung ist immer aktiviert.

Diese Seite beschreibt, was einen Neustart übersteht, wie unterbrochene Arbeit erkannt wird
und wie die automatische Fortsetzung abläuft.

## Was einen Neustart übersteht

| Status                        | Speicherort                                  | Verhalten bei einem Neustart                                           |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Unterhaltungsverlauf          | Agent-spezifische SQLite-Datenbank           | Unverändert; Sitzungen werden ab dem gespeicherten Transkript fortgesetzt |
| Unterbrochener Durchlauf der Hauptsitzung | Agent-spezifische SQLite-Sitzungszeile und Transkript | Wird einige Sekunden nach dem Start automatisch fortgesetzt oder abgeglichen |
| Subagent-Ausführungen         | SQLite (gemeinsame Statusdatenbank)          | Registry wird beim Start wiederhergestellt; unterbrochene Ausführungen werden fortgesetzt |
| Hintergrundaufgaben           | SQLite (gemeinsame Statusdatenbank)          | Werden beim Start abgeglichen; verwaiste Ausführungen werden wiederhergestellt oder als verloren markiert |
| Ausgehende Zustellungen in der Warteschlange | SQLite-Zustellungswarteschlange | Wird nach dem Neustart abgearbeitet; nicht zugestellte Antworten werden erneut versucht |
| Geplante (Cron-)Aufträge      | SQLite-Cron-Speicher                         | Zeitpläne bleiben erhalten; der Scheduler wird beim Start erneut aktiviert |
| Neustartfortsetzung           | SQLite-Neustart-Sentinel                     | Einmalige Folgeaktion wird an die Sitzung gesendet, die den Neustart angefordert hat |

## Ordnungsgemäße Neustarts lassen laufende Arbeit zuerst auslaufen

Ein angeforderter Neustart (`openclaw gateway restart`, eine Konfigurationsänderung, die
einen Neustart erfordert, oder eine Aktualisierung des Gateways) beendet laufende Arbeit nicht sofort. Das
Gateway nimmt keine neue Arbeit mehr an und wartet anschließend bis zum Ablauf eines Zeitbudgets
(standardmäßig 5 Minuten), bis aktive Agent-Durchläufe und Hintergrundaufgaben abgeschlossen sind. Die meisten
Neustarts unterbrechen daher überhaupt nichts.

Nur Arbeit, die nicht innerhalb dieses Zeitbudgets abgeschlossen werden kann (oder eine Ausführung, die
durch einen erzwungenen Neustart oder einen Absturz unterbrochen wird), wird abgebrochen – zuvor wird jedoch jede
betroffene Sitzung zur Wiederherstellung markiert.

## Erkennung unterbrochener Arbeit

Drei sich ergänzende Mechanismen markieren Sitzungen, deren Durchlauf nicht abgeschlossen wurde:

- **Bei der Annahme des Durchlaufs:** Bei einem gewöhnlichen Textdurchlauf in einer bestehenden Hauptsitzung
  hängt das Gateway die Benutzernachricht an, markiert die Sitzung als laufend und zeichnet
  ihren Wiederherstellungs-Zustellungsanspruch in einer einzigen SQLite-Transaktion auf, bevor das Modell oder
  der `before_agent_reply`-Hook ausgeführt wird. Die Control UI führt dies vor der Rückgabe der
  `started`-Bestätigung aus; die Kanalweiterleitung führt es aus, wenn der vorbereitete Durchlauf
  die Agent-Ausführung übernimmt.
  Befehle, Anhänge, durchlaufspezifische Überschreibungen, ausstehende Zustellungen, vorherige Abbruchhinweise,
  Plugin-eigene Sitzungen und Durchläufe mit Ausführungs-Hooks behalten ihre
  spezialisierten Annahmepfade bei.
  Wenn ein `before_agent_reply`-Hook installiert ist, zeichnet die Annahme auch dessen Phase auf.
  Die Wiederherstellung spielt einen mitten im Aufruf unterbrochenen Hook niemals erneut ab. Sobald ein nicht behandelter Hook
  abgeschlossen ist, zeichnet sein Checkpoint dieses Ergebnis auf. Die Wiederherstellung schlägt jedoch weiterhin
  sicher fehl, solange dieser Hook aktiv bleibt: Ein Checkpoint kann nicht beweisen, dass nach dem Neustart
  derselbe Plugin-Code und dieselbe Konfiguration geladen wurden. Behandelte Text- und
  stille Ergebnisse werden für einen deterministischen Abschluss getrennt in Checkpoints festgehalten.
  Dauerhafte Wiederherstellungsansprüche, die von älteren Versionen geschrieben wurden, besitzen keine Markierung
  der Quellzuständigkeit und erhalten daher während eines Upgrades dieselbe sicher fehlschlagende Hook-Prüfung.
- **Beim Herunterfahren:** Während des Auslaufens vor dem Neustart wird jede Sitzung mit einer aktiven Ausführung
  im Sitzungsspeicher mit einer Wiederherstellungsmarkierung versehen, bevor die Ausführung
  abgebrochen wird.
- **Beim Start:** Das Gateway durchsucht die Sitzungsspeicher nach Sitzungen, die weiterhin
  als laufend gekennzeichnet sind, aber im neuen Prozess keinen aktiven Eigentümer haben. Dadurch werden
  harte Abstürze und erzwungene Beendigungen erfasst, bei denen kein Code zum Herunterfahren ausgeführt wurde. Veraltete
  Sperrdateien für Transkripte werden gleichzeitig bereinigt.

## Automatische Fortsetzung

Einige Sekunden nach dem Start leitet das Gateway jede markierte Sitzung erneut weiter,
mit einer synthetischen Systemnachricht, die dem Agent mitteilt, dass sein vorheriger Durchlauf
durch einen Neustart unterbrochen wurde und er anhand des vorhandenen Transkripts fortfahren soll. Wenn
bereits eine endgültige Antwort erzeugt, aber noch nicht zugestellt wurde, wird ihr Text einbezogen,
damit der Agent sie zustellen kann, statt die Arbeit erneut auszuführen. Die Wiederherstellung unternimmt
bis zu 3 Versuche mit exponentiellem Backoff. Jeder erneute Versuch verwendet dieselbe dauerhafte
Weiterleitungskennung, sodass ein uneindeutiger Verbindungsfehler dieselbe Wiederherstellung nicht
zweimal starten kann. Abgeschlossene und nicht fortsetzbare Control-UI-Durchläufe behalten außerdem
zeitlich begrenzte dauerhafte Idempotenz-Tombstones, sodass eine sich erneut verbindende Outbox sie
entfernen kann, ohne die Anfrage erneut auszuführen.

Antworten, die ausschließlich das Nachrichten-Tool verwenden, nutzen eine zweite dauerhafte Korrelation. Bevor eine abschließende
Sendung innerhalb derselben Unterhaltung den Kanal erreicht, zeichnet das Gateway eine nicht aufgelöste
Zustellungsabsicht für die genaue Sitzung und den Quelldurchlauf auf. Ein bestätigter Erfolg beim Provider
löst sie in einen dauerhaften Zustellungsbeleg auf; ein bestätigter Fehler löscht
sie. Die Wiederherstellung schließt einen Zustellungsbeleg ab, ohne Tools erneut auszuführen. Wenn ein Absturz
das Ergebnis beim Provider unbekannt lässt, schlägt die Wiederherstellung sicher fehl, statt
einen externen Effekt erneut auszuführen.

Die zugestellte Antwort wird außerdem zusammen mit ihrer Quellnachrichten-ID in das Transkript gespiegelt.
Abschließende Spiegelungen verwenden einen eigenen Belegschlüssel, sodass eine Fortschrittsmeldung mit
demselben Idempotenzschlüssel des Providers die abschließende Markierung nicht verdecken kann. Fortschrittsmeldungen
und Belege aus älteren Durchläufen können den aktuellen Durchlauf nicht abschließen. Nur
dauerhafte Ansprüche des Kanaleingangs können die Berechtigung für Nachrichtenaktionen wiederherstellen. Eine fortgesetzte
Ausführung behält den ursprünglichen Quellzustellungsmodus und die Quellkorrelation bei, einschließlich
der Identität des Anforderers und etwaiger Einschränkungen auf denselben Kanal oder Thread, sodass derselbe Beleg
auch dann maßgeblich bleibt, wenn während der Wiederherstellung ein weiterer Neustart erfolgt. Ein
ausschließlich das Nachrichten-Tool verwendender Durchlauf ohne rekonstruierbare Kanalberechtigung schlägt
sicher fehl und erhält den einmaligen Hinweis zum erneuten Senden.

Vor der Fortsetzung prüft das Gateway, ob das Ende des Transkripts eine sichere
Fortsetzung erlaubt. Ist dies nicht der Fall (beispielsweise wenn der Durchlauf mit einer veralteten ausstehenden
Genehmigung endete), wird die Sitzung nicht blind erneut ausgeführt; stattdessen veröffentlicht der Agent einen kurzen
Hinweis mit der Aufforderung, die letzte Anfrage erneut zu senden. Bei WebChat wird dieser Hinweis
direkt in den Sitzungsverlauf geschrieben, damit er nach einer erneuten Verbindung sichtbar bleibt.

OpenClaw kann außerdem unterbrochene schreibgeschützte [Code-Mode](/de/reference/code-mode)-Arbeit
rekonstruieren. Code Mode markiert diese Ausführungen als neustartsicher und weist Katalog-Tools mit Nebenwirkungen
oder Plugin-Namespaces zurück, bevor sie ausgeführt werden. Wenn ein Neustart bei der
`wait`-Steuerung erfolgt, rekonstruiert das neue Gateway den Durchlauf anhand seines Transkripts
und erzwingt, dass die rekonstruierte Ausführung neustartsicher bleibt, selbst wenn das
Modell dieses Flag auslässt oder löscht. Der Host beschränkt den gesamten rekonstruierten
Durchlauf auf geprüfte schreibgeschützte Core-Tools und ausdrücklich wiedergabesichere Plugin-Tools,
auch wenn Code Mode nach dem Neustart deaktiviert wird. Arbeit mit Nebenwirkungen
bleibt durch den Hinweis zum erneuten Senden abgesichert, statt einen doppelten Schreibvorgang zu riskieren.

### Subagents

Subagent-Ausführungen werden dauerhaft in der gemeinsamen SQLite-Statusdatenbank gespeichert, sodass die
Subagent-Registry den Prozess übersteht. Beim Start wird die Registry wiederhergestellt und
unterbrochene Subagent-Sitzungen werden mit ihrem ursprünglichen Aufgabenkontext fortgesetzt.
Es gelten zwei Sicherheitsmechanismen:

- Ausführungen, die vor mehr als 2 Stunden unterbrochen wurden, werden abgeschlossen statt fortgesetzt, damit
  ein Gateway, das über Nacht nicht verfügbar war, keine veraltete Arbeit wiederbelebt.
- Eine Sitzung, deren Wiederherstellung wiederholt fehlschlägt, wird als blockiert mit einem Tombstone versehen, damit
  die Wiederherstellung nicht endlos in einer Schleife läuft.

### Hintergrundaufgaben

Die [Registry für Hintergrundaufgaben](/de/automation/tasks) basiert auf SQLite und
wird beim Start sowie in regelmäßigen Abständen abgeglichen: Dauerhafte Ergebnisse, die von
abgeschlossenen Ausführungen aufgezeichnet wurden, werden wiederhergestellt, und Ausführungen, deren zugehöriger Prozess
verschwunden ist, werden nach einer Kulanzfrist als verloren markiert, statt dauerhaft zu hängen.

### Vom Agent angeforderte Neustarts

Wenn der Agent selbst einen Neustart auslöst (durch Anwenden einer Konfigurationsänderung, Aktualisieren
des Gateways oder eine ausdrückliche Neustartanforderung), wird vor dem Beenden des Prozesses ein
Neustart-Sentinel in SQLite geschrieben. Nach dem Start veröffentlicht das Gateway das Ergebnis wieder
im ursprünglichen Chat und leitet einen einmaligen Fortsetzungsdurchlauf weiter, sodass der
Agent genau an derselben Stelle und im selben Kanal und Thread fortfährt.

## Sicherheitsmechanismen und Beobachtbarkeit

- **Schutz vor Absturzschleifen:** 3 unsaubere Starts innerhalb von 5 Minuten lösen einen Schutzmechanismus aus, der
  beim nächsten Start das automatische Starten von Nebendiensten unterdrückt, damit ein abstürzendes Gateway
  den Fehler nicht selbst verstärkt. Der normale Betrieb wird wiederhergestellt, sobald das Zeitfenster der unsauberen Starts abgelaufen ist.
- **Metriken:** Wiederherstellungsaktivitäten werden über
  [Prometheus](/de/gateway/prometheus) als `openclaw_session_recovery_total` und
  `openclaw_session_recovery_age_seconds` exportiert.
- **Protokolle:** Wiederherstellungsentscheidungen werden in den Subsystemen
  `main-session-restart-recovery` und `subagent-interrupted-resume`
  protokolliert.

## Was nicht fortgesetzt wird

- Sitzungen, die von der Wiederherstellung der Hauptsitzung ausgeschlossen sind, weil bereits ein anderer Eigentümer
  für sie zuständig ist: Subagent-Sitzungen (Subagent-Wiederherstellung), Cron-Sitzungen (der
  Scheduler führt sie planmäßig erneut aus) und von ACP verwaltete Sitzungen (die verbundene IDE
  oder der verbundene Client ist für die Fortsetzung zuständig).
- Sitzungen, deren Transkriptende keine sichere Fortsetzung erlaubt; diese erhalten statt einer
  stillen erneuten Ausführung den oben beschriebenen Hinweis zum erneuten Senden.
- Arbeit, die nie angenommen wurde: Nachrichten, die während des Auslauffensters eingehen, werden
  mit einem ausdrücklichen Neustartfehler abgelehnt, statt stillschweigend in die Warteschlange eines
  sich beendenden Prozesses gestellt zu werden.
