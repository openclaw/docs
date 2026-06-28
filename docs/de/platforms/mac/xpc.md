---
read_when:
    - IPC-Verträge oder IPC der Menüleisten-App bearbeiten
summary: macOS-IPC-Architektur für OpenClaw-App, Gateway-Node-Transport und PeekabooBridge
title: macOS-IPC
x-i18n:
    generated_at: "2026-06-28T00:13:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw-macOS-IPC-Architektur

**Aktuelles Modell:** Ein lokaler Unix-Socket verbindet den **Node-Host-Service** mit der **macOS-App** für Exec-Freigaben + `system.run`. Eine Debug-CLI `openclaw-mac` ist für Discovery-/Verbindungsprüfungen vorhanden; Agent-Aktionen laufen weiterhin über den Gateway-WebSocket und `node.invoke`. UI-Automatisierung verwendet PeekabooBridge.

## Ziele

- Eine einzelne GUI-App-Instanz, die alle TCC-bezogenen Arbeiten besitzt (Benachrichtigungen, Bildschirmaufnahme, Mikrofon, Sprache, AppleScript).
- Eine kleine Oberfläche für Automatisierung: Gateway + Node-Befehle sowie PeekabooBridge für UI-Automatisierung.
- Vorhersehbare Berechtigungen: immer dieselbe signierte Bundle-ID, gestartet durch launchd, damit TCC-Genehmigungen erhalten bleiben.

## Funktionsweise

### Gateway + Node-Transport

- Die App führt den Gateway aus (lokaler Modus) und verbindet sich damit als Node.
- Agent-Aktionen werden über `node.invoke` ausgeführt (z. B. `system.run`, `system.notify`, `canvas.*`).
- Häufige Mac-Node-Befehle sind `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run` und `system.notify`.
- Der Node meldet eine `permissions`-Map, damit Agenten sehen können, ob Bildschirm-,
  Kamera-, Mikrofon-, Sprach-, Automatisierungs- oder Bedienungshilfen-Zugriff verfügbar ist.

### Node-Service + App-IPC

- Ein headless Node-Host-Service verbindet sich mit dem Gateway-WebSocket.
- `system.run`-Anfragen werden über einen lokalen Unix-Socket an die macOS-App weitergeleitet.
- Die App führt den Exec im UI-Kontext aus, fragt bei Bedarf nach und gibt die Ausgabe zurück.

Diagramm (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI-Automatisierung)

- UI-Automatisierung verwendet einen separaten UNIX-Socket namens `bridge.sock` und das PeekabooBridge-JSON-Protokoll.
- Host-Präferenzreihenfolge (clientseitig): Peekaboo.app → Claude.app → OpenClaw.app → lokale Ausführung.
- Sicherheit: Bridge-Hosts erfordern eine erlaubte TeamID; die DEBUG-only-Ausweichmöglichkeit für dieselbe UID wird durch `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` geschützt (Peekaboo-Konvention).
- Siehe: [PeekabooBridge-Nutzung](/de/platforms/mac/peekaboo) für Details.

## Betriebliche Abläufe

- Neustart/Rebuild: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Beendet vorhandene Instanzen
  - Swift-Build + Paketierung
  - Schreibt/bootstrappt/kickstartet den LaunchAgent
- Einzelinstanz: Die App beendet sich frühzeitig, wenn bereits eine andere Instanz mit derselben Bundle-ID läuft.

## Hardening-Hinweise

- Bevorzugen Sie, für alle privilegierten Oberflächen eine TeamID-Übereinstimmung zu verlangen.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG-only) kann Aufrufer mit derselben UID für lokale Entwicklung zulassen.
- Die gesamte Kommunikation bleibt ausschließlich lokal; es werden keine Netzwerk-Sockets offengelegt.
- TCC-Abfragen stammen ausschließlich aus dem GUI-App-Bundle; halten Sie die signierte Bundle-ID über Rebuilds hinweg stabil.
- IPC-Hardening: Socket-Modus `0600`, Token, Peer-UID-Prüfungen, HMAC-Challenge/Response, kurze TTL.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [macOS-IPC-Ablauf (Exec-Freigaben)](/de/tools/exec-approvals-advanced#macos-ipc-flow)
