---
read_when:
    - Sie möchten wissen, ob durch einen Neustart des Gateways laufende Agentenaufgaben verloren gehen
    - Ein Agentenlauf wurde durch einen Neustart, Absturz oder das erneute Laden der Konfiguration unterbrochen
    - Sie debuggen die automatische Sitzungswiederherstellung, nachdem das Gateway wieder verfügbar ist
summary: 'Was einen Neustart oder Absturz des Gateways übersteht: Unterbrochene Agent-Durchläufe werden automatisch fortgesetzt, Subagenten und Hintergrundaufgaben werden wiederhergestellt, ausstehende Zustellungen werden abgearbeitet'
title: Neustartwiederherstellung
x-i18n:
    generated_at: "2026-07-12T15:26:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b2701cb9cdc5aabffc395a2956260389cbe81a6c3ca2876830ef4ed83db2fb53
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Durch einen Neustart des Gateways geht der Agent-Status nicht verloren. Unterhaltungen, Transkripte,
geplante Aufträge, Datensätze zu Hintergrundaufgaben und ausgehende Nachrichten in der Warteschlange befinden sich sämtlich
auf dem Datenträger. Arbeiten, die während eines Durchlaufs unterbrochen wurden, werden erkannt und
automatisch fortgesetzt, sobald das Gateway wieder verfügbar ist. Ein manueller Eingriff ist
nicht erforderlich, und es muss nichts konfiguriert werden: Die Wiederherstellung ist immer aktiviert.

Diese Seite beschreibt, was einen Neustart übersteht, wie unterbrochene Arbeiten erkannt werden
und wie die automatische Fortsetzung abläuft.

## Was einen Neustart übersteht

| Status                        | Speicherort                                         | Verhalten bei einem Neustart                                          |
| ----------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| Unterhaltungsverlauf          | JSONL-Transkripte + sitzungsbezogener Speicher pro Agent auf dem Datenträger | Unverändert; Sitzungen werden anhand des gespeicherten Transkripts fortgesetzt |
| Unterbrochener Durchlauf der Hauptsitzung | Wiederherstellungsmarkierungen im Sitzungsspeicher | Wird wenige Sekunden nach dem Start automatisch fortgesetzt            |
| Subagent-Ausführungen         | SQLite (gemeinsame Statusdatenbank)                  | Registrierung wird beim Start wiederhergestellt; unterbrochene Ausführungen werden fortgesetzt |
| Hintergrundaufgaben           | SQLite (gemeinsame Statusdatenbank)                  | Werden beim Start abgeglichen; verwaiste Ausführungen werden wiederhergestellt oder als verloren markiert |
| Ausgehende Zustellungen in der Warteschlange | SQLite-Zustellungswarteschlange             | Wird nach dem Neustart abgearbeitet; nicht zugestellte Antworten werden erneut versucht |
| Geplante (Cron-)Aufträge      | SQLite-Cron-Speicher                                 | Zeitpläne bleiben erhalten; der Scheduler wird beim Start erneut aktiviert |
| Neustartfortsetzung           | SQLite-Neustart-Sentinel                             | Einmalige Fortsetzung wird an die Sitzung gesendet, die den Neustart angefordert hat |

## Ordnungsgemäße Neustarts warten zunächst auf den Abschluss

Ein angeforderter Neustart (`openclaw gateway restart`, eine Konfigurationsänderung, die
einen Neustart erfordert, oder ein Gateway-Update) beendet laufende Arbeiten nicht sofort. Das
Gateway nimmt keine neuen Arbeiten mehr an und wartet anschließend bis zu einem Zeitlimit für das geordnete Beenden
(standardmäßig 5 Minuten) darauf, dass aktive Agent-Durchläufe und
Hintergrundaufgaben abgeschlossen werden. Daher unterbrechen die meisten
Neustarts überhaupt keine Arbeiten.

Nur Arbeiten, die nicht innerhalb dieses Zeitlimits abgeschlossen werden können (oder Ausführungen, die
durch einen erzwungenen Neustart oder einen Absturz unterbrochen wurden), werden abgebrochen – zuvor wird jedoch jede
betroffene Sitzung zur Wiederherstellung markiert.

## Wie unterbrochene Arbeiten erkannt werden

Zwei sich ergänzende Mechanismen markieren Sitzungen, deren Durchlauf nicht abgeschlossen wurde:

- **Beim Herunterfahren:** Während des geordneten Beendens für den Neustart wird jede Sitzung mit einer aktiven Ausführung
  im Sitzungsspeicher mit einer Wiederherstellungsmarkierung versehen, bevor die Ausführung
  abgebrochen wird.
- **Beim Start:** Das Gateway durchsucht die Sitzungsspeicher nach Sitzungen, die weiterhin
  als laufend gekennzeichnet sind, im neuen Prozess jedoch keinen aktiven Eigentümer haben. Dadurch werden
  harte Abstürze und Prozessabbrüche erfasst, bei denen kein Code zum Herunterfahren ausgeführt wurde. Veraltete Sperrdateien für Transkripte
  werden gleichzeitig bereinigt.

## Automatische Fortsetzung

Wenige Sekunden nach dem Start sendet das Gateway jede markierte Sitzung erneut
mit einer synthetischen Systemnachricht, die dem Agent mitteilt, dass sein vorheriger Durchlauf
durch einen Neustart unterbrochen wurde und er anhand des vorhandenen Transkripts fortfahren soll. Wenn eine
abschließende Antwort bereits erstellt, aber noch nicht zugestellt wurde, wird ihr Text eingefügt,
damit der Agent sie zustellen kann, statt die Arbeit erneut auszuführen. Die Wiederherstellung wird bis zu
3-mal mit exponentiellem Backoff erneut versucht.

Vor der Fortsetzung prüft das Gateway, ob am Ende des Transkripts sicher
weitergearbeitet werden kann. Ist dies nicht der Fall (wenn der Durchlauf beispielsweise mit einer veralteten, ausstehenden
Genehmigung endete), wird die Sitzung nicht blind erneut ausgeführt; stattdessen veröffentlicht der Agent einen kurzen
Hinweis mit der Bitte an den Benutzer, die letzte Anfrage erneut zu senden.

OpenClaw kann auch unterbrochene schreibgeschützte Arbeiten im [Code Mode](/de/reference/code-mode)
rekonstruieren. Code Mode kennzeichnet diese Ausführungen als neustartsicher und lehnt Katalogwerkzeuge oder Plugin-Namespaces mit Nebenwirkungen
ab, bevor sie ausgeführt werden. Wenn ein Neustart während der `wait`-Steuerung erfolgt,
rekonstruiert das neue Gateway den Durchlauf anhand seines Transkripts
und erzwingt, dass die rekonstruierte Ausführung neustartsicher bleibt, selbst wenn das
Modell dieses Flag auslässt oder löscht. Der Host beschränkt den gesamten rekonstruierten
Durchlauf auf geprüfte schreibgeschützte Kernwerkzeuge und explizit wiederholungssichere Plugin-Werkzeuge,
auch wenn Code Mode nach dem Neustart deaktiviert wird. Arbeiten mit Nebenwirkungen
bleiben durch den Hinweis zum erneuten Senden geschützt, statt einen doppelten Schreibvorgang zu riskieren.

### Subagents

Subagent-Ausführungen werden in der gemeinsamen SQLite-Statusdatenbank gespeichert, sodass die
Subagent-Registrierung den Prozess übersteht. Beim Start wird die Registrierung wiederhergestellt, und
unterbrochene Subagent-Sitzungen werden mit ihrem ursprünglichen Aufgabenkontext fortgesetzt.
Es gelten zwei Sicherheitsmechanismen:

- Ausführungen, die vor mehr als 2 Stunden unterbrochen wurden, werden abgeschlossen, statt fortgesetzt zu werden, damit
  ein Gateway, das über Nacht außer Betrieb war, keine veralteten Arbeiten wieder aufnimmt.
- Eine Sitzung, deren Wiederherstellung wiederholt fehlschlägt, wird als blockiert mit einem Tombstone versehen, damit
  die Wiederherstellung nicht endlos wiederholt wird.

### Hintergrundaufgaben

Die [Registrierung für Hintergrundaufgaben](/de/automation/tasks) basiert auf SQLite und
wird beim Start sowie in regelmäßigen Abständen abgeglichen: Dauerhafte Ergebnisse, die von
abgeschlossenen Ausführungen aufgezeichnet wurden, werden wiederhergestellt, und Ausführungen, deren zugehöriger Prozess verschwunden ist, werden
nach einer Kulanzfrist als verloren markiert, statt dauerhaft hängen zu bleiben.

### Vom Agent angeforderte Neustarts

Wenn der Agent selbst einen Neustart auslöst (durch Anwenden einer Konfigurationsänderung, Aktualisieren
des Gateways oder eine explizite Neustartanforderung), wird vor dem Beenden des Prozesses ein Neustart-Sentinel in
SQLite geschrieben. Nach dem Start veröffentlicht das Gateway das Ergebnis im
ursprünglichen Chat und löst einen einmaligen Fortsetzungsdurchlauf aus, sodass der
Agent genau an der Stelle weitermacht, an der er aufgehört hat, und zwar im selben Kanal und Thread.

## Sicherheitsmechanismen und Beobachtbarkeit

- **Unterbrecher für Absturzschleifen:** 3 unsaubere Starts innerhalb von 5 Minuten lösen einen Unterbrecher aus, der
  beim nächsten Start den automatischen Start von Nebendiensten unterdrückt, damit ein abstürzendes Gateway
  das Problem nicht selbst verstärkt. Der normale Betrieb wird wiederhergestellt, sobald das Zeitfenster für unsaubere Starts abgelaufen ist.
- **Metriken:** Wiederherstellungsaktivitäten werden über
  [Prometheus](/de/gateway/prometheus) als `openclaw_session_recovery_total` und
  `openclaw_session_recovery_age_seconds` exportiert.
- **Protokolle:** Entscheidungen zur Wiederherstellung werden unter den Subsystemen
  `main-session-restart-recovery` und `subagent-interrupted-resume`
  protokolliert.

## Was nicht fortgesetzt wird

- Sitzungen, die von der Wiederherstellung der Hauptsitzung ausgeschlossen sind, weil sie bereits von einem anderen Eigentümer
  verwaltet werden: Subagent-Sitzungen (Subagent-Wiederherstellung), Cron-Sitzungen (der
  Scheduler führt sie gemäß dem Zeitplan erneut aus) und ACP-verwaltete Sitzungen (die verbundene IDE
  oder der verbundene Client ist für die Fortsetzung zuständig).
- Sitzungen, bei denen anhand des Transkriptendes nicht sicher fortgefahren werden kann; diese erhalten statt einer stillen
  erneuten Ausführung den oben beschriebenen Hinweis zum erneuten Senden.
- Arbeiten, die nie angenommen wurden: Nachrichten, die während des Zeitfensters für das geordnete Beenden eingehen, werden
  mit einem ausdrücklichen Neustartfehler abgelehnt, statt unbemerkt in die Warteschlange eines
  sich beendenden Prozesses gestellt zu werden.
