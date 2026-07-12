---
read_when:
    - PeekabooBridge in OpenClaw.app hosten
    - Integration von Peekaboo über den Swift Package Manager
    - Ändern des PeekabooBridge-Protokolls/der Pfade
    - Entscheidung zwischen PeekabooBridge, Codex Computer Use und cua-driver MCP
summary: PeekabooBridge-Integration für die Automatisierung der macOS-Benutzeroberfläche
title: Peekaboo-Bridge
x-i18n:
    generated_at: "2026-07-12T15:38:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw kann **PeekabooBridge** als lokalen, berechtigungsbewussten Broker für die UI-Automatisierung hosten (`PeekabooBridgeHostCoordinator`, basierend auf dem Swift-Paket `steipete/Peekaboo`). Dadurch kann die `peekaboo`-CLI die UI-Automatisierung steuern und dabei die TCC-Berechtigungen der macOS-App wiederverwenden.

## Was dies ist (und was nicht)

- **Host**: OpenClaw.app kann als PeekabooBridge-Host fungieren.
- **Client**: die `peekaboo`-CLI (es gibt keine separate Oberfläche `openclaw ui ...`).
- **UI**: Visuelle Overlays verbleiben in Peekaboo.app; OpenClaw ist ein schlanker Broker-Host.

## Beziehung zu anderen Desktop-Steuerungspfaden

OpenClaw verfügt über vier Desktop-Steuerungspfade, die bewusst voneinander getrennt bleiben:

- **PeekabooBridge-Host**: OpenClaw.app hostet den lokalen PeekabooBridge-Socket. Die `peekaboo`-CLI ist der Client und verwendet die macOS-Berechtigungen von OpenClaw.app für Screenshots, Klicks, Menüs, Dialoge, Dock-Aktionen und die Fensterverwaltung.
- **Agentengesteuerte Computernutzung (`computer.act`)**: Das integrierte `computer`-Tool des Gateway-Agenten erfasst Screenshots über `screen.snapshot` und steuert Zeiger und Tastatur über den gefährlichen Node-Befehl `computer.act`. Ein macOS-Node führt `computer.act` prozessintern mithilfe der eingebetteten Peekaboo-Automatisierungsdienste, die diese Bridge bereitstellt, sowie eng begrenzter CoreGraphics-Primitiven aus, ohne den PeekabooBridge-Socket oder die `peekaboo`-CLI zu verwenden. Siehe [Computernutzung](/nodes/computer-use).
- **Codex Computer Use**: Das gebündelte `codex`-Plugin prüft das MCP-Plugin `computer-use` von Codex und kann es installieren (`extensions/codex/src/app-server/computer-use.ts`). Anschließend übernimmt Codex während Ausführungen im Codex-Modus die nativen Tool-Aufrufe zur Desktop-Steuerung. OpenClaw leitet diese Aktionen nicht über PeekabooBridge weiter.
- **Direktes `cua-driver`-MCP**: OpenClaw kann den vorgelagerten Server `cua-driver mcp` von TryCua als normalen MCP-Server registrieren. Dadurch erhalten Agenten die eigenen Schemas sowie den PID-/Fenster-/Elementindex-Workflow des CUA-Treibers, ohne dass eine Weiterleitung über den Codex-Marktplatz oder den PeekabooBridge-Socket erfolgt.

Verwenden Sie Peekaboo für die umfassende macOS-Automatisierungsoberfläche über den berechtigungsbewussten Bridge-Host von OpenClaw.app. Verwenden Sie die agentengesteuerte Computernutzung, wenn der Gateway-Agent den Desktop über einen einheitlichen Node-Befehl `computer.act`, den jedes Vision-Modell steuern kann, sehen und bedienen soll. Verwenden Sie Codex Computer Use, wenn ein Agent im Codex-Modus das native Plugin von Codex verwenden soll. Verwenden Sie direktes `cua-driver mcp`, um den CUA-Treiber jeder von OpenClaw verwalteten Laufzeit als normalen MCP-Server bereitzustellen.

## Bridge aktivieren

In der macOS-App: **Settings -> Enable Peekaboo Bridge**.

Wenn diese Option aktiviert ist, startet OpenClaw einen lokalen UNIX-Socket-Server unter `~/Library/Application Support/OpenClaw/<socket-name>`. Wenn sie deaktiviert ist, wird der Host angehalten und `peekaboo` greift auf andere verfügbare Hosts zurück. Der Koordinator verwaltet außerdem Verknüpfungen für ältere Sockets (`clawdbot`, `clawdis`, `moltbot` unter Application Support), die für ältere `peekaboo`-Installationen auf den aktuellen Socket verweisen.

## Erkennungsreihenfolge des Clients

Peekaboo-Clients versuchen Hosts üblicherweise in dieser Reihenfolge:

1. Peekaboo.app (vollständige Benutzeroberfläche)
2. Claude.app (falls installiert)
3. OpenClaw.app (schlanker Broker)

Verwenden Sie `peekaboo bridge status --verbose`, um zu sehen, welcher Host aktiv ist und welcher Socket-Pfad verwendet wird. Überschreiben Sie ihn mit:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicherheit und Berechtigungen

- Die Bridge validiert **Codesignaturen der Aufrufer**; eine Zulassungsliste von TeamIDs wird durchgesetzt (TeamID des Peekaboo-Hosts sowie die eigene TeamID der ausgeführten App).
- Bevorzugen Sie für Bedienungshilfen die signierte Bridge-/App-Identität gegenüber einer generischen `node`-Laufzeit. Wenn Sie `node` Bedienungshilfen gewähren, kann jedes von dieser ausführbaren Node-Datei gestartete Paket den Zugriff auf die GUI-Automatisierung übernehmen. Siehe [macOS-Berechtigungen](/de/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Bei Anfragen tritt nach 10 Sekunden eine Zeitüberschreitung ein (`requestTimeoutSec: 10`).
- Wenn erforderliche Berechtigungen fehlen, gibt die Bridge eine eindeutige Fehlermeldung zurück, anstatt die Systemeinstellungen zu öffnen.

## Snapshot-Verhalten (Automatisierung)

Snapshots werden mit einer Gültigkeitsdauer von 10 Minuten und einer Obergrenze von 50 Snapshots im Arbeitsspeicher gespeichert (`InMemorySnapshotManager`); Artefakte werden bei der Bereinigung nicht gelöscht. Wenn Sie eine längere Aufbewahrung benötigen, erfassen Sie sie über den Client erneut.

## Fehlerbehebung

- Wenn `peekaboo` „bridge client is not authorized“ meldet, stellen Sie sicher, dass der Client ordnungsgemäß signiert ist, oder führen Sie den Host ausschließlich im **Debug**-Modus mit `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` aus.
- Wenn keine Hosts gefunden werden, öffnen Sie eine der Host-Apps (Peekaboo.app oder OpenClaw.app) und bestätigen Sie, dass die Berechtigungen erteilt wurden.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
