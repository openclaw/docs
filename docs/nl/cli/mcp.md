---
read_when:
    - Codex, Claude Code of een andere MCP-client verbinden met kanalen die door OpenClaw worden ondersteund
    - Wordt `openclaw mcp serve` uitgevoerd
    - Door OpenClaw opgeslagen MCP-serverdefinities beheren
sidebarTitle: MCP
summary: Stel OpenClaw-kanaalgesprekken beschikbaar via MCP en beheer opgeslagen MCP-serverdefinities
title: MCP
x-i18n:
    generated_at: "2026-07-16T15:35:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` heeft twee taken:

- OpenClaw als een MCP-server uitvoeren met `openclaw mcp serve`
- door OpenClaw beheerde definities van uitgaande MCP-servers beheren met `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` en `unset`

Bij `serve` fungeert OpenClaw als een MCP-server. Bij de andere subopdrachten fungeert OpenClaw als een clientregister voor MCP-servers die de eigen runtimes later kunnen gebruiken.

<Note>
  `list`, `show`, `set` en `unset` lezen en schrijven alleen door OpenClaw beheerde `mcp.servers`-vermeldingen in de OpenClaw-configuratie. Ze bevatten geen mcporter-servers uit `config/mcporter.json`; gebruik `mcporter list` voor dat register.
</Note>

Gebruik [`openclaw acp`](/nl/cli/acp) wanneer OpenClaw zelf een sessie voor een programmeerharnas moet hosten en die runtime via ACP moet routeren.

## Kies het juiste MCP-pad

| Doel                                                                | Gebruik                                                                  | Waarom                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Een externe MCP-client OpenClaw-kanaalgesprekken laten lezen/verzenden | `openclaw mcp serve`                                                 | OpenClaw is de MCP-server en stelt door de Gateway ondersteunde gesprekken beschikbaar via stdio.                                 |
| MCP-servers van derden opslaan voor door OpenClaw beheerde agentuitvoeringen        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw is het clientregister voor MCP-servers en projecteert die servers later naar geschikte runtimes.               |
| Een opgeslagen server controleren zonder een agentbeurt uit te voeren                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` en `doctor` inspecteren de configuratie; `probe` opent een live MCP-verbinding en vermeldt de mogelijkheden.               |
| MCP-configuratie vanuit een browser bewerken                                      | Control UI `/settings/mcp` (alias `/mcp`)                            | De pagina toont de inventaris, inschakeling, OAuth-/filtersamenvattingen, opdrachthints en een editor met het bereik `mcp`.         |
| Codex app-server een afgebakende native MCP-server geven                    | `mcp.servers.<name>.codex`                                           | Het blok `codex` beïnvloedt alleen de threadprojectie van Codex app-server en wordt verwijderd voordat de native configuratie wordt doorgegeven. |
| Door ACP gehoste harnassessies uitvoeren                                     | [`openclaw acp`](/nl/cli/acp) en [ACP-agenten](/nl/tools/acp-agents-setup) | De ACP-brugmodus accepteert geen injectie van MCP-servers per sessie; configureer in plaats daarvan Gateway-/Plugin-bruggen.     |

<Tip>
Als je niet zeker weet welk pad je nodig hebt, begin dan met `openclaw mcp status --verbose`. Hiermee zie je wat OpenClaw heeft opgeslagen zonder MCP-servers te starten.
</Tip>

## OpenClaw als een MCP-server

Dit is het pad `openclaw mcp serve`.

### Wanneer serve te gebruiken

Gebruik `openclaw mcp serve` wanneer:

- Codex, Claude Code of een andere MCP-client rechtstreeks moet communiceren met door OpenClaw ondersteunde kanaalgesprekken
- je al een lokale of externe OpenClaw Gateway met gerouteerde sessies hebt
- je één MCP-server wilt die met alle kanaalbackends van OpenClaw werkt, in plaats van afzonderlijke bruggen per kanaal uit te voeren

Gebruik in plaats daarvan [`openclaw acp`](/nl/cli/acp) wanneer OpenClaw zelf de programmeerruntime moet hosten en de agentsessie binnen OpenClaw moet houden.

### Hoe het werkt

`openclaw mcp serve` start een stdio-MCP-server. De MCP-client is eigenaar van dat proces. Zolang de client de stdio-sessie openhoudt, maakt de brug via WebSocket verbinding met een lokale of externe OpenClaw Gateway en stelt deze gerouteerde kanaalgesprekken beschikbaar via MCP.

<Steps>
  <Step title="Client start de brug">
    De MCP-client start `openclaw mcp serve`.
  </Step>
  <Step title="Brug maakt verbinding met Gateway">
    De brug maakt via WebSocket verbinding met de OpenClaw Gateway.
  </Step>
  <Step title="Sessies worden MCP-gesprekken">
    Gerouteerde sessies worden MCP-gesprekken en hulpmiddelen voor transcripties/geschiedenis.
  </Step>
  <Step title="Livegebeurtenissen worden in de wachtrij geplaatst">
    Livegebeurtenissen worden in het geheugen in de wachtrij geplaatst zolang de brug verbonden is.
  </Step>
  <Step title="Optionele Claude-push">
    Als de Claude-kanaalmodus is ingeschakeld, kan dezelfde sessie ook Claude-specifieke pushmeldingen ontvangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Belangrijk gedrag">
    - de status van de livewachtrij begint wanneer de brug verbinding maakt
    - oudere transcriptiegeschiedenis wordt gelezen met `messages_read`
    - Claude-pushmeldingen bestaan alleen zolang de MCP-sessie actief is
    - wanneer de client de verbinding verbreekt, wordt de brug afgesloten en verdwijnt de livewachtrij
    - eenmalige agentingangen zoals `openclaw agent` en `openclaw infer model run` sluiten alle gebundelde MCP-runtimes die ze openen af zodra het antwoord is voltooid, zodat herhaalde gescripte uitvoeringen geen onderliggende stdio-MCP-processen opstapelen
    - stdio-MCP-servers die door OpenClaw worden gestart (gebundeld of door de gebruiker geconfigureerd), worden bij het afsluiten als een procesboom beëindigd, zodat subprocessen die door de server zijn gestart niet blijven bestaan nadat de bovenliggende stdio-client is afgesloten
    - bij het verwijderen of opnieuw instellen van een sessie worden de MCP-clients van die sessie via het gedeelde opschoningspad voor runtimes opgeruimd, zodat er geen achtergebleven stdio-verbindingen aan een verwijderde sessie gekoppeld blijven

  </Accordion>
</AccordionGroup>

### Kies een clientmodus

<Tabs>
  <Tab title="Algemene MCP-clients">
    Alleen standaard MCP-hulpmiddelen. Gebruik `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` en de goedkeuringshulpmiddelen.
  </Tab>
  <Tab title="Claude Code">
    Standaard MCP-hulpmiddelen plus de Claude-specifieke kanaaladapter. Schakel `--claude-channel-mode on` in of behoud de standaardwaarde `auto`.
  </Tab>
</Tabs>

<Note>
Momenteel gedraagt `auto` zich hetzelfde als `on`. Er is nog geen detectie van clientmogelijkheden.
</Note>

### Wat serve beschikbaar stelt

De brug gebruikt bestaande routeringsmetadata van Gateway-sessies om door kanalen ondersteunde gesprekken beschikbaar te stellen. Een gesprek verschijnt wanneer OpenClaw al een sessiestatus heeft met een bekende route, zoals:

- `channel`
- metadata van ontvanger of bestemming
- optionele `accountId`
- optionele `threadId`

Dit biedt MCP-clients één plek om:

- recente gerouteerde gesprekken weer te geven
- recente transcriptiegeschiedenis te lezen
- op nieuwe inkomende gebeurtenissen te wachten
- een antwoord via dezelfde route terug te sturen
- goedkeuringsverzoeken te zien die binnenkomen terwijl de brug verbonden is

### Gebruik

<Tabs>
  <Tab title="Lokale Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Externe Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Externe Gateway (wachtwoord)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Uitgebreid / Claude uit">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Brughulpmiddelen

<AccordionGroup>
  <Accordion title="conversations_list">
    Geeft recente, door sessies ondersteunde gesprekken weer die al routeringsmetadata in de sessiestatus van de Gateway hebben.

    Filters: `limit` (max. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Retourneert één gesprek op basis van `session_key` via een rechtstreekse zoekactie naar een Gateway-sessie.
  </Accordion>
  <Accordion title="messages_read">
    Leest recente transcriptieberichten voor één door een sessie ondersteund gesprek. `limit` is standaard 20, maximaal 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extraheert niet-tekstuele inhoudsblokken van berichten uit één transcriptiebericht. Dit is een metadataweergave van transcriptie-inhoud, geen zelfstandige duurzame blobopslag voor bijlagen.
  </Accordion>
  <Accordion title="events_poll">
    Leest in de wachtrij geplaatste livegebeurtenissen vanaf een numerieke cursor. `limit` maximaal 200.
  </Accordion>
  <Accordion title="events_wait">
    Pollt langdurig totdat de volgende overeenkomende gebeurtenis in de wachtrij binnenkomt of een time-out verstrijkt (standaard 30s, maximaal 300s).

    Gebruik dit wanneer een algemene MCP-client bijna-realtimelevering nodig heeft zonder een Claude-specifiek pushprotocol.

  </Accordion>
  <Accordion title="messages_send">
    Stuurt tekst terug via dezelfde route die al voor de sessie is vastgelegd.

    Huidig gedrag:

    - vereist een bestaande gespreksroute
    - gebruikt het kanaal, de ontvanger, de account-id en de thread-id van de sessie
    - verzendt alleen tekst

  </Accordion>
  <Accordion title="permissions_list_open">
    Geeft openstaande goedkeuringsverzoeken voor exec/Plugin weer die de brug heeft waargenomen sinds deze verbinding maakte met de Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Handelt één openstaand goedkeuringsverzoek voor exec/Plugin af met:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Gebeurtenismodel

De brug houdt een gebeurteniswachtrij in het geheugen bij zolang deze verbonden is.

Huidige gebeurtenistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- de wachtrij is alleen live; deze begint wanneer de MCP-brug wordt gestart
- `events_poll` en `events_wait` spelen oudere Gateway-geschiedenis niet uit zichzelf opnieuw af
- een duurzame achterstand moet worden gelezen met `messages_read`

</Warning>

### Claude-kanaalmeldingen

De brug kan ook Claude-specifieke kanaalmeldingen beschikbaar stellen. Dit is het OpenClaw-equivalent van een Claude Code-kanaaladapter: standaard MCP-hulpmiddelen blijven beschikbaar, maar live inkomende berichten kunnen ook binnenkomen als Claude-specifieke MCP-meldingen.

<Tabs>
  <Tab title="uit">
    `--claude-channel-mode off`: alleen standaard MCP-hulpmiddelen.
  </Tab>
  <Tab title="aan">
    `--claude-channel-mode on`: Claude-kanaalmeldingen inschakelen.
  </Tab>
  <Tab title="automatisch (standaard)">
    `--claude-channel-mode auto`: huidige standaardwaarde; hetzelfde bruggedrag als `on`.
  </Tab>
</Tabs>

Wanneer de Claude-kanaalmodus is ingeschakeld, kondigt de server experimentele Claude-mogelijkheden aan en kan deze het volgende uitzenden:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Huidig gedrag van de brug:

- inkomende `user`-transcriptieberichten worden doorgestuurd als `notifications/claude/channel`
- Claude-machtigingsverzoeken die via MCP worden ontvangen, worden in het geheugen bijgehouden
- als de opdrachteigenaar in het gekoppelde gesprek later `yes <id>` of `no <id>` verzendt (`<id>` is de aanvraag-id van 5 letters, zonder `l`), zet de brug dit om naar `notifications/claude/channel/permission`
- deze meldingen gelden alleen voor de live sessie; als de MCP-client de verbinding verbreekt, is er geen pushdoel

Dit is bewust clientspecifiek. Algemene MCP-clients moeten vertrouwen op de standaard pollinghulpmiddelen.

### MCP-clientconfiguratie

Voorbeeldconfiguratie voor een stdio-client:

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

Begin voor de meeste generieke MCP-clients met het standaard tooloppervlak en negeer de Claude-modus. Schakel de Claude-modus alleen in voor clients die de Claude-specifieke meldingsmethoden daadwerkelijk begrijpen.

### Opties

`openclaw mcp serve` ondersteunt:

<ParamField path="--url" type="string">
  WebSocket-URL van de Gateway. Standaard `gateway.remote.url` wanneer geconfigureerd.
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
  Claude-meldingsmodus. Standaard `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Uitgebreide logboeken op stderr.
</ParamField>

<Tip>
Geef waar mogelijk de voorkeur aan `--token-file` of `--password-file` boven geheimen in de opdrachtregel.
</Tip>

### Beveiligings- en vertrouwensgrens

De bridge verzint geen routering. Deze stelt alleen gesprekken beschikbaar die de Gateway al kan routeren.

Dat betekent:

- toelatingslijsten voor afzenders, koppeling en vertrouwen op kanaalniveau blijven onderdeel van de onderliggende OpenClaw-kanaalconfiguratie
- `messages_send` kan alleen antwoorden via een bestaande opgeslagen route
- de goedkeuringsstatus is alleen live/in het geheugen beschikbaar voor de huidige bridgesessie
- bridge-authenticatie moet dezelfde Gateway-token- of wachtwoordcontroles gebruiken die je voor elke andere externe Gateway-client zou vertrouwen

Als een gesprek in `conversations_list` ontbreekt, ligt dat doorgaans niet aan de MCP-configuratie. De oorzaak is ontbrekende of onvolledige routeringsmetadata in de onderliggende Gateway-sessie.

### Testen

OpenClaw levert een deterministische Docker-rooktest voor deze bridge:

```bash
pnpm test:docker:mcp-channels
```

Die rooktest voert één container uit: de test vult de gespreksstatus, start de Gateway, start vervolgens `openclaw mcp serve` als een stdio-subproces en stuurt dit aan als MCP-client. De test verifieert gespreksdetectie, het lezen van transcripten, het lezen van bijlagemetadata, het gedrag van de wachtrij voor livegebeurtenissen en kanaal- en toestemmingsmeldingen in Claude-stijl via de echte stdio-MCP-bridge. Routering voor uitgaande verzending (`messages_send` waarbij de opgeslagen gespreksroute opnieuw wordt gebruikt) wordt afzonderlijk gedekt door unittests in `src/mcp/channel-server.test.ts`.

Dit is de snelste manier om te bewijzen dat de bridge werkt zonder een echt Telegram-, Discord- of iMessage-account in de testuitvoering op te nemen.

Zie [Testen](/nl/help/testing) voor een bredere testcontext.

### Probleemoplossing

<AccordionGroup>
  <Accordion title="Geen gesprekken geretourneerd">
    Dit betekent doorgaans dat de Gateway-sessie nog niet routeerbaar is. Controleer of de onderliggende sessie opgeslagen routeringsmetadata bevat voor kanaal/provider, ontvanger en optioneel account/thread.
  </Accordion>
  <Accordion title="events_poll of events_wait mist oudere berichten">
    Dit is te verwachten. De livewachtrij begint wanneer de bridge verbinding maakt. Lees oudere transcriptgeschiedenis met `messages_read`.
  </Accordion>
  <Accordion title="Claude-meldingen verschijnen niet">
    Controleer al het volgende:

    - de client heeft de stdio-MCP-sessie opengehouden
    - `--claude-channel-mode` is `on` of `auto`
    - de client begrijpt de Claude-specifieke meldingsmethoden daadwerkelijk
    - het inkomende bericht is ontvangen nadat de bridge verbinding maakte

  </Accordion>
  <Accordion title="Goedkeuringen ontbreken">
    `permissions_list_open` toont alleen goedkeuringsverzoeken die zijn waargenomen terwijl de bridge verbonden was. Het is geen duurzame API voor goedkeuringsgeschiedenis.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-clientregister

Dit is het pad voor `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` en `unset`.

Deze opdrachten stellen OpenClaw niet via MCP beschikbaar. Ze beheren door OpenClaw beheerde MCP-serverdefinities onder `mcp.servers` in de OpenClaw-configuratie. Ze lezen geen mcporter-servers uit `config/mcporter.json`.

Die opgeslagen definities zijn bedoeld voor runtimes die OpenClaw later start of configureert, zoals ingebedde OpenClaw en andere runtime-adapters. OpenClaw slaat de definities centraal op, zodat die runtimes geen eigen dubbele lijsten met MCP-servers hoeven bij te houden.

<AccordionGroup>
  <Accordion title="Belangrijk gedrag">
    - deze opdrachten lezen of schrijven alleen de OpenClaw-configuratie
    - `status`, `list`, `show`, `doctor` zonder `--probe`, `set`, `configure`, `tools`, `logout`, `reload` en `unset` maken geen verbinding met de doel-MCP-server
    - `login` voert de MCP OAuth-netwerkstroom uit voor de geconfigureerde HTTP-server en slaat de resulterende lokale aanmeldgegevens op
    - `status --verbose` toont informatie over het opgeloste transport, de authenticatie, time-out, filters en parallelle toolaanroepen zonder verbinding te maken
    - `doctor` controleert opgeslagen definities op lokale installatieproblemen, zoals ontbrekende stdio-opdrachten, ongeldige werkmappen, ontbrekende TLS-bestanden, uitgeschakelde servers, letterlijke gevoelige header-/omgevingswaarden en onvolledige OAuth-autorisatie
    - `doctor --probe` voegt hetzelfde bewijs van een liveverbinding toe als `probe` nadat de statische controles zijn geslaagd
    - `probe` maakt verbinding met de geselecteerde server of alle geconfigureerde servers, geeft tools weer en rapporteert mogelijkheden/diagnostiek
    - `add` bouwt een definitie op uit vlaggen en voert een test uit voordat deze wordt opgeslagen, tenzij `--no-probe` is ingesteld of eerst OAuth-autorisatie nodig is
    - runtime-adapters bepalen tijdens de uitvoering welke transportvormen ze daadwerkelijk ondersteunen
    - `enabled: false` houdt een server opgeslagen, maar sluit deze uit van detectie door de ingebedde runtime
    - `timeout` en `connectTimeout` stellen time-outs per server in seconden in voor verzoeken en verbindingen
    - `supportsParallelToolCalls: true` markeert servers die adapters gelijktijdig kunnen aanroepen
    - HTTP-servers kunnen statische headers, OAuth-aanmelding, beheer van TLS-verificatie en paden naar mTLS-certificaten/-sleutels gebruiken
    - ingebedde OpenClaw stelt geconfigureerde MCP-tools beschikbaar in normale toolprofielen voor `coding` en `messaging`; `minimal` verbergt ze nog steeds en `tools.deny: ["bundle-mcp"]` schakelt ze expliciet uit
    - `toolFilter.include` en `toolFilter.exclude` per server filteren gedetecteerde MCP-tools voordat ze OpenClaw-tools worden
    - servers die resources of prompts adverteren, stellen ook hulptools beschikbaar voor het weergeven/lezen van resources en het weergeven/ophalen van prompts; die gegenereerde hulpnamen (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) gebruiken hetzelfde insluitings-/uitsluitingsfilter
    - dynamische wijzigingen in de MCP-toollijst maken de gecachte catalogus voor die sessie ongeldig; bij de volgende detectie/het volgende gebruik wordt deze vanaf de server vernieuwd
    - herhaalde fouten bij MCP-toolrequests of in het protocol onderbreken die server kortstondig, zodat één defecte server niet de hele beurt verbruikt
    - sessiegebonden gebundelde MCP-runtimes worden na `mcp.sessionIdleTtlMs` milliseconden inactiviteit opgeruimd (standaard 10 minuten; stel `0` in om dit uit te schakelen) en eenmalige ingebedde uitvoeringen ruimen ze aan het einde van de uitvoering op

  </Accordion>
</AccordionGroup>

Runtime-adapters kunnen dit gedeelde register normaliseren naar de vorm die hun downstreamclient verwacht. Ingebedde OpenClaw gebruikt bijvoorbeeld rechtstreeks OpenClaw-waarden voor `transport`, terwijl Claude Code en Gemini CLI-eigen waarden voor `type` ontvangen, zoals `http`, `sse` of `stdio`.

Codex-app-server respecteert ook een optioneel `codex`-blok op elke server. Dit is
OpenClaw-projectiemetadata, uitsluitend voor Codex-app-serverthreads; deze wijzigt geen
ACP-sessies, generieke Codex-harnasconfiguratie of andere runtime-adapters.
Gebruik een niet-lege `codex.agents` om een server alleen naar specifieke OpenClaw-
agent-id's te projecteren. Lege, blanco of ongeldige agentlijsten worden door de configuratie-
validatie geweigerd en door het runtimeprojectiepad weggelaten in plaats van
globaal te worden. Gebruik `codex.defaultToolsApprovalMode` (`auto`, `prompt` of `approve`)
om de native `default_tools_approval_mode` van Codex voor een vertrouwde server uit te voeren.
OpenClaw verwijdert de `codex`-metadata voordat de native `mcp_servers`-
configuratie aan Codex wordt doorgegeven.

### Opgeslagen MCP-serverdefinities

Opdrachten:

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
- `show` zonder naam toont het volledige geconfigureerde MCP-serverobject.
- `status` classificeert geconfigureerde transporten zonder verbinding te maken. `--verbose` bevat opgeloste details over starten, time-outs, OAuth, filters en parallelle aanroepen.
- `doctor` voert statische controles uit zonder verbinding te maken. Voeg `--probe` toe wanneer de opdracht ook moet verifiëren dat ingeschakelde servers verbinding maken.
- `probe` maakt verbinding en rapporteert aantallen tools, ondersteuning voor resources/prompts, ondersteuning voor lijstwijzigingen en diagnostiek.
- `add` accepteert stdio-vlaggen zoals `--command`, `--arg`, `--env` en `--cwd`, of HTTP-vlaggen zoals `--url`, `--transport`, `--header`, `--auth oauth`, TLS-, time-out- en toolselectievlaggen.
- `set` verwacht één JSON-objectwaarde op de opdrachtregel.
- `configure` werkt de inschakeling, toolfilters, time-outs, OAuth, TLS en informatie voor parallelle toolaanroepen bij zonder de volledige serverdefinitie te vervangen. Voeg `--probe` toe om de bijgewerkte server te verifiëren voordat deze wordt opgeslagen.
- `tools` werkt toolfilters per server bij. Insluitings-/uitsluitingsvermeldingen zijn MCP-toolnamen en eenvoudige `*`-globpatronen.
- `login` voert de OAuth-stroom uit voor HTTP-servers die met `auth: "oauth"` zijn geconfigureerd. De eerste uitvoering toont een autorisatie-URL; voer de opdracht na goedkeuring opnieuw uit met `--code`.
- `logout` wist opgeslagen OAuth-aanmeldgegevens voor de genoemde server zonder de opgeslagen serverdefinitie te verwijderen.
- `reload` verwijdert gecachte MCP-runtimes in het proces alleen voor het huidige CLI-proces. Gateway- of agentprocessen in een ander proces hebben nog steeds hun eigen herlaad- of herstartpad nodig.
- Gebruik `transport: "streamable-http"` voor Streamable HTTP MCP-servers. `openclaw mcp set` normaliseert voor compatibiliteit ook de CLI-eigen `type: "http"` naar dezelfde canonieke configuratievorm.
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

Deze voorbeelden slaan alleen serverdefinities op. Voer daarna `openclaw mcp doctor --probe` uit om te verifiëren dat de server start en tools beschikbaar stelt.

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

    Beperk bestandssysteemservers tot de kleinste mappenstructuur die de agent moet kunnen lezen of bewerken.

  </Tab>
  <Tab title="Geheugen">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Gebruik een toolfilter als de server schrijftools beschikbaar stelt die niet toegankelijk mogen zijn voor normale agents.

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

    `doctor` controleert of `cwd` bestaat en of de opdracht vanuit de geconfigureerde omgeving kan worden gevonden.

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

    Gebruik OAuth wanneer de externe server dit ondersteunt. Als de server statische headers vereist, leg letterlijke bearertokens dan niet vast in een commit.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Servers voor directe desktopbesturing nemen de machtigingen over van het proces dat ze starten. Gebruik beperkte toolfilters en machtigingsprompts op besturingssysteemniveau.

  </Tab>
</Tabs>

### Structuren van JSON-uitvoer

Gebruik `--json` voor scripts en dashboards. Verzamelingen velden kunnen in de loop van de tijd groeien, dus consumers moeten onbekende sleutels negeren.

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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "OAuth-referenties zijn niet geautoriseerd; voer openclaw mcp login docs uit"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` wordt afgesloten met een niet-nulstatus wanneer een ingeschakelde, gecontroleerde server een probleem op `error`-niveau heeft. Problemen van het type `warning` en `info` worden gemeld, maar zorgen er op zichzelf niet voor dat de opdracht mislukt.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    `probe --json` opent een live MCP-clientsessie en drukt het resultaat rechtstreeks af; anders dan bij `status`/`doctor` heeft de uitvoer geen `path`-veld op het hoogste niveau. De sleutels `resources` en `prompts` zijn alleen aanwezig wanneer de server die mogelijkheid daadwerkelijk adverteert (een server zonder prompts laat de sleutel `prompts` weg in plaats van `false` te rapporteren). Gebruik `probe` als bewijs van bereikbaarheid en mogelijkheden, niet voor controles van statische configuratie.

  </Accordion>
</AccordionGroup>

Voorbeeld van een configuratiestructuur:

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

Start een lokaal onderliggend proces en communiceert via stdin/stdout.

| Veld                       | Beschrijving                              |
| -------------------------- | ----------------------------------------- |
| `command`                  | Uitvoerbaar bestand om te starten (vereist) |
| `args`                     | Reeks opdrachtregelargumenten             |
| `env`                      | Extra omgevingsvariabelen                 |
| `cwd` / `workingDirectory` | Werkmap voor het proces                   |

<Warning>
**Veiligheidsfilter voor stdio-omgevingsvariabelen**

OpenClaw weigert vóór het starten van een stdio-MCP-server omgevingssleutels voor het opstarten van interpreters, het kapen van loaders en shellinitialisatie, zelfs als ze in het `env`-blok van een server staan. Hiervoor wordt hetzelfde beveiligingsbeleid voor de hostomgeving gebruikt als voor andere door OpenClaw gestarte processen: bekende opstart-hooks voor interpreters worden geblokkeerd (bijvoorbeeld `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), evenals voorvoegsels voor het injecteren van gedeelde bibliotheken en functies (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) en vergelijkbare variabelen voor runtimebesturing. Bij het opstarten worden deze stilzwijgend verwijderd en wordt een waarschuwing gelogd, zodat ze geen impliciete prelude kunnen injecteren, de interpreter kunnen vervangen, een debugger kunnen inschakelen of de dynamische linker voor het stdio-proces kunnen kapen. Dankzij een expliciete toelatingslijst blijven gewone MCP-omgevingsvariabelen voor referenties bruikbaar (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), samen met gewone proxy- en serverspecifieke omgevingsvariabelen (`HTTP_PROXY`, aangepaste `*_API_KEY`, enzovoort). Andere `AWS_*`-sleutels, zoals `AWS_CONFIG_FILE` en `AWS_SHARED_CREDENTIALS_FILE`, blijven geblokkeerd omdat ze naar referentiebestanden verwijzen in plaats van rechtstreeks een referentiewaarde te bevatten.

Als je MCP-server echt een van de geblokkeerde variabelen nodig heeft, stel je deze in voor het hostproces van de Gateway in plaats van onder `env` van de stdio-server.
</Warning>

### SSE-/HTTP-transport

Maakt via HTTP Server-Sent Events verbinding met een externe MCP-server.

| Veld                           | Beschrijving                                                              |
| ------------------------------ | ------------------------------------------------------------------------- |
| `url`                          | HTTP- of HTTPS-URL van de externe server (vereist)                        |
| `headers`                      | Optionele sleutel-waardetoewijzing van HTTP-headers (bijvoorbeeld auth-tokens) |
| `connectionTimeoutMs`          | Verbindingstime-out per server in ms (optioneel)                          |
| `connectTimeout`               | Verbindingstime-out per server in seconden (optioneel)                    |
| `timeout` / `requestTimeoutMs` | Time-out voor MCP-verzoeken per server in seconden of ms                  |
| `auth: "oauth"`                | Gebruik MCP-OAuth-referenties die door `openclaw mcp login` zijn opgeslagen |
| `sslVerify`                    | Stel alleen in op false voor expliciet vertrouwde privé-HTTPS-eindpunten  |
| `clientCert` / `clientKey`     | Paden naar mTLS-clientcertificaat en -sleutel                             |
| `supportsParallelToolCalls`    | Aanwijzing dat gelijktijdige aanroepen veilig zijn voor deze server       |

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

Gevoelige waarden in `url` (gebruikersinfo) en `headers` worden in logboeken en statusuitvoer geredigeerd. `openclaw mcp doctor` waarschuwt wanneer `headers`- of `env`-items die gevoelig lijken letterlijke waarden bevatten, zodat operators die waarden uit vastgelegde configuratie kunnen verwijderen.

### OAuth-workflow

OAuth is bedoeld voor HTTP-MCP-servers die de MCP-OAuth-stroom adverteren. Statische `Authorization`-headers worden voor een server genegeerd zolang `auth: "oauth"` is ingeschakeld. Referenties die door `openclaw mcp login` zijn opgeslagen, werken met ingebedde MCP, CLI-runners en de lokale Codex-appserver.

Totdat referenties beschikbaar zijn, laat OpenClaw alleen die MCP-server weg uit de agentruntime, in plaats van de agentbeurt te laten mislukken. De operator, of een agent met shelltoegang, kan vervolgens `openclaw mcp login <name>` uitvoeren en de server tijdens een latere beurt gebruiken.

Wanneer een externe MCP-service al wordt ondersteund door een afzonderlijk OpenClaw-auth-profiel dat kan vernieuwen, kun je optioneel `oauth.authProfileId` instellen. OpenClaw vernieuwt een van beide bronnen van referenties vóór de runtimeprojectie en geeft alleen het huidige toegangstoken door aan de onderliggende MCP-client.

<Steps>
  <Step title="De server opslaan">
    Voeg de server toe of werk deze bij met `auth: "oauth"` en eventuele optionele OAuth-metagegevens.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Sla voor een bearer die door een auth-profiel wordt ondersteund de profielkoppeling op:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Aanmelden starten">
    Voer de aanmelding uit om het autorisatieverzoek te maken.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw drukt de autorisatie-URL af en slaat de tijdelijke OAuth-verificatiestatus op in de OpenClaw-statusmap.

  </Step>
  <Step title="Voltooien met de code">
    Nadat je in de browser toestemming hebt gegeven, geef je de geretourneerde code terug aan OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Autorisatie controleren">
    Gebruik status of doctor om te bevestigen dat tokens aanwezig zijn.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Referenties wissen">
    Uitloggen verwijdert opgeslagen OAuth-referenties, maar behoudt de opgeslagen serverdefinitie.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Als de provider tokens roteert of de autorisatiestatus vastloopt, voer je `openclaw mcp logout <name>` uit en herhaal je vervolgens `login`. `logout` kan referenties voor een opgeslagen HTTP-server wissen, zelfs nadat `auth: "oauth"` uit de configuratie is verwijderd, zolang de servernaam en URL de vermelding in de referentieopslag nog steeds identificeren.

### Streamable HTTP-transport

`streamable-http` is een aanvullende transportoptie naast `sse` en `stdio`. Deze gebruikt HTTP-streaming voor bidirectionele communicatie met externe MCP-servers.

| Veld                           | Beschrijving                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | HTTP- of HTTPS-URL van de externe server (vereist)                                     |
| `transport`                    | Stel in op `"streamable-http"` om dit transport te selecteren; indien weggelaten gebruikt OpenClaw `sse` |
| `headers`                      | Optionele sleutel-waardetoewijzing van HTTP-headers (bijvoorbeeld authenticatietokens) |
| `connectionTimeoutMs`          | Verbindingstime-out per server in ms (optioneel)                                       |
| `connectTimeout`               | Verbindingstime-out per server in seconden (optioneel)                                 |
| `timeout` / `requestTimeoutMs` | Time-out voor MCP-verzoeken per server in seconden of ms                               |
| `auth: "oauth"`                | Gebruik MCP OAuth-referenties die zijn opgeslagen door `openclaw mcp login`              |
| `sslVerify`                    | Stel alleen in op false voor expliciet vertrouwde privé-HTTPS-eindpunten                |
| `clientCert` / `clientKey`     | Paden naar het mTLS-clientcertificaat en de sleutel                                    |
| `supportsParallelToolCalls`    | Geeft aan dat gelijktijdige aanroepen veilig zijn voor deze server                     |

De OpenClaw-configuratie gebruikt `transport: "streamable-http"` als de canonieke spelling. CLI-native MCP-waarden voor `type: "http"` worden geaccepteerd wanneer ze via `openclaw mcp set` worden opgeslagen en worden door `openclaw doctor --fix` in bestaande configuraties hersteld, maar `transport` is wat het ingebedde OpenClaw rechtstreeks gebruikt.

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
Registeropdrachten starten de kanaalbridge niet. Alleen `probe` en `doctor --probe` openen een live MCP-clientsessie om te bewijzen dat de doelserver bereikbaar is.
</Note>

## Control UI

De Control UI in de browser bevat een speciale pagina met MCP-instellingen op `/settings/mcp`; het eerdere pad `/mcp` blijft als alias bestaan. De pagina toont aantallen geconfigureerde servers, samenvattingen van ingeschakelde servers, OAuth en filters, transportrijen per server, bedieningselementen om servers in of uit te schakelen, algemene CLI-opdrachten en een editor met een beperkt bereik voor de configuratiesectie `mcp`.

Gebruik de pagina voor wijzigingen door operators en een snel overzicht. Gebruik `openclaw mcp doctor --probe` of `openclaw mcp probe` wanneer je live bewijs van de server nodig hebt.

Werkstroom voor operators:

1. Open de Control UI en kies **MCP**.
2. Bekijk de overzichtskaarten voor het totale aantal, ingeschakelde servers, OAuth en gefilterde servers.
3. Gebruik elke serverrij voor informatie over transport, authenticatie, filters, time-outs en opdrachten.
4. Schakel de server in of uit wanneer je een definitie wilt behouden maar deze van runtime-detectie wilt uitsluiten.
5. Bewerk de configuratiesectie `mcp` met beperkt bereik voor structurele wijzigingen, zoals nieuwe servers, headers, TLS, OAuth-metadata of toolfilters.
6. Kies **Save** om alleen de configuratie op te slaan, of **Save & Publish** om deze via het configuratiepad van de Gateway toe te passen.
7. Voer `openclaw mcp doctor --probe` uit wanneer je live bewijs nodig hebt dat de bewerkte server start en tools weergeeft.

Opmerkingen:

- opdrachtfragmenten plaatsen servernamen tussen aanhalingstekens, zodat ongebruikelijke namen in een shell kopieerbaar blijven
- weergegeven URL-achtige waarden worden vóór het renderen geredigeerd wanneer ze ingesloten referenties bevatten
- de pagina start zelf geen MCP-transporten
- actieve runtimes hebben mogelijk `openclaw mcp reload`, publicatie van de Gateway-configuratie of een herstart van het proces nodig, afhankelijk van welk proces eigenaar is van de MCP-clients

## MCP Apps

OpenClaw kan tools renderen die de stabiele [MCP Apps-extensie](https://modelcontextprotocol.io/extensions/apps) implementeren. Apps zijn opt-in, omdat hun HTML afkomstig is van de geconfigureerde MCP-server en zij vanaf diezelfde server om voor de app zichtbare tools of resources kunnen vragen.

Schakel de hostbridge in:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Herstart de Gateway nadat je deze instelling hebt gewijzigd. Wanneer deze is ingeschakeld, start OpenClaw een HTTP(S)-listener die uitsluitend voor de sandbox is bedoeld, op de Gateway-poort plus één (voor de standaard-Gateway: `18790`). De Control UI laadt Apps vanaf die afzonderlijke origin; de listener biedt nooit de Control UI, geauthenticeerde Gateway-routes of gebruikersgegevens aan.

Directe Gateway-verbindingen hebben toegang tot beide poorten nodig. Als een reverse proxy of TLS-terminator de Control UI beschikbaar stelt, geef Apps dan een eigen openbare origin en stuur alleen die origin via een proxy door naar de sandboxlistener:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

De sandbox-origin moet verschillen van de origin van de Control UI. Host daarop geen andere geauthenticeerde of gevoelige inhoud.

De officiële eenvoudige React-demo kan bijvoorbeeld als volgt worden geconfigureerd:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Gedrag en beveiligingsgrenzen:

- OpenClaw kondigt de extensie `io.modelcontextprotocol/ui` alleen aan wanneer Apps zijn ingeschakeld.
- Alleen resources van `ui://` met exact het MIME-type `text/html;profile=mcp-app` worden gerenderd.
- UI-resources zijn beperkt tot 2 MiB, worden achter een dubbele iframe-proxy op een afzonderlijke buitenste origin geplaatst, in een ondoorzichtige binnenste App-origin geladen en beperkt door een CSP die is afgeleid van de resourcemetadata.
- Tools die uitsluitend voor Apps zijn bedoeld (`_meta.ui.visibility: ["app"]`), blijven buiten de lijst met modeltools. Apps kunnen alleen voor de app zichtbare tools op hun eigen server aanroepen die ook voldoen aan het effectieve OpenClaw-toolbeleid voor de uitvoering die de weergave heeft gemaakt.
- Aan een origin gebonden App-machtigingen, zoals camera, microfoon en geolocatie, worden niet verleend zolang binnenste App-documenten ondoorzichtige origins gebruiken voor isolatie tussen Apps.
- App-HTML, volledige toolargumenten en onbewerkte resultaten bevinden zich in een begrensde weergavelease van tien minuten in het geheugen en worden niet naar schijf geschreven of naar metadata voor transcriptvoorbeelden gekopieerd. Het transcript slaat alleen een begrensde server-, tool- en resourcebeschrijving op die aan de oorspronkelijke toolaanroep-ID is gekoppeld. Na een herstart van de Gateway kan de Control UI die beschrijving verifiëren aan de hand van het geauthenticeerde sessietranscript en de resource `ui://` opnieuw ophalen; gereconstrueerde weergaven zijn alleen-lezen totdat een nieuwe uitvoering actuele toolmachtigingen vastlegt.
- `openclaw security audit` waarschuwt zolang de bridge is ingeschakeld. Schakel deze uit met `openclaw config set mcp.apps.enabled false --strict-json` wanneer deze niet nodig is.

## Huidige beperkingen

Deze pagina documenteert de bridge zoals die momenteel wordt geleverd.

Huidige beperkingen:

- gespreksdetectie is afhankelijk van bestaande routemetadata van Gateway-sessies
- geen generiek pushprotocol naast de Claude-specifieke adapter
- nog geen tools voor het bewerken van berichten of het toevoegen van reacties
- HTTP/SSE/streamable-http-transport maakt verbinding met één externe server; nog geen gemultiplexte upstream
- `permissions_list_open` bevat alleen goedkeuringen die zijn waargenomen terwijl de bridge verbonden is

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Plugins](/nl/cli/plugins)
