---
read_when:
    - PeekabooBridge hosten in OpenClaw.app
    - Peekaboo integreren via Swift Package Manager
    - PeekabooBridge-protocol/-paden wijzigen
    - Kiezen tussen PeekabooBridge, Codex Computer Use en cua-driver MCP
summary: PeekabooBridge-integratie voor macOS-UI-automatisering
title: Kiekeboe-brug
x-i18n:
    generated_at: "2026-04-29T23:00:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw kan **PeekabooBridge** hosten als lokale, toestemmingsbewuste broker voor UI-automatisering. Hierdoor kan de `peekaboo` CLI UI-automatisering aansturen terwijl de TCC-toestemmingen van de macOS-app opnieuw worden gebruikt.

## Wat dit is (en niet is)

- **Host**: OpenClaw.app kan fungeren als PeekabooBridge-host.
- **Client**: gebruik de `peekaboo` CLI (geen afzonderlijk `openclaw ui ...`-oppervlak).
- **UI**: visuele overlays blijven in Peekaboo.app; OpenClaw is een lichte brokerhost.

## Relatie tot Computergebruik

OpenClaw heeft drie paden voor desktopbesturing, en die blijven bewust gescheiden:

- **PeekabooBridge-host**: OpenClaw.app kan de lokale PeekabooBridge-socket hosten. De `peekaboo` CLI blijft de client en gebruikt de macOS-toestemmingen van OpenClaw.app voor Peekaboo-automatiseringsprimitieven zoals schermafbeeldingen, klikken, menu's, dialogen, Dock-acties en vensterbeheer.
- **Codex Computergebruik**: de gebundelde `codex` Plugin bereidt de Codex-appserver voor, controleert of de `computer-use` MCP-server van Codex beschikbaar is, en laat Codex daarna native toolaanroepen voor desktopbesturing beheren tijdens beurten in Codex-modus. OpenClaw proxyt die acties niet via PeekabooBridge.
- **Directe `cua-driver` MCP**: OpenClaw kan de upstream `cua-driver mcp`-server van TryCua registreren als een normale MCP-server. Dat geeft agenten de eigen schema's en pid/venster/elementindex-workflow van de CUA-driver zonder routering via de Codex-marktplaats of de PeekabooBridge-socket.

Gebruik Peekaboo wanneer je het brede macOS-automatiseringsoppervlak en de toestemmingsbewuste bridgehost van OpenClaw.app wilt. Gebruik Codex Computergebruik wanneer een agent in Codex-modus moet vertrouwen op de native computer-use-Plugin van Codex. Gebruik directe `cua-driver mcp` wanneer je de CUA-driver als normale MCP-server wilt blootstellen aan elke door OpenClaw beheerde runtime.

## Schakel de bridge in

In de macOS-app:

- Instellingen → **Peekaboo Bridge inschakelen**

Wanneer dit is ingeschakeld, start OpenClaw een lokale UNIX-socketserver. Als dit is uitgeschakeld, wordt de host gestopt en valt `peekaboo` terug op andere beschikbare hosts.

## Ontdekkingsvolgorde voor clients

Peekaboo-clients proberen hosts doorgaans in deze volgorde:

1. Peekaboo.app (volledige UX)
2. Claude.app (indien geïnstalleerd)
3. OpenClaw.app (lichte broker)

Gebruik `peekaboo bridge status --verbose` om te zien welke host actief is en welk socketpad wordt gebruikt. Je kunt dit overschrijven met:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Beveiliging en toestemmingen

- De bridge valideert **codehandtekeningen van aanroepers**; er wordt een allowlist van TeamID's afgedwongen (Peekaboo-host-TeamID + OpenClaw-app-TeamID).
- Verzoeken verlopen na ongeveer 10 seconden.
- Als vereiste toestemmingen ontbreken, retourneert de bridge een duidelijke foutmelding in plaats van Systeeminstellingen te starten.

## Snapshotgedrag (automatisering)

Snapshots worden in het geheugen opgeslagen en verlopen automatisch na een kort tijdvenster. Als je ze langer wilt bewaren, leg ze dan opnieuw vast vanaf de client.

## Probleemoplossing

- Als `peekaboo` meldt dat “bridge client is not authorized”, controleer dan of de client correct is ondertekend of voer de host alleen in **debug**-modus uit met `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`.
- Als er geen hosts worden gevonden, open dan een van de host-apps (Peekaboo.app of OpenClaw.app) en bevestig dat toestemmingen zijn verleend.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-toestemmingen](/nl/platforms/mac/permissions)
