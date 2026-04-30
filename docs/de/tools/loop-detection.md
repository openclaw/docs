---
read_when:
    - Ein Benutzer meldet, dass Agenten festhängen und Tool-Aufrufe wiederholen
    - Sie müssen den Schutz vor wiederholten Aufrufen feinabstimmen
    - Sie bearbeiten Richtlinien für Agenten-Werkzeuge und die Laufzeit
summary: So aktivieren und optimieren Sie Schutzmechanismen, die wiederholte Tool-Aufrufschleifen erkennen
title: Erkennung von Werkzeugschleifen
x-i18n:
    generated_at: "2026-04-30T07:19:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw kann verhindern, dass Agenten in wiederholten Tool-Aufrufmustern stecken bleiben.
Der Schutzmechanismus ist **standardmäßig deaktiviert**.

Aktivieren Sie ihn nur dort, wo er benötigt wird, da er bei strengen Einstellungen legitime wiederholte Aufrufe blockieren kann.

## Warum es das gibt

- Erkennt repetitive Sequenzen, die keinen Fortschritt machen.
- Erkennt hochfrequente Schleifen ohne Ergebnis (gleiches Tool, gleiche Eingaben, wiederholte Fehler).
- Erkennt bestimmte Muster wiederholter Aufrufe für bekannte Polling-Tools.

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
- `historySize`: Anzahl der letzten Tool-Aufrufe, die für die Analyse aufbewahrt werden.
- `warningThreshold`: Schwellenwert, ab dem ein Muster nur als Warnung eingestuft wird.
- `criticalThreshold`: Schwellenwert zum Blockieren repetitiver Schleifenmuster.
- `globalCircuitBreakerThreshold`: Globaler Schwellenwert für den Unterbrecher bei fehlendem Fortschritt.
- `detectors.genericRepeat`: erkennt wiederholte Muster mit gleichem Tool und gleichen Parametern.
- `detectors.knownPollNoProgress`: erkennt bekannte pollingartige Muster ohne Zustandsänderung.
- `detectors.pingPong`: erkennt alternierende Ping-Pong-Muster.

Für `exec` vergleichen Prüfungen auf fehlenden Fortschritt stabile Befehlsergebnisse und ignorieren flüchtige Laufzeitmetadaten wie Dauer, PID, Sitzungs-ID und Arbeitsverzeichnis.
Wenn eine Run-ID verfügbar ist, wird der aktuelle Tool-Aufrufverlauf nur innerhalb dieses Runs ausgewertet, sodass geplante Heartbeat-Zyklen und neue Runs keine veralteten Schleifenzähler aus früheren Runs übernehmen.

## Empfohlene Einrichtung

- Beginnen Sie mit `enabled: true` und unveränderten Standardwerten.
- Halten Sie die Schwellenwerte in der Reihenfolge `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Wenn False Positives auftreten:
  - erhöhen Sie `warningThreshold` und/oder `criticalThreshold`
  - erhöhen Sie (optional) `globalCircuitBreakerThreshold`
  - deaktivieren Sie nur den Detektor, der Probleme verursacht
  - reduzieren Sie `historySize` für einen weniger strengen historischen Kontext

## Protokolle und erwartetes Verhalten

Wenn eine Schleife erkannt wird, meldet OpenClaw ein Schleifenereignis und blockiert oder dämpft den nächsten Tool-Zyklus abhängig vom Schweregrad.
Dies schützt Benutzer vor unkontrolliertem Token-Verbrauch und Blockaden, während normaler Tool-Zugriff erhalten bleibt.

- Bevorzugen Sie zunächst Warnung und temporäre Unterdrückung.
- Eskalieren Sie erst, wenn sich wiederholte Nachweise ansammeln.

## Hinweise

- `tools.loopDetection` wird mit Überschreibungen auf Agentenebene zusammengeführt.
- Konfiguration pro Agent überschreibt oder erweitert globale Werte vollständig.
- Wenn keine Konfiguration vorhanden ist, bleiben Guardrails deaktiviert.

## Verwandte Themen

- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Denkstufen](/de/tools/thinking)
- [Sub-Agenten](/de/tools/subagents)
