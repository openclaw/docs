---
read_when:
    - PeekabooBridge in OpenClaw.app hosten
    - Peekaboo über Swift Package Manager integrieren
    - PeekabooBridge-Protokoll/Pfade ändern
    - Entscheidung zwischen PeekabooBridge, Codex Computer Use und cua-driver MCP
summary: PeekabooBridge-Integration für macOS-UI-Automatisierung
title: Peekaboo-Brücke
x-i18n:
    generated_at: "2026-06-27T17:43:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
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
  Die `peekaboo`-CLI bleibt der Client und verwendet die macOS-Berechtigungen von OpenClaw.app
  für Peekaboo-Automatisierungsprimitive wie Screenshots, Klicks,
  Menüs, Dialoge, Dock-Aktionen und Fensterverwaltung.
- **Codex Computer Use**: Das gebündelte `codex`-Plugin bereitet den Codex-App-Server vor,
  überprüft, dass der MCP-Server `computer-use` von Codex verfügbar ist, und lässt dann
  Codex während Turns im Codex-Modus native Tool-Aufrufe zur Desktop-Steuerung übernehmen. OpenClaw
  leitet diese Aktionen nicht über PeekabooBridge weiter.
- **Direktes `cua-driver`-MCP**: OpenClaw kann den Upstream-Server
  `cua-driver mcp` von TryCua als normalen MCP-Server registrieren. Dadurch erhalten Agenten die
  eigenen Schemas und den pid/Fenster/Elementindex-Workflow des CUA-Treibers, ohne
  über den Codex-Marktplatz oder den PeekabooBridge-Socket zu routen.

Verwenden Sie Peekaboo, wenn Sie die breite macOS-Automatisierungsoberfläche und den
berechtigungsbewussten Bridge-Host von OpenClaw.app benötigen. Verwenden Sie Codex Computer Use, wenn ein Agent im Codex-Modus
sich auf das native Computer-Use-Plugin von Codex stützen soll. Verwenden Sie direktes `cua-driver mcp`,
wenn Sie den CUA-Treiber jeder von OpenClaw verwalteten Runtime als normalen
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

- Die Bridge validiert **Code-Signaturen der Aufrufer**; eine Zulassungsliste von TeamIDs wird
  durchgesetzt (Peekaboo-Host-TeamID + OpenClaw-App-TeamID).
- Bevorzugen Sie für Bedienungshilfen die signierte Bridge-/App-Identität gegenüber einer generischen `node`-Runtime. Wenn Sie `node` Bedienungshilfen gewähren, kann jedes Paket, das von dieser Node-Ausführungsdatei gestartet wird, GUI-Automatisierungszugriff erben; siehe
  [macOS-Berechtigungen](/de/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Anfragen laufen nach ca. 10 Sekunden ab.
- Wenn erforderliche Berechtigungen fehlen, gibt die Bridge eine klare Fehlermeldung zurück,
  anstatt die Systemeinstellungen zu öffnen.

## Snapshot-Verhalten (Automatisierung)

Snapshots werden im Arbeitsspeicher gespeichert und laufen nach einem kurzen Zeitraum automatisch ab.
Wenn Sie eine längere Aufbewahrung benötigen, erfassen Sie sie erneut vom Client aus.

## Fehlerbehebung

- Wenn `peekaboo` meldet, dass der „Bridge-Client nicht autorisiert ist“, stellen Sie sicher, dass der Client
  korrekt signiert ist, oder führen Sie den Host nur im **Debug**-Modus mit `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  aus.
- Wenn keine Hosts gefunden werden, öffnen Sie eine der Host-Apps (Peekaboo.app oder OpenClaw.app)
  und bestätigen Sie, dass Berechtigungen gewährt wurden.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
