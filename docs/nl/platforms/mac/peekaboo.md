---
read_when:
    - PeekabooBridge hosten in OpenClaw.app
    - Peekaboo integreren via Swift Package Manager
    - PeekabooBridge-protocol/paden wijzigen
    - Kiezen tussen PeekabooBridge, Codex Computer Use en cua-driver MCP
summary: PeekabooBridge-integratie voor UI-automatisering op macOS
title: Peekaboo-brug
x-i18n:
    generated_at: "2026-05-06T09:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw kan **PeekabooBridge** hosten als een lokale, machtigingsbewuste UI-automatiseringsbroker. Hierdoor kan de `peekaboo` CLI UI-automatisering aansturen terwijl de TCC-machtigingen van de macOS-app opnieuw worden gebruikt.

## Wat dit is (en niet is)

- **Host**: OpenClaw.app kan fungeren als PeekabooBridge-host.
- **Client**: gebruik de `peekaboo` CLI (geen afzonderlijk `openclaw ui ...`-oppervlak).
- **UI**: visuele overlays blijven in Peekaboo.app; OpenClaw is een dunne brokerhost.

## Relatie met Computer Use

OpenClaw heeft drie paden voor desktopbesturing, en die blijven bewust gescheiden:

- **PeekabooBridge-host**: OpenClaw.app kan de lokale PeekabooBridge-socket hosten. De `peekaboo` CLI blijft de client en gebruikt de macOS-machtigingen van OpenClaw.app voor Peekaboo-automatiseringsprimitieven zoals schermafbeeldingen, klikken, menu's, dialoogvensters, Dock-acties en vensterbeheer.
- **Codex Computer Use**: de gebundelde `codex`-Plugin bereidt de Codex app-server voor, verifieert dat Codex' `computer-use` MCP-server beschikbaar is, en laat Codex vervolgens native toolaanroepen voor desktopbesturing afhandelen tijdens beurten in Codex-modus. OpenClaw proxy't die acties niet via PeekabooBridge.
- **Directe `cua-driver` MCP**: OpenClaw kan TryCua's upstream `cua-driver mcp`-server registreren als een normale MCP-server. Dat geeft agents de eigen schema's en pid/window/element-index-workflow van de CUA-driver zonder routering via de Codex marketplace of de PeekabooBridge-socket.

Gebruik Peekaboo wanneer je het brede macOS-automatiseringsoppervlak en de machtigingsbewuste bridgehost van OpenClaw.app wilt. Gebruik Codex Computer Use wanneer een agent in Codex-modus moet vertrouwen op Codex' native computer-use-Plugin. Gebruik directe `cua-driver mcp` wanneer je de CUA-driver wilt blootstellen aan elke door OpenClaw beheerde runtime als een normale MCP-server.

## De bridge inschakelen

In de macOS-app:

- Settings → **Peekaboo Bridge inschakelen**

Wanneer dit is ingeschakeld, start OpenClaw een lokale UNIX-socketserver. Als dit is uitgeschakeld, wordt de host gestopt en valt `peekaboo` terug op andere beschikbare hosts.

## Volgorde voor clientdetectie

Peekaboo-clients proberen hosts doorgaans in deze volgorde:

1. Peekaboo.app (volledige UX)
2. Claude.app (indien geïnstalleerd)
3. OpenClaw.app (dunne broker)

Gebruik `peekaboo bridge status --verbose` om te zien welke host actief is en welk socketpad in gebruik is. Je kunt dit overschrijven met:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Beveiliging en machtigingen

- De bridge valideert **codehandtekeningen van aanroepers**; er wordt een allowlist van TeamID's afgedwongen (Peekaboo-host-TeamID + OpenClaw-app-TeamID).
- Verzoeken verlopen na ~10 seconden.
- Als vereiste machtigingen ontbreken, retourneert de bridge een duidelijke foutmelding in plaats van Systeeminstellingen te openen.

## Snapshotgedrag (automatisering)

Snapshots worden in het geheugen opgeslagen en verlopen automatisch na een kort tijdsvenster. Als je ze langer wilt bewaren, leg ze dan opnieuw vast vanuit de client.

## Probleemoplossing

- Als `peekaboo` meldt dat "bridge client is not authorized", zorg er dan voor dat de client correct is ondertekend of voer de host alleen in **debug**-modus uit met `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`.
- Als er geen hosts worden gevonden, open dan een van de host-apps (Peekaboo.app of OpenClaw.app) en bevestig dat machtigingen zijn verleend.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-machtigingen](/nl/platforms/mac/permissions)
