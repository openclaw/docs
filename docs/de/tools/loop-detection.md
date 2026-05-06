---
read_when:
    - Ein Benutzer meldet, dass Agenten beim wiederholten Ausführen von Tool-Aufrufen hängen bleiben
    - Sie müssen den Schutz vor wiederholten Aufrufen anpassen
    - Sie bearbeiten Tool-/Laufzeit-Richtlinien für Agenten
    - Bei Ihnen treten nach einem Wiederholungsversuch wegen Kontextüberlaufs `compaction_loop_persisted` Abbrüche auf
summary: So aktivieren und optimieren Sie Guardrails, die sich wiederholende Tool-Aufruf-Schleifen erkennen
title: Tool-Loop-Erkennung
x-i18n:
    generated_at: "2026-05-06T07:06:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw verfügt über zwei zusammenarbeitende Schutzmechanismen für repetitive Tool-Aufrufmuster:

1. **Loop-Erkennung** (`tools.loopDetection.enabled`) — standardmäßig deaktiviert. Überwacht den rollierenden Tool-Aufrufverlauf auf wiederholte Muster und Wiederholungsversuche für unbekannte Tools.
2. **Post-Compaction-Guard** (`tools.loopDetection.postCompactionGuard`) — standardmäßig aktiviert, außer `tools.loopDetection.enabled` ist ausdrücklich `false`. Wird nach jedem Compaction-Retry scharfgeschaltet und bricht den Lauf ab, wenn der Agent innerhalb des Fensters dasselbe `(tool, args, result)`-Tripel ausgibt.

Beide werden im selben `tools.loopDetection`-Block konfiguriert, aber der Post-Compaction-Guard läuft immer dann, wenn der Hauptschalter nicht ausdrücklich ausgeschaltet ist. Setzen Sie `tools.loopDetection.enabled: false`, um beide Bereiche stummzuschalten.

## Warum es das gibt

- Repetitive Sequenzen erkennen, die keinen Fortschritt erzielen.
- Hochfrequente Schleifen ohne Ergebnis erkennen (gleiches Tool, gleiche Eingaben, wiederholte Fehler).
- Bestimmte Wiederholungsaufrufmuster für bekannte Polling-Tools erkennen.
- Verhindern, dass Kontextüberlauf, anschließende Compaction und dieselben Schleifenzyklen unbegrenzt weiterlaufen.

## Konfigurationsblock

Globale Standardwerte, mit allen dokumentierten Feldern:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
      },
    },
  },
}
```

Optionale Überschreibung pro Agent:

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Feldverhalten

| Feld                             | Standard | Wirkung                                                                                                                         |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`  | Hauptschalter für die Detektoren des rollierenden Verlaufs. Das Setzen auf `false` deaktiviert auch den Post-Compaction-Guard.  |
| `historySize`                    | `30`     | Anzahl der letzten Tool-Aufrufe, die für die Analyse aufbewahrt werden.                                                         |
| `warningThreshold`               | `10`     | Schwellenwert, ab dem ein Muster nur als Warnung eingestuft wird.                                                               |
| `criticalThreshold`              | `20`     | Schwellenwert zum Blockieren repetitiver Schleifenmuster.                                                                       |
| `unknownToolThreshold`           | `10`     | Blockiert nach dieser Anzahl von Fehlschlägen wiederholte Aufrufe an dasselbe nicht verfügbare Tool.                            |
| `globalCircuitBreakerThreshold`  | `30`     | Globaler Unterbrecherschwellenwert für ausbleibenden Fortschritt über alle Detektoren hinweg.                                   |
| `detectors.genericRepeat`        | `true`   | Erkennt wiederholte Muster aus demselben Tool und denselben Parametern.                                                         |
| `detectors.knownPollNoProgress`  | `true`   | Erkennt bekannte Polling-ähnliche Muster ohne Zustandsänderung.                                                                 |
| `detectors.pingPong`             | `true`   | Erkennt alternierende Ping-Pong-Muster.                                                                                         |
| `postCompactionGuard.windowSize` | `3`      | Anzahl der Tool-Aufrufe nach Compaction, während der Guard scharf bleibt, sowie die Anzahl identischer Tripel, die den Lauf abbricht. |

Für `exec` vergleichen Prüfungen auf ausbleibenden Fortschritt stabile Befehlsergebnisse und ignorieren flüchtige Laufzeitmetadaten wie Dauer, PID, Sitzungs-ID und Arbeitsverzeichnis. Wenn eine Lauf-ID verfügbar ist, wird der aktuelle Tool-Aufrufverlauf nur innerhalb dieses Laufs ausgewertet, sodass geplante Heartbeat-Zyklen und neue Läufe keine veralteten Schleifenzähler aus früheren Läufen übernehmen.

## Empfohlene Einrichtung

- Setzen Sie für kleinere Modelle `enabled: true` und belassen Sie die Schwellenwerte bei ihren Standardwerten. Flaggschiffmodelle benötigen die Erkennung über den rollierenden Verlauf nur selten und können den Hauptschalter auf `false` belassen, während sie dennoch vom Post-Compaction-Guard profitieren.
- Halten Sie die Schwellenwerte in der Reihenfolge `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Wenn falsch positive Treffer auftreten:
  - Erhöhen Sie `warningThreshold` und/oder `criticalThreshold`.
  - Erhöhen Sie optional `globalCircuitBreakerThreshold`.
  - Deaktivieren Sie nur den spezifischen Detektor, der Probleme verursacht (`detectors.<name>: false`).
  - Reduzieren Sie `historySize` für einen weniger strikten historischen Kontext.
- Um alles zu deaktivieren, einschließlich des Post-Compaction-Guards, setzen Sie `tools.loopDetection.enabled: false` ausdrücklich.

## Post-Compaction-Guard

Wenn der Runner nach einem Kontextüberlauf einen Compaction-Retry abschließt, schaltet er einen Guard mit kurzem Fenster scharf, der die nächsten wenigen Tool-Aufrufe überwacht. Wenn der Agent innerhalb des Fensters dasselbe `(toolName, argsHash, resultHash)`-Tripel mehrfach ausgibt, schließt der Guard daraus, dass die Compaction die Schleife nicht durchbrochen hat, und bricht den Lauf mit einem `compaction_loop_persisted`-Fehler ab.

Der Guard wird durch das Master-Flag `tools.loopDetection.enabled` gesteuert, mit einer Besonderheit: Er bleibt **aktiviert, wenn das Flag nicht gesetzt oder `true` ist**, und wird nur deaktiviert, wenn das Flag ausdrücklich `false` ist. Das ist beabsichtigt. Der Guard dient dazu, Compaction-Schleifen zu verlassen, die sonst unbegrenzt Tokens verbrauchen würden, sodass Nutzer ohne Konfiguration dennoch geschützt sind.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- Ein niedrigerer `windowSize` ist strenger (weniger Versuche vor dem Abbruch).
- Ein höherer `windowSize` gibt dem Agent mehr Wiederherstellungsversuche.
- Der Guard bricht nie ab, wenn sich Ergebnisse ändern, sondern nur, wenn Ergebnisse über das Fenster hinweg byte-identisch sind.
- Er ist bewusst eng gefasst: Er löst nur unmittelbar nach einem Compaction-Retry aus.

<Note>
  Der Post-Compaction-Guard läuft immer dann, wenn das Master-Flag nicht ausdrücklich `false` ist, selbst wenn Sie nie einen `tools.loopDetection`-Block geschrieben haben. Suchen Sie zur Überprüfung direkt nach einem Compaction-Ereignis im Gateway-Log nach `post-compaction guard armed for N attempts`.
</Note>

## Logs und erwartetes Verhalten

Wenn eine Schleife erkannt wird, meldet OpenClaw ein Schleifenereignis und dämpft oder blockiert je nach Schweregrad den nächsten Tool-Zyklus. Das schützt Nutzer vor ausufernden Token-Kosten und Blockaden, während der normale Tool-Zugriff erhalten bleibt.

- Warnungen kommen zuerst.
- Unterdrückung folgt, wenn Muster über den Warnschwellenwert hinaus bestehen bleiben.
- Kritische Schwellenwerte blockieren den nächsten Tool-Zyklus und zeigen im Laufdatensatz einen klaren Grund der Loop-Erkennung an.
- Der Post-Compaction-Guard gibt `compaction_loop_persisted`-Fehler mit dem Namen des betroffenen Tools und der Anzahl identischer Aufrufe aus.

## Verwandt

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/de/tools/exec-approvals" icon="shield">
    Zulassen-/Ablehnen-Richtlinie für Shell-Ausführung.
  </Card>
  <Card title="Thinking levels" href="/de/tools/thinking" icon="brain">
    Reasoning-Effort-Stufen und Interaktion mit Provider-Richtlinien.
  </Card>
  <Card title="Sub-agents" href="/de/tools/subagents" icon="users">
    Starten isolierter Agents, um ausuferndes Verhalten einzugrenzen.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges `tools.loopDetection`-Schema und Zusammenführungssemantik.
  </Card>
</CardGroup>
