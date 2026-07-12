---
read_when:
    - IPC-Verträge oder IPC der Menüleisten-App bearbeiten
summary: macOS-IPC-Architektur für die OpenClaw-App, den Gateway-Node-Transport und PeekabooBridge
title: macOS-IPC
x-i18n:
    generated_at: "2026-07-12T01:51:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw-macOS-IPC-Architektur

Ein lokaler Unix-Socket verbindet den Node-Hostdienst mit der macOS-App für Ausführungsgenehmigungen und `system.run`. Eine `openclaw-mac`-Debug-CLI (`apps/macos/Sources/OpenClawMacCLI`) ist für Erkennungs- und Verbindungsprüfungen vorhanden; Agentenaktionen laufen weiterhin über den Gateway-WebSocket und `node.invoke`. Der Node-gestützte `computer.act`-Pfad führt die eingebettete Peekaboo-Automatisierung prozessintern aus; eigenständige Peekaboo-Clients verwenden PeekabooBridge.

## Ziele

- Eine einzelne GUI-App-Instanz, die sämtliche TCC-bezogenen Aufgaben übernimmt (Benachrichtigungen, Bildschirmaufzeichnung, Mikrofon, Spracherkennung, AppleScript).
- Eine kleine Automatisierungsschnittstelle: Gateway und Node-Befehle, prozessinternes `computer.act` sowie PeekabooBridge für eigenständige Clients zur UI-Automatisierung.
- Vorhersehbare Berechtigungen: stets dieselbe signierte Bundle-ID, gestartet durch launchd, damit TCC-Freigaben erhalten bleiben.

## Funktionsweise

### Gateway- und Node-Transport

- Die App führt den Gateway aus (lokaler Modus) und verbindet sich mit ihm als Node.
- Agentenaktionen werden über `node.invoke` ausgeführt (z. B. `system.run`, `system.notify`, `canvas.*`).
- Zu den Node-Befehlen gehören `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` und `system.notify`.
- Der Node meldet eine `permissions`-Zuordnung, damit Agenten erkennen können, ob Zugriff auf Bildschirm, Kamera, Mikrofon, Spracherkennung, Automatisierung oder Bedienungshilfen verfügbar ist.

### Node-Dienst und App-IPC

- Ein ohne Benutzeroberfläche ausgeführter Node-Hostdienst verbindet sich mit dem Gateway-WebSocket.
- `system.run`-Anfragen werden über einen lokalen Unix-Socket (`ExecApprovalsSocket.swift`) an die macOS-App weitergeleitet.
- Die App führt den Befehl im UI-Kontext aus, fordert bei Bedarf eine Bestätigung an und gibt die Ausgabe zurück.

Diagramm (SCI):

```text
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI-Automatisierung)

- Das integrierte Agentenwerkzeug `computer` verwendet diesen Socket **nicht**. Ein gekoppelter macOS-Node führt `computer.act` im App-Prozess mit eingebetteten Peekaboo-Diensten aus.
- Die UI-Automatisierung verwendet einen separaten UNIX-Socket (`~/Library/Application Support/OpenClaw/<socket>`) und das JSON-Protokoll von PeekabooBridge.
- Host-Prioritätsreihenfolge (clientseitig): Peekaboo.app -> Claude.app -> OpenClaw.app -> lokale Ausführung.
- Sicherheit: Bridge-Hosts erfordern eine TeamID aus der Zulassungsliste (der mitgelieferte `PeekabooBridgeHostCoordinator` lässt ein festgelegtes Team sowie das eigene Signaturteam der App zu); ein ausschließlich für DEBUG vorgesehener Ausweichmechanismus für dieselbe UID wird durch `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` geschützt (Peekaboo-Konvention).
- Weitere Informationen finden Sie unter [PeekabooBridge-Verwendung](/de/platforms/mac/peekaboo).

## Betriebsabläufe

- Neustart/Neuerstellung: `scripts/restart-mac.sh` beendet vorhandene Instanzen, erstellt die App mit Swift neu, paketiert sie erneut und startet sie wieder. Das Skript erkennt automatisch eine verfügbare Signierungsidentität und greift auf `--no-sign` zurück, wenn keine gefunden wird; übergeben Sie `--sign`, um eine Signierung zu erzwingen (schlägt fehl, wenn kein Schlüssel verfügbar ist), oder `--no-sign`, um den unsignierten Pfad zu erzwingen. Die in der Umgebung gesetzte Variable `SIGN_IDENTITY` wird im signierten Pfad aufgehoben, damit die eigene automatische Identitätserkennung von `scripts/codesign-mac-app.sh` das Zertifikat auswählt.
- Einzelinstanz: Die App prüft `NSWorkspace.runningApplications` auf eine doppelte Bundle-ID und wird beendet, wenn mehr als eine Instanz gefunden wird (`isDuplicateInstance()` in `MenuBar.swift`).

## Hinweise zur Absicherung

- Für alle privilegierten Schnittstellen sollte eine übereinstimmende TeamID verlangt werden.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (nur DEBUG) kann für die lokale Entwicklung Aufrufer mit derselben UID zulassen.
- Die gesamte Kommunikation bleibt ausschließlich lokal; es werden keine Netzwerk-Sockets bereitgestellt.
- TCC-Abfragen stammen ausschließlich aus dem Bundle der GUI-App; halten Sie die signierte Bundle-ID über Neuerstellungen hinweg stabil.
- Absicherung des Sockets für Ausführungsgenehmigungen: Dateimodus `0600`, gemeinsam verwendetes Token, Prüfung der Peer-UID (`getpeereid`), HMAC-SHA256-Challenge-Response-Verfahren und eine kurze TTL für Anfragen.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-IPC-Ablauf (Ausführungsgenehmigungen)](/de/tools/exec-approvals-advanced#macos-ipc-flow)
