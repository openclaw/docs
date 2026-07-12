---
read_when:
    - Codeerharnassen uitvoeren via ACP
    - Gespreksgebonden ACP-sessies instellen op berichtenkanalen
    - Een gesprek in een berichtenkanaal koppelen aan een persistente ACP-sessie
    - Problemen oplossen met de ACP-backend, Plugin-koppeling of levering van voltooiingen
    - /acp-opdrachten bedienen vanuit de chat
sidebarTitle: ACP agents
summary: Voer externe codeerharnassen (Claude Code, Cursor, Gemini CLI, expliciete Codex ACP, OpenClaw ACP, OpenCode) uit via de ACP-backend
title: ACP-agents
x-i18n:
    generated_at: "2026-07-12T09:27:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-sessies stellen
OpenClaw in staat externe codeharnassen (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI en andere ondersteunde ACPX-harnassen)
via een ACP-backendplugin uit te voeren. Elke gestarte sessie wordt bijgehouden als een
[achtergrondtaak](/nl/automation/tasks).

<Note>
**ACP is het pad voor externe harnassen, niet het standaardpad voor Codex.** De systeemeigen
Codex-appserverplugin beheert de `/codex ...`-bediening en de standaard
ingebedde `openai/gpt-*`-runtime voor agentbeurten; ACP beheert de `/acp ...`-bediening
en `sessions_spawn({ runtime: "acp" })`-sessies.

Gebruik [`openclaw mcp serve`](/nl/cli/mcp) in plaats van ACP om Codex of Claude Code
als externe MCP-client rechtstreeks verbinding te laten maken met
bestaande OpenClaw-kanaalgesprekken.
</Note>

## Welke pagina heb ik nodig?

| U wilt...                                                                                       | Gebruik dit                            | Opmerkingen                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in het huidige gesprek koppelen of bedienen                                               | `/codex bind`, `/codex threads`        | Systeemeigen Codex-appserverpad wanneer de `codex`-plugin is ingeschakeld: gekoppelde chatantwoorden, doorsturen van afbeeldingen, model/snelheid/machtigingen, stoppen en bijsturen. ACP is een expliciete terugvaloptie |
| Claude Code, Gemini CLI, expliciete Codex ACP of een ander extern harnas _via_ OpenClaw uitvoeren | Deze pagina                            | Aan chats gekoppelde sessies, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, achtergrondtaken, runtimebediening                                                              |
| Een OpenClaw Gateway-sessie _als_ ACP-server beschikbaar stellen aan een editor of client       | [`openclaw acp`](/nl/cli/acp)             | Brugmodus: een IDE/client communiceert via stdio/WebSocket met OpenClaw volgens ACP                                                                                              |
| Een lokale AI-CLI hergebruiken als terugvalmodel dat alleen tekst ondersteunt                   | [CLI-backends](/nl/gateway/cli-backends)  | Geen ACP: geen OpenClaw-tools, geen ACP-bediening, geen harnasruntime                                                                                                            |

## Werkt dit direct?

Ja, na installatie van de officiële ACP-runtimeplugin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Broncodecheck-outs kunnen na `pnpm install` de lokale werkruimteplugin
`extensions/acpx` gebruiken. Voer `/acp doctor` uit voor een gereedheidscontrole.

OpenClaw informeert agents alleen over het starten via ACP wanneer ACP **daadwerkelijk bruikbaar** is:
ACP moet zijn ingeschakeld, verzending mag niet zijn uitgeschakeld, de huidige sessie mag
niet door de sandbox zijn geblokkeerd en er moet een gezonde runtimebackend zijn geladen. Als
aan een voorwaarde niet wordt voldaan, blijven ACP-Skills en ACP-richtlijnen voor `sessions_spawn`
verborgen, zodat de agent geen onbeschikbare backend voorstelt.

<AccordionGroup>
  <Accordion title="Aandachtspunten bij de eerste uitvoering">
    - Als `plugins.allow` is ingesteld, vormt dit een beperkende plugininventaris en **moet** deze `acpx` bevatten, anders wordt de geïnstalleerde ACP-backend opzettelijk geblokkeerd (`/acp doctor` meldt de ontbrekende vermelding in de toelatingslijst).
    - De Codex ACP-adapter wordt met de `acpx`-plugin meegeleverd en wordt waar mogelijk lokaal gestart.
    - Codex ACP wordt uitgevoerd met een geïsoleerde `CODEX_HOME`. OpenClaw kopieert vertrouwde projectvertrouwensvermeldingen plus veilige routeringsconfiguratie voor modellen/providers (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` en veilige velden van `model_providers.<name>`) uit de Codex-hostconfiguratie; authenticatie, meldingen en hooks blijven uitsluitend in de hostconfiguratie.
    - Andere adapters voor doelharnassen kunnen bij het eerste gebruik naar behoefte met `npx` worden opgehaald.
    - Authenticatie bij de leverancier moet voor dat harnas al op de host aanwezig zijn.
    - Als de host geen npm- of netwerktoegang heeft, mislukt het ophalen van adapters bij de eerste uitvoering totdat caches vooraf zijn gevuld of de adapter op een andere manier is geïnstalleerd.

  </Accordion>
  <Accordion title="Runtimevereisten">
    ACP start een echt extern harnasproces. OpenClaw beheert routering,
    de status van achtergrondtaken, aflevering, koppelingen en beleid; het harnas beheert
    de aanmelding bij de provider, de modelcatalogus, het bestandssysteemgedrag en systeemeigen tools.

    Controleer het volgende voordat u OpenClaw als oorzaak aanwijst:

    - `/acp doctor` meldt een ingeschakelde, gezonde backend.
    - De doel-id is toegestaan door `acp.allowedAgents` wanneer die toelatingslijst is ingesteld.
    - De harnasopdracht kan op de Gateway-host worden gestart.
    - Providerauthenticatie is aanwezig voor dat harnas (`claude`, `codex`, `gemini`, `opencode`, `droid`, enzovoort).
    - Het geselecteerde model bestaat voor dat harnas; model-id's zijn niet overdraagbaar tussen harnassen.
    - De aangevraagde `cwd` bestaat en is toegankelijk; laat `cwd` anders weg en laat de backend de standaardwaarde gebruiken.
    - De machtigingsmodus past bij het werk. Niet-interactieve sessies kunnen niet op systeemeigen machtigingsprompts klikken, dus coderingssessies met veel schrijf- en uitvoerbewerkingen hebben doorgaans een ACPX-machtigingsprofiel nodig dat zonder gebruikersinterface kan doorgaan.

  </Accordion>
</AccordionGroup>

OpenClaw-plugintools en ingebouwde OpenClaw-tools worden standaard **niet**
beschikbaar gesteld aan ACP-harnassen. Schakel de expliciete MCP-bruggen in
[ACP-agents - configuratie](/nl/tools/acp-agents-setup) alleen in wanneer het harnas
die tools rechtstreeks moet aanroepen.

## Ondersteunde harnasdoelen

Gebruik met de `acpx`-backend deze id's als doelen voor `/acp spawn <id>` of
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harnas-id    | Gebruikelijke backend                            | Opmerkingen                                                                                         |
| ------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `claude`     | Claude Code ACP-adapter                          | Vereist Claude Code-authenticatie op de host.                                                       |
| `codex`      | Codex ACP-adapter                                | Alleen een expliciete ACP-terugvaloptie wanneer systeemeigen `/codex` niet beschikbaar is of ACP wordt aangevraagd. |
| `copilot`    | GitHub Copilot ACP-adapter                       | Vereist Copilot CLI-/runtimeauthenticatie.                                                          |
| `cursor`     | Cursor CLI ACP (`cursor-agent acp`)              | Overschrijf de acpx-opdracht als een lokale installatie een ander ACP-toegangspunt beschikbaar stelt. |
| `droid`      | Factory Droid CLI                                | Vereist Factory-/Droid-authenticatie of `FACTORY_API_KEY` in de harnasomgeving.                     |
| `fast-agent` | fast-agent-mcp ACP-adapter                       | Wordt naar behoefte opgehaald met `uvx`.                                                            |
| `gemini`     | Gemini CLI ACP-adapter                           | Vereist Gemini CLI-authenticatie of configuratie van een API-sleutel.                               |
| `iflow`      | iFlow CLI                                        | De beschikbaarheid van de adapter en modelbediening zijn afhankelijk van de geïnstalleerde CLI.     |
| `kilocode`   | Kilo Code CLI                                    | De beschikbaarheid van de adapter en modelbediening zijn afhankelijk van de geïnstalleerde CLI.     |
| `kimi`       | Kimi/Moonshot CLI                                | Vereist Kimi-/Moonshot-authenticatie op de host.                                                    |
| `kiro`       | Kiro CLI                                         | De beschikbaarheid van de adapter en modelbediening zijn afhankelijk van de geïnstalleerde CLI.     |
| `mux`        | Mux CLI ACP-adapter                              | Wordt naar behoefte opgehaald met `npx`.                                                            |
| `opencode`   | OpenCode ACP-adapter                             | Vereist OpenCode CLI-/providerauthenticatie.                                                        |
| `openclaw`   | OpenClaw Gateway-brug via `openclaw acp`         | Hiermee kan een ACP-compatibel harnas terugcommuniceren met een OpenClaw Gateway-sessie.             |
| `qoder`      | Qoder CLI                                        | De beschikbaarheid van de adapter en modelbediening zijn afhankelijk van de geïnstalleerde CLI.     |
| `qwen`       | Qwen Code / Qwen CLI                             | Vereist Qwen-compatibele authenticatie op de host.                                                  |
| `trae`       | Trae CLI ACP-adapter                             | De beschikbaarheid van de adapter en modelbediening zijn afhankelijk van de geïnstalleerde CLI.     |

`pi` (pi-acp) is ook geregistreerd in de acpx-backend, maar is niet in
dezelfde zin als de bovenstaande een codeharnas.

Aangepaste acpx-agentaliases kunnen in acpx zelf worden geconfigureerd, maar het
OpenClaw-beleid controleert vóór verzending nog steeds `acp.allowedAgents` en eventuele
`agents.list[].runtime.acp.agent`-toewijzingen.

## Draaiboek voor beheerders

Snelle `/acp`-stroom vanuit de chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` of expliciet
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Werken">
    Ga verder in het gekoppelde gesprek of de gekoppelde thread (of richt u
    expliciet op de sessiesleutel).
  </Step>
  <Step title="Status controleren">
    `/acp status`
  </Step>
  <Step title="Afstemmen">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Bijsturen">
    Zonder de context te vervangen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stoppen">
    `/acp cancel` (huidige beurt) of `/acp close` (sessie + koppelingen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Details van de levenscyclus">
    - Starten maakt een ACP-runtimesessie aan of hervat deze, registreert ACP-metagegevens in het sessiearchief van OpenClaw en kan een achtergrondtaak aanmaken wanneer de uitvoering eigendom is van de bovenliggende taak.
    - ACP-sessies die eigendom zijn van een bovenliggende taak, worden behandeld als achtergrondwerk, zelfs wanneer de runtimesessie persistent is; voltooiing en aflevering tussen oppervlakken verlopen via de taakmelder van de bovenliggende taak in plaats van als een normale, gebruikersgerichte chatsessie.
    - Taakonderhoud sluit beëindigde of verweesde eenmalige ACP-sessies die eigendom zijn van een bovenliggende taak. Persistente ACP-sessies blijven behouden zolang er een actieve gesprekskoppeling bestaat; verouderde persistente sessies zonder actieve koppeling worden gesloten, zodat ze niet ongemerkt kunnen worden hervat nadat de eigenaarstaak is voltooid of de taakregistratie is verdwenen.
    - Gekoppelde vervolgberichten gaan rechtstreeks naar de ACP-sessie totdat de koppeling wordt gesloten, de focus verliest, wordt hersteld of verloopt.
    - Gateway-opdrachten blijven lokaal. `/acp ...`, `/status` en `/unfocus` worden nooit als normale prompttekst naar een gekoppeld ACP-harnas verzonden.
    - `cancel` breekt de actieve beurt af wanneer de backend annulering ondersteunt; de koppeling of sessiemetagegevens worden niet verwijderd.
    - `close` beëindigt de ACP-sessie vanuit het perspectief van OpenClaw en verwijdert de koppeling. Een harnas kan zijn eigen bovenliggende geschiedenis blijven bewaren als het hervatten ondersteunt.
    - De acpx-plugin ruimt door OpenClaw beheerde processtructuren voor wrappers en adapters na `close` op en verwijdert tijdens het starten van de Gateway verouderde, door OpenClaw beheerde verweesde ACPX-processen.
    - Inactieve runtimewerkers komen na `acp.runtime.ttlMinutes` in aanmerking voor opschoning; opgeslagen sessiemetagegevens blijven beschikbaar voor `/acp sessions`.

  </Accordion>
  <Accordion title="Routeringsregels voor systeemeigen Codex">
    Triggers in natuurlijke taal die naar de **systeemeigen Codex-plugin**
    moeten worden gerouteerd wanneer deze is ingeschakeld:

    - "Koppel dit Discord-kanaal aan Codex."
    - "Koppel deze chat aan Codex-thread `<id>`."
    - "Toon Codex-threads en koppel vervolgens deze."

    Native Codex-gesprekskoppeling is het standaardpad voor chatbesturing.
    Dynamische OpenClaw-tools worden nog steeds via OpenClaw uitgevoerd, terwijl
    Codex-native tools zoals shell/apply-patch binnen Codex worden uitgevoerd.
    Voor Codex-native toolgebeurtenissen injecteert OpenClaw per beurt een native
    hook-relais, zodat pluginhooks `before_tool_call` kunnen blokkeren,
    `after_tool_call` kunnen observeren en Codex-`PermissionRequest`-gebeurtenissen
    via OpenClaw-goedkeuringen kunnen routeren. Codex-`Stop`-hooks worden
    doorgestuurd naar OpenClaw `before_agent_finalize`, waar plugins nog één
    modeldoorgang kunnen aanvragen voordat Codex zijn antwoord voltooit. Het
    relais blijft bewust terughoudend: het wijzigt geen argumenten van
    Codex-native tools en herschrijft geen Codex-threadrecords. Gebruik expliciete
    ACP alleen wanneer je het ACP-runtime-/sessiemodel wilt. De
    ondersteuningsgrens van de ingebedde Codex is gedocumenteerd in het
    [ondersteuningscontract voor Codex-harnas v1](/nl/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Spiekbrief voor model-/provider-/runtimeselectie">
    - verouderde Codex-modelreferenties - verouderde Codex OAuth-/abonnementsmodelroute die door doctor wordt hersteld.
    - `openai/*` - ingebedde native Codex-app-serverruntime voor OpenAI-agentbeurten.
    - `/codex ...` - native Codex-gespreksbesturing.
    - `/acp ...` of `runtime: "acp"` - expliciete ACP-/acpx-besturing.

  </Accordion>
  <Accordion title="Natuurlijke-taaltriggers voor ACP-routering">
    Triggers die naar de ACP-runtime moeten routeren:

    - "Voer dit uit als een eenmalige Claude Code ACP-sessie en vat het resultaat samen."
    - "Gebruik Gemini CLI voor deze taak in een thread en houd vervolgstappen daarna in diezelfde thread."
    - "Voer Codex via ACP uit in een achtergrondthread."

    OpenClaw kiest `runtime: "acp"`, bepaalt de `agentId` van het harnas, koppelt
    waar ondersteund aan het huidige gesprek of de huidige thread en routeert
    vervolgberichten naar die sessie totdat deze wordt gesloten of verloopt.
    Codex volgt dit pad alleen wanneer ACP/acpx expliciet is opgegeven of wanneer
    de native Codex-plugin niet beschikbaar is voor de gevraagde bewerking.

    Voor `sessions_spawn` wordt `runtime: "acp"` alleen aangeboden wanneer ACP
    is ingeschakeld, de aanvrager niet in een sandbox draait en een
    ACP-runtimebackend is geladen. `acp.dispatch.enabled=false` pauzeert
    automatische verzending van ACP-threads, maar verbergt of blokkeert
    expliciete aanroepen van `sessions_spawn({ runtime: "acp" })` niet.
    Het richt zich op ACP-harnas-id's zoals `codex`, `claude`, `droid`,
    `gemini` of `opencode`. Geef geen normale OpenClaw-configuratie-agent-id
    uit `agents_list` door, tenzij dat item expliciet is geconfigureerd met
    `agents.list[].runtime.type="acp"`; gebruik anders de standaardruntime voor
    subagents. Wanneer een OpenClaw-agent is geconfigureerd met
    `runtime.type="acp"`, gebruikt OpenClaw `runtime.acp.agent` als de
    onderliggende harnas-id.

  </Accordion>
</AccordionGroup>

## ACP tegenover subagents

Gebruik ACP wanneer je een externe harnasruntime wilt. Gebruik de **native
Codex-app-server** voor Codex-gesprekskoppeling en -besturing wanneer de
`codex`-plugin is ingeschakeld. Gebruik **subagents** wanneer je door OpenClaw
native gedelegeerde uitvoeringen wilt.

| Onderdeel       | ACP-sessie                            | Subagentuitvoering                    |
| --------------- | ------------------------------------- | ------------------------------------- |
| Runtime         | ACP-backendplugin (bijvoorbeeld acpx) | Native OpenClaw-subagentruntime       |
| Sessiesleutel   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`     |
| Hoofdopdrachten | `/acp ...`                            | `/subagents ...`                      |
| Starttool       | `sessions_spawn` met `runtime:"acp"`  | `sessions_spawn` (standaardruntime)   |

Zie ook [Subagents](/nl/tools/subagents).

## Hoe ACP Claude Code uitvoert

Voor Claude Code via ACP bestaat de stack uit:

1. Het besturingsvlak voor OpenClaw ACP-sessies.
2. De officiële runtimeplugin `@openclaw/acpx`.
3. De Claude ACP-adapter.
4. De runtime-/sessiemechanismen aan Claude-zijde.

ACP Claude is een **harnassessie** met ACP-besturing, sessiehervatting,
tracering van achtergrondtaken en optionele gespreks-/threadkoppeling.

CLI-backends zijn afzonderlijke, uitsluitend tekstuele lokale
terugvalruntimes - zie [CLI-backends](/nl/gateway/cli-backends).

Voor beheerders is de praktische regel:

- **Wil je `/acp spawn`, koppelbare sessies, runtimebesturing of permanent harnaswerk?** Gebruik ACP.
- **Wil je eenvoudige lokale tekstterugval via de onbewerkte CLI?** Gebruik CLI-backends.

## Gekoppelde sessies

### Mentaal model

- **Chatoppervlak** - waar mensen blijven praten (Discord-kanaal, Telegram-onderwerp, iMessage-chat).
- **ACP-sessie** - de duurzame Codex-/Claude-/Gemini-runtimestatus waarnaar OpenClaw routeert.
- **Onderliggende thread/onderwerp** - een optioneel extra berichtenoppervlak dat alleen door `--thread ...` wordt aangemaakt.
- **Runtimewerkruimte** - de bestandssysteemlocatie (`cwd`, repository-checkout, backendwerkruimte) waar het harnas wordt uitgevoerd. Onafhankelijk van het chatoppervlak.

### Koppelingen aan het huidige gesprek

`/acp spawn <harness> --bind here` koppelt het huidige gesprek vast aan de
gestarte ACP-sessie - geen onderliggende thread, hetzelfde chatoppervlak.
OpenClaw blijft verantwoordelijk voor transport, authenticatie, veiligheid en
aflevering. Vervolgberichten in dat gesprek worden naar dezelfde sessie
gerouteerd; `/new` en `/reset` stellen de sessie ter plaatse opnieuw in;
`/acp close` verwijdert de koppeling.

Voorbeelden:

```text
/codex bind                                              # native Codex-koppeling, routeer toekomstige berichten hiernaartoe
/codex model gpt-5.4                                     # stel de gekoppelde native Codex-thread af
/codex stop                                              # bestuur de actieve native Codex-beurt
/acp spawn codex --bind here                             # expliciete ACP-terugval voor Codex
/acp spawn codex --thread auto                           # kan een onderliggende thread/onderwerp aanmaken en daar koppelen
/acp spawn codex --bind here --cwd /workspace/repo       # dezelfde chatkoppeling, Codex wordt uitgevoerd in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Koppelingsregels en wederzijdse uitsluiting">
    - `--bind here` en `--thread ...` sluiten elkaar uit.
    - `--bind here` werkt alleen op kanalen die koppeling aan het huidige gesprek ondersteunen; anders retourneert OpenClaw een duidelijke melding dat dit niet wordt ondersteund. Koppelingen blijven behouden na herstarts van de Gateway.
    - Op Discord beheert `spawnSessions` het aanmaken van onderliggende threads voor `--thread auto|here` - niet voor `--bind here`.
    - Als je zonder `--cwd` een andere ACP-agent start, neemt OpenClaw standaard de werkruimte van de **doelagent** over. Ontbrekende overgenomen paden (`ENOENT`/`ENOTDIR`) vallen terug op de standaardwaarde van de backend; andere toegangsfouten (bijvoorbeeld `EACCES`) worden als startfouten gemeld.
    - Gateway-beheeropdrachten blijven lokaal in gekoppelde gesprekken - `/acp ...`-opdrachten worden door OpenClaw afgehandeld, zelfs wanneer normale vervolgtekst naar de gekoppelde ACP-sessie wordt gerouteerd; `/status` en `/unfocus` blijven ook lokaal wanneer opdrachtafhandeling voor dat oppervlak is ingeschakeld.

  </Accordion>
  <Accordion title="Aan threads gekoppelde sessies">
    Wanneer threadkoppelingen zijn ingeschakeld voor een kanaaladapter:

    - OpenClaw koppelt een thread aan een ACP-doelsessie.
    - Vervolgberichten in die thread worden naar de gekoppelde ACP-sessie gerouteerd.
    - ACP-uitvoer wordt teruggeleverd aan dezelfde thread.
    - Ontkoppelen/sluiten/archiveren/inactiviteitstime-out of verloop door maximale leeftijd verwijdert de koppeling.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` en `/unfocus` zijn Gateway-opdrachten, geen prompts voor het ACP-harnas.

    Vereiste functievlaggen voor aan threads gekoppelde ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` is standaard ingeschakeld (stel in op `false` om automatische verzending van ACP-threads te pauzeren; expliciete aanroepen van `sessions_spawn({ runtime: "acp" })` blijven werken).
    - Het starten van threadsessies door de kanaaladapter is ingeschakeld (standaard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Ondersteuning voor threadkoppeling is adapterspecifiek. Als de actieve
    kanaaladapter geen threadkoppelingen ondersteunt, retourneert OpenClaw een
    duidelijke melding dat deze niet worden ondersteund of niet beschikbaar
    zijn.

  </Accordion>
  <Accordion title="Kanalen met threadondersteuning">
    - Elke kanaaladapter die mogelijkheden voor sessie-/threadkoppeling beschikbaar stelt.
    - Huidige ingebouwde ondersteuning: **Discord**-threads/-kanalen, **Telegram**-onderwerpen (forumonderwerpen in groepen/supergroepen en privéberichtonderwerpen).
    - Plugin-kanalen kunnen via dezelfde koppelingsinterface ondersteuning toevoegen.

  </Accordion>
</AccordionGroup>

## Permanente kanaalkoppelingen

Configureer voor niet-tijdelijke werkstromen permanente ACP-koppelingen in
`bindings[]`-items op het hoogste niveau.

### Koppelingsmodel

<ParamField path="bindings[].type" type='"acp"'>
  Markeert een permanente ACP-gesprekskoppeling.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identificeert het doelgesprek. Vormen per kanaal:

- **Discord-kanaal/-thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack-kanaal/privébericht:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Geef de voorkeur aan stabiele Slack-id's; kanaalkoppelingen komen ook overeen met antwoorden binnen de threads van dat kanaal.
- **Telegram-forumonderwerp:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp-privébericht/-groep:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Gebruik E.164-nummers zoals `+15555550123` voor rechtstreekse chats en WhatsApp-groeps-JID's zoals `120363424282127706@g.us` voor groepen.
- **iMessage-privébericht/-groep:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Geef de voorkeur aan `chat_id:*` voor stabiele groepskoppelingen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  De id van de beherende OpenClaw-agent.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionele ACP-overschrijving.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optioneel beheerdersgericht label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionele runtimewerkmap.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionele backendoverschrijving.
</ParamField>

### Runtimestandaardwaarden per agent

Gebruik `agents.list[].runtime` om ACP-standaardwaarden eenmaal per agent te definiëren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harnas-id, bijvoorbeeld `codex` of `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Voorrangsvolgorde van overschrijvingen voor gekoppelde ACP-sessies:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Algemene ACP-standaardwaarden (bijvoorbeeld `acp.backend`)

### Voorbeeld

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Gedrag

- OpenClaw zorgt ervoor dat de geconfigureerde ACP-sessie bestaat nadat de kanaalspecifieke toelating is voltooid en voordat de sessie wordt gebruikt.
- Berichten in dat kanaal, onderwerp of die chat worden naar de geconfigureerde ACP-sessie gerouteerd.
- Geconfigureerde ACP-bindingen zijn eigenaar van hun sessieroute. Uitwaaiering van kanaaluitzendingen vervangt de geconfigureerde ACP-sessie niet voor een overeenkomende binding.
- In gebonden gesprekken stellen `/new` en `/reset` dezelfde ACP-sessiesleutel ter plaatse opnieuw in.
- Tijdelijke runtimebindingen (bijvoorbeeld aangemaakt door flows voor threadfocus) blijven van toepassing waar ze aanwezig zijn.
- Voor ACP-starts tussen agents zonder een expliciete `cwd` neemt OpenClaw de werkruimte van de doelagent over uit de agentconfiguratie.
- Ontbrekende overgenomen werkruimtepaden vallen terug op de standaard-`cwd` van de backend; toegangsfouten voor bestaande paden worden als startfouten gemeld.

## ACP-sessies starten

Er zijn twee manieren om een ACP-sessie te starten:

<Tabs>
  <Tab title="Vanuit sessions_spawn">
    Gebruik `runtime: "acp"` om een ACP-sessie te starten vanuit een agentbeurt
    of toolaanroep.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` is standaard `subagent`; stel daarom voor ACP-sessies expliciet
    `runtime: "acp"` in. Als `agentId` wordt weggelaten, gebruikt OpenClaw
    `acp.defaultAgent` wanneer dit is geconfigureerd. `mode: "session"` vereist
    `thread: true` om een blijvend gebonden gesprek te behouden.
    </Note>

  </Tab>
  <Tab title="Vanuit de opdracht /acp">
    Gebruik `/acp spawn` voor expliciete bediening door een operator vanuit de chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Belangrijkste vlaggen:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Zie [Slash-opdrachten](/nl/tools/slash-commands).

  </Tab>
</Tabs>

### Parameters van `sessions_spawn`

<ParamField path="task" type="string" required>
  Eerste prompt die naar de ACP-sessie wordt verzonden.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Moet voor ACP-sessies `"acp"` zijn.
</ParamField>
<ParamField path="agentId" type="string">
  ID van de ACP-doelharnas. Valt terug op `acp.defaultAgent` als dit is ingesteld.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Vraag waar ondersteund om de flow voor threadbinding.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` is eenmalig; `"session"` is blijvend. Als `thread: true` is ingesteld
  en `mode` wordt weggelaten, kan OpenClaw afhankelijk van het runtimepad
  standaard blijvend gedrag gebruiken. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Aangevraagde werkmap van de runtime (gevalideerd door het beleid van de
  backend/runtime). Als deze wordt weggelaten, neemt de ACP-start de werkruimte
  van de doelagent over wanneer die is geconfigureerd; ontbrekende overgenomen
  paden vallen terug op de standaardinstellingen van de backend, terwijl echte
  toegangsfouten worden geretourneerd.
</ParamField>
<ParamField path="label" type="string">
  Voor operators zichtbaar label dat in sessie-/bannertekst wordt gebruikt.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Hervat een bestaande ACP-sessie in plaats van een nieuwe aan te maken. De
  agent speelt de gespreksgeschiedenis opnieuw af via `session/load`. Vereist
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt voortgangssamenvattingen van de eerste ACP-uitvoering als
  systeemgebeurtenissen terug naar de aanvragende sessie. Geaccepteerde
  antwoorden bevatten onder meer `streamLogPath`, dat verwijst naar een
  sessiespecifiek JSONL-logboek (`<sessionId>.acp-stream.jsonl`) dat je kunt
  volgen voor de volledige relaisgeschiedenis. Voortgangsstreams naar de
  oudersessie tonen standaard commentaar van de assistent en ACP-statusvoortgang,
  tenzij `streaming.progress.commentary=false`. Discord gebruikt voor voorbeelden
  in de oudersessie ook standaard de voortgangsmodus wanneer geen streammodus is
  geconfigureerd. Statusvoortgang respecteert nog steeds
  `acp.stream.tagVisibility`, zodat tags zoals `plan` verborgen blijven tenzij
  ze expliciet zijn ingeschakeld.
</ParamField>

ACP-uitvoeringen van `sessions_spawn` gebruiken
`agents.defaults.subagents.runTimeoutSeconds` als standaardlimiet voor de beurt
van het onderliggende proces. De tool accepteert geen time-outoverschrijvingen
per aanroep (`runTimeoutSeconds`/`timeoutSeconds` worden afgewezen met een fout
die aangeeft dat de standaard moet worden geconfigureerd).

<ParamField path="model" type="string">
  Expliciete modeloverschrijving voor de onderliggende ACP-sessie. ACP-starts
  van Codex normaliseren OpenAI-verwijzingen zoals `openai/gpt-5.4` vóór
  `session/new` naar de opstartconfiguratie van Codex ACP; vormen met slash,
  zoals `openai/gpt-5.4/high`, stellen ook de redeneerinspanning van Codex ACP
  in. Wanneer dit wordt weggelaten, gebruikt
  `sessions_spawn({ runtime: "acp" })` bestaande standaardmodellen voor
  subagents (`agents.defaults.subagents.model` of
  `agents.list[].subagents.model`) wanneer die zijn geconfigureerd; anders
  gebruikt de ACP-harnas zijn eigen standaardmodel. Andere harnassen moeten
  ACP-`models` bekendmaken en `session/set_model` ondersteunen; anders mislukt
  OpenClaw/acpx met een duidelijke melding in plaats van stilzwijgend terug te
  vallen op de standaardinstelling van de doelagent.
</ParamField>
<ParamField path="thinking" type="string">
  Expliciete denk-/redeneerinspanning. Voor Codex ACP wordt `minimal` toegewezen
  aan lage inspanning, worden `low`/`medium`/`high`/`xhigh` rechtstreeks
  toegewezen en laat `off` de opstartoverschrijving voor redeneerinspanning weg.
  Wanneer dit wordt weggelaten, gebruiken ACP-starts bestaande
  standaardinstellingen voor het denken van subagents en voor het geselecteerde
  model `agents.defaults.models["provider/model"].params.thinking`.
</ParamField>

## Modi voor startbinding en threads

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Gedrag                                                                      |
    | ------ | --------------------------------------------------------------------------- |
    | `here` | Bind het huidige actieve gesprek ter plaatse; mislukt als er geen actief is. |
    | `off`  | Maak geen binding voor het huidige gesprek.                                 |

    Opmerkingen:

    - `--bind here` is het eenvoudigste operatorpad om „dit kanaal of deze chat door Codex te laten ondersteunen”.
    - `--bind here` maakt geen onderliggende thread aan.
    - `--bind here` is alleen beschikbaar op kanalen die binding van het huidige gesprek ondersteunen.
    - `--bind` en `--thread` kunnen niet in dezelfde aanroep van `/acp spawn` worden gecombineerd.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Gedrag                                                                                                          |
    | ------ | --------------------------------------------------------------------------------------------------------------- |
    | `auto` | In een actieve thread: bind die thread. Buiten een thread: maak/bind waar ondersteund een onderliggende thread. |
    | `here` | Vereis de huidige actieve thread; mislukt als je je niet in een thread bevindt.                                 |
    | `off`  | Geen binding. De sessie start ongebonden.                                                                        |

    Opmerkingen:

    - Op oppervlakken zonder threadbinding is het standaardgedrag in feite `off`.
    - Voor starten met threadbinding is ondersteuning door het kanaalbeleid vereist:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gebruik `--bind here` wanneer je het huidige gesprek wilt vastzetten zonder een onderliggende thread aan te maken.

  </Tab>
</Tabs>

## Leveringsmodel

ACP-sessies kunnen interactieve werkruimten of achtergrondwerk onder beheer
van een oudersessie zijn. Het leveringspad hangt van die vorm af.

<AccordionGroup>
  <Accordion title="Interactieve ACP-sessies">
    Interactieve sessies zijn bedoeld om het gesprek op een zichtbaar
    chatoppervlak voort te zetten:

    - `/acp spawn ... --bind here` bindt het huidige gesprek aan de ACP-sessie.
    - `/acp spawn ... --thread ...` bindt een kanaalthread/-onderwerp aan de ACP-sessie.
    - Blijvend geconfigureerde `bindings[].type="acp"` routeren overeenkomende gesprekken naar dezelfde ACP-sessie.

    Vervolgberichten in het gebonden gesprek worden rechtstreeks naar de
    ACP-sessie gerouteerd en ACP-uitvoer wordt teruggeleverd aan datzelfde
    kanaal/diezelfde thread/datzelfde onderwerp.

    Wat OpenClaw naar de harnas verzendt:

    - Normale gebonden vervolgberichten worden als prompttekst verzonden, met bijlagen alleen wanneer de harnas/backend die ondersteunt.
    - Beheeropdrachten van `/acp` en lokale Gateway-opdrachten worden vóór ACP-verzending onderschept.
    - Door de runtime gegenereerde voltooiingsgebeurtenissen worden per doel geconcretiseerd. OpenClaw-agents krijgen de interne runtimecontextenvelop van OpenClaw; externe ACP-harnassen krijgen een gewone prompt met het resultaat van het onderliggende proces en een instructie. De onbewerkte envelop `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` mag nooit naar externe harnassen worden verzonden of als ACP-gebruikerstranscripttekst worden opgeslagen.
    - ACP-transcriptvermeldingen gebruiken de voor de gebruiker zichtbare activeringstekst of de gewone voltooiingsprompt. Interne gebeurtenismetadata blijven waar mogelijk gestructureerd in OpenClaw en worden niet behandeld als door de gebruiker geschreven chatinhoud.

  </Accordion>
  <Accordion title="Eenmalige ACP-sessies onder beheer van de oudersessie">
    Eenmalige ACP-sessies die door een andere agentuitvoering worden gestart,
    zijn achtergrondprocessen, vergelijkbaar met subagents:

    - De oudersessie vraagt om werk met `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Het onderliggende proces wordt uitgevoerd in een eigen ACP-harnassessie.
    - Beurten van het onderliggende proces worden uitgevoerd op dezelfde achtergrondbaan die wordt gebruikt voor ingebouwde starts van subagents, zodat een trage ACP-harnas niet-gerelateerd werk in de hoofdsessie niet blokkeert.
    - De voltooiing wordt teruggemeld via het aankondigingspad voor taakvoltooiing. OpenClaw zet interne voltooiingsmetadata om in een gewone ACP-prompt voordat deze naar een externe harnas wordt verzonden, zodat harnassen geen runtimecontextmarkeringen zien die alleen voor OpenClaw bestemd zijn.
    - De oudersessie herschrijft het resultaat van het onderliggende proces in een normale assistentstijl wanneer een voor de gebruiker bestemd antwoord nuttig is.

    Behandel dit pad **niet** als een peer-to-peerchat tussen de oudersessie en
    het onderliggende proces. Het onderliggende proces beschikt al over een
    voltooiingskanaal terug naar de oudersessie.

  </Accordion>
  <Accordion title="Levering via sessions_send en A2A">
    `sessions_send` kan na het starten een andere sessie als doel gebruiken.
    Voor normale peersessies gebruikt OpenClaw na het injecteren van het bericht
    een agent-naar-agentvervolgpad (A2A):

    - Wacht op het antwoord van de doelsessie.
    - Laat de aanvrager en het doel optioneel een begrensd aantal vervolgbeurten uitwisselen.
    - Vraag het doel een aankondigingsbericht te produceren.
    - Lever die aankondiging af bij het zichtbare kanaal of de zichtbare thread.

    Dat A2A-pad is een terugvaloptie voor verzendingen tussen peers waarbij de afzender een
    zichtbare follow-up nodig heeft. Het blijft ingeschakeld wanneer een niet-gerelateerde sessie een
    ACP-doel kan zien en berichten kan sturen, bijvoorbeeld bij ruime instellingen voor
    `tools.sessions.visibility`.

    OpenClaw slaat de A2A-follow-up alleen over wanneer de aanvrager de ouder is van
    zijn eigen eenmalige ACP-kind waarvan de ouder eigenaar is. In dat geval kan het uitvoeren van A2A boven op
    de voltooiing van de taak de ouder activeren met het resultaat van het kind, het
    antwoord van de ouder terugsturen naar het kind en een echo-lus tussen ouder en kind
    veroorzaken. Het resultaat van `sessions_send` meldt `delivery.status="skipped"` voor
    dat kind waarvan de ouder eigenaar is, omdat het voltooiingspad al verantwoordelijk is
    voor het resultaat.

  </Accordion>
  <Accordion title="Een bestaande sessie hervatten">
    Gebruik `resumeSessionId` om een eerdere ACP-sessie voort te zetten in plaats van
    opnieuw te beginnen. De agent speelt de gespreksgeschiedenis opnieuw af via
    `session/load`, zodat deze verdergaat met de volledige context van wat eraan voorafging.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Veelvoorkomende gebruikssituaties:

    - Draag een Codex-sessie over van je laptop naar je telefoon; vraag je agent verder te gaan waar je was gebleven.
    - Zet een codeersessie die je interactief in de CLI bent begonnen zonder gebruikersinterface voort via je agent.
    - Hervat werk dat werd onderbroken door een herstart van de Gateway of een time-out wegens inactiviteit.

    Opmerkingen:

    - `resumeSessionId` is alleen van toepassing wanneer `runtime: "acp"`; de standaardruntime voor subagents negeert dit veld dat alleen voor ACP geldt.
    - `streamTo` is alleen van toepassing wanneer `runtime: "acp"`; de standaardruntime voor subagents negeert dit veld dat alleen voor ACP geldt.
    - `resumeSessionId` is een hostlokale hervattings-id van ACP/de harness, geen OpenClaw-sessiesleutel voor een kanaal; OpenClaw controleert vóór verzending nog steeds het ACP-startbeleid en het beleid van de doelagent, terwijl de ACP-backend of harness verantwoordelijk is voor de autorisatie om die upstream-id te laden.
    - `resumeSessionId` herstelt de upstream ACP-gespreksgeschiedenis; `thread` en `mode` zijn nog steeds normaal van toepassing op de nieuwe OpenClaw-sessie die je aanmaakt, dus voor `mode: "session"` blijft `thread: true` vereist.
    - De doelagent moet `session/load` ondersteunen (Codex en Claude Code doen dit).
    - Als de sessie-id niet wordt gevonden, mislukt het starten met een duidelijke foutmelding; er is geen stille terugval naar een nieuwe sessie.

  </Accordion>
  <Accordion title="Rooktest na implementatie">
    Voer na een implementatie van de Gateway een live end-to-endcontrole uit in plaats van te vertrouwen op
    unittests:

    1. Controleer de geïmplementeerde Gateway-versie en commit op de doelhost.
    2. Open een tijdelijke ACPX-brugsessie naar een live agent.
    3. Vraag die agent `sessions_spawn` aan te roepen met `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` en de taak `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Controleer `accepted=yes`, een echte `childSessionKey` en dat er geen validatiefout is.
    5. Ruim de tijdelijke brugsessie op.

    Beperk de controle tot `mode: "run"` en sla `streamTo: "parent"` over;
    threadgebonden `mode: "session"` en paden voor streamdoorgifte zijn afzonderlijke, uitgebreidere
    integratiecontroles.

  </Accordion>
</AccordionGroup>

## Compatibiliteit met de sandbox

ACP-sessies draaien momenteel in de hostruntime, **niet** binnen de OpenClaw-
sandbox.

<Warning>
**Beveiligingsgrens:**

- De externe harness kan lezen/schrijven volgens de eigen CLI-machtigingen en de geselecteerde `cwd`.
- Het sandboxbeleid van OpenClaw omvat de uitvoering van de ACP-harness **niet**.
- OpenClaw handhaaft nog steeds ACP-functiepoorten, toegestane agents, sessie-eigendom, kanaalkoppelingen en het afleveringsbeleid van de Gateway.
- Gebruik `runtime: "subagent"` voor systeemeigen OpenClaw-werk waarop de sandbox wordt afgedwongen.

</Warning>

Huidige beperkingen:

- Als de sessie van de aanvrager in een sandbox draait, wordt het starten van ACP geblokkeerd voor zowel `sessions_spawn({ runtime: "acp" })` als `/acp spawn`.
- `sessions_spawn` met `runtime: "acp"` ondersteunt `sandbox: "require"` niet.

## Doelsessie bepalen

De meeste `/acp`-acties accepteren een optioneel sessiedoel (`session-key`,
`session-id` of `session-label`).

**Volgorde van bepaling:**

1. Expliciet doelargument (of `--session` voor `/acp steer`)
   - probeert eerst de sleutel
   - daarna een sessie-id in UUID-vorm
   - daarna het label
2. Huidige threadkoppeling (als dit gesprek/deze thread aan een ACP-sessie is gekoppeld).
3. Terugval naar de huidige sessie van de aanvrager.

Zowel koppelingen aan het huidige gesprek als threadkoppelingen tellen mee in stap 2.

Als geen doel kan worden bepaald, retourneert OpenClaw een duidelijke foutmelding
(`Unable to resolve session target: ...`).

## ACP-bediening

| Opdracht              | Wat deze doet                                              | Voorbeeld                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Maakt een ACP-sessie; optionele huidige koppeling of threadkoppeling. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annuleert de lopende beurt voor de doelsessie.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Stuurt een bijsturingsinstructie naar de actieve sessie.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sluit de sessie en ontkoppelt threaddoelen.                  | `/acp close`                                                  |
| `/acp status`        | Toont backend, modus, status, runtimeopties en mogelijkheden. | `/acp status`                                                 |
| `/acp set-mode`      | Stelt de runtimemodus voor de doelsessie in.                      | `/acp set-mode plan`                                          |
| `/acp set`           | Schrijft een algemene runtimeconfiguratieoptie.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Stelt een overschrijving voor de runtimewerkmap in.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Stelt het profiel voor het goedkeuringsbeleid in.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | Stelt de runtime-time-out in (seconden).                            | `/acp timeout 120`                                            |
| `/acp model`         | Stelt een overschrijving voor het runtimemodel in.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Verwijdert overschrijvingen van runtimeopties voor de sessie.                  | `/acp reset-options`                                          |
| `/acp sessions`      | Vermeldt recente ACP-sessies uit de opslag.                      | `/acp sessions`                                               |
| `/acp doctor`        | Toont backendstatus, mogelijkheden en uitvoerbare oplossingen.           | `/acp doctor`                                                 |
| `/acp install`       | Drukt deterministische installatie- en activeringsstappen af.             | `/acp install`                                                |

Voor runtimebediening (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` en `reset-options`) is
de identiteit van de eigenaar vereist via externe kanalen en `operator.admin` via interne
Gateway-clients. Geautoriseerde afzenders die geen eigenaar zijn, kunnen nog steeds `sessions`,
`doctor`, `install` en `help` gebruiken.

`/acp status` toont de effectieve runtimeopties plus sessie-id's op runtime- en
backendniveau. Fouten voor niet-ondersteunde bediening worden
duidelijk weergegeven wanneer een backend een mogelijkheid mist. `/acp sessions` leest de opslag
voor de huidige gekoppelde sessie of de sessie van de aanvrager; doeltokens (`session-key`,
`session-id` of `session-label`) worden bepaald via sessiedetectie van de Gateway,
inclusief aangepaste `session.store`-hoofdmappen per agent.

### Toewijzing van runtimeopties

`/acp` heeft gemaksopdrachten en een algemene insteller. Gelijkwaardige bewerkingen:

| Opdracht                      | Wordt toegewezen aan                              | Opmerkingen                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtimeconfiguratiesleutel `model`           | Voor Codex ACP normaliseert OpenClaw `openai/<model>` naar de model-id van de adapter en wijst het achtervoegsel voor redeneerniveau na een slash, zoals `openai/gpt-5.4/high`, toe aan `reasoning_effort`.                                         |
| `/acp set thinking <level>`  | canonieke optie `thinking`          | OpenClaw verzendt, indien aanwezig, het door de backend geadverteerde equivalent, met voorkeur voor `thinking`, daarna `effort`, `reasoning_effort` of `thought_level`. Voor Codex ACP wijst de adapter waarden toe aan `reasoning_effort`. |
| `/acp permissions <profile>` | canonieke optie `permissionProfile` | OpenClaw verzendt, indien aanwezig, het door de backend geadverteerde equivalent, zoals `approval_policy`, `permission_profile`, `permissions` of `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | canonieke optie `timeoutSeconds`    | OpenClaw verzendt, indien aanwezig, het door de backend geadverteerde equivalent, zoals `timeout` of `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | overschrijving van runtime-`cwd`                 | Rechtstreekse update.                                                                                                                                                                                             |
| `/acp set <key> <value>`     | algemeen                              | `key=cwd` gebruikt het pad voor de `cwd`-overschrijving.                                                                                                                                                                      |
| `/acp reset-options`         | wist alle runtimeoverschrijvingen         | -                                                                                                                                                                                                          |

## acpx-harness, Plugin-configuratie en machtigingen

Zie [ACP-agents - configuratie](/nl/tools/acp-agents-setup) voor de configuratie van de acpx-harness (Claude Code-/Codex-/Gemini CLI-aliassen),
de MCP-bruggen voor Plugin-hulpprogramma's en OpenClaw-hulpprogramma's, en ACP-machtigingsmodi.

## Probleemoplossing

| Symptoom                                                                                  | Waarschijnlijke oorzaak                                                                                                 | Oplossing                                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | Backendplugin ontbreekt, is uitgeschakeld of wordt geblokkeerd door `plugins.allow`.                                    | Installeer en activeer het backendplugin, neem `acpx` op in `plugins.allow` wanneer die toelatingslijst is ingesteld en voer vervolgens `/acp doctor` uit.                |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP is globaal uitgeschakeld.                                                                                           | Stel `acp.enabled=true` in.                                                                                                                                               |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Automatische verzending vanuit normale threadberichten is uitgeschakeld.                                                | Stel `acp.dispatch.enabled=true` in om automatische threadroutering te hervatten; expliciete aanroepen van `sessions_spawn({ runtime: "acp" })` blijven werken.           |
| `ACP agent "<id>" is not allowed by policy`                                               | Agent staat niet op de toelatingslijst.                                                                                 | Gebruik een toegestane `agentId` of werk `acp.allowedAgents` bij.                                                                                                         |
| `/acp doctor` reports backend not ready right after startup                               | Backendplugin ontbreekt, is uitgeschakeld, wordt geblokkeerd door toelatings-/weigeringsbeleid of het geconfigureerde uitvoerbare bestand is niet beschikbaar. | Installeer/activeer het backendplugin, voer `/acp doctor` opnieuw uit en controleer de installatie- of beleidsfout van de backend als deze ongezond blijft.                |
| Harness-opdracht niet gevonden                                                           | De adapter-CLI is niet geïnstalleerd, het externe plugin ontbreekt of het ophalen via `npx` bij de eerste uitvoering is mislukt voor een niet-Codex-adapter. | Voer `/acp doctor` uit, installeer/warm de adapter vooraf op de Gateway-host op of configureer de acpx-agentopdracht expliciet.                                           |
| Model niet gevonden door de harness                                                      | De model-id is geldig voor een andere provider/harness, maar niet voor dit ACP-doel.                                    | Gebruik een model dat door die harness wordt vermeld, configureer het model in de harness of laat de overschrijving weg.                                                  |
| Authenticatiefout van leverancier vanuit de harness                                      | OpenClaw werkt correct, maar er is niet aangemeld bij de doel-CLI/provider.                                              | Meld u aan of verstrek de vereiste providersleutel in de omgeving van de Gateway-host.                                                                                    |
| `Unable to resolve session target: ...`                                                   | Ongeldig sleutel-/id-/labeltoken.                                                                                       | Voer `/acp sessions` uit, kopieer de exacte sleutel/het exacte label en probeer het opnieuw.                                                                               |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` is gebruikt zonder actieve koppelbare conversatie.                                                        | Ga naar de doelchat/het doelkanaal en probeer het opnieuw, of start zonder koppeling.                                                                                      |
| `Conversation bindings are unavailable for <channel>.`                                    | De adapter ondersteunt geen ACP-koppeling voor de huidige conversatie.                                                  | Gebruik waar ondersteund `/acp spawn ... --thread ...`, configureer `bindings[]` op het hoogste niveau of ga naar een ondersteund kanaal.                                 |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` is buiten een threadcontext gebruikt.                                                                   | Ga naar de doelthread of gebruik `--thread auto`/`off`.                                                                                                                   |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Een andere gebruiker is eigenaar van het actieve koppelingsdoel.                                                        | Koppel opnieuw als eigenaar of gebruik een andere conversatie of thread.                                                                                                  |
| `Thread bindings are unavailable for <channel>.`                                          | De adapter ondersteunt geen threadkoppeling.                                                                            | Gebruik `--thread off` of ga naar een ondersteunde adapter/een ondersteund kanaal.                                                                                         |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | De ACP-runtime draait aan de hostzijde; de aanvragende sessie bevindt zich in een sandbox.                              | Gebruik `runtime="subagent"` vanuit sessies in een sandbox of start ACP vanuit een sessie zonder sandbox.                                                                 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | `sandbox="require"` is aangevraagd voor de ACP-runtime.                                                                 | Gebruik `runtime="subagent"` wanneer een sandbox vereist is, of gebruik ACP met `sandbox="inherit"` vanuit een sessie zonder sandbox.                                     |
| `Cannot apply --model ... did not advertise model support`                                | De doelharness biedt geen generieke ACP-modelwisseling.                                                                 | Gebruik een harness die ACP `models`/`session/set_model` aanbiedt, gebruik Codex ACP-modelreferenties of configureer het model rechtstreeks in de harness als die een eigen opstartvlag heeft. |
| Ontbrekende ACP-metadata voor gekoppelde sessie                                           | Verouderde/verwijderde ACP-sessiemetadata.                                                                              | Maak de sessie opnieuw met `/acp spawn` en koppel/focus daarna de thread opnieuw.                                                                                          |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blokkeert schrijfbewerkingen/uitvoering in een niet-interactieve ACP-sessie.                           | Stel `plugins.entries.acpx.config.permissionMode` in op `approve-all` en herstart de Gateway. Zie [Machtigingen configureren](/nl/tools/acp-agents-setup#permission-configuration). |
| ACP-sessie mislukt vroegtijdig met weinig uitvoer                                         | Machtigingsprompts worden geblokkeerd door `permissionMode`/`nonInteractivePermissions`.                                | Controleer de Gateway-logboeken op `AcpRuntimeError`. Stel voor volledige machtigingen `permissionMode=approve-all` in; stel voor gecontroleerde degradatie `nonInteractivePermissions=deny` in. |
| ACP-sessie blijft na voltooiing van het werk onbeperkt hangen                             | Het harnessproces is voltooid, maar de ACP-sessie heeft geen voltooiing gemeld.                                         | Werk OpenClaw bij; de huidige acpx-opruiming beëindigt verouderde wrapper- en adapterprocessen die eigendom zijn van OpenClaw bij het sluiten en tijdens het opstarten van de Gateway. |
| Harness ziet `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | Interne gebeurtenisenvelop is over de ACP-grens gelekt.                                                                 | Werk OpenClaw bij en voer de voltooiingsstroom opnieuw uit; externe harnesses horen uitsluitend gewone voltooiingsprompts te ontvangen.                                  |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` behoort tot
de systeemeigen Codex-hookrelay, niet tot ACP/acpx. Start in een gekoppelde
Codex-chat een nieuwe sessie met `/new` of `/reset`; als het eenmaal werkt en
vervolgens bij de volgende systeemeigen toolaanroep terugkeert, herstart dan
de Codex-app-server of OpenClaw Gateway in plaats van `/new` te blijven
herhalen. Zie
[Problemen met de Codex-harness oplossen](/nl/plugins/codex-harness#troubleshooting).
</Note>

## Gerelateerd

- [ACP-agents - configuratie](/nl/tools/acp-agents-setup)
- [Naar agent verzenden](/nl/tools/agent-send)
- [CLI-backends](/nl/gateway/cli-backends)
- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Sandboxtools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (brugmodus)](/nl/cli/acp)
- [Subagents](/nl/tools/subagents)
