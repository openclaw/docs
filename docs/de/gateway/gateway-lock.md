---
read_when:
    - Ausführen oder Debuggen des Gateway-Prozesses
    - Untersuchung der Erzwingung einer einzelnen Instanz
summary: 'Gateway-Singleton-Schutz: Dateisperre plus WebSocket-/HTTP-Bindung'
title: Gateway-Sperre
x-i18n:
    generated_at: "2026-07-24T03:50:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Warum

- Nur ein Gateway-Prozess sollte ein Zustandsverzeichnis besitzen; führen Sie zusätzliche Gateways mit isolierten Profilen, Zustandsverzeichnissen, Konfigurationen und Ports aus.
- Abstürze/SIGKILL überstehen, ohne veraltete Sperrdateien zu hinterlassen.
- Schnell mit einer eindeutigen Fehlermeldung abbrechen, wenn ein anderes Gateway den Port bereits besitzt.

## Drei Ebenen

Beim Start wird der Besitz in drei Schritten in dieser Reihenfolge durchgesetzt:

1. Die **Zustandsbesitzsperre** erwirbt eine Sperre, die dem kanonischen Zustandsverzeichnis zugeordnet ist. Jedes Gateway ist daran beteiligt, einschließlich Gateways, die mit `OPENCLAW_ALLOW_MULTI_GATEWAY=1` gestartet wurden, sodass destruktive SQLite-Wartungsarbeiten nicht mit einem aktiven Besitzer in Konflikt geraten können.
2. Die **Konfigurationssperre** erwirbt die bisherige konfigurationsbezogene Sperre und zeichnet den Laufzeitport auf. Der Multi-Gateway-Modus überspringt dieses Konfigurations-Singleton, behält jedoch die Zustandsbesitzsperre bei.
3. Die **Socket-Bindung** bindet den HTTP/WebSocket-Listener (Standard: `ws://127.0.0.1:18789`) als exklusiven TCP-Listener.

Jede Ebene kann unabhängig fehlschlagen und löst einen eigenen `GatewayLockError` aus.

### Zustands- und Konfigurationssperren

- Die Aktivität der Sperre wird anhand der aufgezeichneten PID, der plattformspezifischen Prozessstartidentität, sofern verfügbar, und der Gateway-Prozessidentität bestimmt. Ein verifizierter Besitzer bleibt während des Starts maßgeblich, bevor sein Port mit dem Lauschen beginnt.
- Ein dedizierter SQLite-Koordinator serialisiert die Prüfung der Metadaten, die Rückgewinnung veralteter Besitzer und den Austausch von Sperren. Seine exklusive Transaktion wird automatisch freigegeben, wenn der besitzende Prozess abstürzt.
- Wenn eine Sperrdatei fehlt oder der aufgezeichnete Besitzerprozess nicht mehr ausgeführt wird, gewinnt der Startvorgang die Sperre zurück und fährt fort.
- Wenn eine der beiden Sperren aktiv gehalten wird, versucht der Startvorgang es bis zu 5 Sekunden lang (Standardwert) erneut, bevor er aufgibt:

  ```text
  GatewayLockError("Gateway wird bereits ausgeführt (PID <pid>); Zeitüberschreitung der Sperre nach <ms>ms")
  ```

### Socket-Bindung

- Bei `EADDRINUSE` versucht der Startvorgang die Bindung bis zu 20-mal in Intervallen von 500ms erneut (insgesamt ungefähr 10 Sekunden), um ein `TIME_WAIT`-Zeitfenster nach einem kürzlich beendeten Prozess zu überbrücken.
- Wenn der Port nach den Wiederholungsversuchen weiterhin verwendet wird:

  ```text
  GatewayLockError("Eine andere Gateway-Instanz lauscht bereits auf ws://127.0.0.1:<port>")
  ```

- Andere Bindungsfehler:

  ```text
  GatewayLockError("Gateway-Socket konnte nicht an ws://127.0.0.1:<port> gebunden werden: <cause>")
  ```

Beim Herunterfahren schließt das Gateway den HTTP/WebSocket-Server und entfernt seine Zustands-
und Konfigurationssperrdateien.

## Betriebshinweise

- Wenn der Port durch einen anderen Prozess belegt ist, der kein Gateway ist, bleibt der Fehler derselbe; geben Sie den Port frei oder wählen Sie mit `openclaw gateway --port <port>` einen anderen.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` erlaubt mehrere Konfigurations-/Laufzeitinstanzen, jedoch keinen gemeinsam genutzten veränderlichen Zustand. Jede Instanz benötigt weiterhin ein eindeutiges `OPENCLAW_STATE_DIR`.
- Unter einem Dienst-Supervisor prüft ein neuer Gateway-Prozess, bei dem einer der obigen Fehler auftritt, zunächst `/healthz` beim vorhandenen Prozess. Wenn dieser Prozess fehlerfrei funktioniert, überlässt der neue Prozess ihm die Kontrolle, statt fehlzuschlagen. Unter systemd wird er mit dem Code `78` beendet; das `RestartPreventExitStatus=78` der Unit verhindert, dass `Restart=always` aufgrund eines Sperr- oder `EADDRINUSE`-Konflikts wiederholt neu gestartet wird. Wenn der vorhandene Prozess nie fehlerfrei wird, ist die Wiederholung der Statusprüfung zeitlich begrenzt; anschließend schlägt der Startvorgang mit dem obigen Sperrfehler fehl, statt endlos weiterzulaufen.
- Die macOS-App verwendet vor dem Starten des Gateways eine eigene einfache PID-Sicherung; die oben beschriebene Dateisperre und Socket-Bindung bilden die tatsächliche Durchsetzung zur Laufzeit.

## Verwandte Themen

- [Mehrere Gateways](/de/gateway/multiple-gateways) - mehrere Instanzen mit eindeutigen Ports ausführen
- [Fehlerbehebung](/de/gateway/troubleshooting) - Diagnose von `EADDRINUSE` und Portkonflikten
