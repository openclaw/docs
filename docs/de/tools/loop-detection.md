---
read_when:
    - Ein Benutzer meldet, dass Agenten beim Wiederholen von Tool-Aufrufen hängen bleiben
    - Sie müssen den Schutz vor wiederholten Aufrufen anpassen
    - Sie bearbeiten Richtlinien für Agenten-Tools und Laufzeitumgebungen
summary: So aktivieren und konfigurieren Sie Schutzmechanismen, die sich wiederholende Tool-Aufruf-Schleifen erkennen
title: Tool-Loop-Erkennung
x-i18n:
    generated_at: "2026-05-05T01:49:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw kann verhindern, dass Agenten in wiederholten Tool-Aufrufmustern stecken bleiben.
Der Schutz ist **standardmäßig deaktiviert**.

Aktivieren Sie ihn nur dort, wo er benötigt wird, da er bei strengen Einstellungen legitime wiederholte Aufrufe blockieren kann.

## Warum dies existiert

- Sich wiederholende Sequenzen erkennen, die keinen Fortschritt machen.
- Hochfrequente Schleifen ohne Ergebnis erkennen (gleiches Tool, gleiche Eingaben, wiederholte Fehler).
- Spezifische Muster wiederholter Aufrufe für bekannte Polling-Tools erkennen.

## Konfigurationsblock

Globale Standardwerte:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Überschreibung pro Agent (optional):

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

### Verhalten der Felder

- `enabled`: Hauptschalter. `false` bedeutet, dass keine Schleifenerkennung durchgeführt wird.
- `historySize`: Anzahl der jüngsten Tool-Aufrufe, die für die Analyse vorgehalten werden.
- `warningThreshold`: Schwellenwert, ab dem ein Muster als reine Warnung eingestuft wird.
- `criticalThreshold`: Schwellenwert zum Blockieren sich wiederholender Schleifenmuster.
- `globalCircuitBreakerThreshold`: Globaler Schwellenwert für den Abbruch bei fehlendem Fortschritt.
- `detectors.genericRepeat`: erkennt wiederholte Muster mit gleichem Tool + gleichen Parametern.
- `detectors.knownPollNoProgress`: erkennt bekannte polling-artige Muster ohne Zustandsänderung.
- `detectors.pingPong`: erkennt alternierende Ping-Pong-Muster.

Für `exec` vergleichen Prüfungen auf fehlenden Fortschritt stabile Befehlsresultate und ignorieren flüchtige Laufzeitmetadaten wie Dauer, PID, Sitzungs-ID und Arbeitsverzeichnis.
Wenn eine Run-ID verfügbar ist, wird der jüngste Verlauf der Tool-Aufrufe nur innerhalb dieses Runs ausgewertet, sodass geplante Heartbeat-Zyklen und neue Runs keine veralteten Schleifenzähler aus früheren Runs übernehmen.

## Empfohlene Einrichtung

- Aktivieren Sie für kleinere Modelle zunächst `enabled: true` und lassen Sie die Standardwerte unverändert. Flaggschiffmodelle benötigen Schleifenerkennung selten und können sie deaktiviert lassen.
- Halten Sie die Schwellenwerte in der Reihenfolge `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Wenn Fehlalarme auftreten:
  - erhöhen Sie `warningThreshold` und/oder `criticalThreshold`
  - erhöhen Sie optional `globalCircuitBreakerThreshold`
  - deaktivieren Sie nur den Detector, der Probleme verursacht
  - verringern Sie `historySize`, um den historischen Kontext weniger streng zu machen

## Post-Compaction-Schutz

Wenn der Runner einen automatischen Compaction-Wiederholungsversuch abschließt (nach einem Kontextüberlauf), aktiviert er für ein kurzes Fenster einen Schutz, der die nächsten wenigen Tool-Aufrufe beobachtet. Wenn der Agent innerhalb dieses Fensters mehrfach dasselbe `(toolName, args, result)`-Tripel ausgibt, folgert der Schutz, dass die Compaction die Schleife nicht unterbrochen hat, und bricht den Run mit einem Fehler `compaction_loop_persisted` ab.

Dies ist ein separater Codepfad neben den globalen `tools.loopDetection`-Detectors. Er ist unabhängig konfigurierbar:

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: Anzahl der Tool-Aufrufe nach der Compaction, während derer der Schutz aktiv bleibt, _und_ Anzahl identischer Tripel aus (Tool, Argumenten, Ergebnis), die einen Abbruch auslösen.

Der Schutz bricht niemals ab, wenn sich Ergebnisse ändern, sondern nur, wenn Ergebnisse über das Fenster hinweg byte-identisch sind. Er ist absichtlich eng gefasst: Er greift nur unmittelbar nach einem Compaction-Wiederholungsversuch.

## Protokolle und erwartetes Verhalten

Wenn eine Schleife erkannt wird, meldet OpenClaw ein Schleifenereignis und blockiert oder dämpft den nächsten Tool-Zyklus je nach Schweregrad.
Dies schützt Benutzer vor ausuferndem Token-Verbrauch und Blockaden, während der normale Tool-Zugriff erhalten bleibt.

- Bevorzugen Sie zunächst Warnungen und temporäre Unterdrückung.
- Eskalieren Sie nur, wenn sich wiederholte Hinweise ansammeln.

## Hinweise

- `tools.loopDetection` wird mit Overrides auf Agent-Ebene zusammengeführt.
- Die Konfiguration pro Agent überschreibt oder erweitert globale Werte vollständig.
- Wenn keine Konfiguration vorhanden ist, bleiben die Schutzmechanismen deaktiviert.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Denkstufen](/de/tools/thinking)
- [Sub-Agenten](/de/tools/subagents)
