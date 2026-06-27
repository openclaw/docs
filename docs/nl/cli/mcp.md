---
read_when:
    - Codex, Claude Code of een andere MCP-client verbinden met door OpenClaw ondersteunde kanalen
    - Wordt uitgevoerd `openclaw mcp serve`
    - OpenClaw-opgeslagen MCP-serverdefinities beheren
sidebarTitle: MCP
summary: Stel OpenClaw-kanaalgesprekken beschikbaar via MCP en beheer opgeslagen MCP-serverdefinities
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:20:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` heeft twee taken:

- OpenClaw uitvoeren als MCP-server met `openclaw mcp serve`
- Door OpenClaw beheerde uitgaande MCP-serverdefinities beheren met `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` en `unset`

Met andere woorden:

- `serve` is OpenClaw dat optreedt als MCP-server
- de andere subopdrachten zijn OpenClaw dat optreedt als een MCP-clientzijdig register voor MCP-servers die de runtimes later kunnen gebruiken

<Note>
  `list`, `show`, `set` en `unset` lezen en schrijven alleen door OpenClaw beheerde `mcp.servers`-vermeldingen in de OpenClaw-configuratie. Ze bevatten geen mcporter-servers uit `config/mcporter.json`; gebruik `mcporter list` voor dat register.
</Note>

Gebruik [`openclaw acp`](/nl/cli/acp) wanneer OpenClaw zelf een code-harnesssessie moet hosten en die runtime via ACP moet routeren.

## Kies het juiste MCP-pad

OpenClaw heeft meerdere MCP-oppervlakken. Kies het oppervlak dat past bij wie eigenaar is van de agentruntime en wie eigenaar is van de tools.

| Doel                                                                | Gebruik                                                              | Waarom                                                                                                          |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Een externe MCP-client OpenClaw-kanaalgesprekken laten lezen/verzenden | `openclaw mcp serve`                                                 | OpenClaw is de MCP-server en stelt Gateway-ondersteunde gesprekken beschikbaar via stdio.                       |
| MCP-servers van derden opslaan voor door OpenClaw beheerde agentruns | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw is het MCP-clientzijdige register en projecteert die servers later in geschikte runtimes.              |
| Een opgeslagen server controleren zonder een agentbeurt uit te voeren | `openclaw mcp status`, `doctor`, `probe`                             | `status` en `doctor` inspecteren de configuratie; `probe` opent een live MCP-verbinding en toont mogelijkheden. |
| MCP-configuratie vanuit een browser bewerken                         | Control UI `/mcp`                                                    | De pagina toont inventaris, inschakeling, OAuth-/filtersamenvattingen, opdrachthints en een afgebakende `mcp`-editor. |
| Codex app-server een afgebakende native MCP-server geven             | `mcp.servers.<name>.codex`                                           | Het `codex`-blok beïnvloedt alleen Codex app-server-threadprojectie en wordt verwijderd vóór overdracht aan native configuratie. |
| Door ACP gehoste harnesssessies uitvoeren                            | [`openclaw acp`](/nl/cli/acp) en [ACP Agents](/nl/tools/acp-agents-setup) | ACP-bridgemodus accepteert geen MCP-serverinjectie per sessie; configureer in plaats daarvan gateway-/Plugin-bridges. |

<Tip>
Als je niet zeker weet welk pad je nodig hebt, begin dan met `openclaw mcp status --verbose`. Dit toont wat OpenClaw heeft opgeslagen zonder MCP-servers te starten.
</Tip>

## OpenClaw als MCP-server

Dit is het pad `openclaw mcp serve`.

### Wanneer je `serve` gebruikt

Gebruik `openclaw mcp serve` wanneer:

- Codex, Claude Code of een andere MCP-client rechtstreeks moet praten met door OpenClaw ondersteunde kanaalgesprekken
- je al een lokale of externe OpenClaw Gateway hebt met gerouteerde sessies
- je één MCP-server wilt die werkt over de kanaalbackends van OpenClaw heen in plaats van afzonderlijke bridges per kanaal uit te voeren

Gebruik in plaats daarvan [`openclaw acp`](/nl/cli/acp) wanneer OpenClaw zelf de coderuntime moet hosten en de agentsessie binnen OpenClaw moet houden.

### Hoe het werkt

`openclaw mcp serve` start een stdio-MCP-server. De MCP-client is eigenaar van dat proces. Terwijl de client de stdio-sessie openhoudt, maakt de bridge verbinding met een lokale of externe OpenClaw Gateway via WebSocket en stelt gerouteerde kanaalgesprekken beschikbaar via MCP.

<Steps>
  <Step title="Client spawns the bridge">
    De MCP-client start `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    De bridge maakt verbinding met de OpenClaw Gateway via WebSocket.
  </Step>
  <Step title="Sessions become MCP conversations">
    Gerouteerde sessies worden MCP-gesprekken en tools voor transcript/geschiedenis.
  </Step>
  <Step title="Live events queue">
    Live-gebeurtenissen worden in het geheugen in de wachtrij gezet terwijl de bridge verbonden is.
  </Step>
  <Step title="Optional Claude push">
    Als Claude-kanaalmodus is ingeschakeld, kan dezelfde sessie ook Claude-specifieke pushmeldingen ontvangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - live wachtrijstatus begint wanneer de bridge verbinding maakt
    - oudere transcriptgeschiedenis wordt gelezen met `messages_read`
    - Claude-pushmeldingen bestaan alleen terwijl de MCP-sessie actief is
    - wanneer de client de verbinding verbreekt, sluit de bridge af en is de live wachtrij verdwenen
    - eenmalige agentingangspunten zoals `openclaw agent` en `openclaw infer model run` beëindigen alle gebundelde MCP-runtimes die ze openen wanneer het antwoord is voltooid, zodat herhaalde gescripte runs geen stdio-MCP-childprocessen opstapelen
    - stdio-MCP-servers die door OpenClaw worden gestart (gebundeld of door de gebruiker geconfigureerd) worden bij afsluiten als procesboom afgebroken, zodat child-subprocessen die door de server zijn gestart niet blijven bestaan nadat de bovenliggende stdio-client afsluit
    - het verwijderen of resetten van een sessie ruimt de MCP-clients van die sessie op via het gedeelde runtime-opruimpad, zodat er geen achterblijvende stdio-verbindingen aan een verwijderde sessie gekoppeld blijven

  </Accordion>
</AccordionGroup>

### Kies een clientmodus

Gebruik dezelfde bridge op twee verschillende manieren:

<Tabs>
  <Tab title="Generic MCP clients">
    Alleen standaard-MCP-tools. Gebruik `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` en de goedkeuringstools.
  </Tab>
  <Tab title="Claude Code">
    Standaard-MCP-tools plus de Claude-specifieke kanaaladapter. Schakel `--claude-channel-mode on` in of laat de standaardwaarde `auto` staan.
  </Tab>
</Tabs>

<Note>
Vandaag gedraagt `auto` zich hetzelfde als `on`. Er is nog geen detectie van clientmogelijkheden.
</Note>

### Wat `serve` beschikbaar stelt

De bridge gebruikt bestaande routesmetadata van Gateway-sessies om kanaalondersteunde gesprekken beschikbaar te stellen. Een gesprek verschijnt wanneer OpenClaw al sessiestatus heeft met een bekende route, zoals:

- `channel`
- metadata voor ontvanger of bestemming
- optionele `accountId`
- optionele `threadId`

Dit geeft MCP-clients één plek om:

- recente gerouteerde gesprekken te tonen
- recente transcriptgeschiedenis te lezen
- te wachten op nieuwe inkomende gebeurtenissen
- een antwoord terug te sturen via dezelfde route
- goedkeuringsverzoeken te zien die binnenkomen terwijl de bridge verbonden is

### Gebruik

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Bridgetools

De huidige bridge stelt deze MCP-tools beschikbaar:

<AccordionGroup>
  <Accordion title="conversations_list">
    Toont recente sessieondersteunde gesprekken die al routesmetadata in Gateway-sessiestatus hebben.

    Nuttige filters:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Retourneert één gesprek via `session_key` met een directe Gateway-sessieopzoeking.
  </Accordion>
  <Accordion title="messages_read">
    Leest recente transcriptberichten voor één sessieondersteund gesprek.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extraheert niet-tekstuele berichtinhoudsblokken uit één transcriptbericht. Dit is een metadataweergave van transcriptinhoud, geen zelfstandige duurzame opslag voor bijlageblobs.
  </Accordion>
  <Accordion title="events_poll">
    Leest live-gebeurtenissen in de wachtrij sinds een numerieke cursor.
  </Accordion>
  <Accordion title="events_wait">
    Long-pollt totdat de volgende overeenkomende gebeurtenis in de wachtrij binnenkomt of een time-out verloopt.

    Gebruik dit wanneer een generieke MCP-client bijna-realtime levering nodig heeft zonder Claude-specifiek pushprotocol.

  </Accordion>
  <Accordion title="messages_send">
    Stuurt tekst terug via dezelfde route die al op de sessie is vastgelegd.

    Huidig gedrag:

    - vereist een bestaande gespreksroute
    - gebruikt het kanaal, de ontvanger, de account-id en de thread-id van de sessie
    - verzendt alleen tekst

  </Accordion>
  <Accordion title="permissions_list_open">
    Toont openstaande exec-/Plugin-goedkeuringsverzoeken die de bridge heeft waargenomen sinds de verbinding met de Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Lost één openstaand exec-/Plugin-goedkeuringsverzoek op met:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Gebeurtenismodel

De bridge houdt een in-memory gebeurteniswachtrij bij terwijl hij verbonden is.

Huidige gebeurtenistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- de wachtrij is alleen live; deze begint wanneer de MCP-bridge start
- `events_poll` en `events_wait` spelen oudere Gateway-geschiedenis niet zelf opnieuw af
- duurzame backlog moet worden gelezen met `messages_read`

</Warning>

### Claude-kanaalmeldingen

De bridge kan ook Claude-specifieke kanaalmeldingen beschikbaar stellen. Dit is het OpenClaw-equivalent van een Claude Code-kanaaladapter: standaard-MCP-tools blijven beschikbaar, maar live inkomende berichten kunnen ook binnenkomen als Claude-specifieke MCP-meldingen.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: alleen standaard-MCP-tools.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude-kanaalmeldingen inschakelen.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: huidige standaard; hetzelfde bridgegedrag als `on`.
  </Tab>
</Tabs>

Wanneer Claude-kanaalmodus is ingeschakeld, adverteert de server experimentele mogelijkheden van Claude en kan deze het volgende uitzenden:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Huidig bridgegedrag:

- inkomende `user`-transcriptberichten worden doorgestuurd als `notifications/claude/channel`
- Claude-toestemmingsverzoeken die via MCP worden ontvangen, worden in-memory bijgehouden
- als het gekoppelde gesprek later `yes abcde` of `no abcde` verzendt, zet de bridge dat om naar `notifications/claude/channel/permission`
- deze meldingen zijn alleen voor live-sessies; als de MCP-client de verbinding verbreekt, is er geen pushdoel

Dit is bewust clientspecifiek. Generieke MCP-clients moeten vertrouwen op de standaardpollingtools.

### MCP-clientconfiguratie

Voorbeeld van stdio-clientconfiguratie:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Begin voor de meeste generieke MCP-clients met het standaardtooloppervlak en negeer Claude-modus. Schakel Claude-modus alleen in voor clients die de Claude-specifieke meldingsmethoden daadwerkelijk begrijpen.

### Opties

`openclaw mcp serve` ondersteunt:

<ParamField path="--url" type="string">
  Gateway-WebSocket-URL.
</ParamField>
<ParamField path="--token" type="string">
  Gateway-token.
</ParamField>
<ParamField path="--token-file" type="string">
  Token uit bestand lezen.
</ParamField>
<ParamField path="--password" type="string">
  Gateway-wachtwoord.
</ParamField>
<ParamField path="--password-file" type="string">
  Wachtwoord uit bestand lezen.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude-meldingsmodus.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Uitgebreide logs op stderr.
</ParamField>

<Tip>
Gebruik waar mogelijk liever `--token-file` of `--password-file` dan inline geheimen.
</Tip>

### Beveiligings- en vertrouwensgrens

De bridge verzint geen routering. Deze maakt alleen gesprekken zichtbaar waarvan Gateway al weet hoe die moeten worden gerouteerd.

Dat betekent:

- afzender-allowlists, koppeling en vertrouwen op kanaalniveau blijven bij de onderliggende OpenClaw-kanaalconfiguratie horen
- `messages_send` kan alleen antwoorden via een bestaande opgeslagen route
- goedkeuringsstatus is alleen live/in-memory voor de huidige bridgesessie
- bridge-authenticatie moet dezelfde Gateway-token- of wachtwoordcontroles gebruiken die je zou vertrouwen voor elke andere externe Gateway-client

Als een gesprek ontbreekt in `conversations_list`, is de gebruikelijke oorzaak niet de MCP-configuratie. Het gaat om ontbrekende of onvolledige routemetadata in de onderliggende Gateway-sessie.

### Testen

OpenClaw levert een deterministische Docker-smoke voor deze bridge:

```bash
pnpm test:docker:mcp-channels
```

Die smoke:

- start een vooraf gevulde Gateway-container
- start een tweede container die `openclaw mcp serve` start
- verifieert gespreksdetectie, transcriptlezingen, lezingen van bijlagemetadata, live-eventqueuegedrag en routering voor uitgaande verzending
- valideert kanaal- en toestemmingsmeldingen in Claude-stijl via de echte stdio-MCP-bridge

Dit is de snelste manier om te bewijzen dat de bridge werkt zonder een echt Telegram-, Discord- of iMessage-account aan de testrun te koppelen.

Zie [Testen](/nl/help/testing) voor bredere testcontext.

### Probleemoplossing

<AccordionGroup>
  <Accordion title="Geen gesprekken geretourneerd">
    Betekent meestal dat de Gateway-sessie nog niet routeerbaar is. Bevestig dat de onderliggende sessie opgeslagen metadata heeft voor kanaal/provider, ontvanger en optionele account-/threadroute.
  </Accordion>
  <Accordion title="events_poll of events_wait mist oudere berichten">
    Verwacht. De live queue begint wanneer de bridge verbinding maakt. Lees oudere transcriptgeschiedenis met `messages_read`.
  </Accordion>
  <Accordion title="Claude-meldingen verschijnen niet">
    Controleer al het volgende:

    - de client hield de stdio-MCP-sessie open
    - `--claude-channel-mode` is `on` of `auto`
    - de client begrijpt de Claude-specifieke meldingsmethoden daadwerkelijk
    - het inkomende bericht vond plaats nadat de bridge verbinding had gemaakt

  </Accordion>
  <Accordion title="Goedkeuringen ontbreken">
    `permissions_list_open` toont alleen goedkeuringsaanvragen die zijn waargenomen terwijl de bridge verbonden was. Het is geen duurzame API voor goedkeuringsgeschiedenis.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-clientregister

Dit is het pad voor `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` en `unset`.

Deze commando's stellen OpenClaw niet bloot via MCP. Ze beheren door OpenClaw beheerde MCP-serverdefinities onder `mcp.servers` in de OpenClaw-configuratie. Ze lezen geen mcporter-servers uit `config/mcporter.json`.

Die opgeslagen definities zijn bedoeld voor runtimes die OpenClaw later start of configureert, zoals ingebedde OpenClaw en andere runtime-adapters. OpenClaw slaat de definities centraal op, zodat die runtimes geen eigen dubbele MCP-serverlijsten hoeven bij te houden.

<AccordionGroup>
  <Accordion title="Belangrijk gedrag">
    - deze commando's lezen of schrijven alleen OpenClaw-configuratie
    - `status`, `list`, `show`, `doctor` zonder `--probe`, `set`, `configure`, `tools`, `logout`, `reload` en `unset` maken geen verbinding met de doel-MCP-server
    - `login` voert de MCP OAuth-netwerkflow uit voor de geconfigureerde HTTP-server en slaat de resulterende lokale referenties op
    - `status --verbose` print opgeloste hints voor transport, auth, timeout, filter en parallelle toolaanroepen zonder verbinding te maken
    - `doctor` controleert opgeslagen definities op lokale installatieproblemen, zoals ontbrekende stdio-commando's, ongeldige werkmappen, ontbrekende TLS-bestanden, uitgeschakelde servers, letterlijke gevoelige header-/env-waarden en onvolledige OAuth-autorisatie
    - `doctor --probe` voegt hetzelfde live verbindingsbewijs toe als `probe` nadat statische controles slagen
    - `probe` maakt verbinding met de geselecteerde server of alle geconfigureerde servers, vermeldt tools en rapporteert mogelijkheden/diagnostiek
    - `add` bouwt een definitie op uit flags en voert een probe uit vóór opslaan, tenzij `--no-probe` is ingesteld of OAuth-autorisatie eerst nodig is
    - runtime-adapters bepalen tijdens uitvoering welke transportvormen ze daadwerkelijk ondersteunen
    - `enabled: false` houdt een server opgeslagen maar sluit deze uit van ingebedde runtimedetectie
    - `timeout` en `connectTimeout` stellen timeouts per server voor aanvraag en verbinding in seconden in
    - `supportsParallelToolCalls: true` markeert servers die adapters gelijktijdig kunnen aanroepen
    - HTTP-servers kunnen statische headers, OAuth-login, TLS-verificatiecontrole en mTLS-certificaat-/sleutelpaden gebruiken
    - ingebedde OpenClaw stelt geconfigureerde MCP-tools beschikbaar in normale `coding`- en `messaging`-toolprofielen; `minimal` verbergt ze nog steeds, en `tools.deny: ["bundle-mcp"]` schakelt ze expliciet uit
    - per-server `toolFilter.include` en `toolFilter.exclude` filteren ontdekte MCP-tools voordat ze OpenClaw-tools worden
    - servers die resources of prompts adverteren, stellen ook hulpprogramma-tools beschikbaar voor het vermelden/lezen van resources en het vermelden/ophalen van prompts; die gegenereerde hulpprogrammanamen (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) gebruiken hetzelfde include/exclude-filter
    - dynamische wijzigingen in MCP-toollijsten maken de gecachete catalogus voor die sessie ongeldig; de volgende detectie/het volgende gebruik ververst vanaf de server
    - herhaalde MCP-toolaanvraag-/protocolfouten pauzeren die server kort, zodat één kapotte server niet de hele beurt verbruikt
    - sessiegebonden gebundelde MCP-runtimes worden opgeruimd na `mcp.sessionIdleTtlMs` milliseconden inactiviteit (standaard 10 minuten; stel `0` in om uit te schakelen) en eenmalige ingebedde runs ruimen ze op aan het einde van de run

  </Accordion>
</AccordionGroup>

Runtime-adapters kunnen dit gedeelde register normaliseren naar de vorm die hun downstreamclient verwacht. Ingebedde OpenClaw gebruikt bijvoorbeeld OpenClaw-`transport`-waarden rechtstreeks, terwijl Claude Code en Gemini CLI-native `type`-waarden krijgen, zoals `http`, `sse` of `stdio`.

Codex app-server respecteert ook een optioneel `codex`-blok op elke server. Dit is
OpenClaw-projectiemetadata alleen voor Codex app-server-threads; het wijzigt geen
ACP-sessies, generieke Codex-harnessconfiguratie of andere runtime-adapters.
Gebruik niet-lege `codex.agents` om een server alleen naar specifieke OpenClaw-
agent-id's te projecteren. Lege, blanco of ongeldige agentlijsten worden door
configuratievalidatie geweigerd en door het runtimeprojectiepad weggelaten in plaats van
globaal te worden. Gebruik `codex.defaultToolsApprovalMode` (`auto`, `prompt` of `approve`)
om Codex' native `default_tools_approval_mode` uit te zenden voor een vertrouwde server.
OpenClaw verwijdert de `codex`-metadata voordat de native `mcp_servers`-
configuratie aan Codex wordt doorgegeven.

### Opgeslagen MCP-serverdefinities

OpenClaw slaat ook een lichtgewicht MCP-serverregister op in configuratie voor oppervlakken die door OpenClaw beheerde MCP-definities willen.

Commando's:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Opmerkingen:

- `list` sorteert servernamen.
- `show` zonder naam print het volledige geconfigureerde MCP-serverobject.
- `status` classificeert geconfigureerde transporten zonder verbinding te maken. `--verbose` bevat opgeloste details over start, timeout, OAuth, filter en parallelle aanroepen.
- `doctor` voert statische controles uit zonder verbinding te maken. Voeg `--probe` toe wanneer het commando ook moet verifiëren dat ingeschakelde servers verbinding maken.
- `probe` maakt verbinding en rapporteert aantallen tools, ondersteuning voor resources/prompts, ondersteuning voor lijstwijzigingen en diagnostiek.
- `add` accepteert stdio-flags zoals `--command`, `--arg`, `--env` en `--cwd`, of HTTP-flags zoals `--url`, `--transport`, `--header`, `--auth oauth`, TLS, timeout en flags voor toolselectie.
- `set` verwacht één JSON-objectwaarde op de commandoregel.
- `configure` werkt inschakeling, toolfilters, timeouts, OAuth, TLS en hints voor parallelle toolaanroepen bij zonder de hele serverdefinitie te vervangen.
- `tools` werkt toolfilters per server bij. Include/exclude-vermeldingen zijn MCP-toolnamen en eenvoudige `*`-globs.
- `login` voert de OAuth-flow uit voor HTTP-servers die zijn geconfigureerd met `auth: "oauth"`. De eerste run print een autorisatie-URL; voer opnieuw uit met `--code` na goedkeuring.
- `logout` wist opgeslagen OAuth-referenties voor de genoemde server zonder de opgeslagen serverdefinitie te verwijderen.
- `reload` ruimt gecachete in-process MCP-runtimes op. Gateway- of agentprocessen in een ander proces hebben nog steeds hun eigen herlaad- of herstartpad nodig.
- Gebruik `transport: "streamable-http"` voor Streamable HTTP-MCP-servers. `openclaw mcp set` normaliseert ook CLI-native `type: "http"` naar dezelfde canonieke configuratievorm voor compatibiliteit.
- `unset` mislukt als de genoemde server niet bestaat.

Voorbeelden:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Veelgebruikte serverrecepten

Deze voorbeelden slaan alleen serverdefinities op. Voer daarna `openclaw mcp doctor --probe` uit om te bewijzen dat de server start en tools beschikbaar stelt.

<Tabs>
  <Tab title="Bestandssysteem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Beperk bestandssysteemservers tot de kleinste mapstructuur die de agent moet lezen of bewerken.

  </Tab>
  <Tab title="Geheugen">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Gebruik een toolfilter als de server schrijftools beschikbaar stelt die niet beschikbaar mogen zijn voor normale agents.

  </Tab>
  <Tab title="Lokaal script">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` controleert of `cwd` bestaat en of het commando vanuit de geconfigureerde omgeving kan worden opgelost.

  </Tab>
  <Tab title="Externe HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Gebruik OAuth wanneer de externe server dit ondersteunt. Als de server statische headers vereist, vermijd dan het committen van letterlijke bearer-tokens.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Directe desktopbesturingsservers erven de machtigingen van het proces dat ze starten. Gebruik smalle toolfilters en machtigingsprompts op OS-niveau.

  </Tab>
</Tabs>

### JSON-uitvoervormen

Gebruik `--json` voor scripts en dashboards. Veldsets kunnen in de loop van de tijd groeien, dus consumers moeten onbekende sleutels negeren.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` sluit af met een niet-nulstatus wanneer een ingeschakelde gecontroleerde server een fout heeft. Waarschuwingen worden gerapporteerd, maar zorgen er op zichzelf niet voor dat de opdracht mislukt.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` opent een live MCP-clientsessie. Gebruik dit als bewijs voor bereikbaarheid en mogelijkheden, niet voor statische configuratie-audits.

  </Accordion>
</AccordionGroup>

Voorbeeldconfiguratievorm:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Stdio-transport

Start een lokaal childproces en communiceert via stdin/stdout.

| Veld                       | Beschrijving                          |
| -------------------------- | ------------------------------------- |
| `command`                  | Uitvoerbaar bestand om te starten (vereist) |
| `args`                     | Array met command-line-argumenten     |
| `env`                      | Extra omgevingsvariabelen             |
| `cwd` / `workingDirectory` | Werkdirectory voor het proces         |

<Warning>
**Veiligheidsfilter voor Stdio-env**

OpenClaw weigert env-sleutels voor interpreter-startup die kunnen wijzigen hoe een stdio-MCP-server opstart vóór de eerste RPC, zelfs als ze in het `env`-blok van een server staan. Geblokkeerde sleutels zijn onder andere `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` en vergelijkbare runtime-control-variabelen. Startup weigert deze met een configuratiefout zodat ze geen impliciete prelude kunnen injecteren, de interpreter kunnen vervangen, een debugger kunnen inschakelen of runtime-uitvoer kunnen omleiden tegen het stdio-proces. Gewone credentials, proxy's en serverspecifieke env-vars (`GITHUB_TOKEN`, `HTTP_PROXY`, aangepaste `*_API_KEY`, enzovoort) worden niet beïnvloed.

Als je MCP-server echt een van de geblokkeerde variabelen nodig heeft, stel die dan in op het gateway-hostproces in plaats van onder de `env` van de stdio-server.
</Warning>

### SSE-/HTTP-transport

Maakt verbinding met een externe MCP-server via HTTP Server-Sent Events.

| Veld                           | Beschrijving                                                        |
| ------------------------------ | ------------------------------------------------------------------- |
| `url`                          | HTTP- of HTTPS-URL van de externe server (vereist)                  |
| `headers`                      | Optionele key-value-map met HTTP-headers (bijvoorbeeld auth-tokens) |
| `connectionTimeoutMs`          | Verbindingstime-out per server in ms (optioneel)                    |
| `connectTimeout`               | Verbindingstime-out per server in seconden (optioneel)              |
| `timeout` / `requestTimeoutMs` | Time-out voor MCP-verzoeken per server in seconden of ms            |
| `auth: "oauth"`                | Gebruik MCP OAuth-tokenopslag en `openclaw mcp login`               |
| `sslVerify`                    | Stel alleen in op false voor expliciet vertrouwde privé-HTTPS-endpoints |
| `clientCert` / `clientKey`     | Paden naar mTLS-clientcertificaat en sleutel                        |
| `supportsParallelToolCalls`    | Hint dat gelijktijdige aanroepen veilig zijn voor deze server       |

Voorbeeld:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Gevoelige waarden in `url` (userinfo) en `headers` worden geredigeerd in logs en statusuitvoer. `openclaw mcp doctor` waarschuwt wanneer gevoelig ogende `headers`- of `env`-vermeldingen letterlijke waarden bevatten, zodat operators die waarden uit gecommitte configuratie kunnen verplaatsen.

### OAuth-workflow

OAuth is bedoeld voor HTTP-MCP-servers die de MCP OAuth-flow adverteren. Statische `Authorization`-headers worden genegeerd voor een server zolang `auth: "oauth"` is ingeschakeld.

<Steps>
  <Step title="Sla de server op">
    Voeg de server toe of werk deze bij met `auth: "oauth"` en eventuele optionele OAuth-metadata.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    Voer login uit om het autorisatieverzoek te maken.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw drukt de autorisatie-URL af en slaat tijdelijke OAuth-verifierstatus op onder de OpenClaw-statusdirectory.

  </Step>
  <Step title="Voltooi met de code">
    Geef na goedkeuring in de browser de geretourneerde code terug aan OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Controleer autorisatie">
    Gebruik status of doctor om te bevestigen dat tokens aanwezig zijn.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Wis credentials">
    Logout verwijdert opgeslagen OAuth-credentials, maar behoudt de opgeslagen serverdefinitie.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Als de provider tokens roteert of de autorisatiestatus vastloopt, voer dan `openclaw mcp logout <name>` uit en herhaal daarna `login`. `logout` kan credentials wissen voor een opgeslagen HTTP-server, zelfs nadat `auth: "oauth"` uit de configuratie is verwijderd, zolang de servernaam en URL de vermelding in de credentialstore nog identificeren.

### Streamable HTTP-transport

`streamable-http` is een extra transportoptie naast `sse` en `stdio`. Het gebruikt HTTP-streaming voor bidirectionele communicatie met externe MCP-servers.

| Veld                           | Beschrijving                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `url`                          | HTTP- of HTTPS-URL van de externe server (vereist)                                      |
| `transport`                    | Stel in op `"streamable-http"` om dit transport te selecteren; als dit ontbreekt, gebruikt OpenClaw `sse` |
| `headers`                      | Optionele key-value-map met HTTP-headers (bijvoorbeeld auth-tokens)                     |
| `connectionTimeoutMs`          | Verbindingstime-out per server in ms (optioneel)                                        |
| `connectTimeout`               | Verbindingstime-out per server in seconden (optioneel)                                  |
| `timeout` / `requestTimeoutMs` | Time-out voor MCP-verzoeken per server in seconden of ms                                |
| `auth: "oauth"`                | Gebruik MCP OAuth-tokenopslag en `openclaw mcp login`                                   |
| `sslVerify`                    | Stel alleen in op false voor expliciet vertrouwde privé-HTTPS-endpoints                 |
| `clientCert` / `clientKey`     | Paden naar mTLS-clientcertificaat en sleutel                                            |
| `supportsParallelToolCalls`    | Hint dat gelijktijdige aanroepen veilig zijn voor deze server                           |

OpenClaw-configuratie gebruikt `transport: "streamable-http"` als de canonieke schrijfwijze. CLI-native MCP-waarden `type: "http"` worden geaccepteerd wanneer ze via `openclaw mcp set` worden opgeslagen en door `openclaw doctor --fix` in bestaande configuratie gerepareerd, maar `transport` is wat ingebedde OpenClaw rechtstreeks consumeert.

Voorbeeld:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Registry-opdrachten starten de channel bridge niet. Alleen `probe` en `doctor --probe` openen een live MCP-clientsessie om te bewijzen dat de doelserver bereikbaar is.
</Note>

## Control UI

De browser-Control UI bevat een speciale MCP-instellingenpagina op `/mcp`. Deze toont aantallen geconfigureerde servers, samenvattingen van ingeschakeld/OAuth/filter, transportregels per server, besturingselementen voor inschakelen/uitschakelen, veelgebruikte CLI-opdrachten en een scoped editor voor de `mcp`-configuratiesectie.

Gebruik de pagina voor operatorbewerkingen en snelle inventarisatie. Gebruik `openclaw mcp doctor --probe` of `openclaw mcp probe` wanneer je live serverbewijs nodig hebt.

Operatorworkflow:

1. Open de Control UI en kies **MCP**.
2. Bekijk de overzichtskaarten voor het totaal aantal servers, ingeschakelde servers, OAuth-servers en gefilterde servers.
3. Gebruik elke serverrij voor transport-, auth-, filter-, timeout- en opdracht-hints.
4. Schakel inschakeling om wanneer je een definitie wilt behouden maar wilt uitsluiten van runtimedetectie.
5. Bewerk de gescopete `mcp`-configuratiesectie voor structurele wijzigingen zoals nieuwe servers, headers, TLS, OAuth-metadata of toolfilters.
6. Kies **Opslaan** om alleen de configuratie vast te leggen, of **Opslaan en publiceren** om deze via het Gateway-configuratiepad toe te passen.
7. Voer `openclaw mcp doctor --probe` uit wanneer je live bewijs nodig hebt dat de bewerkte server start en tools vermeldt.

Opmerkingen:

- opdrachtfragmenten plaatsen servernamen tussen aanhalingstekens, zodat ongebruikelijke namen kopieerbaar blijven in een shell
- weergegeven URL-achtige waarden worden vóór weergave geredigeerd wanneer ze ingesloten referenties bevatten
- de pagina start MCP-transports niet zelf
- actieve runtimes hebben mogelijk `openclaw mcp reload`, Gateway-configuratiepublicatie of een procesherstart nodig, afhankelijk van welk proces de MCP-clients beheert

## Huidige limieten

Deze pagina documenteert de bridge zoals die vandaag wordt geleverd.

Huidige limieten:

- gespreksdetectie is afhankelijk van bestaande metadata voor Gateway-sessieroutes
- geen generiek pushprotocol buiten de Claude-specifieke adapter
- nog geen tools om berichten te bewerken of op berichten te reageren
- HTTP/SSE/streamable-http-transport maakt verbinding met één externe server; nog geen gemultiplexte upstream
- `permissions_list_open` bevat alleen goedkeuringen die zijn waargenomen terwijl de bridge verbonden is

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Plugins](/nl/cli/plugins)
