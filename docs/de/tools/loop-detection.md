---
read_when:
    - Ein Benutzer berichtet, dass Agenten in einer Schleife wiederholt Tool-Aufrufe ausführen.
    - Sie müssen den Schutz vor wiederholten Aufrufen optimieren
    - Sie bearbeiten Richtlinien für Agenten-Tools und -Laufzeiten
    - Nach einem Wiederholungsversuch wegen Kontextüberlaufs treten `compaction_loop_persisted`-Abbrüche auf
summary: So aktivieren und optimieren Sie Schutzmechanismen, die sich wiederholende Schleifen von Tool-Aufrufen erkennen
title: Erkennung von Tool-Schleifen
x-i18n:
    generated_at: "2026-07-12T15:59:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw verfügt über zwei zusammenwirkende Schutzmechanismen gegen sich wiederholende Tool-Aufrufsmuster,
die beide unter `tools.loopDetection` konfiguriert werden:

1. **Schleifenerkennung** (`enabled`) – standardmäßig deaktiviert. Überwacht den gleitenden
   Verlauf der Tool-Aufrufe auf wiederholte Muster und erneute Versuche mit unbekannten Tools.
2. **Schutz nach Compaction** (`postCompactionGuard`) – aktiviert, sofern
   `enabled` nicht ausdrücklich auf `false` gesetzt ist. Wird nach jedem Compaction-Wiederholungsversuch aktiviert und
   bricht den Lauf ab, wenn der Agent dasselbe Tripel `(tool, args, result)`
   innerhalb des Fensters wiederholt.

Setzen Sie `tools.loopDetection.enabled: false`, um beide Schutzmechanismen zu deaktivieren.

## Warum dies existiert

- Sich wiederholende Sequenzen erkennen, die keinen Fortschritt erzielen.
- Hochfrequente Schleifen ohne Ergebnis erkennen (gleiches Tool, gleiche Eingaben, wiederholte
  Fehler).
- Bestimmte Muster wiederholter Aufrufe für bekannte Polling-Tools erkennen.
- Zyklen aus Kontextüberlauf -> Compaction -> derselben Schleife unterbrechen, statt sie
  unbegrenzt weiterlaufen zu lassen.

## Konfigurationsblock

Globale Standardwerte mit allen dokumentierten Feldern:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // Hauptschalter für die Detektoren mit gleitendem Verlauf
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
        windowSize: 3, // nach einem Compaction-Wiederholungsversuch aktiviert; wird ausgeführt, sofern enabled nicht ausdrücklich false ist
      },
    },
  },
}
```

Optionale Überschreibung pro Agent (unter `agents.list[].tools.loopDetection`):

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

Die Einstellungen pro Agent überlagern den globalen Block Feld für Feld (einschließlich verschachtelter
`detectors` und `postCompactionGuard`), sodass ein Agent nur die
Felder festlegen muss, die er ändern möchte.

### Verhalten der Felder

| Feld                             | Standardwert | Wirkung                                                                                                                                                                               |
| -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`      | Hauptschalter für die Detektoren mit gleitendem Verlauf. `false` deaktiviert außerdem den Schutz nach Compaction.                                                                      |
| `historySize`                    | `30`         | Anzahl der für die Analyse vorgehaltenen letzten Tool-Aufrufe.                                                                                                                        |
| `warningThreshold`               | `10`         | Anzahl der Wiederholungen, bevor ein Muster lediglich als Warnung eingestuft wird.                                                                                                    |
| `criticalThreshold`              | `20`         | Anzahl der Wiederholungen, ab der ein Schleifenmuster ohne Fortschritt blockiert wird. Bei einer Fehlkonfiguration setzt die Runtime diesen Wert oberhalb von `warningThreshold`.      |
| `unknownToolThreshold`           | `10`         | Blockiert nach dieser Anzahl fehlgeschlagener Versuche wiederholte Aufrufe desselben nicht verfügbaren Tools. Wird nicht durch `detectors` gesteuert.                                  |
| `globalCircuitBreakerThreshold`  | `30`         | Globaler Schutzschalter bei fehlendem Fortschritt über alle Detektoren hinweg. Bei einer Fehlkonfiguration setzt die Runtime diesen Wert oberhalb von `criticalThreshold`. Wird nicht durch `detectors` gesteuert. |
| `detectors.genericRepeat`        | `true`       | Warnt bei wiederholten Aufrufen mit demselben Tool und denselben Argumenten; blockiert, sobald diese Aufrufe außerdem identische Ergebnisse zurückgeben.                               |
| `detectors.knownPollNoProgress`  | `true`       | Erkennt bekannte Polling-Muster ohne Fortschritt (`process` mit `action: "poll"`/`"log"`, `command_status`).                                                                          |
| `detectors.pingPong`             | `true`       | Erkennt alternierende Pingpong-Muster ohne Fortschritt zwischen zwei Aufrufen.                                                                                                        |
| `postCompactionGuard.windowSize` | `3`          | Anzahl der Versuche, für die der Schutz nach der Compaction aktiviert bleibt, sowie Anzahl identischer Tripel, bei der der Lauf abgebrochen wird.                                     |

Für `exec` vergleicht das Hashing bei fehlendem Fortschritt stabile Befehlsergebnisse (Status,
Exit-Code, Zeitüberschreitungskennzeichen, Ausgabe) und ignoriert flüchtige Runtime-Metadaten wie
Dauer, PID, Sitzungs-ID und Arbeitsverzeichnis. Ergebnisse ausgehender Nachrichtenversände
werden ohne flüchtige aufrufspezifische IDs (Nachrichten-ID, Datei-ID, Zeitstempel)
gehasht, sodass ein „gesendet“-Ergebnis nicht mit einem anderen „gesendet“-
Ergebnis identisch erscheint. Wenn eine Lauf-ID verfügbar ist, wird der Verlauf nur innerhalb dieses Laufs ausgewertet,
sodass geplante Heartbeat-Zyklen und neue Läufe keine veralteten Schleifenzähler
aus früheren Läufen übernehmen.

## Empfohlene Einrichtung

- Setzen Sie für kleinere Modelle `enabled: true` und belassen Sie die Schwellenwerte bei ihren
  Standardwerten. Spitzenmodelle benötigen die Erkennung anhand des gleitenden Verlaufs nur selten und können
  den Hauptschalter auf `false` belassen, während sie weiterhin vom
  Schutz nach Compaction profitieren.
- Halten Sie die Schwellenwerte in der Reihenfolge `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`; die Runtime erhöht `criticalThreshold` und
  `globalCircuitBreakerThreshold`, wenn Sie sie auf oder unter den
  Schwellenwert setzen, den sie überschreiten müssen.
- Falls Fehlalarme auftreten:
  - Erhöhen Sie `warningThreshold` und/oder `criticalThreshold`.
  - Erhöhen Sie optional `globalCircuitBreakerThreshold`.
  - Deaktivieren Sie nur den spezifischen Detektor, der Probleme verursacht (`detectors.<name>: false`).
  - Verringern Sie `historySize`, um ein kürzeres Verlaufsfenster zu verwenden.
- Um alles einschließlich des Schutzes nach Compaction zu deaktivieren, setzen Sie
  `tools.loopDetection.enabled: false` ausdrücklich.

## Schutz nach Compaction

Nach einem Compaction-Wiederholungsversuch infolge eines Kontextüberlaufs aktiviert die Ausführung
für die nächsten Tool-Aufrufe einen Schutz mit kurzem Fenster. Wenn der Agent dasselbe
Tripel `(toolName, argsHash, resultHash)` innerhalb dieses Fensters
`postCompactionGuard.windowSize`-mal ausgibt, kommt der Schutz zu dem Schluss, dass die Compaction die
Schleife nicht unterbrochen hat, und bricht den Lauf mit einem Fehler vom Typ `compaction_loop_persisted` ab.

Der Schutz wird durch das Haupt-Flag `tools.loopDetection.enabled` gesteuert, jedoch mit einer
Besonderheit: Er bleibt **aktiviert, wenn das Flag nicht gesetzt oder `true` ist**, und wird nur
deaktiviert, wenn das Flag ausdrücklich auf `false` gesetzt ist. Dies ist beabsichtigt – der Schutz
dient dazu, Compaction-Schleifen zu verlassen, die andernfalls unbegrenzt Tokens verbrauchen würden,
sodass auch Benutzer ohne Konfiguration geschützt sind.

```json5
{
  tools: {
    loopDetection: {
      // Hauptschalter; auf false setzen, um den Schutz zusammen mit den Detektoren mit gleitendem Verlauf zu deaktivieren
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // Standardwert
      },
    },
  },
}
```

- Ein niedrigerer Wert für `windowSize` ist strenger (weniger Versuche vor dem Abbruch).
- Ein höherer Wert für `windowSize` gewährt dem Agent mehr Wiederherstellungsversuche.
- Der Schutz bricht niemals ab, solange sich die Ergebnisse ändern; nur byte-identische
  Ergebnisse innerhalb des Fensters lösen ihn aus.
- Er wird nur unmittelbar nach einem Compaction-Wiederholungsversuch aktiviert, nicht an anderen
  Stellen eines Laufs.

<Note>
  Der Schutz nach Compaction wird immer ausgeführt, wenn das Haupt-Flag nicht ausdrücklich auf `false` gesetzt ist, selbst wenn Sie nie einen `tools.loopDetection`-Block angelegt haben. Suchen Sie zur Überprüfung unmittelbar nach einem Compaction-Ereignis im Gateway-Protokoll nach `post-compaction guard armed for N attempts`.
</Note>

## Protokolle und erwartetes Verhalten

Wenn eine Schleife erkannt wird, protokolliert OpenClaw ein Schleifenereignis und warnt entweder oder blockiert
abhängig vom Schweregrad den nächsten Tool-Zyklus. Dies schützt vor unkontrolliertem
Token-Verbrauch und Blockierungen, während der normale Tool-Zugriff erhalten bleibt.

- Zuerst werden Warnungen ausgegeben.
- Die Blockierung folgt, sobald ein Muster über den Warnschwellenwert hinaus bestehen bleibt.
- Kritische Schwellenwerte blockieren den nächsten Tool-Zyklus und zeigen einen eindeutigen
  Grund der Schleifenerkennung im Laufdatensatz an.
- Der Schutz nach Compaction gibt Fehler vom Typ `compaction_loop_persisted` aus, die
  das verursachende Tool und die Anzahl identischer Aufrufe nennen.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Exec-Genehmigungen" href="/de/tools/exec-approvals" icon="shield">
    Zulassen-/Ablehnen-Richtlinie für die Shell-Ausführung.
  </Card>
  <Card title="Denkstufen" href="/de/tools/thinking" icon="brain">
    Stufen des Schlussfolgerungsaufwands und Zusammenspiel mit Provider-Richtlinien.
  </Card>
  <Card title="Untergeordnete Agents" href="/de/tools/subagents" icon="users">
    Starten isolierter Agents, um unkontrolliertes Verhalten zu begrenzen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-tools#toolsloopdetection" icon="gear">
    Vollständiges `tools.loopDetection`-Schema und Zusammenführungssemantik.
  </Card>
</CardGroup>
