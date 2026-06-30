---
read_when:
    - Je wilt dat OpenClaw-agenten in Codex-modus Codex Computer Use gebruiken
    - Je kiest tussen Codex Computer Use, PeekabooBridge en directe cua-driver MCP
    - Je kiest tussen Codex Computer Use en een directe cua-driver MCP-configuratie
    - Je configureert computerUse voor de gebundelde Codex-Plugin
    - Je lost problemen op met de status of installatie van /codex computer-use
summary: Stel Codex Computer Use in voor OpenClaw-agenten in Codex-modus
title: Codex-computergebruik
x-i18n:
    generated_at: "2026-06-30T14:12:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use is een Codex-native MCP-plugin voor lokale desktopbediening. OpenClaw
vendort de desktop-app niet, voert zelf geen desktopacties uit en omzeilt geen
Codex-machtigingen. De gebundelde `codex`-plugin bereidt alleen Codex app-server
voor: deze schakelt Codex-pluginondersteuning in, vindt of installeert de
geconfigureerde Codex Computer Use-plugin, controleert of de `computer-use`
MCP-server beschikbaar is en laat Codex daarna de native MCP-toolaanroepen
beheren tijdens Codex-modusbeurten.

Gebruik deze pagina wanneer OpenClaw al de native Codex-harness gebruikt. Zie
[Codex-harness](/nl/plugins/codex-harness) voor de runtime-installatie zelf.

## OpenClaw.app en Peekaboo

De Peekaboo-integratie van OpenClaw.app staat los van Codex Computer Use. De
macOS-app kan een PeekabooBridge-socket hosten zodat de `peekaboo` CLI de lokale
toestemmingen voor Toegankelijkheid en Schermopname van de app opnieuw kan
gebruiken voor Peekaboo's eigen automatiseringstools. Die bridge installeert of
proxyt Codex Computer Use niet, en Codex Computer Use roept niet aan via de
PeekabooBridge-socket.

Gebruik [Peekaboo-bridge](/nl/platforms/mac/peekaboo) wanneer je wilt dat
OpenClaw.app een machtigingsbewuste host is voor Peekaboo CLI-automatisering.
Gebruik deze pagina wanneer een OpenClaw-agent in Codex-modus de native
`computer-use` MCP-plugin van Codex beschikbaar moet hebben voordat de beurt
start.

## iOS-app

De iOS-app staat los van Codex Computer Use. Deze installeert of proxyt de Codex
`computer-use` MCP-server niet en is geen backend voor desktopbediening. In
plaats daarvan maakt de iOS-app verbinding als OpenClaw-node en stelt deze
mobiele mogelijkheden beschikbaar via node-opdrachten zoals `canvas.*`,
`camera.*`, `screen.*`, `location.*` en `talk.*`.

Gebruik [iOS](/nl/platforms/ios) wanneer je wilt dat een agent een iPhone-node via
de Gateway aanstuurt. Gebruik deze pagina wanneer een agent in Codex-modus de
lokale macOS-desktop moet bedienen via de native Computer Use-plugin van Codex.

## Directe cua-driver MCP

Codex Computer Use is niet de enige manier om desktopbediening beschikbaar te
maken. Als je wilt dat door OpenClaw beheerde runtimes TryCua's driver direct
aanroepen, gebruik dan de upstream `cua-driver mcp`-server via OpenClaw's
MCP-register in plaats van de Codex-specifieke marketplace-flow.

Vraag na het installeren van `cua-driver` om de OpenClaw-opdracht:

```bash
cua-driver mcp-config --client openclaw
```

of registreer de stdio-server zelf:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dat pad houdt het upstream MCP-tooloppervlak intact, inclusief de
driverschema's en gestructureerde MCP-antwoorden. Gebruik het wanneer je de
CUA-driver beschikbaar wilt maken als normale OpenClaw MCP-server. Gebruik de
Codex Computer Use-installatie op deze pagina wanneer Codex app-server de
plugininstallatie, MCP-herlaadacties en native toolaanroepen binnen
Codex-modusbeurten moet beheren.

De driver van CUA is macOS-specifiek en vereist nog steeds de lokale
macOS-machtigingen waar de app om vraagt, zoals Toegankelijkheid en
Schermopname. OpenClaw installeert `cua-driver` niet, verleent die machtigingen
niet en omzeilt het veiligheidsmodel van de upstream driver niet.

## Snelle installatie

Stel `plugins.entries.codex.config.computerUse` in wanneer Codex-modusbeurten
Computer Use beschikbaar moeten hebben voordat een thread start. `autoInstall:
true` meldt Computer Use aan en laat OpenClaw het installeren of opnieuw
inschakelen vóór de beurt:

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
      model: "openai/gpt-5.5",
    },
  },
}
```

Met deze configuratie controleert OpenClaw Codex app-server vóór elke
Codex-modusbeurt. Als Computer Use ontbreekt maar Codex app-server al een
installeerbare marketplace heeft ontdekt, vraagt OpenClaw Codex app-server om de
Plugin te installeren of opnieuw in te schakelen en MCP-servers opnieuw te
laden. Op macOS probeert OpenClaw, wanneer er geen overeenkomende marketplace is
geregistreerd en de standaard Codex-appbundel bestaat, ook de gebundelde Codex
marketplace te registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` voordat het
faalt. Als de installatie de MCP-server nog steeds niet beschikbaar kan maken,
mislukt de beurt voordat de thread start.

Gebruik na het wijzigen van de Computer Use-configuratie `/new` of `/reset` in
de betrokken chat voordat je test, als er al een bestaande Codex-thread is
gestart.

Bij door macOS beheerde stdio-start geeft OpenClaw de voorkeur aan de
ondertekende desktop-Codex-appbundel op
`/Applications/Codex.app/Contents/Resources/codex` wanneer die bestaat. Zo
blijft Computer Use onder de appbundel die eigenaar is van de lokale
machtigingen voor desktopbediening. Als de desktop-app niet is geïnstalleerd,
valt OpenClaw terug op de beheerde Codex-binary die naast de plugin is
geïnstalleerd. Als een geïnstalleerde desktop-app initialiseert met een niet
ondersteunde app-serverversie, sluit OpenClaw dat child-proces en probeert het
de volgende beheerde binary-kandidaat, in plaats van een verouderde desktop-app
de plugin-lokale fallback te laten overschaduwen. Expliciete
`appServer.command`-configuratie of `OPENCLAW_CODEX_APP_SERVER_BIN` overschrijft
deze beheerde selectie nog steeds.

## Opdrachten

Gebruik de `/codex computer-use`-opdrachten vanaf elk chatoppervlak waar het
opdrachtoppervlak van de `codex`-plugin beschikbaar is. Dit zijn OpenClaw
chat-/runtime-opdrachten, geen `openclaw codex ...` CLI-subopdrachten:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` is alleen-lezen. Deze voegt geen marketplace-bronnen toe, installeert
geen plugins en schakelt geen Codex-pluginondersteuning in. Als er geen
configuratie is die Computer Use aanmeldt, kan `status` uitgeschakeld melden,
zelfs na een eenmalige installatieopdracht.

`install` schakelt Codex app-server-pluginondersteuning in, voegt optioneel een
geconfigureerde marketplace-bron toe, installeert of schakelt de geconfigureerde
plugin opnieuw in via Codex app-server, laadt MCP-servers opnieuw en verifieert
dat de MCP-server tools beschikbaar maakt. Omdat installatie vertrouwde
hostbronnen wijzigt, kan alleen een eigenaar of een `operator.admin`
Gateway-client `install` uitvoeren. Andere geautoriseerde afzenders kunnen de
alleen-lezen opdracht `status` blijven gebruiken, ook met overschrijvingen.

## Marketplace-keuzes

OpenClaw gebruikt dezelfde app-server-API die Codex zelf beschikbaar stelt. De
marketplace-velden bepalen waar Codex `computer-use` moet vinden.

| Veld                 | Gebruik wanneer                                                  | Installatieondersteuning                                |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| Geen marketplace-veld | Je wilt dat Codex app-server marketplaces gebruikt die het al kent. | Ja, wanneer app-server een lokale marketplace retourneert. |
| `marketplaceSource`  | Je hebt een Codex marketplace-bron die app-server kan toevoegen. | Ja, voor expliciete `/codex computer-use install`.      |
| `marketplacePath`    | Je kent het lokale marketplace-bestandspad op de host al.        | Ja, voor expliciete installatie en automatische installatie bij beurtstart. |
| `marketplaceName`    | Je wilt één al geregistreerde marketplace op naam selecteren.    | Alleen ja wanneer de geselecteerde marketplace een lokaal pad heeft. |

Nieuwe Codex-homes hebben mogelijk een kort moment nodig om hun officiële
marketplaces te vullen. Tijdens de installatie pollt OpenClaw `plugin/list`
gedurende maximaal `marketplaceDiscoveryTimeoutMs` milliseconden. De standaard
is 60 seconden.

Als meerdere bekende marketplaces Computer Use bevatten, geeft OpenClaw de
voorkeur aan `openai-bundled`, daarna `openai-curated` en daarna `local`.
Onbekende dubbelzinnige matches falen gesloten en vragen je om
`marketplaceName` of `marketplacePath` in te stellen.

## Gebundelde macOS-marketplace

Recente Codex-desktopbuilds bundelen Computer Use hier:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wanneer `computerUse.autoInstall` waar is en er geen marketplace met
`computer-use` is geregistreerd, probeert OpenClaw automatisch de standaard
gebundelde marketplace-root toe te voegen:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Je kunt deze ook expliciet vanuit een shell registreren met Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Als je een niet-standaard Codex-apppad gebruikt, voer dan één keer `/codex
computer-use install --source <marketplace-root>` uit of stel
`computerUse.marketplacePath` in op een lokaal marketplace-bestandspad. Gebruik
`--marketplace-path` alleen wanneer je het marketplace JSON-bestandspad hebt,
niet de gebundelde marketplace-root.

## Limiet voor externe catalogus

Codex app-server kan catalogusvermeldingen die alleen extern zijn weergeven en
lezen, maar ondersteunt momenteel geen externe `plugin/install`. Dat betekent
dat `marketplaceName` een alleen-externe marketplace kan selecteren voor
statuscontroles, maar installaties en opnieuw inschakelen nog steeds een lokale
marketplace nodig hebben via `marketplaceSource` of `marketplacePath`.

Als status zegt dat de plugin beschikbaar is in een externe Codex marketplace
maar externe installatie niet wordt ondersteund, voer dan install uit met een
lokale bron of pad:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Configuratiereferentie

| Veld                            | Standaard      | Betekenis                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use vereisen. Staat standaard op waar wanneer een ander Computer Use-veld is ingesteld. |
| `autoInstall`                   | false          | Installeren of opnieuw inschakelen vanuit al ontdekte marketplaces bij beurtstart. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Hoelang install wacht op marketplace-detectie door Codex app-server.           |
| `marketplaceSource`             | unset          | Brontekst doorgegeven aan Codex app-server `marketplace/add`.                  |
| `marketplacePath`               | unset          | Lokaal Codex marketplace-bestandspad dat de plugin bevat.                      |
| `marketplaceName`               | unset          | Geregistreerde Codex marketplace-naam om te selecteren.                        |
| `pluginName`                    | `computer-use` | Codex marketplace-pluginnaam.                                                  |
| `mcpServerName`                 | `computer-use` | MCP-servernaam die door de geïnstalleerde plugin beschikbaar wordt gemaakt.    |

Automatische installatie bij beurtstart weigert bewust geconfigureerde
`marketplaceSource`-waarden. Het toevoegen van een nieuwe bron is een expliciete
installatiehandeling, dus gebruik één keer `/codex computer-use install --source
<marketplace-source>` en laat `autoInstall` daarna toekomstige herinschakelingen
afhandelen vanuit ontdekte lokale marketplaces. Automatische installatie bij
beurtstart kan een geconfigureerde `marketplacePath` gebruiken, omdat dat al een
lokaal pad op de host is.

## Wat OpenClaw controleert

OpenClaw rapporteert intern een stabiele installatiereden en formatteert de
gebruikersgerichte status voor chat:

| Reden                        | Betekenis                                              | Volgende stap                                 |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` is naar false opgelost.          | Stel `enabled` of een ander Computer Use-veld in. |
| `marketplace_missing`        | Er was geen overeenkomende marketplace beschikbaar.    | Configureer bron, pad of marketplace-naam.    |
| `plugin_not_installed`       | Marketplace bestaat, maar de Plugin is niet geinstalleerd. | Voer install uit of schakel `autoInstall` in. |
| `plugin_disabled`            | Plugin is geinstalleerd maar uitgeschakeld in de Codex-configuratie. | Voer install uit om deze opnieuw in te schakelen. |
| `remote_install_unsupported` | Geselecteerde marketplace is alleen remote.            | Gebruik `marketplaceSource` of `marketplacePath`. |
| `mcp_missing`                | Plugin is ingeschakeld, maar de MCP-server is niet beschikbaar. | Controleer Codex Computer Use en OS-machtigingen. |
| `ready`                      | Plugin en MCP-tools zijn beschikbaar.                  | Start de Codex-modusbeurt.                    |
| `check_failed`               | Een Codex app-server-aanvraag is mislukt tijdens de statuscontrole. | Controleer app-server-connectiviteit en logs. |
| `auto_install_blocked`       | De setup bij beurtstart zou een nieuwe bron moeten toevoegen. | Voer eerst een expliciete install uit.         |

De chatuitvoer bevat de Plugin-status, MCP-serverstatus, marketplace, tools
wanneer beschikbaar, en het specifieke bericht voor de mislukte setupstap.

## macOS-machtigingen

Computer Use is macOS-specifiek. De MCP-server die eigendom is van Codex kan lokale OS-
machtigingen nodig hebben voordat deze apps kan inspecteren of bedienen. Als OpenClaw zegt dat Computer Use
is geinstalleerd maar de MCP-server niet beschikbaar is, controleer dan eerst de Computer
Use-setup aan Codex-zijde:

- Codex app-server draait op dezelfde host waar desktopbediening moet
  plaatsvinden.
- De Computer Use-Plugin is ingeschakeld in de Codex-configuratie.
- De `computer-use` MCP-server verschijnt in de MCP-status van Codex app-server.
- macOS heeft de vereiste machtigingen verleend voor de desktopbedieningsapp.
- De huidige hostsessie heeft toegang tot de desktop die wordt bediend.

OpenClaw faalt bewust gesloten wanneer `computerUse.enabled` true is. Een
Codex-modusbeurt mag niet stilzwijgend doorgaan zonder de native desktoptools
die de configuratie vereiste.

## Probleemoplossing

**Status zegt niet geinstalleerd.** Voer `/codex computer-use install` uit. Als de
marketplace niet wordt ontdekt, geef dan `--source` of `--marketplace-path` mee.

**Status zegt geinstalleerd maar uitgeschakeld.** Voer `/codex computer-use install` opnieuw uit.
Codex app-server-install schrijft de Plugin-configuratie terug naar ingeschakeld.

**Status zegt dat remote-install niet wordt ondersteund.** Gebruik een lokale marketplace-bron of
-pad. Catalogusvermeldingen die alleen remote zijn, kunnen worden bekeken maar niet worden geinstalleerd via de
huidige app-server-API.

**Status zegt dat de MCP-server niet beschikbaar is.** Voer install eenmaal opnieuw uit zodat MCP-
servers herladen. Als deze niet beschikbaar blijft, herstel dan de Codex Computer Use-app,
de MCP-status van Codex app-server of macOS-machtigingen.

**Status of een probe krijgt een time-out op `computer-use.list_apps`.** De Plugin en MCP-
server zijn aanwezig, maar de lokale Computer Use-bridge heeft niet geantwoord. Sluit of
herstart Codex Computer Use, start Codex Desktop indien nodig opnieuw en probeer het daarna opnieuw in een
nieuwe OpenClaw-sessie. Als de host eerder Computer Use uitvoerde via een oudere
beheerde Codex app-server, vernieuw dan de geinstalleerde Plugin vanuit de gebundelde desktop-
marketplace:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Een Computer Use-tool zegt `Native hook relay unavailable`.** De Codex-native
toolhook kon geen actieve OpenClaw-relay bereiken via de lokale bridge of
Gateway-fallback. Start een nieuwe OpenClaw-sessie met `/new` of `/reset`. Als het
eenmaal werkt en daarna opnieuw mislukt bij een latere toolaanroep, wist `/new` alleen de
huidige poging; herstart de Codex app-server of OpenClaw Gateway zodat oude threads
en hookregistraties worden verwijderd, en probeer het daarna opnieuw in een nieuwe sessie.

**Automatische install bij beurtstart weigert een bron.** Dit is opzettelijk. Voeg eerst de
bron toe met expliciet `/codex computer-use install --source <marketplace-source>`;
daarna kan toekomstige automatische install bij beurtstart de ontdekte lokale
marketplace gebruiken.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [Peekaboo-bridge](/nl/platforms/mac/peekaboo)
- [iOS-app](/nl/platforms/ios)
