---
read_when:
    - Ausführen oder Debuggen des Gateway-Prozesses
    - Untersuchung der Einzelinstanz-Durchsetzung
summary: Singleton-Schutz für das Gateway über die Bindung des WebSocket-Listeners
title: Gateway-Sperre
x-i18n:
    generated_at: "2026-04-30T16:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Warum

- Stellen Sie sicher, dass pro Basisport auf demselben Host nur eine Gateway-Instanz ausgeführt wird; zusätzliche Gateways müssen isolierte Profile und eindeutige Ports verwenden.
- Überstehen Sie Abstürze/SIGKILL, ohne veraltete Lock-Dateien zurückzulassen.
- Schlagen Sie schnell mit einer klaren Fehlermeldung fehl, wenn der Control-Port bereits belegt ist.

## Mechanismus

- Das Gateway erwirbt zuerst eine konfigurationsbezogene Lock-Datei im State-Lock-Verzeichnis und prüft den konfigurierten Port auf einen vorhandenen Listener.
- Wenn der aufgezeichnete Lock-Eigentümer nicht mehr vorhanden ist, der Port frei ist oder der Lock veraltet ist, beansprucht der Startvorgang den Lock erneut und fährt fort.
- Das Gateway bindet dann den HTTP/WebSocket-Listener (Standard: `ws://127.0.0.1:18789`) über einen exklusiven TCP-Listener.
- Wenn das Binden mit `EADDRINUSE` fehlschlägt, löst der Startvorgang `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` aus.
- Beim Herunterfahren schließt das Gateway den HTTP/WebSocket-Server und entfernt die Lock-Datei.

## Fehlerschnittstelle

- Wenn ein anderer Prozess den Port belegt, löst der Startvorgang `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` aus.
- Andere Bind-Fehler werden als `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` ausgegeben.

## Betriebshinweise

- Wenn der Port von einem _anderen_ Prozess belegt ist, ist der Fehler derselbe; geben Sie den Port frei oder wählen Sie mit `openclaw gateway --port <port>` einen anderen.
- Unter einem Service-Supervisor lässt ein neuer Gateway-Prozess, der einen vorhandenen fehlerfreien `/healthz`-Responder erkennt, diesen Prozess in Kontrolle. Unter systemd beendet sich der doppelte Starter mit Code 78, sodass das standardmäßige `RestartPreventExitStatus=78` verhindert, dass `Restart=always` bei einem Lock- oder `EADDRINUSE`-Konflikt in einer Schleife läuft. Wenn der vorhandene Prozess nie fehlerfrei wird, sind Wiederholungen begrenzt und der Startvorgang schlägt mit einem klaren Lock-Fehler fehl, statt endlos zu laufen.
- Die macOS-App verwaltet weiterhin ihre eigene schlanke PID-Sicherung, bevor sie das Gateway startet; der Runtime-Lock wird durch die Lock-Datei plus HTTP/WebSocket-Bindung erzwungen.

## Verwandte Themen

- [Mehrere Gateways](/de/gateway/multiple-gateways) — mehrere Instanzen mit eindeutigen Ports ausführen
- [Fehlerbehebung](/de/gateway/troubleshooting) — `EADDRINUSE` und Portkonflikte diagnostizieren
