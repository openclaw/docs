---
read_when:
    - Codex, Claude Code of een andere MCP-client verbinden met door OpenClaw ondersteunde kanalen
    - Wordt uitgevoerd `openclaw mcp serve`
    - Door OpenClaw opgeslagen MCP-serverdefinities beheren
sidebarTitle: MCP
summary: Stel OpenClaw-kanaalgesprekken beschikbaar via MCP en beheer opgeslagen MCP-serverdefinities
title: MCP
x-i18n:
    generated_at: "2026-04-29T22:33:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` heeft twee taken:

- OpenClaw uitvoeren als MCP-server met `openclaw mcp serve`
- door OpenClaw beheerde uitgaande MCP-serverdefinities beheren met `list`, `show`, `set` en `unset`

Met andere woorden:

- `serve` is OpenClaw dat optreedt als MCP-server
- `list` / `show` / `set` / `unset` is OpenClaw dat optreedt als MCP-clientzijdig register voor andere MCP-servers die de runtimes later kunnen gebruiken

Gebruik [`openclaw acp`](/nl/cli/acp) wanneer OpenClaw zelf een coding-harnesssessie moet hosten en die runtime via ACP moet routeren.

## OpenClaw als MCP-server

Dit is het `openclaw mcp serve`-pad.

### Wanneer `serve` gebruiken

Gebruik `openclaw mcp serve` wanneer:

- Codex, Claude Code of een andere MCP-client rechtstreeks moet praten met door OpenClaw ondersteunde kanaalgesprekken
- je al een lokale of externe OpenClaw Gateway met gerouteerde sessies hebt
- je één MCP-server wilt die werkt met de kanaalbackends van OpenClaw, in plaats van afzonderlijke bruggen per kanaal uit te voeren

Gebruik in plaats daarvan [`openclaw acp`](/nl/cli/acp) wanneer OpenClaw zelf de coding-runtime moet hosten en de agentsessie binnen OpenClaw moet houden.

### Hoe het werkt

`openclaw mcp serve` start een stdio-MCP-server. De MCP-client beheert dat proces. Zolang de client de stdio-sessie openhoudt, maakt de brug via WebSocket verbinding met een lokale of externe OpenClaw Gateway en stelt gerouteerde kanaalgesprekken beschikbaar via MCP.

<Steps>
  <Step title="Client spawns the bridge">
    De MCP-client start `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    De brug maakt via WebSocket verbinding met de OpenClaw Gateway.
  </Step>
  <Step title="Sessions become MCP conversations">
    Gerouteerde sessies worden MCP-gesprekken en transcript-/geschiedenistools.
  </Step>
  <Step title="Live events queue">
    Live-gebeurtenissen worden in het geheugen in de wachtrij geplaatst terwijl de brug verbonden is.
  </Step>
  <Step title="Optional Claude push">
    Als Claude-kanaalmodus is ingeschakeld, kan dezelfde sessie ook Claude-specifieke pushmeldingen ontvangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - live-wachtrijstatus begint wanneer de brug verbinding maakt
    - oudere transcriptgeschiedenis wordt gelezen met `messages_read`
    - Claude-pushmeldingen bestaan alleen zolang de MCP-sessie actief is
    - wanneer de client de verbinding verbreekt, wordt de brug afgesloten en verdwijnt de live-wachtrij
    - eenmalige agentingangspunten zoals `openclaw agent` en `openclaw infer model run` ruimen alle gebundelde MCP-runtimes op die ze openen wanneer het antwoord is voltooid, zodat herhaalde gescripte runs geen stdio-MCP-kindprocessen ophopen
    - stdio-MCP-servers die door OpenClaw worden gestart (gebundeld of door de gebruiker geconfigureerd) worden bij afsluiten als procesboom beëindigd, zodat kindsubprocessen die door de server zijn gestart niet blijven bestaan nadat de bovenliggende stdio-client is afgesloten
    - het verwijderen of resetten van een sessie ruimt de MCP-clients van die sessie op via het gedeelde runtime-opruimpad, zodat er geen achterblijvende stdio-verbindingen aan een verwijderde sessie gekoppeld blijven

  </Accordion>
</AccordionGroup>

### Kies een clientmodus

Gebruik dezelfde brug op twee verschillende manieren:

<Tabs>
  <Tab title="Generic MCP clients">
    Alleen standaard MCP-tools. Gebruik `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` en de goedkeuringstools.
  </Tab>
  <Tab title="Claude Code">
    Standaard MCP-tools plus de Claude-specifieke kanaaladapter. Schakel `--claude-channel-mode on` in of laat de standaardwaarde `auto` staan.
  </Tab>
</Tabs>

<Note>
Vandaag gedraagt `auto` zich hetzelfde als `on`. Er is nog geen detectie van clientmogelijkheden.
</Note>

### Wat `serve` beschikbaar maakt

De brug gebruikt bestaande routeringsmetadata van Gateway-sessies om kanaalgebaseerde gesprekken beschikbaar te maken. Een gesprek verschijnt wanneer OpenClaw al sessiestatus heeft met een bekende route, zoals:

- `channel`
- ontvanger- of bestemmingsmetadata
- optionele `accountId`
- optionele `threadId`

Dit geeft MCP-clients één plek om:

- recente gerouteerde gesprekken weer te geven
- recente transcriptgeschiedenis te lezen
- te wachten op nieuwe inkomende gebeurtenissen
- een antwoord terug te sturen via dezelfde route
- goedkeuringsverzoeken te zien die binnenkomen terwijl de brug verbonden is

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

### Brugtools

De huidige brug maakt deze MCP-tools beschikbaar:

<AccordionGroup>
  <Accordion title="conversations_list">
    Geeft recente sessiegebaseerde gesprekken weer die al routeringsmetadata in Gateway-sessiestatus hebben.

    Handige filters:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Retourneert één gesprek op basis van `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Leest recente transcriptberichten voor één sessiegebaseerd gesprek.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extraheert niet-tekstuele berichtinhoudsblokken uit één transcriptbericht. Dit is een metadataweergave over transcriptinhoud, geen zelfstandige duurzame opslag voor bijlageblobs.
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
    - verstuurt alleen tekst

  </Accordion>
  <Accordion title="permissions_list_open">
    Geeft openstaande exec-/Plugin-goedkeuringsverzoeken weer die de brug heeft waargenomen sinds deze verbinding maakte met de Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Lost één openstaand exec-/Plugin-goedkeuringsverzoek op met:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Gebeurtenismodel

De brug houdt een gebeurteniswachtrij in het geheugen bij terwijl deze verbonden is.

Huidige gebeurtenistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- de wachtrij is alleen live; deze begint wanneer de MCP-brug start
- `events_poll` en `events_wait` spelen zelf geen oudere Gateway-geschiedenis opnieuw af
- duurzame achterstand moet worden gelezen met `messages_read`

</Warning>

### Claude-kanaalmeldingen

De brug kan ook Claude-specifieke kanaalmeldingen beschikbaar maken. Dit is het OpenClaw-equivalent van een Claude Code-kanaaladapter: standaard MCP-tools blijven beschikbaar, maar live inkomende berichten kunnen ook binnenkomen als Claude-specifieke MCP-meldingen.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: alleen standaard MCP-tools.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude-kanaalmeldingen inschakelen.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: huidige standaardwaarde; hetzelfde bruggedrag als `on`.
  </Tab>
</Tabs>

Wanneer Claude-kanaalmodus is ingeschakeld, adverteert de server experimentele Claude-mogelijkheden en kan deze het volgende verzenden:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Huidig bruggedrag:

- inkomende `user`-transcriptberichten worden doorgestuurd als `notifications/claude/channel`
- Claude-machtigingsverzoeken die via MCP worden ontvangen, worden in het geheugen bijgehouden
- als het gekoppelde gesprek later `yes abcde` of `no abcde` verzendt, zet de brug dat om naar `notifications/claude/channel/permission`
- deze meldingen zijn alleen voor de live-sessie; als de MCP-client de verbinding verbreekt, is er geen pushdoel

Dit is bewust clientspecifiek. Generieke MCP-clients moeten vertrouwen op de standaard pollingtools.

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

Begin voor de meeste generieke MCP-clients met het standaard tooloppervlak en negeer Claude-modus. Schakel Claude-modus alleen in voor clients die de Claude-specifieke meldingsmethoden daadwerkelijk begrijpen.

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
Geef waar mogelijk de voorkeur aan `--token-file` of `--password-file` boven inline geheimen.
</Tip>

### Beveiliging en vertrouwensgrens

De brug bedenkt geen routering. Deze maakt alleen gesprekken beschikbaar waarvan Gateway al weet hoe ze moeten worden gerouteerd.

Dat betekent:

- afzender-allowlists, pairing en vertrouwen op kanaalniveau blijven behoren tot de onderliggende OpenClaw-kanaalconfiguratie
- `messages_send` kan alleen antwoorden via een bestaande opgeslagen route
- goedkeuringsstatus is alleen live/in-memory voor de huidige brugsessie
- brugauthenticatie moet dezelfde Gateway-token- of wachtwoordcontroles gebruiken die je voor elke andere externe Gateway-client zou vertrouwen

Als een gesprek ontbreekt in `conversations_list`, is de gebruikelijke oorzaak niet de MCP-configuratie. Het gaat om ontbrekende of onvolledige routeringsmetadata in de onderliggende Gateway-sessie.

### Testen

OpenClaw levert een deterministische Docker-smoke voor deze brug:

```bash
pnpm test:docker:mcp-channels
```

Die smoke:

- start een vooraf gevulde Gateway-container
- start een tweede container die `openclaw mcp serve` start
- verifieert gespreksdetectie, transcriptlezingen, metadatalezingen van bijlagen, gedrag van de live-gebeurteniswachtrij en routering van uitgaande verzending
- valideert Claude-achtige kanaal- en machtigingsmeldingen via de echte stdio-MCP-brug

Dit is de snelste manier om te bewijzen dat de brug werkt zonder een echt Telegram-, Discord- of iMessage-account in de testrun te configureren.

Zie [Testen](/nl/help/testing) voor bredere testcontext.

### Probleemoplossing

<AccordionGroup>
  <Accordion title="No conversations returned">
    Betekent meestal dat de Gateway-sessie nog niet routeerbaar is. Bevestig dat de onderliggende sessie opgeslagen kanaal-/providermetadata, ontvanger en optionele account-/threadrouteringsmetadata heeft.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    Verwacht. De live-wachtrij begint wanneer de brug verbinding maakt. Lees oudere transcriptgeschiedenis met `messages_read`.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    Controleer al het volgende:

    - de client hield de stdio-MCP-sessie open
    - `--claude-channel-mode` is `on` of `auto`
    - de client begrijpt de Claude-specifieke meldingsmethoden daadwerkelijk
    - het inkomende bericht vond plaats nadat de brug verbinding had gemaakt

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` toont alleen goedkeuringsverzoeken die zijn waargenomen terwijl de brug verbonden was. Het is geen duurzame API voor goedkeuringsgeschiedenis.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-clientregister

Dit is het pad voor `openclaw mcp list`, `show`, `set` en `unset`.

Deze opdrachten stellen OpenClaw niet beschikbaar via MCP. Ze beheren MCP-serverdefinities die eigendom zijn van OpenClaw onder `mcp.servers` in de OpenClaw-configuratie.

Die opgeslagen definities zijn bedoeld voor runtimes die OpenClaw later start of configureert, zoals ingebedde Pi en andere runtimeadapters. OpenClaw slaat de definities centraal op zodat die runtimes niet hun eigen dubbele lijsten met MCP-servers hoeven bij te houden.

<AccordionGroup>
  <Accordion title="Important behavior">
    - deze opdrachten lezen of schrijven alleen OpenClaw-configuratie
    - ze maken geen verbinding met de doel-MCP-server
    - ze valideren niet of de opdracht, URL of remote transport nu bereikbaar is
    - runtimeadapters bepalen tijdens uitvoering welke transportvormen ze daadwerkelijk ondersteunen
    - ingebedde Pi stelt geconfigureerde MCP-tools beschikbaar in normale toolprofielen voor `coding` en `messaging`; `minimal` verbergt ze nog steeds, en `tools.deny: ["bundle-mcp"]` schakelt ze expliciet uit
    - sessiegebonden gebundelde MCP-runtimes worden opgeruimd na `mcp.sessionIdleTtlMs` milliseconden inactiviteit (standaard 10 minuten; stel `0` in om dit uit te schakelen) en eenmalige ingebedde runs ruimen ze op aan het einde van de run

  </Accordion>
</AccordionGroup>

Runtimeadapters kunnen dit gedeelde register normaliseren naar de vorm die hun downstreamclient verwacht. Ingebedde Pi gebruikt bijvoorbeeld OpenClaw-waarden voor `transport` rechtstreeks, terwijl Claude Code en Gemini CLI-native waarden voor `type` ontvangen, zoals `http`, `sse` of `stdio`.

### Opgeslagen MCP-serverdefinities

OpenClaw slaat ook een lichtgewicht MCP-serverregister op in de configuratie voor oppervlakken die door OpenClaw beheerde MCP-definities willen gebruiken.

Opdrachten:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Opmerkingen:

- `list` sorteert servernamen.
- `show` zonder naam drukt het volledige geconfigureerde MCP-serverobject af.
- `set` verwacht één JSON-objectwaarde op de opdrachtregel.
- Gebruik `transport: "streamable-http"` voor Streamable HTTP MCP-servers. `openclaw mcp set` normaliseert ook CLI-native `type: "http"` naar dezelfde canonieke configuratievorm voor compatibiliteit.
- `unset` mislukt als de genoemde server niet bestaat.

Voorbeelden:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

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
        "transport": "streamable-http"
      }
    }
  }
}
```

### Stdio-transport

Start een lokaal childproces en communiceert via stdin/stdout.

| Veld                       | Beschrijving                                  |
| -------------------------- | --------------------------------------------- |
| `command`                  | Uitvoerbaar bestand om te starten (vereist)   |
| `args`                     | Array met opdrachtregelargumenten             |
| `env`                      | Extra omgevingsvariabelen                     |
| `cwd` / `workingDirectory` | Werkmap voor het proces                       |

<Warning>
**Veiligheidsfilter voor stdio-env**

OpenClaw weigert env-sleutels voor interpreteropstart die kunnen wijzigen hoe een stdio-MCP-server opstart vóór de eerste RPC, zelfs als ze in het `env`-blok van een server voorkomen. Geblokkeerde sleutels zijn onder meer `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` en vergelijkbare runtimebesturingsvariabelen. Opstarten weigert deze met een configuratiefout, zodat ze geen impliciete prelude kunnen injecteren, de interpreter kunnen vervangen of een debugger tegen het stdio-proces kunnen inschakelen. Gewone referentie-, proxy- en serverspecifieke env-vars (`GITHUB_TOKEN`, `HTTP_PROXY`, aangepaste `*_API_KEY`, enz.) worden niet beïnvloed.

Als je MCP-server echt een van de geblokkeerde variabelen nodig heeft, stel die dan in op het Gateway-hostproces in plaats van onder de `env` van de stdio-server.
</Warning>

### SSE / HTTP-transport

Maakt verbinding met een externe MCP-server via HTTP Server-Sent Events.

| Veld                  | Beschrijving                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `url`                 | HTTP- of HTTPS-URL van de externe server (vereist)                        |
| `headers`             | Optionele sleutel-waardemap met HTTP-headers (bijvoorbeeld authtokens)    |
| `connectionTimeoutMs` | Verbindingstime-out per server in ms (optioneel)                          |

Voorbeeld:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Gevoelige waarden in `url` (userinfo) en `headers` worden geredigeerd in logs en statusuitvoer.

### Streamable HTTP-transport

`streamable-http` is een extra transportoptie naast `sse` en `stdio`. Het gebruikt HTTP-streaming voor bidirectionele communicatie met externe MCP-servers.

| Veld                  | Beschrijving                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `url`                 | HTTP- of HTTPS-URL van de externe server (vereist)                                                   |
| `transport`           | Stel in op `"streamable-http"` om dit transport te selecteren; als dit ontbreekt, gebruikt OpenClaw `sse` |
| `headers`             | Optionele sleutel-waardemap met HTTP-headers (bijvoorbeeld authtokens)                               |
| `connectionTimeoutMs` | Verbindingstime-out per server in ms (optioneel)                                                     |

OpenClaw-configuratie gebruikt `transport: "streamable-http"` als canonieke spelling. CLI-native MCP-waarden voor `type: "http"` worden geaccepteerd wanneer ze via `openclaw mcp set` worden opgeslagen en door `openclaw doctor --fix` in bestaande configuratie worden gerepareerd, maar `transport` is wat ingebedde Pi rechtstreeks gebruikt.

Voorbeeld:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Deze opdrachten beheren alleen opgeslagen configuratie. Ze starten de channel bridge niet, openen geen live MCP-clientsessie en bewijzen niet dat de doelserver bereikbaar is.
</Note>

## Huidige beperkingen

Deze pagina documenteert de bridge zoals die vandaag is geleverd.

Huidige beperkingen:

- gespreksdetectie is afhankelijk van bestaande route-metadata van Gateway-sessies
- geen generiek pushprotocol buiten de Claude-specifieke adapter
- nog geen tools om berichten te bewerken of erop te reageren
- HTTP/SSE/streamable-http-transport maakt verbinding met één externe server; nog geen gemultiplexte upstream
- `permissions_list_open` bevat alleen goedkeuringen die zijn waargenomen terwijl de bridge verbonden is

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Plugins](/nl/cli/plugins)
