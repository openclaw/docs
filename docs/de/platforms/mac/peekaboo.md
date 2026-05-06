---
read_when:
    - Bereitstellung von PeekabooBridge in OpenClaw.app
    - Peekaboo über den Swift Package Manager integrieren
    - PeekabooBridge-Protokoll/-Pfade ändern
    - Entscheidung zwischen PeekabooBridge, Codex Computer Use und cua-driver MCP
summary: PeekabooBridge-Integration für UI-Automatisierung unter macOS
title: Peekaboo-Brücke
x-i18n:
    generated_at: "2026-05-06T06:56:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw kann **PeekabooBridge** als lokalen, berechtigungsbewussten Broker für UI-Automatisierung hosten. Dadurch kann die `peekaboo` CLI die UI-Automatisierung steuern und dabei die TCC-Berechtigungen der macOS-App wiederverwenden.

## Was dies ist (und was nicht)

- **Host**: OpenClaw.app kann als PeekabooBridge-Host fungieren.
- **Client**: Verwenden Sie die `peekaboo` CLI (keine separate `openclaw ui ...`-Oberfläche).
- **UI**: Visuelle Overlays bleiben in Peekaboo.app; OpenClaw ist ein schlanker Broker-Host.

## Verhältnis zu Computer Use

OpenClaw hat drei Pfade zur Desktop-Steuerung, die bewusst getrennt bleiben:

- **PeekabooBridge-Host**: OpenClaw.app kann den lokalen PeekabooBridge-Socket hosten.
  Die `peekaboo` CLI bleibt der Client und nutzt die macOS-Berechtigungen von OpenClaw.app
  für Peekaboo-Automatisierungsprimitive wie Screenshots, Klicks,
  Menüs, Dialoge, Dock-Aktionen und Fensterverwaltung.
- **Codex Computer Use**: Das gebündelte `codex` Plugin bereitet den Codex-App-Server vor,
  überprüft, ob Codex’ `computer-use` MCP-Server verfügbar ist, und lässt dann
  Codex während Durchläufen im Codex-Modus native Tool-Aufrufe zur Desktop-Steuerung übernehmen. OpenClaw
  leitet diese Aktionen nicht über PeekabooBridge weiter.
- **Direktes `cua-driver` MCP**: OpenClaw kann TryCuas Upstream-Server
  `cua-driver mcp` als normalen MCP-Server registrieren. Dadurch erhalten Agenten die eigenen Schemas
  des CUA-Treibers und den PID-/Fenster-/Elementindex-Workflow, ohne
  über den Codex Marketplace oder den PeekabooBridge-Socket zu routen.

Verwenden Sie Peekaboo, wenn Sie die breite macOS-Automatisierungsoberfläche und den
berechtigungsbewussten Bridge-Host von OpenClaw.app benötigen. Verwenden Sie Codex Computer Use, wenn ein Agent im Codex-Modus
sich auf Codex’ natives Computer-Use-Plugin stützen soll. Verwenden Sie direktes `cua-driver mcp`,
wenn Sie den CUA-Treiber für jede von OpenClaw verwaltete Runtime als normalen
MCP-Server verfügbar machen möchten.

## Bridge aktivieren

In der macOS-App:

- Einstellungen → **Peekaboo Bridge aktivieren**

Wenn aktiviert, startet OpenClaw einen lokalen UNIX-Socket-Server. Wenn deaktiviert, wird der Host
gestoppt und `peekaboo` fällt auf andere verfügbare Hosts zurück.

## Client-Erkennungsreihenfolge

Peekaboo-Clients versuchen Hosts typischerweise in dieser Reihenfolge:

1. Peekaboo.app (vollständige UX)
2. Claude.app (falls installiert)
3. OpenClaw.app (schlanker Broker)

Verwenden Sie `peekaboo bridge status --verbose`, um zu sehen, welcher Host aktiv ist und welcher
Socket-Pfad verwendet wird. Sie können dies überschreiben mit:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicherheit und Berechtigungen

- Die Bridge validiert **Code-Signaturen des Aufrufers**; eine Allowlist von TeamIDs wird
  erzwungen (Peekaboo-Host-TeamID + OpenClaw-App-TeamID).
- Anfragen laufen nach etwa 10 Sekunden ab.
- Wenn erforderliche Berechtigungen fehlen, gibt die Bridge eine klare Fehlermeldung zurück,
  anstatt die Systemeinstellungen zu öffnen.

## Snapshot-Verhalten (Automatisierung)

Snapshots werden im Arbeitsspeicher gespeichert und laufen nach einem kurzen Zeitraum automatisch ab.
Wenn Sie eine längere Aufbewahrung benötigen, erfassen Sie den Snapshot erneut vom Client aus.

## Fehlerbehebung

- Wenn `peekaboo` meldet: „bridge client is not authorized“, stellen Sie sicher, dass der Client
  ordnungsgemäß signiert ist, oder führen Sie den Host nur im **Debug**-Modus mit `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  aus.
- Wenn keine Hosts gefunden werden, öffnen Sie eine der Host-Apps (Peekaboo.app oder OpenClaw.app)
  und bestätigen Sie, dass die Berechtigungen erteilt wurden.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
