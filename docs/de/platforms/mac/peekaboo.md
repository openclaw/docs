---
read_when:
    - PeekabooBridge in OpenClaw.app hosten
    - Peekaboo über den Swift Package Manager integrieren
    - PeekabooBridge-Protokoll/-Pfade ändern
    - Entscheidung zwischen PeekabooBridge, Codex Computer Use und cua-driver MCP
summary: PeekabooBridge-Integration für macOS-UI-Automatisierung
title: Peekaboo-Brücke
x-i18n:
    generated_at: "2026-04-30T07:03:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw kann **PeekabooBridge** als lokalen, berechtigungsbewussten Broker für UI-Automatisierung hosten. Dadurch kann die `peekaboo`-CLI UI-Automatisierung steuern und dabei die TCC-Berechtigungen der macOS-App wiederverwenden.

## Was dies ist (und was nicht)

- **Host**: OpenClaw.app kann als PeekabooBridge-Host fungieren.
- **Client**: Verwenden Sie die `peekaboo`-CLI (keine separate Oberfläche `openclaw ui ...`).
- **UI**: Visuelle Overlays bleiben in Peekaboo.app; OpenClaw ist ein schlanker Broker-Host.

## Beziehung zu Computer Use

OpenClaw hat drei Pfade zur Desktop-Steuerung, die bewusst getrennt bleiben:

- **PeekabooBridge-Host**: OpenClaw.app kann den lokalen PeekabooBridge-Socket hosten.
  Die `peekaboo`-CLI bleibt der Client und nutzt die macOS-Berechtigungen von OpenClaw.app
  für Peekaboo-Automatisierungsprimitive wie Screenshots, Klicks,
  Menüs, Dialoge, Dock-Aktionen und Fensterverwaltung.
- **Codex Computer Use**: Das gebündelte `codex`-Plugin bereitet den Codex-App-Server vor,
  prüft, ob Codexs `computer-use`-MCP-Server verfügbar ist, und lässt dann
  Codex während Turns im Codex-Modus native Tool-Aufrufe zur Desktop-Steuerung
  übernehmen. OpenClaw leitet diese Aktionen nicht über PeekabooBridge weiter.
- **Direktes `cua-driver`-MCP**: OpenClaw kann TryCuas Upstream-Server
  `cua-driver mcp` als normalen MCP-Server registrieren. Dadurch erhalten Agenten die
  eigenen Schemas des CUA drivers und den pid/window/element-index-Workflow, ohne
  über den Codex-Marketplace oder den PeekabooBridge-Socket zu routen.

Verwenden Sie Peekaboo, wenn Sie die breite macOS-Automatisierungsoberfläche und den
berechtigungsbewussten Bridge-Host von OpenClaw.app nutzen möchten. Verwenden Sie Codex Computer Use, wenn ein Agent im Codex-Modus
sich auf Codexs natives Computer-Use-Plugin stützen soll. Verwenden Sie direkt `cua-driver mcp`,
wenn Sie den CUA driver jeder von OpenClaw verwalteten Runtime als normalen
MCP-Server bereitstellen möchten.

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

- Die Bridge validiert **Code-Signaturen der Aufrufer**; eine Allowlist von TeamIDs wird
  durchgesetzt (Peekaboo-Host-TeamID + OpenClaw-App-TeamID).
- Requests laufen nach ~10 Sekunden ab.
- Wenn erforderliche Berechtigungen fehlen, gibt die Bridge eine klare Fehlermeldung zurück,
  anstatt die Systemeinstellungen zu öffnen.

## Snapshot-Verhalten (Automatisierung)

Snapshots werden im Arbeitsspeicher gespeichert und laufen nach einem kurzen Zeitfenster automatisch ab.
Wenn Sie sie länger aufbewahren müssen, erfassen Sie sie erneut vom Client.

## Fehlerbehebung

- Wenn `peekaboo` meldet „Bridge-Client ist nicht autorisiert“, stellen Sie sicher, dass der Client
  korrekt signiert ist, oder führen Sie den Host nur im **Debug**-Modus mit `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  aus.
- Wenn keine Hosts gefunden werden, öffnen Sie eine der Host-Apps (Peekaboo.app oder OpenClaw.app)
  und bestätigen Sie, dass Berechtigungen erteilt sind.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
