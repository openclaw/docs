---
read_when:
    - Codex, Claude Code of een andere MCP-client verbinden met kanalen die door OpenClaw worden ondersteund
    - Uitvoeren van `openclaw mcp serve`
    - Door OpenClaw opgeslagen MCP-serverdefinities beheren
sidebarTitle: MCP
summary: Stel OpenClaw-kanaalgesprekken beschikbaar via MCP en beheer opgeslagen MCP-serverdefinities
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:41:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` heeft twee taken:

- OpenClaw uitvoeren als een MCP-server met `openclaw mcp serve`
- door OpenClaw beheerde uitgaande MCP-serverdefinities beheren met `list`, `show`, `set` en `unset`

Met andere woorden:

- `serve` is OpenClaw dat optreedt als MCP-server
- `list` / `show` / `set` / `unset` is OpenClaw dat optreedt als MCP-clientzijdig register voor andere MCP-servers die de runtimes later kunnen gebruiken

Gebruik [`openclaw acp`](/nl/cli/acp) wanneer OpenClaw zelf een codeerharness-sessie moet hosten en die runtime via ACP moet routeren.

## OpenClaw als MCP-server

Dit is het `openclaw mcp serve`-pad.

### Wanneer `serve` gebruiken

Gebruik `openclaw mcp serve` wanneer:

- Codex, Claude Code of een andere MCP-client rechtstreeks moet praten met door OpenClaw ondersteunde kanaalgesprekken
- je al een lokale of externe OpenClaw Gateway met gerouteerde sessies hebt
- je één MCP-server wilt die werkt over de kanaalbackends van OpenClaw heen in plaats van afzonderlijke bruggen per kanaal uit te voeren

Gebruik in plaats daarvan [`openclaw acp`](/nl/cli/acp) wanneer OpenClaw zelf de codeerruntime moet hosten en de agentsessie binnen OpenClaw moet houden.

### Hoe het werkt

`openclaw mcp serve` start een stdio MCP-server. De MCP-client is eigenaar van dat proces. Zolang de client de stdio-sessie openhoudt, maakt de brug verbinding met een lokale of externe OpenClaw Gateway via WebSocket en stelt gerouteerde kanaalgesprekken beschikbaar via MCP.

<Steps>
  <Step title="Client start de brug">
    De MCP-client start `openclaw mcp serve`.
  </Step>
  <Step title="Brug maakt verbinding met Gateway">
    De brug maakt via WebSocket verbinding met de OpenClaw Gateway.
  </Step>
  <Step title="Sessies worden MCP-gesprekken">
    Gerouteerde sessies worden MCP-gesprekken en transcript-/geschiedenistools.
  </Step>
  <Step title="Livegebeurtenissen worden in de wachtrij gezet">
    Livegebeurtenissen worden in het geheugen in de wachtrij gezet terwijl de brug verbonden is.
  </Step>
  <Step title="Optionele Claude-push">
    Als de Claude-kanaalmodus is ingeschakeld, kan dezelfde sessie ook Claude-specifieke pushmeldingen ontvangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Belangrijk gedrag">
    - livewachtrijstatus begint wanneer de brug verbinding maakt
    - oudere transcriptgeschiedenis wordt gelezen met `messages_read`
    - Claude-pushmeldingen bestaan alleen zolang de MCP-sessie actief is
    - wanneer de client de verbinding verbreekt, sluit de brug af en is de livewachtrij weg
    - eenmalige agentingangen zoals `openclaw agent` en `openclaw infer model run` ruimen alle gebundelde MCP-runtimes op die ze openen wanneer het antwoord is voltooid, zodat herhaalde gescripte runs geen stdio MCP-childprocessen opstapelen
    - stdio MCP-servers die door OpenClaw worden gestart (gebundeld of door de gebruiker geconfigureerd) worden bij het afsluiten als procesboom beëindigd, zodat childprocessen die door de server zijn gestart niet blijven bestaan nadat de bovenliggende stdio-client afsluit
    - het verwijderen of resetten van een sessie ruimt de MCP-clients van die sessie op via het gedeelde runtime-opruimpad, zodat er geen achterblijvende stdio-verbindingen aan een verwijderde sessie gekoppeld blijven

  </Accordion>
</AccordionGroup>

### Kies een clientmodus

Gebruik dezelfde brug op twee verschillende manieren:

<Tabs>
  <Tab title="Algemene MCP-clients">
    Alleen standaard MCP-tools. Gebruik `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` en de goedkeuringstools.
  </Tab>
  <Tab title="Claude Code">
    Standaard MCP-tools plus de Claude-specifieke kanaaladapter. Schakel `--claude-channel-mode on` in of laat de standaardwaarde `auto` staan.
  </Tab>
</Tabs>

<Note>
Vandaag gedraagt `auto` zich hetzelfde als `on`. Er is nog geen detectie van clientcapaciteiten.
</Note>

### Wat `serve` beschikbaar stelt

De brug gebruikt bestaande Gateway-sessieroutemetadata om kanaalondersteunde gesprekken beschikbaar te stellen. Een gesprek verschijnt wanneer OpenClaw al sessiestatus heeft met een bekende route zoals:

- `channel`
- metadata van ontvanger of bestemming
- optionele `accountId`
- optionele `threadId`

Dit geeft MCP-clients één plek om:

- recente gerouteerde gesprekken te tonen
- recente transcriptgeschiedenis te lezen
- te wachten op nieuwe inkomende gebeurtenissen
- een antwoord terug te sturen via dezelfde route
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

### Brugtools

De huidige brug stelt deze MCP-tools beschikbaar:

<AccordionGroup>
  <Accordion title="conversations_list">
    Toont recente sessieondersteunde gesprekken die al routemetadata in de Gateway-sessiestatus hebben.

    Handige filters:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Retourneert één gesprek op basis van `session_key` met een directe Gateway-sessiezoekopdracht.
  </Accordion>
  <Accordion title="messages_read">
    Leest recente transcriptberichten voor één sessieondersteund gesprek.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extraheert niet-tekstuele berichtinhoudsblokken uit één transcriptbericht. Dit is een metadataweergave over transcriptinhoud, geen zelfstandige duurzame blobopslag voor bijlagen.
  </Accordion>
  <Accordion title="events_poll">
    Leest livegebeurtenissen in de wachtrij sinds een numerieke cursor.
  </Accordion>
  <Accordion title="events_wait">
    Long-pollt totdat de volgende overeenkomende gebeurtenis in de wachtrij binnenkomt of een time-out verloopt.

    Gebruik dit wanneer een algemene MCP-client bijna-realtime levering nodig heeft zonder Claude-specifiek pushprotocol.

  </Accordion>
  <Accordion title="messages_send">
    Stuurt tekst terug via dezelfde route die al op de sessie is vastgelegd.

    Huidig gedrag:

    - vereist een bestaande gespreksroute
    - gebruikt het kanaal, de ontvanger, account-id en thread-id van de sessie
    - verstuurt alleen tekst

  </Accordion>
  <Accordion title="permissions_list_open">
    Toont openstaande goedkeuringsverzoeken voor exec/Plugin die de brug heeft waargenomen sinds de verbinding met de Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Lost één openstaand goedkeuringsverzoek voor exec/Plugin op met:

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
- de wachtrij is alleen live; deze start wanneer de MCP-brug start
- `events_poll` en `events_wait` spelen oudere Gateway-geschiedenis niet zelf opnieuw af
- duurzame achterstand moet worden gelezen met `messages_read`

</Warning>

### Claude-kanaalmeldingen

De brug kan ook Claude-specifieke kanaalmeldingen beschikbaar stellen. Dit is het OpenClaw-equivalent van een Claude Code-kanaaladapter: standaard MCP-tools blijven beschikbaar, maar live inkomende berichten kunnen ook aankomen als Claude-specifieke MCP-meldingen.

<Tabs>
  <Tab title="uit">
    `--claude-channel-mode off`: alleen standaard MCP-tools.
  </Tab>
  <Tab title="aan">
    `--claude-channel-mode on`: schakel Claude-kanaalmeldingen in.
  </Tab>
  <Tab title="auto (standaard)">
    `--claude-channel-mode auto`: huidige standaardwaarde; hetzelfde bruggedrag als `on`.
  </Tab>
</Tabs>

Wanneer de Claude-kanaalmodus is ingeschakeld, adverteert de server experimentele Claude-capaciteiten en kan deze uitzenden:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Huidig bruggedrag:

- inkomende `user`-transcriptberichten worden doorgestuurd als `notifications/claude/channel`
- Claude-toestemmingsverzoeken die via MCP worden ontvangen, worden in het geheugen bijgehouden
- als het gekoppelde gesprek later `yes abcde` of `no abcde` verzendt, zet de brug dat om naar `notifications/claude/channel/permission`
- deze meldingen zijn alleen voor live sessies; als de MCP-client de verbinding verbreekt, is er geen pushdoel

Dit is bewust clientspecifiek. Algemene MCP-clients moeten vertrouwen op de standaard pollingtools.

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

Voor de meeste algemene MCP-clients begin je met het standaard tooloppervlak en negeer je de Claude-modus. Zet de Claude-modus alleen aan voor clients die de Claude-specifieke meldingsmethoden daadwerkelijk begrijpen.

### Opties

`openclaw mcp serve` ondersteunt:

<ParamField path="--url" type="string">
  Gateway WebSocket-URL.
</ParamField>
<ParamField path="--token" type="string">
  Gateway-token.
</ParamField>
<ParamField path="--token-file" type="string">
  Lees token uit bestand.
</ParamField>
<ParamField path="--password" type="string">
  Gateway-wachtwoord.
</ParamField>
<ParamField path="--password-file" type="string">
  Lees wachtwoord uit bestand.
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

### Beveiligings- en vertrouwensgrens

De brug verzint geen routering. Deze stelt alleen gesprekken beschikbaar waarvan de Gateway al weet hoe ze moeten worden gerouteerd.

Dat betekent:

- afzender-allowlists, pairing en vertrouwen op kanaalniveau blijven onderdeel van de onderliggende OpenClaw-kanaalconfiguratie
- `messages_send` kan alleen antwoorden via een bestaande opgeslagen route
- goedkeuringsstatus is alleen live/in-memory voor de huidige brugsessie
- brugauthenticatie moet dezelfde Gateway-token- of wachtwoordcontroles gebruiken die je zou vertrouwen voor elke andere externe Gateway-client

Als een gesprek ontbreekt in `conversations_list`, is de gebruikelijke oorzaak niet de MCP-configuratie. Het gaat dan om ontbrekende of onvolledige routemetadata in de onderliggende Gateway-sessie.

### Testen

OpenClaw levert een deterministische Docker-smoke voor deze brug:

```bash
pnpm test:docker:mcp-channels
```

Die smoke:

- start een vooraf gevulde Gateway-container
- start een tweede container die `openclaw mcp serve` start
- verifieert gespreksdetectie, transcriptleesacties, metadata-leesacties voor bijlagen, gedrag van de livegebeurteniswachtrij en routering van uitgaande verzendingen
- valideert Claude-achtige kanaal- en toestemmingsmeldingen via de echte stdio MCP-brug

Dit is de snelste manier om te bewijzen dat de brug werkt zonder een echt Telegram-, Discord- of iMessage-account aan de testrun te koppelen.

Zie [Testen](/nl/help/testing) voor bredere testcontext.

### Probleemoplossing

<AccordionGroup>
  <Accordion title="Geen gesprekken geretourneerd">
    Betekent meestal dat de Gateway-sessie nog niet routeerbaar is. Bevestig dat de onderliggende sessie opgeslagen kanaal-/providermetadata, ontvanger en optionele account-/thread-routemetadata heeft.
  </Accordion>
  <Accordion title="events_poll of events_wait mist oudere berichten">
    Verwacht. De livewachtrij start wanneer de brug verbinding maakt. Lees oudere transcriptgeschiedenis met `messages_read`.
  </Accordion>
  <Accordion title="Claude-meldingen verschijnen niet">
    Controleer al deze punten:

    - de client hield de stdio MCP-sessie open
    - `--claude-channel-mode` is `on` of `auto`
    - de client begrijpt de Claude-specifieke meldingsmethoden daadwerkelijk
    - het inkomende bericht vond plaats nadat de brug verbinding had gemaakt

  </Accordion>
  <Accordion title="Goedkeuringen ontbreken">
    `permissions_list_open` toont alleen goedkeuringsverzoeken die zijn waargenomen terwijl de brug verbonden was. Het is geen duurzame API voor goedkeuringsgeschiedenis.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-clientregister

Dit is het pad voor `openclaw mcp list`, `show`, `set` en `unset`.

Deze opdrachten stellen OpenClaw niet beschikbaar via MCP. Ze beheren MCP-serverdefinities die eigendom zijn van OpenClaw onder `mcp.servers` in de OpenClaw-configuratie.

Die opgeslagen definities zijn bedoeld voor runtimes die OpenClaw later start of configureert, zoals ingebedde Pi en andere runtime-adapters. OpenClaw slaat de definities centraal op, zodat die runtimes geen eigen dubbele MCP-serverlijsten hoeven bij te houden.

<AccordionGroup>
  <Accordion title="Belangrijk gedrag">
    - deze opdrachten lezen of schrijven alleen OpenClaw-configuratie
    - ze maken geen verbinding met de doel-MCP-server
    - ze valideren niet of de opdracht, URL of externe transportlaag op dit moment bereikbaar is
    - runtime-adapters bepalen tijdens uitvoering welke transportvormen ze daadwerkelijk ondersteunen
    - ingebedde Pi stelt geconfigureerde MCP-tools beschikbaar in normale toolprofielen voor `coding` en `messaging`; `minimal` verbergt ze nog steeds, en `tools.deny: ["bundle-mcp"]` schakelt ze expliciet uit
    - sessiegebonden gebundelde MCP-runtimes worden opgeruimd na `mcp.sessionIdleTtlMs` milliseconden inactiviteit (standaard 10 minuten; stel `0` in om uit te schakelen) en eenmalige ingebedde runs ruimen ze op aan het einde van de run

  </Accordion>
</AccordionGroup>

Runtime-adapters kunnen dit gedeelde register normaliseren naar de vorm die hun downstreamclient verwacht. Ingebedde Pi gebruikt bijvoorbeeld OpenClaw-waarden voor `transport` direct, terwijl Claude Code en Gemini CLI-native `type`-waarden ontvangen zoals `http`, `sse` of `stdio`.

### Opgeslagen MCP-serverdefinities

OpenClaw slaat ook een lichtgewicht MCP-serverregister op in de configuratie voor oppervlakken die door OpenClaw beheerde MCP-definities willen gebruiken.

Opdrachten:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Opmerkingen:

- `list` sorteert servernamen.
- `show` zonder naam print het volledige geconfigureerde MCP-serverobject.
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

| Veld                       | Beschrijving                         |
| -------------------------- | ------------------------------------ |
| `command`                  | Uitvoerbaar bestand om te starten (vereist) |
| `args`                     | Array met opdrachtregelargumenten    |
| `env`                      | Extra omgevingsvariabelen            |
| `cwd` / `workingDirectory` | Werkmap voor het proces              |

<Warning>
**Veiligheidsfilter voor stdio-env**

OpenClaw weigert env-sleutels voor interpreter-startup die kunnen wijzigen hoe een stdio MCP-server opstart vóór de eerste RPC, zelfs als ze in het `env`-blok van een server staan. Geblokkeerde sleutels zijn onder andere `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` en vergelijkbare runtime-control-variabelen. Startup weigert deze met een configuratiefout, zodat ze geen impliciete prelude kunnen injecteren, de interpreter kunnen vervangen of een debugger tegen het stdio-proces kunnen inschakelen. Gewone credential-, proxy- en serverspecifieke env-vars (`GITHUB_TOKEN`, `HTTP_PROXY`, aangepaste `*_API_KEY`, enz.) worden niet beïnvloed.

Als je MCP-server echt een van de geblokkeerde variabelen nodig heeft, stel die dan in op het Gateway-hostproces in plaats van onder de `env` van de stdio-server.
</Warning>

### SSE- / HTTP-transport

Maakt verbinding met een externe MCP-server via HTTP Server-Sent Events.

| Veld                  | Beschrijving                                                    |
| --------------------- | --------------------------------------------------------------- |
| `url`                 | HTTP- of HTTPS-URL van de externe server (vereist)              |
| `headers`             | Optionele sleutel-waardemap met HTTP-headers (bijvoorbeeld auth tokens) |
| `connectionTimeoutMs` | Verbindingstime-out per server in ms (optioneel)                |

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

`streamable-http` is een aanvullende transportoptie naast `sse` en `stdio`. Het gebruikt HTTP-streaming voor bidirectionele communicatie met externe MCP-servers.

| Veld                  | Beschrijving                                                                            |
| --------------------- | --------------------------------------------------------------------------------------- |
| `url`                 | HTTP- of HTTPS-URL van de externe server (vereist)                                      |
| `transport`           | Stel in op `"streamable-http"` om dit transport te selecteren; wanneer weggelaten, gebruikt OpenClaw `sse` |
| `headers`             | Optionele sleutel-waardemap met HTTP-headers (bijvoorbeeld auth tokens)                 |
| `connectionTimeoutMs` | Verbindingstime-out per server in ms (optioneel)                                        |

OpenClaw-configuratie gebruikt `transport: "streamable-http"` als de canonieke spelling. CLI-native MCP-waarden voor `type: "http"` worden geaccepteerd wanneer ze via `openclaw mcp set` worden opgeslagen en gerepareerd door `openclaw doctor --fix` in bestaande configuratie, maar `transport` is wat ingebedde Pi direct gebruikt.

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

## Huidige limieten

Deze pagina documenteert de bridge zoals die vandaag is geleverd.

Huidige limieten:

- gespreksdetectie hangt af van bestaande routemetadata van Gateway-sessies
- geen generiek pushprotocol buiten de Claude-specifieke adapter
- nog geen tools voor berichtbewerking of reacties
- HTTP/SSE/streamable-http-transport maakt verbinding met één externe server; nog geen gemultiplexte upstream
- `permissions_list_open` bevat alleen goedkeuringen die zijn waargenomen terwijl de bridge verbonden is

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Plugins](/nl/cli/plugins)
