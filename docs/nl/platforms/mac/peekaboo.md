---
read_when:
    - PeekabooBridge hosten in OpenClaw.app
    - Peekaboo integreren via Swift Package Manager
    - PeekabooBridge-protocol/-paden wijzigen
    - Kiezen tussen PeekabooBridge, Codex Computer Use en cua-driver MCP
summary: PeekabooBridge-integratie voor automatisering van de macOS-gebruikersinterface
title: Peekaboo-brug
x-i18n:
    generated_at: "2026-07-12T09:00:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw kan **PeekabooBridge** hosten als een lokale, machtigingsbewuste broker voor UI-automatisering (`PeekabooBridgeHostCoordinator`, ondersteund door het Swift-pakket `steipete/Peekaboo`). Hierdoor kan de `peekaboo`-CLI UI-automatisering aansturen en daarbij de TCC-machtigingen van de macOS-app hergebruiken.

## Wat dit is (en niet is)

- **Host**: OpenClaw.app kan fungeren als PeekabooBridge-host.
- **Client**: de `peekaboo`-CLI (er is geen afzonderlijke `openclaw ui ...`-interface).
- **UI**: visuele overlays blijven in Peekaboo.app; OpenClaw is een lichtgewicht brokerhost.

## Relatie tot andere methoden voor desktopbesturing

OpenClaw heeft vier methoden voor desktopbesturing die bewust gescheiden blijven:

- **PeekabooBridge-host**: OpenClaw.app host de lokale PeekabooBridge-socket. De `peekaboo`-CLI is de client en gebruikt de macOS-machtigingen van OpenClaw.app voor schermafbeeldingen, klikken, menu's, dialoogvensters, Dock-acties en vensterbeheer.
- **Computeraansturing door de agent (`computer.act`)**: het ingebouwde `computer`-hulpmiddel van de Gateway-agent maakt schermafbeeldingen via `screen.snapshot` en bestuurt de aanwijzer en het toetsenbord via de gevaarlijke Node-opdracht `computer.act`. Een macOS-Node voert `computer.act` binnen het proces uit met behulp van de ingebedde Peekaboo-automatiseringsservices die deze bridge beschikbaar stelt, aangevuld met beperkte CoreGraphics-primitieven, zonder gebruik te maken van de PeekabooBridge-socket of de `peekaboo`-CLI. Zie [Computergebruik](/nodes/computer-use).
- **Codex Computer Use**: de meegeleverde `codex`-plugin controleert de MCP-plugin `computer-use` van Codex en kan deze installeren (`extensions/codex/src/app-server/computer-use.ts`). Vervolgens kan Codex tijdens beurten in Codex-modus zelf systeemeigen hulpmiddelaanroepen voor desktopbesturing beheren. OpenClaw stuurt deze acties niet door via PeekabooBridge.
- **Rechtstreekse `cua-driver`-MCP**: OpenClaw kan de upstreamserver `cua-driver mcp` van TryCua registreren als een normale MCP-server. Hierdoor krijgen agents toegang tot de eigen schema's en de pid-/venster-/elementindexworkflow van het CUA-stuurprogramma, zonder routering via de Codex-marktplaats of de PeekabooBridge-socket.

Gebruik Peekaboo voor uitgebreide macOS-automatisering via de machtigingsbewuste bridgehost van OpenClaw.app. Gebruik computeraansturing door de agent wanneer de Gateway-agent het bureaublad moet kunnen zien en besturen via een uniforme Node-opdracht `computer.act` die door elk visiemodel kan worden aangestuurd. Gebruik Codex Computer Use wanneer een agent in Codex-modus moet vertrouwen op de systeemeigen plugin van Codex. Gebruik rechtstreeks `cua-driver mcp` om het CUA-stuurprogramma als een normale MCP-server beschikbaar te stellen aan elke door OpenClaw beheerde runtime.

## De bridge inschakelen

In de macOS-app: **Settings -> Enable Peekaboo Bridge**.

Wanneer dit is ingeschakeld, start OpenClaw een lokale UNIX-socketserver op `~/Library/Application Support/OpenClaw/<socket-name>`. Wanneer dit is uitgeschakeld, stopt de host en valt `peekaboo` terug op andere beschikbare hosts. De coördinator onderhoudt ook verouderde symbolische socketkoppelingen (`clawdbot`, `clawdis` en `moltbot` onder Application Support) die naar de huidige socket verwijzen voor oudere installaties van `peekaboo`.

## Zoekvolgorde voor clients

Peekaboo-clients proberen hosts doorgaans in deze volgorde:

1. Peekaboo.app (volledige gebruikerservaring)
2. Claude.app (indien geïnstalleerd)
3. OpenClaw.app (lichtgewicht broker)

Gebruik `peekaboo bridge status --verbose` om te zien welke host actief is en welk socketpad wordt gebruikt. Overschrijf dit met:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Beveiliging en machtigingen

- De bridge valideert **codehandtekeningen van aanroepers**; er wordt een toelatingslijst met TeamID's afgedwongen (de TeamID van de Peekaboo-host plus de eigen TeamID van de actieve app).
- Geef voor Toegankelijkheid de voorkeur aan de ondertekende identiteit van de bridge/app boven een generieke `node`-runtime. Als u Toegankelijkheid aan `node` verleent, kan elk pakket dat door dat uitvoerbare Node-bestand wordt gestart toegang tot GUI-automatisering overnemen; zie [macOS-machtigingen](/nl/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Verzoeken verlopen na 10 seconden (`requestTimeoutSec: 10`).
- Als vereiste machtigingen ontbreken, retourneert de bridge een duidelijke foutmelding in plaats van Systeeminstellingen te openen.

## Gedrag van momentopnamen (automatisering)

Momentopnamen worden in het geheugen opgeslagen met een geldigheidsduur van 10 minuten en een maximum van 50 momentopnamen (`InMemorySnapshotManager`); artefacten worden bij het opschonen niet verwijderd. Als u ze langer wilt bewaren, maakt u vanuit de client een nieuwe opname.

## Problemen oplossen

- Als `peekaboo` de melding "bridge client is not authorized" weergeeft, controleert u of de client correct is ondertekend of voert u de host alleen in de **debug**-modus uit met `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`.
- Als er geen hosts worden gevonden, opent u een van de host-apps (Peekaboo.app of OpenClaw.app) en controleert u of de machtigingen zijn verleend.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-machtigingen](/nl/platforms/mac/permissions)
