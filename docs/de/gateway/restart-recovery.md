---
read_when:
    - Sie möchten wissen, ob durch einen Neustart des Gateways laufende Agentenaufgaben verloren gehen
    - Ein Agentenlauf wurde durch einen Neustart, Absturz oder das erneute Laden der Konfiguration unterbrochen
    - Sie debuggen die automatische Sitzungswiederherstellung, nachdem das Gateway wieder verfügbar ist
summary: 'Was einen Neustart oder Absturz des Gateways übersteht: Unterbrochene Agenten-Durchläufe werden automatisch fortgesetzt, Subagenten und Hintergrundaufgaben werden wiederhergestellt, ausstehende Zustellungen werden abgearbeitet'
title: Neustartwiederherstellung
x-i18n:
    generated_at: "2026-07-24T03:48:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdea30f3a90697951f4f63a06897d2c1d936e5145138b47fed7d8ebd8b7187ad
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Ein Neustart des Gateways führt nicht zum Verlust des Agent-Status. Unterhaltungen, Transkripte,
geplante Aufträge, Datensätze zu Hintergrundaufgaben und ausgehende Nachrichten in der Warteschlange
werden alle auf dem Datenträger gespeichert. Arbeit, die mitten in einem Turn unterbrochen wurde, wird
erkannt und automatisch fortgesetzt, nachdem das Gateway wieder verfügbar ist. Die Wiederherstellung
ist immer aktiviert und erfordert normalerweise keinen manuellen Eingriff. Wiederholt fehlschlagende
Wiederherstellungen sind begrenzt und können eine Sitzung unter Quarantäne stellen, bis Sie sie prüfen
oder ersetzen.

Diese Seite beschreibt, was einen Neustart überdauert, wie unterbrochene Arbeit erkannt wird
und wie die automatische Fortsetzung aussieht.

## Was einen Neustart überdauert

| Status                        | Speicherort                                  | Verhalten bei einem Neustart                                           |
| ----------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| Unterhaltungsverlauf          | Agent-spezifische SQLite-Datenbank           | Unverändert; Sitzungen werden anhand des gespeicherten Transkripts fortgesetzt |
| Unterbrochener Turn der Hauptsitzung | Agent-spezifische SQLite-Sitzungszeile und Transkript | Wird einige Sekunden nach dem Start automatisch fortgesetzt oder abgeglichen |
| Subagent-Ausführungen         | SQLite (gemeinsame Statusdatenbank)          | Registrierung wird beim Start wiederhergestellt; unterbrochene Ausführungen werden fortgesetzt |
| Hintergrundaufgaben           | SQLite (gemeinsame Statusdatenbank)          | Werden beim Start abgeglichen; verwaiste Ausführungen werden wiederhergestellt oder als verloren markiert |
| Ausgehende Zustellungen in der Warteschlange | SQLite-Zustellungswarteschlange | Wird nach dem Neustart abgearbeitet; nicht zugestellte Antworten werden erneut versucht |
| Geplante Cron-Aufträge        | SQLite-Cron-Speicher                         | Zeitpläne bleiben erhalten; der Scheduler aktiviert sie beim Start erneut |
| Neustartfortsetzung           | SQLite-Neustart-Sentinel                     | Einmalige Fortsetzung wird an die Sitzung gesendet, die den Neustart angefordert hat |

## Geordnete Neustarts warten zunächst auf den Abschluss

Ein angeforderter Neustart (`openclaw gateway restart`, eine Konfigurationsänderung, die
einen Neustart erfordert, oder ein Gateway-Update) beendet laufende Arbeit nicht sofort. Das
Gateway nimmt keine neue Arbeit mehr an und wartet dann bis zu einem Zeitbudget für das Leeren
(standardmäßig 5 Minuten), bis aktive Agent-Turns und Hintergrundaufgaben abgeschlossen sind. Die
meisten Neustarts unterbrechen daher überhaupt nichts.

Nur Arbeit, die nicht innerhalb des Zeitbudgets für das Leeren abgeschlossen werden kann (oder eine
Ausführung, die durch einen erzwungenen Neustart oder einen Absturz unterbrochen wird), wird abgebrochen —
und bevor dies geschieht, wird jede betroffene Sitzung für die Wiederherstellung markiert.

## Erkennung unterbrochener Arbeit

Drei sich ergänzende Mechanismen markieren Sitzungen, deren Turn nicht abgeschlossen wurde:

- **Bei der Turn-Annahme:** Bei einem gewöhnlichen Text-Turn in einer vorhandenen Hauptsitzung
  hängt das Gateway die Benutzernachricht an, markiert die Sitzung als laufend und zeichnet
  ihren Zustellungsanspruch für die Wiederherstellung in einer einzigen SQLite-Transaktion auf, bevor das Modell oder
  die Ausführung des `before_agent_reply`-Hooks beginnt. Die Control UI führt dies aus, bevor sie die
  `started`-Bestätigung zurückgibt; die Kanalweiterleitung tut dies, wenn der vorbereitete Turn
  die Agent-Ausführung übernimmt.
  Befehle, Anhänge, Turn-spezifische Überschreibungen, ausstehende Zustellungen, vorherige Abbruchhinweise,
  Plugin-eigene Sitzungen und Turns mit Ausführungs-Hooks behalten ihre
  spezialisierten Annahmepfade bei.
  Wenn ein `before_agent_reply`-Hook installiert ist, wird bei der Annahme auch seine Phase aufgezeichnet.
  Die Wiederherstellung spielt niemals einen mitten im Aufruf unterbrochenen Hook erneut ab. Sobald ein unbehandelter Hook
  abgeschlossen ist, zeichnet sein Prüfpunkt dieses Ergebnis auf, aber die Wiederherstellung schlägt weiterhin sicher
  fehl, solange dieser Hook aktiv bleibt: Ein Prüfpunkt kann nicht belegen, dass nach dem
  Neustart derselbe Plugin-Code und dieselbe Konfiguration geladen wurden. Verarbeitete Text- und
  stille Ergebnisse erhalten für einen deterministischen Abschluss separate Prüfpunkte.
  Dauerhafte Wiederherstellungsansprüche, die von älteren Versionen geschrieben wurden, besitzen keine
  Markierung für die Quellzuständigkeit und unterliegen daher während eines Upgrades derselben sicheren Hook-Prüfung.
- **Beim Herunterfahren:** Während des Leerens vor dem Neustart wird jede Sitzung mit einer aktiven Ausführung
  im Sitzungsspeicher mit einer Wiederherstellungsmarkierung versehen, bevor die Ausführung
  abgebrochen wird.
- **Beim Start:** Das Gateway durchsucht Sitzungsspeicher nach Sitzungen, die weiterhin
  angeben, ausgeführt zu werden, im neuen Prozess jedoch keinen aktiven Eigentümer haben. Dies erfasst
  harte Abstürze und Prozessbeendigungen, bei denen kein Code zum Herunterfahren ausgeführt wurde. Veraltete Transkript-Sperrdateien
  werden gleichzeitig bereinigt.

## Automatische Fortsetzung

Einige Sekunden nach dem Start leitet das Gateway jede markierte Sitzung erneut
mit einer synthetischen Systemnachricht weiter, die dem Agent mitteilt, dass sein vorheriger Turn
durch einen Neustart unterbrochen wurde und er anhand des vorhandenen Transkripts fortfahren soll. Wenn bereits
eine abschließende Antwort erzeugt, aber nicht zugestellt wurde, wird ihr Text eingefügt,
damit der Agent sie zustellen kann, statt die Arbeit erneut auszuführen.

Der Abgleich beim Start versucht vorübergehende Fehler bis zu dreimal mit
exponentiellem Backoff erneut. Unabhängig davon verfügt jeder unterbrochene Hauptsitzungszyklus über ein
dauerhaftes Budget von drei berechneten automatischen Weiterleitungsversuchen, das über
Gateway-Neustarts hinweg erhalten bleibt. OpenClaw berechnet einen Versuch vor der Weiterleitung, erstattet ihn, wenn
das Gateway die Anfrage vor der Annahme ausdrücklich ablehnt, und behält die
Berechnung bei, wenn ein Ergebnis nach der Weiterleitung ungewiss ist, um eine erneute Ausführung zu vermeiden.
Vordergrundarbeit, der die Sitzung bereits gehört, verhindert die automatische Wiederherstellung,
bis diese Arbeit abgeschlossen ist.

Nachdem das dauerhafte Budget ausgeschöpft ist, erhält die Sitzung einen Tombstone, statt
endlos in einer Schleife weiterzulaufen. Prüfen Sie die fehlgeschlagene Sitzung und verwenden Sie `/new` oder `/reset`, um einen
Ersatz zu starten. `openclaw doctor --fix` kann eine veraltete Abbruchmarkierung reparieren, die
mit einem Tombstone in Konflikt steht, aktiviert diesen Wiederherstellungszyklus jedoch nicht erneut.

Jeder erneute Versuch verwendet dieselbe dauerhafte Weiterleitungskennung, sodass ein mehrdeutiger
Verbindungsfehler dieselbe Wiederherstellung nicht zweimal starten kann. Abgeschlossene und nicht fortsetzbare Turns der Control
UI behalten außerdem begrenzte dauerhafte Idempotenz-Tombstones bei, sodass ein
sich erneut verbindender Postausgang sie ohne erneute Ausführung der Anfrage entfernen kann.

Antworten, die ausschließlich das Nachrichten-Tool verwenden, nutzen eine zweite dauerhafte Korrelation. Bevor eine abschließende
Sendung innerhalb derselben Unterhaltung den Kanal erreicht, zeichnet das Gateway eine nicht aufgelöste
Zustellungsabsicht für die genaue Sitzung und den Quell-Turn auf. Ein bestätigter Erfolg des Providers
löst sie in einen dauerhaften Zustellungsbeleg auf; ein bestätigter Fehler löscht
sie. Die Wiederherstellung schließt einen Zustellungsbeleg ab, ohne Tools erneut auszuführen. Wenn ein Absturz
den Ausgang beim Provider unbekannt lässt, schlägt die Wiederherstellung sicher fehl, statt
einen externen Effekt zu wiederholen.

Die zugestellte Antwort wird außerdem zusammen mit ihrer Quellnachrichten-ID in das Transkript gespiegelt.
Abschließende Spiegelungen verwenden einen eigenen Belegschlüssel, sodass eine Fortschrittsmeldung mit
demselben Idempotenzschlüssel des Providers die Abschlussmarkierung nicht verdecken kann. Fortschrittsmeldungen
und Belege aus älteren Turns können den aktuellen Turn nicht abschließen. Nur
dauerhafte Ansprüche des Kanaleingangs können die Berechtigung für Nachrichtenaktionen wiederherstellen. Eine fortgesetzte
Ausführung behält den ursprünglichen Quellzustellungsmodus und die Quellkorrelation einschließlich
der Identität des Anfordernden und etwaiger Einschränkungen auf denselben Kanal oder Thread bei, sodass derselbe Beleg
selbst dann maßgeblich bleibt, wenn während der Wiederherstellung ein weiterer Neustart erfolgt. Ein
Turn, der ausschließlich das Nachrichten-Tool verwendet und dessen Kanalberechtigung nicht rekonstruiert werden kann,
schlägt sicher fehl und erhält den einmaligen Hinweis zum erneuten Senden.

Vor der Fortsetzung prüft das Gateway, ob das Ende des Transkripts sicher als
Ausgangspunkt verwendet werden kann. Ist dies nicht der Fall (beispielsweise wenn der Turn mit einer veralteten ausstehenden
Genehmigung endete), wird die Sitzung nicht blind erneut ausgeführt; stattdessen veröffentlicht der Agent einen kurzen
Hinweis mit der Bitte, die letzte Anfrage erneut zu senden. Bei WebChat wird dieser Hinweis
direkt in den Sitzungsverlauf geschrieben, damit er nach der erneuten Verbindung sichtbar bleibt.

OpenClaw kann außerdem unterbrochene schreibgeschützte [Code-Mode](/de/tools/code-mode)-Arbeit
rekonstruieren. Code Mode markiert diese Ausführungen als neustartsicher und lehnt Tools mit Seiteneffekten
aus dem Katalog oder Plugin-Namespaces ab, bevor sie ausgeführt werden. Wenn ein Neustart auf
das `wait`-Steuerelement trifft, rekonstruiert das neue Gateway den Turn anhand seines Transkripts
und erzwingt, dass die rekonstruierte Ausführung neustartsicher bleibt, selbst wenn das
Modell dieses Flag auslässt oder löscht. Der Host beschränkt den gesamten rekonstruierten
Turn auf geprüfte schreibgeschützte Core-Tools und ausdrücklich wiedergabesichere Plugin-Tools,
auch wenn Code Mode nach dem Neustart deaktiviert wird. Arbeit mit Seiteneffekten
bleibt durch den Hinweis zum erneuten Senden geschützt, statt einen doppelten Schreibvorgang zu riskieren.

### Subagents

Subagent-Ausführungen werden in der gemeinsamen SQLite-Statusdatenbank gespeichert, sodass die
Subagent-Registrierung den Prozess überdauert. Beim Start wird die Registrierung wiederhergestellt, und
unterbrochene Subagent-Sitzungen werden mit ihrem ursprünglichen Aufgabenkontext fortgesetzt.
Es gelten zwei Sicherheitsmechanismen:

- Ausführungen, die vor mehr als 2 Stunden unterbrochen wurden, werden abgeschlossen statt fortgesetzt, damit
  ein Gateway, das über Nacht nicht verfügbar war, keine veraltete Arbeit wiederbelebt.
- Eine Sitzung, deren Wiederherstellung wiederholt fehlschlägt, wird als blockiert mit einem Tombstone versehen, damit
  die Wiederherstellung nicht endlos wiederholt wird.

### Hintergrundaufgaben

Die [Registrierung für Hintergrundaufgaben](/de/automation/tasks) basiert auf SQLite und
wird beim Start sowie in regelmäßigen Abständen abgeglichen: Dauerhafte Ergebnisse, die von
abgeschlossenen Ausführungen aufgezeichnet wurden, werden wiederhergestellt, und Ausführungen, deren besitzender Prozess verschwunden ist, werden
nach einer Karenzzeit als verloren markiert, statt dauerhaft hängen zu bleiben.

### Vom Agent angeforderte Neustarts

Wenn der Agent selbst einen Neustart auslöst (durch Anwenden einer Konfigurationsänderung, Aktualisieren
des Gateways oder eine ausdrückliche Neustartanforderung), wird vor dem Beenden des Prozesses ein Neustart-Sentinel in
SQLite geschrieben. Nach dem Start veröffentlicht das Gateway das Ergebnis im
ursprünglichen Chat und sendet einen einmaligen Fortsetzungs-Turn, sodass der
Agent genau dort weiterarbeitet, wo er aufgehört hat, und zwar im selben Kanal und Thread.

Die typisierten SQLite-Spalten des Sentinels sind für die Neustartverarbeitung maßgeblich;
sein `payload_json`-Wert dient nur als Schatten für Wiedergabe und Debugging. Die Laufzeit liest, schreibt
und löscht den SQLite-Status ohne Datei-Fallback. Während der Speicherumstellung wird
beim Start und durch Doctor eine begrenzte Statusmigration ausgeführt, um ein
validiertes `restart-sentinel.json` zu bewahren, das der ältere Prozess nach einem Update hinterlassen hat.
Die Migration überprüft die typisierte Zeile und entfernt die Quelldatei, bevor die normale
Neustartverarbeitung fortgesetzt wird.

## Sicherheitsmechanismen und Beobachtbarkeit

- **Schutz vor Absturzschleifen:** 3 unsaubere Starts innerhalb von 5 Minuten lösen einen Schutzmechanismus aus, der
  beim nächsten Start das automatische Starten von Nebendiensten unterdrückt, damit ein abstürzendes Gateway
  den Fehler nicht selbst verstärkt. Der Schutz wird aufgehoben, sobald das Zeitfenster für unsaubere Starts abgelaufen ist.
- **Versuchslimit der Hauptsitzung:** drei berechnete automatische Weiterleitungsversuche
  pro unterbrochenem Zyklus; bei Ausschöpfung erhält diese Sitzung einen Tombstone, bis sie
  geprüft und ersetzt wird.
- **Metriken:** Wiederherstellungsaktivitäten werden über
  [Prometheus](/de/gateway/prometheus) als `openclaw_session_recovery_total` und
  `openclaw_session_recovery_age_seconds` exportiert.
- **Protokolle:** Entscheidungen zur Wiederherstellung werden in den
  Subsystemen `main-session-restart-recovery` und `subagent-interrupted-resume`
  protokolliert.

## Was nicht fortgesetzt wird

- Sitzungen, die von der Wiederherstellung der Hauptsitzung ausgeschlossen sind, weil sie bereits von einem anderen Eigentümer
  verwaltet werden: Subagent-Sitzungen (Subagent-Wiederherstellung), Cron-Sitzungen (der
  Scheduler führt sie planmäßig erneut aus) und ACP-verwaltete Sitzungen (die verbundene IDE
  oder der Client ist für die Fortsetzung zuständig).
- Sitzungen, deren Transkriptende nicht sicher fortgesetzt werden kann; diese erhalten den
  oben beschriebenen Hinweis zum erneuten Senden statt einer stillen erneuten Ausführung.
- Arbeit, die nie angenommen wurde: Nachrichten, die während des Leerungszeitfensters eintreffen, werden
  mit einem ausdrücklichen Neustartfehler abgelehnt, statt unbemerkt in einem
  auslaufenden Prozess in die Warteschlange gestellt zu werden.
- Eigenständige eingebettete Turns können keine Hauptsitzung mit ausstehender
  Neustartwiederherstellung übernehmen, da sie nicht denselben Lebenszyklus-Eigentümer wie das Gateway verwenden.
  Führen Sie den Turn über das Gateway aus oder setzen Sie ihn dort mit `/new` oder `/reset` zurück.
