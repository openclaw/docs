---
read_when:
    - Ausführen oder Debuggen des Gateway-Prozesses
    - Untersuchung der Erzwingung einer Einzelinstanz
summary: 'Singleton-Schutz für den Gateway: Dateisperre plus WebSocket-/HTTP-Bindung'
title: Gateway-Sperre
x-i18n:
    generated_at: "2026-07-12T01:39:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Warum

- Nur ein Gateway-Prozess sollte auf einem Host für eine bestimmte Konfiguration und einen bestimmten Port zuständig sein; führen Sie zusätzliche Gateways mit isolierten Profilen und eindeutigen Ports aus.
- Abstürze/SIGKILL überstehen, ohne veraltete Sperrdateien zu hinterlassen.
- Schnell mit einer eindeutigen Fehlermeldung abbrechen, wenn ein anderes Gateway den Port bereits belegt.

## Zwei Ebenen

Beim Start wird der Besitz durch eine einzelne Instanz in zwei unabhängigen, aufeinanderfolgenden Schritten durchgesetzt:

1. Die **Dateisperre** erwirbt eine konfigurationsspezifische Sperrdatei im Sperrverzeichnis des Zustandsverzeichnisses. Beim Erwerb wird der konfigurierte Port auf einen aktiven Listener geprüft, um einen veralteten Besitzer der Sperre nach einem Absturz zu erkennen.
2. Die **Socket-Bindung** bindet den HTTP-/WebSocket-Listener (standardmäßig `ws://127.0.0.1:18789`) als exklusiven TCP-Listener.

Jede Ebene kann unabhängig fehlschlagen und löst ihren eigenen `GatewayLockError` aus.

### Dateisperre

- Wenn die Sperrdatei fehlt, der aufgezeichnete Besitzerprozess nicht mehr ausgeführt wird oder die Portprüfung des Besitzers keinen aktiven Listener findet, übernimmt der Startvorgang die Sperre und fährt fort.
- Wenn die Sperre aktiv gehalten wird und keiner der oben genannten Fälle zutrifft, wiederholt der Startvorgang den Versuch bis zu 5 Sekunden lang (Standardwert), bevor er abbricht:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Socket-Bindung

- Bei `EADDRINUSE` wiederholt der Startvorgang die Bindung bis zu 20-mal in Abständen von 500 ms (insgesamt ungefähr 10 Sekunden), um ein `TIME_WAIT`-Zeitfenster nach einem kürzlich beendeten Prozess zu überbrücken.
- Wenn der Port nach den Wiederholungsversuchen weiterhin belegt ist:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Andere Bindungsfehler:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Beim Herunterfahren schließt das Gateway den HTTP-/WebSocket-Server und entfernt die Sperrdatei.

## Betriebshinweise

- Wenn der Port durch einen anderen Prozess belegt ist, der kein Gateway ist, bleibt die Fehlermeldung gleich; geben Sie den Port frei oder wählen Sie mit `openclaw gateway --port <port>` einen anderen aus.
- Unter einer Dienstüberwachung prüft ein neuer Gateway-Prozess, bei dem einer der beiden oben genannten Fehler auftritt, zunächst `/healthz` des bestehenden Prozesses. Wenn dieser Prozess funktionsfähig ist, überlässt der neue Prozess ihm die Kontrolle, anstatt fehlzuschlagen. Unter systemd wird er mit dem Code `78` beendet; `RestartPreventExitStatus=78` der Unit verhindert, dass `Restart=always` bei einem Konflikt durch eine Sperre oder `EADDRINUSE` eine Neustartschleife verursacht. Wenn der bestehende Prozess nie funktionsfähig wird, sind die Wiederholungsversuche der Zustandsprüfung zeitlich begrenzt. Der Start schlägt anschließend mit dem oben genannten Sperrfehler fehl, anstatt endlos weiterzulaufen.
- Die macOS-App verwendet vor dem Starten des Gateways eine eigene einfache PID-Schutzprüfung; die oben beschriebene Dateisperre und Socket-Bindung stellen die tatsächliche Durchsetzung zur Laufzeit dar.

## Verwandte Themen

- [Mehrere Gateways](/de/gateway/multiple-gateways) – mehrere Instanzen mit eindeutigen Ports ausführen
- [Fehlerbehebung](/de/gateway/troubleshooting) – Diagnose von `EADDRINUSE` und Portkonflikten
