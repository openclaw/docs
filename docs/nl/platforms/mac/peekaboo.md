---
read_when:
    - PeekabooBridge hosten in OpenClaw.app
    - Peekaboo integreren via Swift Package Manager
    - PeekabooBridge-protocol/paden wijzigen
    - Kiezen tussen PeekabooBridge, Codex Computer Use en cua-driver MCP
summary: PeekabooBridge-integratie voor macOS-UI-automatisering
title: Kiekeboe-brug
x-i18n:
    generated_at: "2026-06-27T17:48:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw kan **PeekabooBridge** hosten als een lokale, toestemmingsbewuste UI-automatiseringsbroker. Hierdoor kan de `peekaboo` CLI UI-automatisering aansturen terwijl de TCC-toestemmingen van de macOS-app worden hergebruikt.

## Wat dit is (en niet is)

- **Host**: OpenClaw.app kan fungeren als PeekabooBridge-host.
- **Client**: gebruik de `peekaboo` CLI (geen afzonderlijk `openclaw ui ...`-oppervlak).
- **UI**: visuele overlays blijven in Peekaboo.app; OpenClaw is een dunne brokerhost.

## Relatie met Computer Use

OpenClaw heeft drie paden voor desktopbesturing, en die blijven bewust gescheiden:

- **PeekabooBridge-host**: OpenClaw.app kan de lokale PeekabooBridge-socket hosten.
  De `peekaboo` CLI blijft de client en gebruikt de macOS-toestemmingen van OpenClaw.app
  voor Peekaboo-automatiseringsprimitieven zoals schermafbeeldingen, klikken,
  menu's, dialoogvensters, Dock-acties en vensterbeheer.
- **Codex Computer Use**: de gebundelde `codex`-plugin bereidt de Codex-appserver voor,
  verifieert dat Codex' `computer-use` MCP-server beschikbaar is, en laat vervolgens
  Codex eigenaar zijn van native toolaanroepen voor desktopbesturing tijdens Codex-modusbeurten. OpenClaw
  proxyt die acties niet via PeekabooBridge.
- **Directe `cua-driver` MCP**: OpenClaw kan TryCua's upstream
  `cua-driver mcp`-server registreren als een normale MCP-server. Dat geeft agents de eigen schema's
  en pid-/venster-/elementindex-workflow van de CUA-driver zonder routering
  via de Codex-marktplaats of de PeekabooBridge-socket.

Gebruik Peekaboo wanneer je het brede macOS-automatiseringsoppervlak en de
toestemmingsbewuste bridgehost van OpenClaw.app wilt. Gebruik Codex Computer Use wanneer een agent in Codex-modus
moet vertrouwen op Codex' native computer-use-plugin. Gebruik directe `cua-driver mcp`
wanneer je de CUA-driver wilt blootstellen aan elke door OpenClaw beheerde runtime als een normale
MCP-server.

## De bridge inschakelen

In de macOS-app:

- Instellingen → **Peekaboo Bridge inschakelen**

Wanneer ingeschakeld, start OpenClaw een lokale UNIX-socketserver. Indien uitgeschakeld, wordt de host
gestopt en valt `peekaboo` terug op andere beschikbare hosts.

## Clientdetectievolgorde

Peekaboo-clients proberen hosts doorgaans in deze volgorde:

1. Peekaboo.app (volledige UX)
2. Claude.app (indien geïnstalleerd)
3. OpenClaw.app (dunne broker)

Gebruik `peekaboo bridge status --verbose` om te zien welke host actief is en welk
socketpad in gebruik is. Je kunt dit overschrijven met:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Beveiliging en toestemmingen

- De bridge valideert **codehandtekeningen van aanroepers**; een allowlist van TeamID's wordt
  afgedwongen (Peekaboo-host-TeamID + OpenClaw-app-TeamID).
- Geef de voorkeur aan de ondertekende bridge-/app-identiteit boven een generieke `node`-runtime voor
  Toegankelijkheid. Toegankelijkheid verlenen aan `node` laat elk pakket dat door
  dat Node-uitvoerbare bestand wordt gestart GUI-automatiseringstoegang erven; zie
  [macOS-toestemmingen](/nl/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Verzoeken verlopen na ~10 seconden.
- Als vereiste toestemmingen ontbreken, retourneert de bridge een duidelijke foutmelding
  in plaats van Systeeminstellingen te openen.

## Snapshot-gedrag (automatisering)

Snapshots worden in het geheugen opgeslagen en verlopen automatisch na een korte periode.
Als je ze langer wilt bewaren, leg ze dan opnieuw vast vanuit de client.

## Probleemoplossing

- Als `peekaboo` meldt "bridge client is not authorized", zorg er dan voor dat de client
  correct is ondertekend of voer de host alleen in **debug**-modus uit met `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`.
- Als er geen hosts worden gevonden, open dan een van de host-apps (Peekaboo.app of OpenClaw.app)
  en bevestig dat de toestemmingen zijn verleend.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-toestemmingen](/nl/platforms/mac/permissions)
