---
read_when:
    - Hosting von PeekabooBridge in OpenClaw.app
    - Peekaboo über den Swift Package Manager integrieren
    - PeekabooBridge-Protokoll/-Pfade ändern
    - Entscheidung zwischen PeekabooBridge, Codex Computer Use und cua-driver MCP
summary: PeekabooBridge-Integration für die Automatisierung der macOS-Benutzeroberfläche
title: Peekaboo-Bridge
x-i18n:
    generated_at: "2026-07-24T04:43:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw kann **PeekabooBridge** als lokalen, berechtigungsorientierten Broker für die UI-Automatisierung hosten (`PeekabooBridgeHostCoordinator`, gestützt auf das Swift-Paket `steipete/Peekaboo`). Dadurch kann die CLI `peekaboo` die UI-Automatisierung steuern und dabei die TCC-Berechtigungen der macOS-App wiederverwenden.

## Was dies ist (und was nicht)

- **Host**: OpenClaw.app kann als PeekabooBridge-Host fungieren.
- **Client**: die CLI `peekaboo` (es gibt keine separate `openclaw ui ...`-Oberfläche).
- **UI**: Visuelle Overlays verbleiben in Peekaboo.app; OpenClaw ist ein schlanker Broker-Host.

## Beziehung zu anderen Pfaden für die Desktop-Steuerung

OpenClaw verfügt über vier Pfade für die Desktop-Steuerung, die bewusst voneinander getrennt bleiben:

- **PeekabooBridge-Host**: OpenClaw.app hostet den lokalen PeekabooBridge-Socket. Die CLI `peekaboo` ist der Client und verwendet die macOS-Berechtigungen von OpenClaw.app für Bildschirmaufnahmen, Klicks, Menüs, Dialoge, Dock-Aktionen und die Fensterverwaltung.
- **Agentengesteuerte Computernutzung (`computer.act`)**: Das integrierte Tool `computer` des Gateway-Agenten erstellt über `screen.snapshot` Bildschirmaufnahmen und steuert Zeiger und Tastatur über den gefährlichen Node-Befehl `computer.act`. Ein macOS-Node führt `computer.act` prozessintern mithilfe der eingebetteten Peekaboo-Automatisierungsdienste aus, die diese Bridge bereitstellt, sowie mit gezielt eingesetzten CoreGraphics-Primitiven, ohne den PeekabooBridge-Socket oder die CLI `peekaboo` zu verwenden. Siehe [Computernutzung](/de/nodes/computer-use).
- **Codex Computer Use**: Das gebündelte Plugin `codex` prüft das MCP-Plugin `computer-use` von Codex (`extensions/codex/src/app-server/computer-use.ts`) und kann es installieren. Anschließend kann Codex während Ausführungen im Codex-Modus die nativen Tool-Aufrufe zur Desktop-Steuerung übernehmen. OpenClaw leitet diese Aktionen nicht über PeekabooBridge weiter.
- **Direktes `cua-driver`-MCP**: OpenClaw kann den Upstream-Server `cua-driver mcp` von TryCua als normalen MCP-Server registrieren. Dadurch erhalten Agenten die eigenen Schemas des CUA-Treibers sowie dessen PID-/Fenster-/Elementindex-Arbeitsablauf, ohne dass die Weiterleitung über den Codex Marketplace oder den PeekabooBridge-Socket erfolgt.

Verwenden Sie Peekaboo für die umfassende macOS-Automatisierung über den berechtigungsorientierten Bridge-Host von OpenClaw.app. Verwenden Sie die agentengesteuerte Computernutzung, wenn der Gateway-Agent den Desktop über einen einheitlichen Node-Befehl `computer.act` sehen und steuern soll, den jedes Vision-Modell verwenden kann. Verwenden Sie Codex Computer Use, wenn ein Agent im Codex-Modus das native Plugin von Codex nutzen soll. Verwenden Sie direktes `cua-driver mcp`, um den CUA-Treiber jeder von OpenClaw verwalteten Laufzeit als normalen MCP-Server bereitzustellen.

## Bridge aktivieren

In der macOS-App: **Settings -> Enable Peekaboo Bridge**. Für den Schalter muss **Allow Computer Control** aktiviert sein, da beide lokale UI-Automatisierung ermöglichen. Wenn Computer Control deaktiviert ist, ist der Schalter deaktiviert und der Host wird nicht ausgeführt. Um Peekaboo ohne Computer Control zu steuern, führen Sie stattdessen die eigene Mac-App von Peekaboo als Host aus.

Wenn die Funktion aktiviert ist (und Computer Control eingeschaltet ist), startet OpenClaw einen lokalen UNIX-Socket-Server unter `~/Library/Application Support/OpenClaw/<socket-name>`. Wenn sie deaktiviert ist, wird der Host beendet und `peekaboo` greift auf andere verfügbare Hosts zurück. Der Koordinator verwaltet außerdem ältere Socket-Symlinks (`clawdbot`, `clawdis`, `moltbot` unter Application Support), die für ältere `peekaboo`-Installationen auf den aktuellen Socket verweisen.

## Reihenfolge der Client-Erkennung

Peekaboo-Clients versuchen Hosts normalerweise in dieser Reihenfolge:

1. Peekaboo.app (vollständige Benutzeroberfläche)
2. Claude.app (falls installiert)
3. OpenClaw.app (schlanker Broker)

Verwenden Sie `peekaboo bridge status --verbose`, um zu sehen, welcher Host aktiv ist und welcher Socket-Pfad verwendet wird. Überschreiben Sie dies mit:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicherheit und Berechtigungen

- Die Bridge validiert **Codesignaturen der Aufrufer**; eine Positivliste von TeamIDs wird durchgesetzt (die TeamID des Peekaboo-Hosts sowie die eigene TeamID der ausgeführten App).
- Bevorzugen Sie für Bedienungshilfen die signierte Bridge-/App-Identität gegenüber einer generischen `node`-Laufzeit. Wenn `node` Bedienungshilfen gewährt werden, kann jedes von dieser ausführbaren Node-Datei gestartete Paket den Zugriff auf die GUI-Automatisierung erben; siehe [macOS-Berechtigungen](/de/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Anfragen überschreiten nach 10 Sekunden das Zeitlimit (`requestTimeoutSec: 10`).
- Wenn erforderliche Berechtigungen fehlen, gibt die Bridge eine eindeutige Fehlermeldung zurück, anstatt die Systemeinstellungen zu öffnen.

## Snapshot-Verhalten (Automatisierung)

Snapshots werden mit einem Gültigkeitszeitraum von 10 Minuten und einer Obergrenze von 50 Snapshots (`InMemorySnapshotManager`) im Arbeitsspeicher gespeichert; Artefakte werden bei der Bereinigung nicht gelöscht. Wenn Sie eine längere Aufbewahrung benötigen, erfassen Sie den Snapshot erneut vom Client.

## Fehlerbehebung

- Wenn `peekaboo` „bridge client is not authorized“ meldet, stellen Sie sicher, dass der Client ordnungsgemäß signiert ist, oder führen Sie den Host mit `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ausschließlich im **debug**-Modus aus.
- Wenn keine Hosts gefunden werden, öffnen Sie eine der Host-Apps (Peekaboo.app oder OpenClaw.app) und vergewissern Sie sich, dass die Berechtigungen erteilt wurden.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
