---
read_when:
    - Je wilt dat OpenClaw-agenten in Codex-modus Codex Computer Use gebruiken
    - Je kiest tussen Codex Computer Use, PeekabooBridge en directe cua-driver MCP
    - Je kiest tussen Codex Computer Use en een rechtstreekse cua-driver MCP-configuratie
    - Je configureert computerUse voor de meegeleverde Codex-plugin
    - Je lost problemen op met /codex computer-use status of install
summary: Stel Codex Computer Use in voor OpenClaw-agents in Codex-modus
title: Codex-computergebruik
x-i18n:
    generated_at: "2026-05-06T09:25:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use is een Codex-native MCP-plugin voor lokale desktopbediening. OpenClaw
levert de desktop-app niet mee, voert zelf geen desktopacties uit en omzeilt
Codex-machtigingen niet. De gebundelde `codex`-plugin bereidt alleen Codex app-server voor:
hij schakelt ondersteuning voor Codex-plugins in, vindt of installeert de geconfigureerde Codex
Computer Use-plugin, controleert of de `computer-use` MCP-server beschikbaar is en
laat Codex vervolgens eigenaar zijn van de native MCP-toolaanroepen tijdens Codex-mode-beurten.

Gebruik deze pagina wanneer OpenClaw al de native Codex-harness gebruikt. Zie voor de
runtime-installatie zelf [Codex-harness](/nl/plugins/codex-harness).

## OpenClaw.app en Peekaboo

De Peekaboo-integratie van OpenClaw.app staat los van Codex Computer Use. De
macOS-app kan een PeekabooBridge-socket hosten zodat de `peekaboo` CLI de
lokale Accessibility- en Screen Recording-toestemmingen van de app kan hergebruiken voor Peekaboo's eigen
automatiseringstools. Die bridge installeert of proxyt Codex Computer Use niet, en
Codex Computer Use roept niet aan via de PeekabooBridge-socket.

Gebruik [Peekaboo-bridge](/nl/platforms/mac/peekaboo) wanneer je wilt dat OpenClaw.app een
machtigingsbewuste host is voor Peekaboo CLI-automatisering. Gebruik deze pagina wanneer een
Codex-mode OpenClaw-agent Codex' native `computer-use` MCP-plugin
beschikbaar moet hebben voordat de beurt start.

## iOS-app

De iOS-app staat los van Codex Computer Use. Hij installeert of proxyt
de Codex `computer-use` MCP-server niet en is geen backend voor desktopbediening.
In plaats daarvan maakt de iOS-app verbinding als een OpenClaw-node en stelt mobiele
mogelijkheden beschikbaar via node-opdrachten zoals `canvas.*`, `camera.*`, `screen.*`,
`location.*` en `talk.*`.

Gebruik [iOS](/nl/platforms/ios) wanneer je wilt dat een agent een iPhone-node aanstuurt via
de Gateway. Gebruik deze pagina wanneer een Codex-mode-agent de lokale
macOS-desktop moet bedienen via Codex' native Computer Use-plugin.

## Directe cua-driver MCP

Codex Computer Use is niet de enige manier om desktopbediening beschikbaar te maken. Als je wilt dat
door OpenClaw beheerde runtimes TryCua's driver rechtstreeks aanroepen, gebruik dan de upstream
`cua-driver mcp`-server via OpenClaw's MCP-register in plaats van de
Codex-specifieke marketplace-flow.

Vraag na het installeren van `cua-driver` om de OpenClaw-opdracht:

```bash
cua-driver mcp-config --client openclaw
```

of registreer de stdio-server zelf:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Dat pad houdt het upstream MCP-tooloppervlak intact, inclusief de driver-
schema's en gestructureerde MCP-antwoorden. Gebruik het wanneer je de CUA-driver
beschikbaar wilt maken als een normale OpenClaw MCP-server. Gebruik de Codex Computer Use-installatie op
deze pagina wanneer Codex app-server eigenaar moet zijn van plugininstallatie, MCP-herladingen
en native toolaanroepen binnen Codex-mode-beurten.

CUA's driver is macOS-specifiek en vereist nog steeds de lokale macOS-machtigingen
waar zijn app om vraagt, zoals Accessibility en Screen Recording. OpenClaw
installeert `cua-driver` niet, verleent die machtigingen niet en omzeilt het veiligheidsmodel
van de upstream driver niet.

## Snelle installatie

Stel `plugins.entries.codex.config.computerUse` in wanneer Codex-mode-beurten
Computer Use beschikbaar moeten hebben voordat een thread start:

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

Met deze configuratie controleert OpenClaw Codex app-server vóór elke Codex-mode-beurt.
Als Computer Use ontbreekt maar Codex app-server al een installeerbare
marketplace heeft ontdekt, vraagt OpenClaw Codex app-server om de
plugin te installeren of opnieuw in te schakelen en MCP-servers opnieuw te laden. Op macOS probeert OpenClaw,
wanneer er geen overeenkomende marketplace is geregistreerd en de standaard Codex-appbundel bestaat, ook de
gebundelde Codex-marketplace te registreren vanuit
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` voordat het
mislukt. Als de installatie de MCP-server nog steeds niet beschikbaar kan maken, mislukt de beurt
voordat de thread start.

Bestaande sessies behouden hun runtime en Codex-threadbinding. Gebruik na het wijzigen van
`agentRuntime` of de Computer Use-configuratie `/new` of `/reset` in de betrokken
chat voordat je test.

## Opdrachten

Gebruik de `/codex computer-use`-opdrachten vanaf elk chatoppervlak waar het `codex`-
pluginopdrachtoppervlak beschikbaar is. Dit zijn OpenClaw chat-/runtime-opdrachten,
geen `openclaw codex ...` CLI-subopdrachten:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` is alleen-lezen. Het voegt geen marketplace-bronnen toe, installeert geen plugins en
schakelt geen ondersteuning voor Codex-plugins in.

`install` schakelt ondersteuning voor Codex app-server-plugins in, voegt optioneel een geconfigureerde
marketplace-bron toe, installeert of schakelt de geconfigureerde plugin opnieuw in via Codex
app-server, laadt MCP-servers opnieuw en verifieert dat de MCP-server tools beschikbaar stelt.

## Marketplace-keuzes

OpenClaw gebruikt dezelfde app-server-API die Codex zelf beschikbaar stelt. De
marketplace-velden kiezen waar Codex `computer-use` moet vinden.

| Veld                 | Gebruik wanneer                                                  | Installatieondersteuning                                  |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Geen marketplace-veld | Je wilt dat Codex app-server marketplaces gebruikt die hij al kent. | Ja, wanneer app-server een lokale marketplace retourneert. |
| `marketplaceSource`  | Je hebt een Codex-marketplacebron die app-server kan toevoegen.  | Ja, voor expliciete `/codex computer-use install`.       |
| `marketplacePath`    | Je kent het lokale marketplacebestandspad op de host al.         | Ja, voor expliciete installatie en automatische installatie bij beurtstart. |
| `marketplaceName`    | Je wilt één al geregistreerde marketplace op naam selecteren.    | Alleen ja wanneer de geselecteerde marketplace een lokaal pad heeft. |

Nieuwe Codex-homes hebben mogelijk een kort moment nodig om hun officiële marketplaces te initialiseren.
Tijdens installatie pollt OpenClaw `plugin/list` maximaal
`marketplaceDiscoveryTimeoutMs` milliseconden. De standaardwaarde is 60 seconden.

Als meerdere bekende marketplaces Computer Use bevatten, geeft OpenClaw de voorkeur aan
`openai-bundled`, daarna `openai-curated`, daarna `local`. Onbekende dubbelzinnige overeenkomsten
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
lokaal marketplacebestandspad of voer één keer `/codex computer-use install --source
<marketplace-source>` uit.

## Limiet van externe catalogus

Codex app-server kan remote-only catalogusvermeldingen weergeven en lezen, maar ondersteunt momenteel geen
remote `plugin/install`. Dat betekent dat `marketplaceName` een
remote-only marketplace kan selecteren voor statuscontroles, maar installaties en opnieuw inschakelen
hebben nog steeds een lokale marketplace nodig via `marketplaceSource` of `marketplacePath`.

Als status zegt dat de plugin beschikbaar is in een externe Codex-marketplace maar externe
installatie niet wordt ondersteund, voer installatie uit met een lokale bron of lokaal pad:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Configuratiereferentie

| Veld                            | Standaard      | Betekenis                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | afgeleid       | Vereist Computer Use. Standaard true wanneer een ander Computer Use-veld is ingesteld. |
| `autoInstall`                   | false          | Installeer of schakel opnieuw in vanuit al ontdekte marketplaces bij beurtstart. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Hoe lang installatie wacht op marketplace-detectie door Codex app-server.      |
| `marketplaceSource`             | niet ingesteld | Brontekst doorgegeven aan Codex app-server `marketplace/add`.                  |
| `marketplacePath`               | niet ingesteld | Lokaal Codex-marketplacebestandspad dat de plugin bevat.                       |
| `marketplaceName`               | niet ingesteld | Geregistreerde Codex-marketplacenaam om te selecteren.                         |
| `pluginName`                    | `computer-use` | Codex-marketplace-pluginnaam.                                                  |
| `mcpServerName`                 | `computer-use` | MCP-servernaam die door de geïnstalleerde plugin wordt beschikbaar gesteld.    |

Automatische installatie bij beurtstart weigert bewust geconfigureerde `marketplaceSource`-
waarden. Het toevoegen van een nieuwe bron is een expliciete installatiehandeling, dus gebruik
één keer `/codex computer-use install --source <marketplace-source>` en laat daarna
`autoInstall` toekomstige herinschakelingen vanuit ontdekte lokale marketplaces afhandelen.
Automatische installatie bij beurtstart kan een geconfigureerde `marketplacePath` gebruiken, omdat dat
al een lokaal pad op de host is.

## Wat OpenClaw controleert

OpenClaw rapporteert intern een stabiele installatiereden en formatteert de gebruikersgerichte
status voor chat:

| Reden                        | Betekenis                                             | Volgende stap                                  |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` is naar false herleid.          | Stel `enabled` of een ander Computer Use-veld in. |
| `marketplace_missing`        | Er was geen overeenkomende marketplace beschikbaar.   | Configureer bron, pad of marketplacenaam.     |
| `plugin_not_installed`       | Marketplace bestaat, maar de plugin is niet geïnstalleerd. | Voer installatie uit of schakel `autoInstall` in. |
| `plugin_disabled`            | Plugin is geïnstalleerd maar uitgeschakeld in Codex-configuratie. | Voer installatie uit om deze opnieuw in te schakelen. |
| `remote_install_unsupported` | Geselecteerde marketplace is remote-only.             | Gebruik `marketplaceSource` of `marketplacePath`. |
| `mcp_missing`                | Plugin is ingeschakeld, maar de MCP-server is niet beschikbaar. | Controleer Codex Computer Use en OS-machtigingen. |
| `ready`                      | Plugin en MCP-tools zijn beschikbaar.                 | Start de Codex-mode-beurt.                    |
| `check_failed`               | Een Codex app-server-verzoek is mislukt tijdens statuscontrole. | Controleer app-server-connectiviteit en logs. |
| `auto_install_blocked`       | Installatie bij beurtstart zou een nieuwe bron moeten toevoegen. | Voer eerst expliciete installatie uit.        |

De chatuitvoer bevat de pluginstatus, MCP-serverstatus, marketplace, tools
wanneer beschikbaar en het specifieke bericht voor de mislukte installatiestap.

## macOS-machtigingen

Computer Use is macOS-specifiek. De MCP-server die eigendom is van Codex heeft mogelijk lokale OS-
machtigingen nodig voordat hij apps kan inspecteren of bedienen. Als OpenClaw zegt dat Computer Use
is geïnstalleerd maar de MCP-server niet beschikbaar is, verifieer dan eerst de Codex-side Computer
Use-installatie:

- Codex app-server draait op dezelfde host waar desktopbesturing moet
  plaatsvinden.
- De Computer Use-plugin is ingeschakeld in de Codex-configuratie.
- De `computer-use` MCP-server verschijnt in de MCP-status van Codex app-server.
- macOS heeft de vereiste machtigingen verleend voor de desktopbesturingsapp.
- De huidige hostsessie heeft toegang tot het desktop dat wordt bestuurd.

OpenClaw faalt bewust gesloten wanneer `computerUse.enabled` true is. Een
beurt in Codex-modus mag niet stilzwijgend doorgaan zonder de native
desktoptools die door de configuratie zijn vereist.

## Probleemoplossing

**Status zegt dat het niet is geïnstalleerd.** Voer `/codex computer-use install` uit. Als de
marketplace niet wordt gevonden, geef dan `--source` of `--marketplace-path` mee.

**Status zegt dat het is geïnstalleerd maar uitgeschakeld.** Voer `/codex computer-use install` opnieuw uit.
De installatie van Codex app-server schrijft de pluginconfiguratie terug als ingeschakeld.

**Status zegt dat installatie op afstand niet wordt ondersteund.** Gebruik een lokale marketplacebron of
een lokaal pad. Catalogusvermeldingen die alleen op afstand beschikbaar zijn, kunnen worden geïnspecteerd maar niet geïnstalleerd via de
huidige app-server-API.

**Status zegt dat de MCP-server niet beschikbaar is.** Voer de installatie nogmaals uit zodat MCP-
servers opnieuw laden. Als deze niet beschikbaar blijft, herstel dan de Codex Computer Use-app,
de MCP-status van Codex app-server of de macOS-machtigingen.

**Status of een probe krijgt een time-out op `computer-use.list_apps`.** De plugin en MCP-
server zijn aanwezig, maar de lokale Computer Use-bridge heeft niet geantwoord. Sluit of
herstart Codex Computer Use, start Codex Desktop indien nodig opnieuw en probeer het daarna opnieuw in een
nieuwe OpenClaw-sessie.

**Een Computer Use-tool zegt `Native hook relay unavailable`.** De Codex-native
toolhook kon geen actieve OpenClaw-relay bereiken via de lokale bridge of
Gateway-terugval. Start een nieuwe OpenClaw-sessie met `/new` of `/reset`. Als dit
blijft gebeuren, herstart dan de Gateway zodat oude app-serverthreads en hook-
registraties worden verwijderd, en probeer het daarna opnieuw.

**Automatische installatie bij het begin van een beurt weigert een bron.** Dit is opzettelijk. Voeg de
bron eerst toe met expliciet `/codex computer-use install --source <marketplace-source>`;
daarna kan automatische installatie bij het begin van toekomstige beurten de gevonden lokale
marketplace gebruiken.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [Peekaboo-bridge](/nl/platforms/mac/peekaboo)
- [iOS-app](/nl/platforms/ios)
