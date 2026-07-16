---
read_when:
    - Ausführen oder Debuggen des Gateway-Prozesses
    - Untersuchung der Erzwingung einer einzelnen Instanz
summary: 'Gateway-Singleton-Schutz: Dateisperre plus WebSocket-/HTTP-Bindung'
title: Gateway-Sperre
x-i18n:
    generated_at: "2026-07-16T12:48:13Z"
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
- Übersteht Abstürze/SIGKILL, ohne veraltete Sperrdateien zu hinterlassen.
- Bricht mit einer klaren Fehlermeldung frühzeitig ab, wenn ein anderes Gateway den Port bereits besitzt.

## Drei Ebenen

Beim Start wird die Besitzzuordnung in drei Schritten in dieser Reihenfolge durchgesetzt:

1. Die **Zustandsbesitzsperre** erwirbt eine Sperre, deren Schlüssel das kanonische Zustandsverzeichnis ist. Jedes Gateway ist daran beteiligt, einschließlich Gateways, die mit `OPENCLAW_ALLOW_MULTI_GATEWAY=1` gestartet wurden, damit destruktive SQLite-Wartungsarbeiten nicht mit einem aktiven Besitzer kollidieren können.
2. Die **Konfigurationssperre** erwirbt die bisherige konfigurationsbezogene Sperre und zeichnet den Laufzeit-Port auf. Der Multi-Gateway-Modus überspringt dieses Konfigurations-Singleton, behält jedoch die Zustandsbesitzsperre bei.
3. Die **Socket-Bindung** bindet den HTTP/WebSocket-Listener (standardmäßig `ws://127.0.0.1:18789`) als exklusiven TCP-Listener.

Jede Ebene kann unabhängig fehlschlagen und löst ihren eigenen `GatewayLockError` aus.

### Zustands- und Konfigurationssperren

- Die Gültigkeit der Sperre ergibt sich aus der aufgezeichneten PID, der plattformspezifischen Prozessstartidentität, sofern verfügbar, und der Gateway-Prozessidentität. Ein verifizierter Besitzer bleibt während des Starts maßgeblich, bevor sein Port mit dem Lauschen beginnt.
- Ein dedizierter SQLite-Koordinator serialisiert die Prüfung der Metadaten, die Rückgewinnung veralteter Besitzzuordnungen und den Austausch von Sperren. Seine exklusive Transaktion wird automatisch freigegeben, wenn der besitzende Prozess abstürzt.
- Wenn eine Sperrdatei fehlt oder der aufgezeichnete Besitzerprozess nicht mehr ausgeführt wird, gewinnt der Startvorgang die Sperre zurück und fährt fort.
- Wenn eine der beiden Sperren aktiv gehalten wird, versucht der Startvorgang es bis zu 5 Sekunden lang (Standardwert) erneut, bevor er abbricht:

  ```text
  GatewayLockError("Gateway wird bereits ausgeführt (PID <pid>); Zeitüberschreitung der Sperre nach <ms>ms")
  ```

### Socket-Bindung

- Bei `EADDRINUSE` versucht der Startvorgang die Bindung bis zu 20-mal in Abständen von 500ms erneut (insgesamt etwa 10 Sekunden), um ein `TIME_WAIT`-Zeitfenster nach einem kürzlich beendeten Prozess zu überbrücken.
- Wenn der Port nach den erneuten Versuchen weiterhin belegt ist:

  ```text
  GatewayLockError("Eine andere Gateway-Instanz lauscht bereits auf ws://127.0.0.1:<port>")
  ```

- Andere Bindungsfehler:

  ```text
  GatewayLockError("Gateway-Socket konnte auf ws://127.0.0.1:<port> nicht gebunden werden: <cause>")
  ```

Beim Herunterfahren schließt das Gateway den HTTP/WebSocket-Server und entfernt seine
Zustands- und Konfigurationssperrdateien.

## Betriebshinweise

- Wenn der Port durch einen anderen Prozess belegt ist, der kein Gateway ist, bleibt der Fehler derselbe; geben Sie den Port frei oder wählen Sie mit `openclaw gateway --port <port>` einen anderen.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` erlaubt mehrere Konfigurations-/Laufzeitinstanzen, jedoch keinen gemeinsam genutzten veränderlichen Zustand. Jede Instanz benötigt weiterhin ein eindeutiges `OPENCLAW_STATE_DIR`.
- Unter einer Dienstüberwachung prüft ein neuer Gateway-Prozess, bei dem einer der obigen Fehler auftritt, zunächst `/healthz` am bestehenden Prozess. Wenn dieser Prozess fehlerfrei arbeitet, überlässt ihm der neue Prozess die Kontrolle, anstatt fehlzuschlagen. Unter systemd wird er mit dem Code `78` beendet; das `RestartPreventExitStatus=78` der Unit verhindert, dass `Restart=always` bei einem Sperr- oder `EADDRINUSE`-Konflikt in einer Schleife ausgeführt wird. Wenn der bestehende Prozess nie fehlerfrei arbeitet, sind die Wiederholungsversuche der Zustandsprüfung zeitlich begrenzt; anschließend schlägt der Start mit dem obigen Sperrfehler fehl, anstatt endlos in einer Schleife zu laufen.
- Die macOS-App verwendet vor dem Starten des Gateways eine eigene schlanke PID-Sicherung; die obige Dateisperre und Socket-Bindung bilden die eigentliche Durchsetzung zur Laufzeit.

## Verwandte Themen

- [Mehrere Gateways](/de/gateway/multiple-gateways) - mehrere Instanzen mit eindeutigen Ports ausführen
- [Fehlerbehebung](/de/gateway/troubleshooting) - `EADDRINUSE` und Portkonflikte diagnostizieren
