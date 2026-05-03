---
read_when:
    - Ein Benutzer meldet, dass Agenten beim Wiederholen von Tool-Aufrufen hängen bleiben
    - Sie müssen den Schutz vor wiederholten Aufrufen feinabstimmen
    - Sie bearbeiten Richtlinien für Agentenwerkzeuge und -Laufzeiten
summary: So aktivieren und optimieren Sie Schutzmechanismen, die sich wiederholende Tool-Aufruf-Schleifen erkennen
title: Erkennung von Tool-Schleifen
x-i18n:
    generated_at: "2026-05-03T21:39:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw kann verhindern, dass Agenten in wiederholten Tool-Aufrufmustern stecken bleiben.
Der Schutzmechanismus ist **standardmäßig deaktiviert**.

Aktivieren Sie ihn nur dort, wo er benötigt wird, da er bei strengen Einstellungen legitime wiederholte Aufrufe blockieren kann.

## Warum dies existiert

- Erkennen repetitiver Sequenzen, die keinen Fortschritt erzielen.
- Erkennen hochfrequenter Schleifen ohne Ergebnis (gleiches Tool, gleiche Eingaben, wiederholte Fehler).
- Erkennen bestimmter Muster wiederholter Aufrufe für bekannte Polling-Tools.

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

### Feldverhalten

- `enabled`: Hauptschalter. `false` bedeutet, dass keine Schleifenerkennung durchgeführt wird.
- `historySize`: Anzahl der letzten Tool-Aufrufe, die für die Analyse vorgehalten werden.
- `warningThreshold`: Schwellenwert, ab dem ein Muster als reine Warnung eingestuft wird.
- `criticalThreshold`: Schwellenwert zum Blockieren repetitiver Schleifenmuster.
- `globalCircuitBreakerThreshold`: globaler Schwellenwert für den Unterbrecher bei ausbleibendem Fortschritt.
- `detectors.genericRepeat`: erkennt wiederholte Muster aus gleichem Tool und gleichen Parametern.
- `detectors.knownPollNoProgress`: erkennt bekannte polling-ähnliche Muster ohne Zustandsänderung.
- `detectors.pingPong`: erkennt alternierende Ping-Pong-Muster.

Für `exec` vergleichen Prüfungen auf ausbleibenden Fortschritt stabile Befehlsresultate und ignorieren flüchtige Laufzeitmetadaten wie Dauer, PID, Sitzungs-ID und Arbeitsverzeichnis.
Wenn eine Run-ID verfügbar ist, wird der Verlauf der letzten Tool-Aufrufe nur innerhalb dieses Runs ausgewertet, sodass geplante Heartbeat-Zyklen und neue Runs keine veralteten Schleifenzähler aus früheren Runs übernehmen.

## Empfohlene Einrichtung

- Für kleinere Modelle beginnen Sie mit `enabled: true` und unveränderten Standardwerten. Flaggschiffmodelle benötigen selten Schleifenerkennung und können sie deaktiviert lassen.
- Halten Sie die Schwellenwerte in der Reihenfolge `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Wenn Fehlalarme auftreten:
  - erhöhen Sie `warningThreshold` und/oder `criticalThreshold`
  - erhöhen Sie (optional) `globalCircuitBreakerThreshold`
  - deaktivieren Sie nur den Detector, der Probleme verursacht
  - reduzieren Sie `historySize` für weniger strikten historischen Kontext

## Logs und erwartetes Verhalten

Wenn eine Schleife erkannt wird, meldet OpenClaw ein Schleifenereignis und blockiert oder dämpft den nächsten Tool-Zyklus abhängig vom Schweregrad.
Dies schützt Benutzer vor ausuferndem Token-Verbrauch und Blockaden, während der normale Tool-Zugriff erhalten bleibt.

- Bevorzugen Sie zuerst Warnungen und temporäre Unterdrückung.
- Eskalieren Sie erst, wenn sich wiederholte Evidenz ansammelt.

## Hinweise

- `tools.loopDetection` wird mit Überschreibungen auf Agentenebene zusammengeführt.
- Die Konfiguration pro Agent überschreibt oder erweitert globale Werte vollständig.
- Wenn keine Konfiguration vorhanden ist, bleiben Schutzmechanismen ausgeschaltet.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Denkstufen](/de/tools/thinking)
- [Sub-Agenten](/de/tools/subagents)
