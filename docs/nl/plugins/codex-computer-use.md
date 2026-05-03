---
read_when:
    - Je wilt dat OpenClaw-agents in Codex-modus Codex Computer Use gebruiken
    - Je kiest tussen Codex Computer Use, PeekabooBridge en rechtstreekse cua-driver MCP
    - Je kiest tussen Codex Computer Use en een directe cua-driver MCP-configuratie
    - Je configureert computerUse voor de gebundelde Codex Plugin
    - Je lost problemen op met de status of installatie van /codex computer-use
summary: Codex Computer Use instellen voor OpenClaw-agents in Codex-modus
title: Codex-computergebruik
x-i18n:
    generated_at: "2026-05-03T11:12:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use is een Codex-native MCP-plugin voor lokale desktopbesturing. OpenClaw
bundelt de desktopapp niet, voert zelf geen desktopacties uit en omzeilt geen
Codex-machtigingen. De gebundelde `codex`-plugin bereidt alleen Codex app-server
voor: deze schakelt Codex-pluginondersteuning in, vindt of installeert de
geconfigureerde Codex Computer Use-plugin, controleert of de `computer-use`
MCP-server beschikbaar is, en laat Codex daarna de native MCP-toolaanroepen
beheren tijdens beurten in Codex-modus.

Gebruik deze pagina wanneer OpenClaw al de native Codex-harness gebruikt. Zie
voor de runtime-installatie zelf [Codex-harness](/nl/plugins/codex-harness).

## OpenClaw.app en Peekaboo

De Peekaboo-integratie van OpenClaw.app staat los van Codex Computer Use. De
macOS-app kan een PeekabooBridge-socket hosten zodat de `peekaboo` CLI de lokale
machtigingen van de app voor Toegankelijkheid en Schermopname opnieuw kan
gebruiken voor de eigen automatiseringstools van Peekaboo. Die bridge
installeert of proxyt Codex Computer Use niet, en Codex Computer Use roept niets
aan via de PeekabooBridge-socket.

Gebruik [Peekaboo-bridge](/nl/platforms/mac/peekaboo) wanneer je wilt dat
OpenClaw.app een machtigingsbewuste host is voor Peekaboo CLI-automatisering.
Gebruik deze pagina wanneer een OpenClaw-agent in Codex-modus de native
`computer-use` MCP-plugin van Codex beschikbaar moet hebben voordat de beurt
begint.

## iOS-app

De iOS-app staat los van Codex Computer Use. Deze installeert of proxyt de Codex
`computer-use` MCP-server niet en is geen backend voor desktopbesturing. In
plaats daarvan maakt de iOS-app verbinding als een OpenClaw-node en stelt deze
mobiele mogelijkheden beschikbaar via node-opdrachten zoals `canvas.*`,
`camera.*`, `screen.*`, `location.*` en `talk.*`.

Gebruik [iOS](/nl/platforms/ios) wanneer je wilt dat een agent een iPhone-node via
de Gateway aanstuurt. Gebruik deze pagina wanneer een agent in Codex-modus de
lokale macOS-desktop moet besturen via de native Computer Use-plugin van Codex.

## Directe cua-driver MCP

Codex Computer Use is niet de enige manier om desktopbesturing beschikbaar te
maken. Als je wilt dat door OpenClaw beheerde runtimes TryCua's driver
rechtstreeks aanroepen, gebruik dan de upstream `cua-driver mcp`-server via het
MCP-register van OpenClaw in plaats van de Codex-specifieke marktplaatsstroom.

Vraag na installatie van `cua-driver` om de OpenClaw-opdracht:

```bash
cua-driver mcp-config --client openclaw
```

of registreer de stdio-server zelf:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dat pad houdt het upstream MCP-tooloppervlak intact, inclusief de
driverschema's en gestructureerde MCP-responses. Gebruik dit wanneer je de
CUA-driver beschikbaar wilt maken als een normale OpenClaw MCP-server. Gebruik
de Codex Computer Use-installatie op deze pagina wanneer Codex app-server
plugininstallatie, MCP-herlaadacties en native toolaanroepen binnen beurten in
Codex-modus moet beheren.

De CUA-driver is macOS-specifiek en vereist nog steeds de lokale
macOS-machtigingen waar de app om vraagt, zoals Toegankelijkheid en
Schermopname. OpenClaw installeert `cua-driver` niet, verleent die machtigingen
niet en omzeilt het veiligheidsmodel van de upstream driver niet.

## Snelle installatie

Stel `plugins.entries.codex.config.computerUse` in wanneer beurten in
Codex-modus Computer Use beschikbaar moeten hebben voordat een thread begint:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Met deze configuratie controleert OpenClaw Codex app-server vóór elke beurt in
Codex-modus. Als Computer Use ontbreekt maar Codex app-server al een
installeerbare marktplaats heeft ontdekt, vraagt OpenClaw Codex app-server om
de plugin te installeren of opnieuw in te schakelen en MCP-servers opnieuw te
laden. Op macOS probeert OpenClaw, wanneer er geen overeenkomende marktplaats is
geregistreerd en de standaard Codex-appbundel bestaat, ook de gebundelde
Codex-marktplaats te registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` voordat het
faalt. Als de installatie de MCP-server nog steeds niet beschikbaar kan maken,
faalt de beurt voordat de thread begint.

Bestaande sessies behouden hun runtime en Codex-threadbinding. Gebruik na het
wijzigen van `agentRuntime` of de Computer Use-configuratie `/new` of `/reset`
in de betreffende chat voordat je test.

## Opdrachten

Gebruik de `/codex computer-use`-opdrachten vanaf elk chatoppervlak waar het
opdrachtoppervlak van de `codex`-plugin beschikbaar is. Dit zijn
OpenClaw-chat-/runtimeopdrachten, geen `openclaw codex ...` CLI-subopdrachten:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` is alleen-lezen. Het voegt geen marktplaatsbronnen toe, installeert
geen plugins en schakelt geen Codex-pluginondersteuning in.

`install` schakelt pluginondersteuning in Codex app-server in, voegt optioneel
een geconfigureerde marktplaatsbron toe, installeert of schakelt de
geconfigureerde plugin opnieuw in via Codex app-server, laadt MCP-servers
opnieuw en verifieert dat de MCP-server tools beschikbaar stelt.

## Marktplaatskeuzes

OpenClaw gebruikt dezelfde app-server-API die Codex zelf beschikbaar stelt. De
marktplaatsvelden kiezen waar Codex `computer-use` moet vinden.

| Veld                 | Gebruik wanneer                                                | Installatieondersteuning                                 |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| Geen marktplaatsveld | Je wilt dat Codex app-server marktplaatsen gebruikt die deze al kent. | Ja, wanneer app-server een lokale marktplaats retourneert. |
| `marketplaceSource`  | Je hebt een Codex-marktplaatsbron die app-server kan toevoegen. | Ja, voor expliciete `/codex computer-use install`.       |
| `marketplacePath`    | Je kent het lokale marktplaatsbestandspad op de host al.       | Ja, voor expliciete installatie en automatische installatie bij beurtstart. |
| `marketplaceName`    | Je wilt één al geregistreerde marktplaats op naam selecteren.  | Alleen ja wanneer de geselecteerde marktplaats een lokaal pad heeft. |

Nieuwe Codex-homes hebben mogelijk kort de tijd nodig om hun officiële
marktplaatsen te initialiseren. Tijdens installatie pollt OpenClaw `plugin/list`
maximaal `marketplaceDiscoveryTimeoutMs` milliseconden. De standaardwaarde is 60
seconden.

Als meerdere bekende marktplaatsen Computer Use bevatten, geeft OpenClaw de
voorkeur aan `openai-bundled`, daarna `openai-curated` en daarna `local`.
Onbekende dubbelzinnige overeenkomsten falen gesloten en vragen je om
`marketplaceName` of `marketplacePath` in te stellen.

## Gebundelde macOS-marktplaats

Recente Codex-desktopbuilds bundelen Computer Use hier:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wanneer `computerUse.autoInstall` true is en er geen marktplaats met
`computer-use` is geregistreerd, probeert OpenClaw automatisch de standaard
gebundelde marktplaatsroot toe te voegen:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Je kunt deze ook expliciet vanuit een shell registreren met Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Als je een niet-standaard Codex-apppad gebruikt, stel dan
`computerUse.marketplacePath` in op een lokaal marktplaatsbestandspad of voer
één keer `/codex computer-use install --source <marketplace-source>` uit.

## Limiet van externe catalogus

Codex app-server kan externe-only catalogusitems weergeven en lezen, maar
ondersteunt momenteel geen externe `plugin/install`. Dat betekent dat
`marketplaceName` een externe-only marktplaats kan selecteren voor
statuscontroles, maar installaties en opnieuw inschakelen hebben nog steeds een
lokale marktplaats nodig via `marketplaceSource` of `marketplacePath`.

Als de status zegt dat de plugin beschikbaar is in een externe
Codex-marktplaats maar externe installatie niet wordt ondersteund, voer dan
install uit met een lokale bron of lokaal pad:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Configuratiereferentie

| Veld                            | Standaard      | Betekenis                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | afgeleid       | Computer Use vereisen. Standaard true wanneer een ander Computer Use-veld is ingesteld. |
| `autoInstall`                   | false          | Installeer of schakel opnieuw in vanuit al ontdekte marktplaatsen bij beurtstart. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Hoe lang install wacht op marktplaatsontdekking door Codex app-server.         |
| `marketplaceSource`             | niet ingesteld | Brontekst die wordt doorgegeven aan Codex app-server `marketplace/add`.        |
| `marketplacePath`               | niet ingesteld | Lokaal Codex-marktplaatsbestandspad dat de plugin bevat.                       |
| `marketplaceName`               | niet ingesteld | Geregistreerde Codex-marktplaatsnaam om te selecteren.                         |
| `pluginName`                    | `computer-use` | Pluginnaam in de Codex-marktplaats.                                            |
| `mcpServerName`                 | `computer-use` | MCP-servernaam die door de geïnstalleerde plugin wordt beschikbaar gesteld.    |

Automatische installatie bij beurtstart weigert bewust geconfigureerde
`marketplaceSource`-waarden. Het toevoegen van een nieuwe bron is een expliciete
installatiehandeling, dus gebruik één keer `/codex computer-use install --source
<marketplace-source>` en laat `autoInstall` daarna toekomstige herinschakelingen
afhandelen vanuit ontdekte lokale marktplaatsen. Automatische installatie bij
beurtstart kan een geconfigureerde `marketplacePath` gebruiken, omdat dat al een
lokaal pad op de host is.

## Wat OpenClaw controleert

OpenClaw rapporteert intern een stabiele installatiereden en formatteert de
gebruikersgerichte status voor chat:

| Reden                        | Betekenis                                             | Volgende stap                                  |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` is opgelost naar false.         | Stel `enabled` of een ander Computer Use-veld in. |
| `marketplace_missing`        | Er was geen overeenkomende marktplaats beschikbaar.   | Configureer bron, pad of marktplaatsnaam.     |
| `plugin_not_installed`       | Marktplaats bestaat, maar de plugin is niet geïnstalleerd. | Voer install uit of schakel `autoInstall` in. |
| `plugin_disabled`            | Plugin is geïnstalleerd maar uitgeschakeld in Codex-configuratie. | Voer install uit om deze opnieuw in te schakelen. |
| `remote_install_unsupported` | Geselecteerde marktplaats is externe-only.            | Gebruik `marketplaceSource` of `marketplacePath`. |
| `mcp_missing`                | Plugin is ingeschakeld, maar de MCP-server is niet beschikbaar. | Controleer Codex Computer Use en OS-machtigingen. |
| `ready`                      | Plugin en MCP-tools zijn beschikbaar.                 | Start de beurt in Codex-modus.                |
| `check_failed`               | Een Codex app-server-aanvraag is mislukt tijdens de statuscontrole. | Controleer app-serverconnectiviteit en logs.  |
| `auto_install_blocked`       | Installatie bij beurtstart zou een nieuwe bron moeten toevoegen. | Voer eerst expliciete install uit.            |

De chatuitvoer bevat de pluginstatus, MCP-serverstatus, marktplaats, tools
wanneer beschikbaar, en het specifieke bericht voor de falende installatiestap.

## macOS-machtigingen

Computer Use is macOS-specifiek. De door Codex beheerde MCP-server heeft
mogelijk lokale OS-machtigingen nodig voordat deze apps kan inspecteren of
besturen. Als OpenClaw zegt dat Computer Use is geïnstalleerd maar de MCP-server
niet beschikbaar is, verifieer dan eerst de Computer Use-installatie aan de
Codex-kant:

- Codex app-server draait op dezelfde host waar desktopbediening moet
  plaatsvinden.
- De Computer Use Plugin is ingeschakeld in de Codex-configuratie.
- De `computer-use` MCP-server verschijnt in de MCP-status van Codex app-server.
- macOS heeft de vereiste machtigingen verleend voor de desktopbedieningsapp.
- De huidige hostsessie heeft toegang tot de desktop die wordt bediend.

OpenClaw faalt bewust gesloten wanneer `computerUse.enabled` true is. Een
beurt in Codex-modus mag niet stilzwijgend doorgaan zonder de native
desktoptools die door de configuratie zijn vereist.

## Problemen oplossen

**Status zegt dat het niet is geinstalleerd.** Voer `/codex computer-use install` uit. Als de
marketplace niet wordt gevonden, geef dan `--source` of `--marketplace-path` door.

**Status zegt dat het is geinstalleerd maar uitgeschakeld.** Voer `/codex computer-use install` opnieuw uit.
De installatie van Codex app-server schrijft de Plugin-configuratie terug als ingeschakeld.

**Status zegt dat installatie op afstand niet wordt ondersteund.** Gebruik een lokale marketplace-bron of
pad. Catalogusvermeldingen die alleen op afstand beschikbaar zijn, kunnen worden geinspecteerd maar niet geinstalleerd via de
huidige app-server-API.

**Status zegt dat de MCP-server niet beschikbaar is.** Voer de installatie nog een keer opnieuw uit zodat MCP-
servers opnieuw laden. Als deze onbeschikbaar blijft, herstel dan de Codex Computer Use-app,
de MCP-status van Codex app-server of de macOS-machtigingen.

**Status of een probe verloopt met een time-out op `computer-use.list_apps`.** De Plugin en MCP-
server zijn aanwezig, maar de lokale Computer Use-bridge heeft niet geantwoord. Sluit of
herstart Codex Computer Use, start Codex Desktop zo nodig opnieuw, en probeer het daarna opnieuw in een
nieuwe OpenClaw-sessie.

**Een Computer Use-tool zegt `Native hook relay unavailable`.** De Codex-native
toolhook kon geen actieve OpenClaw-relay bereiken via de lokale bridge of
Gateway-fallback. Start een nieuwe OpenClaw-sessie met `/new` of `/reset`. Als dit
blijft gebeuren, herstart dan de Gateway zodat oude app-server-threads en hook-
registraties worden verwijderd, en probeer het opnieuw.

**Automatische installatie bij het begin van een beurt weigert een bron.** Dit is opzettelijk. Voeg de
bron eerst toe met expliciet `/codex computer-use install --source <marketplace-source>`;
daarna kan toekomstige automatische installatie bij het begin van een beurt de gevonden lokale
marketplace gebruiken.
