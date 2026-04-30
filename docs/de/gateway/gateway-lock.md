---
read_when:
    - Gateway-Prozess ausführen oder debuggen
    - Untersuchung der Durchsetzung einer Einzelinstanz
summary: Gateway-Singleton-Schutz mithilfe der WebSocket-Listener-Bindung
title: Gateway-Sperre
x-i18n:
    generated_at: "2026-04-30T06:53:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Warum

- Stellen Sie sicher, dass pro Basisport auf demselben Host nur eine Gateway-Instanz ausgeführt wird; zusätzliche Gateways müssen isolierte Profile und eindeutige Ports verwenden.
- Überstehen Sie Abstürze/SIGKILL, ohne veraltete Lock-Dateien zu hinterlassen.
- Schlagen Sie schnell mit einem klaren Fehler fehl, wenn der Steuerungsport bereits belegt ist.

## Mechanismus

- Das Gateway erwirbt zuerst eine konfigurationsspezifische Lock-Datei im State-Lock-Verzeichnis und prüft den konfigurierten Port auf einen vorhandenen Listener.
- Wenn der aufgezeichnete Lock-Eigentümer nicht mehr vorhanden ist, der Port frei ist oder der Lock veraltet ist, beansprucht der Startvorgang den Lock erneut und fährt fort.
- Das Gateway bindet anschließend den HTTP/WebSocket-Listener (Standard `ws://127.0.0.1:18789`) mit einem exklusiven TCP-Listener.
- Wenn das Binden mit `EADDRINUSE` fehlschlägt, wirft der Startvorgang `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Beim Herunterfahren schließt das Gateway den HTTP/WebSocket-Server und entfernt die Lock-Datei.

## Fehleroberfläche

- Wenn ein anderer Prozess den Port belegt, wirft der Startvorgang `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Andere Bind-Fehler werden als `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` ausgegeben.

## Betriebshinweise

- Wenn der Port von einem _anderen_ Prozess belegt ist, ist der Fehler derselbe; geben Sie den Port frei oder wählen Sie mit `openclaw gateway --port <port>` einen anderen.
- Unter einem Service-Supervisor beendet sich ein neuer Gateway-Prozess, der einen vorhandenen fehlerfreien `/healthz`-Responder erkennt, erfolgreich und überlässt diesem Prozess die Kontrolle. Wenn der vorhandene Prozess nie fehlerfrei wird, sind Wiederholungen begrenzt, und der Startvorgang schlägt mit einem klaren Lock-Fehler fehl, statt endlos zu schleifen.
- Die macOS-App behält weiterhin ihren eigenen leichtgewichtigen PID-Schutz bei, bevor sie das Gateway startet; der Laufzeit-Lock wird durch die Lock-Datei plus HTTP/WebSocket-Bindung erzwungen.

## Verwandte Themen

- [Mehrere Gateways](/de/gateway/multiple-gateways) — mehrere Instanzen mit eindeutigen Ports ausführen
- [Problembehandlung](/de/gateway/troubleshooting) — `EADDRINUSE` und Portkonflikte diagnostizieren
