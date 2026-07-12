---
read_when:
    - Je wilt dat OpenClaw-agenten in Codex-modus Codex Computer Use gebruiken
    - Je maakt een keuze tussen Codex Computer Use, PeekabooBridge en directe cua-driver-MCP
    - U configureert computerUse voor de gebundelde Codex-Plugin
    - Je lost problemen op met de status of installatie van computergebruik in /codex
summary: Codex Computer Use instellen voor OpenClaw-agents in Codex-modus
title: Codex-computergebruik
x-i18n:
    generated_at: "2026-07-12T09:07:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use is een Codex-native MCP-plugin voor lokale desktopbesturing. OpenClaw
levert de desktopapp niet mee, voert zelf geen desktopacties uit en omzeilt
Codex-machtigingen niet. De meegeleverde `codex`-plugin bereidt alleen de Codex-app-server voor:
deze schakelt ondersteuning voor Codex-plugins in, zoekt of installeert de geconfigureerde Computer Use-
plugin, controleert of de MCP-server `computer-use` beschikbaar is en laat
Codex vervolgens de native MCP-toolaanroepen uitvoeren tijdens beurten in Codex-modus.

Gebruik deze pagina wanneer OpenClaw al de native Codex-harness gebruikt. Zie
[Codex-harness](/nl/plugins/codex-harness) voor het instellen van de runtime zelf.

Dit verschilt van de ingebouwde [door een Node ondersteunde computertool](/nl/nodes/computer-use) van OpenClaw. Gebruik de ingebouwde tool wanneer hetzelfde agentcontract een gekoppelde Mac moet besturen, ongeacht of de agent op de Gateway of een andere Node wordt uitgevoerd. Gebruik Codex Computer Use wanneer de Codex-app-server de lokale MCP-installatie, machtigingen en native toolaanroepen moet beheren.

## OpenClaw.app en Peekaboo

De Peekaboo-integratie van OpenClaw.app staat los van Codex Computer Use. De
macOS-app kan een PeekabooBridge-socket hosten, zodat de `peekaboo`-CLI de
lokale toestemmingen van de app voor Toegankelijkheid en Schermopname kan hergebruiken voor de eigen
automatiseringstools van Peekaboo. Die bridge installeert Codex Computer Use niet en fungeert er niet als proxy voor, en
Codex Computer Use roept niets aan via de PeekabooBridge-socket.

Gebruik [Peekaboo-bridge](/nl/platforms/mac/peekaboo) wanneer u wilt dat OpenClaw.app
een machtigingsbewuste host is voor automatisering met de Peekaboo-CLI. Gebruik deze pagina wanneer een
OpenClaw-agent in Codex-modus de native MCP-plugin `computer-use` van Codex
beschikbaar moet hebben voordat de beurt begint.

## iOS-app

De iOS-app staat los van Codex Computer Use. Deze installeert de MCP-server
`computer-use` van Codex niet, fungeert er niet als proxy voor en is geen backend voor desktopbesturing.
In plaats daarvan maakt de iOS-app verbinding als een OpenClaw-Node en stelt deze mobiele
mogelijkheden beschikbaar via Node-opdrachten zoals `canvas.*`, `camera.*`, `screen.*`,
`location.*` en `talk.*`.

Gebruik [iOS](/nl/platforms/ios) wanneer u wilt dat een agent een iPhone-Node
via de Gateway aanstuurt. Gebruik deze pagina wanneer een agent in Codex-modus de
lokale macOS-desktop moet besturen via de native Computer Use-plugin van Codex.

## Rechtstreekse cua-driver-MCP

Codex Computer Use is niet de enige manier om desktopbesturing beschikbaar te stellen. Als u wilt
dat door OpenClaw beheerde runtimes de driver van TryCua rechtstreeks aanroepen, gebruikt u de upstream
`cua-driver mcp`-server via het MCP-register van OpenClaw in plaats van de
Codex-specifieke marketplaceprocedure.

Vraag na de installatie van `cua-driver` om de OpenClaw-opdracht:

```bash
cua-driver mcp-config --client openclaw
```

of registreer de stdio-server rechtstreeks:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dit pad houdt het upstream MCP-tooloppervlak intact, inclusief de driver-
schema's en gestructureerde MCP-antwoorden. Gebruik dit wanneer u wilt dat de CUA-driver
beschikbaar is als een normale OpenClaw-MCP-server. Gebruik de configuratie voor Codex Computer Use op
deze pagina wanneer de Codex-app-server de plugininstallatie, het opnieuw laden van MCP-servers
en native toolaanroepen binnen beurten in Codex-modus moet beheren.

De driver van CUA is specifiek voor macOS en vereist nog steeds de lokale macOS-machtigingen
waarom de app vraagt, zoals Toegankelijkheid en Schermopname. OpenClaw
installeert `cua-driver` niet, verleent die machtigingen niet en omzeilt het
veiligheidsmodel van de upstream driver niet.

## Snelle configuratie

Stel `plugins.entries.codex.config.computerUse` in wanneer Computer Use vóór
het starten van een thread beschikbaar moet zijn voor beurten in Codex-modus. Met `autoInstall: true` wordt
Computer Use ingeschakeld en kan OpenClaw het vóór de beurt installeren of opnieuw inschakelen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Met deze configuratie controleert OpenClaw de Codex-app-server vóór elke beurt in
Codex-modus. Als Computer Use ontbreekt, maar de Codex-app-server al een
installeerbare marketplace heeft gevonden, vraagt OpenClaw de Codex-app-server de plugin te installeren of
opnieuw in te schakelen en MCP-servers opnieuw te laden. Wanneer op macOS geen overeenkomende
marketplace is geregistreerd en er een standaard desktopappbundel bestaat, probeert OpenClaw
ook de meegeleverde Codex-marketplace te registreren vanuit
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, waarbij
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` behouden blijft
als terugvaloptie voor verouderde zelfstandige installaties. Als de configuratie de
MCP-server nog steeds niet beschikbaar kan maken, mislukt de beurt voordat de thread begint.

Gebruik na het wijzigen van de Computer Use-configuratie `/new` of `/reset` in de betreffende
chat voordat u gaat testen als er al een bestaande Codex-thread is gestart.

Bij beheerd opstarten van Computer Use op macOS krijgt het binaire bestand van de desktopapp op
`/Applications/ChatGPT.app/Contents/Resources/codex` de voorkeur, waarna
wordt teruggevallen op `/Applications/Codex.app/Contents/Resources/codex` voor verouderde
zelfstandige installaties. Dit geldt ook voor eenmalige status- en
installatieopdrachten voor Computer Use die hun eigen client starten. Zo blijft desktopbesturing onder
de appbundel die de lokale macOS-machtigingen beheert. Als de desktopapp niet is
geïnstalleerd, valt OpenClaw terug op het beheerde binaire bestand van Codex dat naast de
plugin is geïnstalleerd. Normale beheerde Codex-beurten met de standaard geïsoleerde agenthome geven
eerst de voorkeur aan dat vastgezette pakket, zodat een oudere desktopapp de huidige modelondersteuning
niet kan overschaduwen. Homes met gebruikersbereik blijven de desktopapp voorrang geven, omdat ze native
Computer Use-status kunnen laden. Een geïsoleerde agenthome waarvan de effectieve Codex-configuratie
Computer Use inschakelt, blijft ook de desktopapp voorrang geven. Expliciete
`appServer.command`-configuratie of `OPENCLAW_CODEX_APP_SERVER_BIN` overschrijft
deze beheerde selectie nog steeds.

OpenClaw serialiseert native leesbewerkingen van de Codex-configuratie en de installatie van Computer Use
binnen één actieve Gateway. Een afzonderlijk Codex-proces of een andere Gateway maakt geen
deel uit van die afscherming. Start na het wijzigen van de native Codex-pluginconfiguratie buiten de
Gateway de Gateway opnieuw en start een nieuwe chat voordat u op de nieuwe
selectie vertrouwt.

## Opdrachten

Gebruik de opdrachten `/codex computer-use` vanaf elk chatoppervlak waar het
opdrachtoppervlak van de `codex`-plugin beschikbaar is. Dit zijn OpenClaw-chat-/runtime-
opdrachten, geen CLI-subopdrachten van `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` is de standaardactie en is alleen-lezen: deze voegt geen marketplace-
bronnen toe, installeert geen plugins en schakelt ondersteuning voor Codex-plugins niet in. Als Computer Use via geen enkele configuratie
is ingeschakeld, kan `status` uitgeschakeld melden, zelfs na een eenmalige
installatieopdracht.

`install` schakelt ondersteuning voor plugins van de Codex-app-server in, voegt optioneel een
geconfigureerde marketplacebron toe, installeert de geconfigureerde plugin of schakelt deze opnieuw in
via de Codex-app-server, laadt MCP-servers opnieuw en controleert of de MCP-
server tools beschikbaar stelt. Omdat de installatie vertrouwde hostbronnen wijzigt,
kan alleen een eigenaar of een Gateway-client met `operator.admin` `install` uitvoeren. Andere
geautoriseerde afzenders kunnen de alleen-lezenopdracht `status` blijven gebruiken,
ook met overschrijvingen.

Oudere releases accepteerden eenmalige identiteitoverschrijvingen met `--plugin`, `--server` en `--mcp-server`.
Configureer in plaats daarvan `computerUse.pluginName` en
`computerUse.mcpServerName` permanent. Wanneer een verouderde identiteitsvlag
wordt gebruikt, vermeldt de opdracht de exacte instelling die permanent moet worden opgeslagen en herhaalt deze
de gevraagde actie plus alle ondersteunde marketplacevlaggen in de migratie-instructies.

## Marketplacekeuzes

OpenClaw gebruikt dezelfde app-server-API die Codex zelf beschikbaar stelt. De
marketplacevelden bepalen waar Codex `computer-use` moet vinden.

| Veld                 | Gebruiken wanneer                                                  | Installatieondersteuning                                          |
| -------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Geen marketplaceveld | U wilt dat de Codex-app-server marketplaces gebruikt die deze al kent. | Ja, wanneer de app-server een lokale marketplace retourneert.     |
| `marketplaceSource`  | U hebt een Codex-marketplacebron die de app-server kan toevoegen.  | Ja, voor expliciete `/codex computer-use install`.                |
| `marketplacePath`    | U kent het lokale bestandspad van de marketplace op de host al.    | Ja, voor expliciete installatie en automatische installatie bij het starten van een beurt. |
| `marketplaceName`    | U wilt een reeds geregistreerde marketplace op naam selecteren.    | Alleen wanneer de geselecteerde marketplace een lokaal pad heeft. |

Nieuwe Codex-homes hebben mogelijk even tijd nodig om hun officiële
marketplaces te initialiseren. Tijdens de installatie peilt OpenClaw maximaal
`marketplaceDiscoveryTimeoutMs` milliseconden naar `plugin/list` (standaard 60 seconden).

Als meerdere bekende marketplaces Computer Use bevatten, geeft OpenClaw de voorkeur aan
`openai-bundled`, vervolgens `openai-curated` en daarna `local`. Onbekende dubbelzinnige
overeenkomsten worden uit veiligheid geweigerd en vragen u `marketplaceName` of
`marketplacePath` in te stellen.

## Meegeleverde macOS-marketplace

Huidige desktopbuilds van ChatGPT leveren Computer Use hier mee; verouderde zelfstandige
desktopbuilds van Codex gebruiken dezelfde indeling onder `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wanneer `computerUse.autoInstall` waar is en er geen marketplace met
`computer-use` is geregistreerd, probeert OpenClaw de eerste bestaande standaard
meegeleverde marketplaceroot toe te voegen:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

U kunt deze ook expliciet vanuit een shell registreren met Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Als u een niet-standaard pad voor de Codex-app gebruikt, voert u eenmaal `/codex computer-use install
--source <marketplace-root>` uit of stelt u `computerUse.marketplacePath` in op een
lokaal bestandspad van een marketplace. Gebruik `--marketplace-path` alleen wanneer u het
pad naar het JSON-bestand van de marketplace hebt, niet de root van de meegeleverde marketplace.

### Gedeelde plugincache

De standaardinstelling `pluginCacheMode: "independent"` laat elke Codex-home en de bijbehorende
plugincache onbeheerd. Stel `pluginCacheMode: "shared"` in om de meegeleverde
Computer Use-plugin vóór het opstarten van de app-server naar de detecteerbare plugincache
van de actieve Codex-home te kopiëren. De gedeelde modus behoudt oudere gecachete versies omdat
actieve Codex-clients nog steeds naar hun geversioneerde pluginmappen kunnen verwijzen; bij een
mislukte vervangende kopie blijft ook de actieve cache behouden. Expliciete configuratie van
`marketplaceName` of `marketplacePath` schakelt deze
afstemming uit, zodat OpenClaw die selectie niet overschrijft.

## Beperking van catalogi op afstand

De Codex-app-server kan catalogusvermeldingen die alleen op afstand beschikbaar zijn weergeven en lezen, maar ondersteunt
momenteel geen externe `plugin/install`. Dit betekent dat `marketplaceName`
een marketplace die alleen op afstand beschikbaar is kan selecteren voor statuscontroles, maar voor installaties en
opnieuw inschakelen nog steeds een lokale marketplace via `marketplaceSource` of
`marketplacePath` nodig is.

Als de status meldt dat de plugin beschikbaar is in een externe Codex-marketplace, maar
installatie op afstand niet wordt ondersteund, voert u de installatie uit met een lokale bron of een lokaal pad:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Configuratiereferentie

| Veld                            | Standaard      | Betekenis                                                                                 |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| `enabled`                       | afgeleid       | Computer Use vereisen. Is standaard true wanneer een ander Computer Use-veld is ingesteld. |
| `autoInstall`                   | false          | Installeren of opnieuw inschakelen vanuit reeds ontdekte marktplaatsen bij het begin van een beurt. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Hoelang de installatie wacht op marktplaatsdetectie door de Codex app-server.             |
| `liveTestTimeoutMs`             | 60000          | Time-out voor de tijdelijke gereedheids-thread en de bijbehorende opschoningsverzoeken.    |
| `toolCallTimeoutMs`             | 60000          | Time-out voor de gereedheidstoolaanroep `list_apps` van Computer Use.                     |
| `healthCheckEnabled`            | false          | Periodieke gereedheidscontroles uitvoeren terwijl de beherende app-serverclient actief is. |
| `healthCheckIntervalMinutes`    | 60             | Controlefrequentie; geaccepteerde waarden zijn 30, 60, 120 of 240 minuten.                |
| `pluginCacheMode`               | `independent`  | Gebruik `shared` om de Codex-home-cache te vernieuwen vanuit de meegeleverde desktopplugin. |
| `strictReadiness`               | false          | Het opstarten stoppen bij een mislukte livecontrole in plaats van door te gaan met een waarschuwing. |
| `autoRepair`                    | false          | Verouderde afgebakende MCP-subprocessen van Computer Use beëindigen en een mislukte controle eenmaal opnieuw proberen. |
| `marketplaceSource`             | niet ingesteld | Bronreeks die wordt doorgegeven aan `marketplace/add` van de Codex app-server.             |
| `marketplacePath`               | niet ingesteld | Lokaal bestandspad van de Codex-marktplaats die de plugin bevat.                           |
| `marketplaceName`               | niet ingesteld | Naam van de geregistreerde Codex-marktplaats die moet worden geselecteerd.                 |
| `pluginName`                    | `computer-use` | Naam van de plugin op de Codex-marktplaats.                                                |
| `mcpServerName`                 | `computer-use` | Naam van de MCP-server die door de geïnstalleerde plugin beschikbaar wordt gesteld.        |

Automatische installatie bij het begin van een beurt weigert bewust geconfigureerde
waarden voor `marketplaceSource`. Het toevoegen van een nieuwe bron is een expliciete
installatiehandeling. Gebruik daarom eenmaal
`/codex computer-use install --source <marketplace-source>` en laat daarna
`autoInstall` toekomstige herinschakelingen vanuit ontdekte lokale marktplaatsen
afhandelen. Automatische installatie bij het begin van een beurt kan een geconfigureerd
`marketplacePath` gebruiken, omdat dit al een lokaal pad op de host is.

Elk veld accepteert ook een overschrijving via een omgevingsvariabele, die wordt
gecontroleerd wanneer de bijbehorende configuratiesleutel niet is ingesteld:

| Veld                            | Omgevingsvariabele                                               |
| ------------------------------- | ---------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                    |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                       |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS`   |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`               |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`               |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`               |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`      |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                  |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                   |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                        |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`                 |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                   |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                   |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                        |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                    |

## Wat OpenClaw controleert

OpenClaw rapporteert intern een stabiele installatiereden en maakt de
gebruikersgerichte status voor de chat op:

| Reden                        | Betekenis                                                           | Volgende stap                                      |
| ---------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` is omgezet naar false.                        | Stel `enabled` of een ander Computer Use-veld in.  |
| `marketplace_missing`        | Er was geen overeenkomende marktplaats beschikbaar.                 | Configureer de bron, het pad of de marktplaatsnaam. |
| `plugin_not_installed`       | De marktplaats bestaat, maar de plugin is niet geïnstalleerd.       | Voer de installatie uit of schakel `autoInstall` in. |
| `plugin_disabled`            | De plugin is geïnstalleerd, maar uitgeschakeld in de Codex-configuratie. | Voer de installatie uit om deze opnieuw in te schakelen. |
| `remote_install_unsupported` | De geselecteerde marktplaats is uitsluitend extern beschikbaar.    | Gebruik `marketplaceSource` of `marketplacePath`.  |
| `mcp_missing`                | De plugin is ingeschakeld, maar de MCP-server is niet beschikbaar. | Controleer Codex Computer Use en de OS-machtigingen. |
| `ready`                      | De plugin en MCP-tools zijn beschikbaar.                            | Start de beurt in Codex-modus.                     |
| `check_failed`               | Een verzoek aan de Codex app-server is mislukt tijdens de statuscontrole. | Controleer de app-serververbinding en logboeken.   |
| `auto_install_blocked`       | De installatie bij het begin van de beurt zou een nieuwe bron moeten toevoegen. | Voer eerst een expliciete installatie uit.         |

De chatuitvoer bevat de pluginstatus, MCP-serverstatus, marktplaats,
tools indien beschikbaar en het specifieke bericht voor de mislukte
installatiestap.

## macOS-machtigingen

Computer Use is specifiek voor macOS. De MCP-server die door Codex wordt
beheerd, heeft mogelijk lokale OS-machtigingen nodig voordat deze apps kan
inspecteren of bedienen. Als OpenClaw meldt dat Computer Use is geïnstalleerd,
maar de MCP-server niet beschikbaar is, controleer dan eerst de
Computer Use-installatie aan de Codex-zijde:

- De Codex app-server draait op dezelfde host waarop de desktopbediening moet
  plaatsvinden.
- De Computer Use-plugin is ingeschakeld in de Codex-configuratie.
- De MCP-server `computer-use` verschijnt in de MCP-status van de Codex app-server.
- macOS heeft de vereiste machtigingen verleend aan de app voor desktopbediening.
- De huidige hostsessie heeft toegang tot het bureaublad dat wordt bediend.

OpenClaw stopt bewust veilig wanneer `computerUse.enabled` true is. Een
beurt in Codex-modus mag niet stilzwijgend doorgaan zonder de systeemeigen
desktoptools die door de configuratie worden vereist.

## Probleemoplossing

**De status meldt dat de plugin niet is geïnstalleerd.** Voer
`/codex computer-use install` uit. Als de marktplaats niet wordt ontdekt,
geef dan `--source` of `--marketplace-path` door.

**De status meldt dat de plugin is geïnstalleerd maar uitgeschakeld.** Voer
`/codex computer-use install` opnieuw uit. De installatie via de Codex
app-server schrijft de pluginconfiguratie terug als ingeschakeld.

**De status meldt dat externe installatie niet wordt ondersteund.** Gebruik
een lokale marktplaatsbron of een lokaal pad. Catalogusvermeldingen die
uitsluitend extern beschikbaar zijn, kunnen worden geïnspecteerd maar niet
via de huidige app-server-API worden geïnstalleerd.

**De status meldt dat de MCP-server niet beschikbaar is.** Voer de installatie
eenmaal opnieuw uit, zodat de MCP-servers opnieuw worden geladen. Als de server
niet beschikbaar blijft, herstel dan de Codex Computer Use-app, de MCP-status
van de Codex app-server of de macOS-machtigingen.

**De status of een controle loopt vast op `computer-use.list_apps`.** De plugin
en MCP-server zijn aanwezig, maar de lokale Computer Use-bridge heeft niet
geantwoord. Sluit of herstart Codex Computer Use, start zo nodig Codex Desktop
opnieuw en probeer het daarna opnieuw in een nieuwe OpenClaw-sessie. Als op de
host eerder Computer Use via een oudere beheerde Codex app-server werd
uitgevoerd, vernieuw dan de geïnstalleerde plugin vanuit de met de desktop
meegeleverde marktplaats (gebruik het pad van `Codex.app` voor zelfstandige
Codex-desktopinstallaties):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Een Computer Use-tool meldt `Native hook relay unavailable`.** De
systeemeigen toolhook van Codex kon geen actief OpenClaw-relais bereiken via
de lokale bridge of Gateway-terugval. Start een nieuwe OpenClaw-sessie met
`/new` of `/reset`. Als het eenmaal werkt en vervolgens bij een latere
toolaanroep opnieuw mislukt, wist `/new` alleen de huidige poging. Herstart de
Codex app-server of OpenClaw Gateway, zodat oude threads en hookregistraties
worden verwijderd, en probeer het daarna opnieuw in een nieuwe sessie.

**Automatische installatie bij het begin van een beurt weigert een bron.**
Dit is opzettelijk. Voeg de bron eerst expliciet toe met
`/codex computer-use install --source <marketplace-source>`. Daarna kan de
automatische installatie bij het begin van toekomstige beurten de ontdekte
lokale marktplaats gebruiken.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [Peekaboo-bridge](/nl/platforms/mac/peekaboo)
- [iOS-app](/nl/platforms/ios)
