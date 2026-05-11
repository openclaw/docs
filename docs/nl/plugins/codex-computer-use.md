---
read_when:
    - Je wilt dat OpenClaw-agenten in Codex-modus Codex Computer Use gebruiken
    - Je kiest tussen Codex Computer Use, PeekabooBridge en directe cua-driver MCP
    - Je maakt een keuze tussen Codex Computer Use en een directe cua-driver-MCP-configuratie
    - Je configureert computerUse voor de meegeleverde Codex-Plugin
    - Je lost problemen op met de status of installatie van /codex computer-use
summary: Codex Computer Use instellen voor OpenClaw-agents in Codex-modus
title: Codex-computergebruik
x-i18n:
    generated_at: "2026-05-11T20:38:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use is een Codex-native MCP-Plugin voor lokale desktopbesturing. OpenClaw
levert de desktop-app niet mee, voert zelf geen desktopacties uit en omzeilt
Codex-machtigingen niet. De gebundelde `codex`-Plugin bereidt alleen Codex app-server voor:
deze schakelt ondersteuning voor Codex-Plugins in, vindt of installeert de geconfigureerde Codex
Computer Use-Plugin, controleert of de `computer-use` MCP-server beschikbaar is, en
laat Codex vervolgens eigenaar zijn van de native MCP-toolaanroepen tijdens Codex-modusbeurten.

Gebruik deze pagina wanneer OpenClaw al de native Codex-harness gebruikt. Zie
[Codex-harness](/nl/plugins/codex-harness) voor de runtimeconfiguratie zelf.

## OpenClaw.app en Peekaboo

De Peekaboo-integratie van OpenClaw.app staat los van Codex Computer Use. De
macOS-app kan een PeekabooBridge-socket hosten, zodat de `peekaboo` CLI de
lokale toegankelijkheids- en schermopnamemachtigingen van de app kan hergebruiken voor
de eigen automatiseringstools van Peekaboo. Die bridge installeert of proxyt Codex Computer Use niet, en
Codex Computer Use roept niet aan via de PeekabooBridge-socket.

Gebruik [Peekaboo-bridge](/nl/platforms/mac/peekaboo) wanneer je wilt dat OpenClaw.app
een machtigingsbewuste host is voor Peekaboo CLI-automatisering. Gebruik deze pagina wanneer een
OpenClaw-agent in Codex-modus de native `computer-use` MCP-Plugin van Codex
beschikbaar moet hebben voordat de beurt begint.

## iOS-app

De iOS-app staat los van Codex Computer Use. Deze installeert of proxyt
de Codex `computer-use` MCP-server niet en is geen backend voor desktopbesturing.
In plaats daarvan verbindt de iOS-app als een OpenClaw-Node en stelt mobiele
mogelijkheden beschikbaar via Node-opdrachten zoals `canvas.*`, `camera.*`, `screen.*`,
`location.*` en `talk.*`.

Gebruik [iOS](/nl/platforms/ios) wanneer je wilt dat een agent een iPhone-Node aanstuurt via
de Gateway. Gebruik deze pagina wanneer een agent in Codex-modus de lokale
macOS-desktop moet besturen via de native Computer Use-Plugin van Codex.

## Directe cua-driver MCP

Codex Computer Use is niet de enige manier om desktopbesturing beschikbaar te maken. Als je wilt
dat door OpenClaw beheerde runtimes de driver van TryCua rechtstreeks aanroepen, gebruik dan de upstream
`cua-driver mcp`-server via het MCP-register van OpenClaw in plaats van de
Codex-specifieke marketplace-flow.

Vraag na installatie van `cua-driver` om de OpenClaw-opdracht:

```bash
cua-driver mcp-config --client openclaw
```

of registreer de stdio-server zelf:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dat pad houdt het upstream MCP-tooloppervlak intact, inclusief de driverschema's
en gestructureerde MCP-responsen. Gebruik dit wanneer je wilt dat de CUA-driver
beschikbaar is als een normale OpenClaw MCP-server. Gebruik de Codex Computer Use-configuratie op
deze pagina wanneer Codex app-server Plugin-installatie, MCP-herladingen
en native toolaanroepen binnen Codex-modusbeurten moet beheren.

De driver van CUA is macOS-specifiek en vereist nog steeds de lokale macOS-machtigingen
waar de app om vraagt, zoals Toegankelijkheid en Schermopname. OpenClaw
installeert `cua-driver` niet, verleent die machtigingen niet en omzeilt het veiligheidsmodel
van de upstream driver niet.

## Snelle configuratie

Stel `plugins.entries.codex.config.computerUse` in wanneer Codex-modusbeurten
Computer Use beschikbaar moeten hebben voordat een thread begint:

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

Met deze configuratie controleert OpenClaw Codex app-server vóór elke Codex-modusbeurt.
Als Computer Use ontbreekt maar Codex app-server al een
installeerbare marketplace heeft ontdekt, vraagt OpenClaw Codex app-server om
de Plugin te installeren of opnieuw in te schakelen en MCP-servers opnieuw te laden. Op macOS, wanneer geen overeenkomende marketplace is
geregistreerd en de standaard Codex-appbundel bestaat, probeert OpenClaw ook de
gebundelde Codex-marketplace te registreren vanaf
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` voordat het
mislukt. Als de configuratie de MCP-server nog steeds niet beschikbaar kan maken, mislukt de beurt
voordat de thread begint.

Gebruik na het wijzigen van de Computer Use-configuratie `/new` of `/reset` in de betrokken chat
voordat je test als er al een bestaande Codex-thread is gestart.

## Opdrachten

Gebruik de `/codex computer-use`-opdrachten vanaf elk chatoppervlak waar het
Plugin-opdrachtoppervlak van `codex` beschikbaar is. Dit zijn OpenClaw-chat/runtime-opdrachten,
geen `openclaw codex ...` CLI-subopdrachten:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` is alleen-lezen. Deze voegt geen marketplace-bronnen toe, installeert geen Plugins en
schakelt ondersteuning voor Codex-Plugins niet in.

`install` schakelt ondersteuning voor Codex app-server-Plugins in, voegt optioneel een geconfigureerde
marketplace-bron toe, installeert of schakelt de geconfigureerde Plugin opnieuw in via Codex
app-server, laadt MCP-servers opnieuw en verifieert dat de MCP-server tools beschikbaar stelt.

## Marketplace-keuzes

OpenClaw gebruikt dezelfde app-server-API die Codex zelf beschikbaar stelt. De
marketplace-velden kiezen waar Codex `computer-use` moet vinden.

| Veld                 | Gebruik wanneer                                                  | Installatieondersteuning                              |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| Geen marketplace-veld | Je wilt dat Codex app-server marketplaces gebruikt die het al kent. | Ja, wanneer app-server een lokale marketplace retourneert. |
| `marketplaceSource`  | Je hebt een Codex-marketplace-bron die app-server kan toevoegen. | Ja, voor expliciete `/codex computer-use install`.    |
| `marketplacePath`    | Je kent het lokale marketplace-bestandspad op de host al.        | Ja, voor expliciete installatie en auto-install bij beurtstart. |
| `marketplaceName`    | Je wilt één al geregistreerde marketplace selecteren op naam.    | Alleen ja wanneer de geselecteerde marketplace een lokaal pad heeft. |

Nieuwe Codex-homes hebben mogelijk een kort moment nodig om hun officiële marketplaces te seeden.
Tijdens installatie pollt OpenClaw `plugin/list` maximaal
`marketplaceDiscoveryTimeoutMs` milliseconden. De standaardwaarde is 60 seconden.

Als meerdere bekende marketplaces Computer Use bevatten, geeft OpenClaw de voorkeur aan
`openai-bundled`, daarna `openai-curated` en daarna `local`. Onbekende dubbelzinnige matches
falen gesloten en vragen je `marketplaceName` of `marketplacePath` in te stellen.

## Gebundelde macOS-marketplace

Recente Codex-desktopbuilds bundelen Computer Use hier:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Wanneer `computerUse.autoInstall` true is en er geen marketplace met
`computer-use` is geregistreerd, probeert OpenClaw automatisch de standaard gebundelde
marketplace-root toe te voegen:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Je kunt deze ook expliciet registreren vanuit een shell met Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Als je een niet-standaard Codex-apppad gebruikt, stel dan `computerUse.marketplacePath` in op een
lokaal marketplace-bestandspad of voer `/codex computer-use install --source
<marketplace-source>` één keer uit.

## Limiet voor externe catalogus

Codex app-server kan alleen-externe catalogusitems weergeven en lezen, maar ondersteunt momenteel geen
externe `plugin/install`. Dat betekent dat `marketplaceName`
een alleen-externe marketplace kan selecteren voor statuscontroles, maar installaties en opnieuw inschakelen
nog steeds een lokale marketplace via `marketplaceSource` of `marketplacePath` nodig hebben.

Als status zegt dat de Plugin beschikbaar is in een externe Codex-marketplace maar externe
installatie niet wordt ondersteund, voer install uit met een lokale bron of lokaal pad:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Configuratiereferentie

| Veld                            | Standaard      | Betekenis                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | afgeleid       | Vereis Computer Use. Staat standaard op true wanneer een ander Computer Use-veld is ingesteld. |
| `autoInstall`                   | false          | Installeer of schakel opnieuw in vanuit al ontdekte marketplaces bij beurtstart. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Hoelang install wacht op marketplace-ontdekking door Codex app-server.         |
| `marketplaceSource`             | niet ingesteld | Brontekenreeks die wordt doorgegeven aan Codex app-server `marketplace/add`.   |
| `marketplacePath`               | niet ingesteld | Lokaal Codex-marketplace-bestandspad dat de Plugin bevat.                      |
| `marketplaceName`               | niet ingesteld | Geregistreerde Codex-marketplace-naam om te selecteren.                        |
| `pluginName`                    | `computer-use` | Codex-marketplace-Pluginnaam.                                                  |
| `mcpServerName`                 | `computer-use` | MCP-servernaam die door de geïnstalleerde Plugin wordt blootgesteld.           |

Auto-install bij beurtstart weigert bewust geconfigureerde `marketplaceSource`-waarden.
Een nieuwe bron toevoegen is een expliciete configuratiebewerking, dus gebruik
`/codex computer-use install --source <marketplace-source>` één keer en laat daarna
`autoInstall` toekomstige herinschakelingen afhandelen vanuit ontdekte lokale marketplaces.
Auto-install bij beurtstart kan een geconfigureerde `marketplacePath` gebruiken, omdat dat
al een lokaal pad op de host is.

## Wat OpenClaw controleert

OpenClaw rapporteert intern een stabiele configuratiereden en formatteert de gebruikersgerichte
status voor chat:

| Reden                        | Betekenis                                             | Volgende stap                                  |
| ---------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `disabled`                   | `computerUse.enabled` is opgelost naar false.         | Stel `enabled` of een ander Computer Use-veld in. |
| `marketplace_missing`        | Er was geen overeenkomende marketplace beschikbaar.   | Configureer bron, pad of marketplace-naam.     |
| `plugin_not_installed`       | Marketplace bestaat, maar de Plugin is niet geïnstalleerd. | Voer install uit of schakel `autoInstall` in. |
| `plugin_disabled`            | Plugin is geïnstalleerd maar uitgeschakeld in Codex-configuratie. | Voer install uit om deze opnieuw in te schakelen. |
| `remote_install_unsupported` | Geselecteerde marketplace is alleen extern.           | Gebruik `marketplaceSource` of `marketplacePath`. |
| `mcp_missing`                | Plugin is ingeschakeld, maar de MCP-server is niet beschikbaar. | Controleer Codex Computer Use en OS-machtigingen. |
| `ready`                      | Plugin en MCP-tools zijn beschikbaar.                 | Start de Codex-modusbeurt.                    |
| `check_failed`               | Een Codex app-server-aanvraag is mislukt tijdens de statuscontrole. | Controleer app-serverconnectiviteit en logs. |
| `auto_install_blocked`       | Configuratie bij beurtstart zou een nieuwe bron moeten toevoegen. | Voer eerst expliciet install uit.             |

De chatuitvoer bevat de Pluginstatus, MCP-serverstatus, marketplace, tools
wanneer beschikbaar, en het specifieke bericht voor de mislukte configuratiestap.

## macOS-machtigingen

Computer Use is macOS-specifiek. De door Codex beheerde MCP-server heeft mogelijk lokale OS-
machtigingen nodig voordat deze apps kan inspecteren of besturen. Als OpenClaw zegt dat Computer Use
is geïnstalleerd maar de MCP-server niet beschikbaar is, verifieer dan eerst de Codex-zijdige Computer
Use-configuratie:

- Codex app-server draait op dezelfde host waar desktopbesturing moet
  plaatsvinden.
- De Computer Use Plugin is ingeschakeld in de Codex-configuratie.
- De `computer-use` MCP-server verschijnt in de MCP-status van Codex app-server.
- macOS heeft de vereiste machtigingen verleend voor de desktopbesturingsapp.
- De huidige hostsessie heeft toegang tot de desktop die wordt bestuurd.

OpenClaw faalt bewust gesloten wanneer `computerUse.enabled` true is. Een
Codex-modusbeurt mag niet stilzwijgend doorgaan zonder de native desktoptools
die de configuratie vereist.

## Probleemoplossing

**Status zegt dat het niet is geïnstalleerd.** Voer `/codex computer-use install` uit. Als de
marktplaats niet wordt gevonden, geef dan `--source` of `--marketplace-path` door.

**Status zegt dat het is geïnstalleerd maar uitgeschakeld.** Voer `/codex computer-use install` opnieuw uit.
De installatie van Codex app-server schrijft de Plugin-configuratie terug naar ingeschakeld.

**Status zegt dat installatie op afstand niet wordt ondersteund.** Gebruik een lokale marktplaatsbron of
-pad. Catalogusvermeldingen die alleen op afstand beschikbaar zijn, kunnen worden geïnspecteerd maar niet geïnstalleerd via de
huidige app-server-API.

**Status zegt dat de MCP-server niet beschikbaar is.** Voer de installatie nog één keer opnieuw uit zodat MCP-
servers opnieuw laden. Als deze niet beschikbaar blijft, herstel dan de Codex Computer Use-app,
de MCP-status van Codex app-server of de macOS-machtigingen.

**Status of een probe loopt vast op `computer-use.list_apps`.** De Plugin en MCP-
server zijn aanwezig, maar de lokale Computer Use-bridge heeft niet geantwoord. Sluit of
herstart Codex Computer Use, start Codex Desktop opnieuw indien nodig en probeer het daarna opnieuw in een
nieuwe OpenClaw-sessie.

**Een Computer Use-tool zegt `Native hook relay unavailable`.** De Codex-native
tool-hook kon geen actieve OpenClaw-relay bereiken via de lokale bridge of
Gateway-fallback. Start een nieuwe OpenClaw-sessie met `/new` of `/reset`. Als dit
blijft gebeuren, herstart dan de gateway zodat oude app-server-threads en hook-
registraties worden verwijderd, en probeer het daarna opnieuw.

**Automatische installatie bij het begin van een beurt weigert een bron.** Dit is opzettelijk. Voeg de
bron eerst toe met expliciet `/codex computer-use install --source <marketplace-source>`;
daarna kan toekomstige automatische installatie bij het begin van een beurt de gevonden lokale
marktplaats gebruiken.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [Peekaboo-bridge](/nl/platforms/mac/peekaboo)
- [iOS-app](/nl/platforms/ios)
