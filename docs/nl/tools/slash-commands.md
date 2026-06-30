---
read_when:
    - Chatopdrachten gebruiken of configureren
    - Opdrachtroutering of machtigingen debuggen
    - Begrijpen hoe skill-opdrachten worden geregistreerd
sidebarTitle: Slash commands
summary: Alle beschikbare slash-opdrachten, directives en inline sneltoetsen — configuratie, routering en gedrag per oppervlak.
title: Slash-commando's
x-i18n:
    generated_at: "2026-06-30T14:12:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

De Gateway verwerkt opdrachten die als zelfstandige berichten worden verzonden en beginnen met `/`.
Bash-opdrachten alleen voor de host gebruiken `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek aan een ACP-sessie is gekoppeld, wordt normale tekst naar de ACP-
harness gerouteerd. Beheeropdrachten voor de Gateway blijven lokaal: `/acp ...` bereikt altijd
de OpenClaw-opdrachthandler, en `/status` plus `/unfocus` blijven lokaal wanneer
opdrachtverwerking voor het oppervlak is ingeschakeld.

## Drie opdrachttypen

<CardGroup cols={3}>
  <Card title="Opdrachten" icon="terminal">
    Zelfstandige `/...`-berichten die door de Gateway worden verwerkt. Moeten als de
    enige inhoud in het bericht worden verzonden.
  </Card>
  <Card title="Directieven" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — verwijderd uit het bericht voordat het model
    het ziet. Slaan sessie-instellingen op wanneer ze alleen worden verzonden; werken als inline hints
    wanneer ze met andere tekst worden verzonden.
  </Card>
  <Card title="Inline snelkoppelingen" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — worden direct uitgevoerd en worden
    verwijderd voordat het model de resterende tekst ziet. Alleen geautoriseerde afzenders.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Details van directiefgedrag">
    - Directieven worden uit het bericht verwijderd voordat het model het ziet.
    - In berichten met **alleen directieven** (het bericht bevat alleen directieven), worden ze
      in de sessie opgeslagen en beantwoorden ze met een bevestiging.
    - In **normale chat**-berichten met andere tekst werken ze als inline hints en
      slaan ze **geen** sessie-instellingen op.
    - Directieven zijn alleen van toepassing op **geautoriseerde afzenders**. Als `commands.allowFrom`
      is ingesteld, is dat de enige gebruikte toelatingslijst; anders komt autorisatie uit
      kanaaltoelatingslijsten/koppeling plus `commands.useAccessGroups`. Ongeautoriseerde
      afzenders zien directieven als platte tekst behandeld.
  </Accordion>
</AccordionGroup>

## Configuratie

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Schakelt het parsen van `/...` in chatberichten in. Op oppervlakken zonder native opdrachten
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) werken tekst-
  opdrachten zelfs wanneer dit op `false` staat.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registreert native opdrachten. Auto: aan voor Discord/Telegram; uit voor Slack;
  genegeerd voor providers zonder native ondersteuning. Overschrijf per kanaal met
  `channels.<provider>.commands.native`. Op Discord slaat `false` registratie van slash-opdrachten
  over; eerder geregistreerde opdrachten kunnen zichtbaar blijven totdat ze worden verwijderd.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registreert skillopdrachten native wanneer ondersteund. Auto: aan voor
  Discord/Telegram; uit voor Slack. Overschrijf met
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Schakelt `! <cmd>` in om shellopdrachten op de host uit te voeren (`/bash <cmd>`-alias). Vereist
  `tools.elevated`-toelatingslijsten.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Hoe lang bash wacht voordat naar achtergrondmodus wordt overgeschakeld (`0` zet direct
  op de achtergrond).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`). Alleen eigenaar.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`). Alleen eigenaar.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (Plugin-detectie/status plus installeren en in-/uitschakelen). Alleen eigenaar voor schrijven.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (runtime-only configuratie-overschrijvingen). Alleen eigenaar.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` en Gateway-herstarttoolacties in.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Expliciete eigenaarstoegestane lijst voor opdrachtoppervlakken die alleen voor de eigenaar zijn. Staat los van
  `commands.allowFrom` en DM-koppelingstoegang.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: vereist eigenaarsidentiteit voor opdrachten die alleen voor de eigenaar zijn. Wanneer `true`,
  moet de afzender overeenkomen met `commands.ownerAllowFrom` of interne `operator.admin`-
  scope hebben. Een wildcardvermelding in `allowFrom` is **niet** voldoende.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe eigenaar-id's in de systeemprompt verschijnen.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-geheim dat wordt gebruikt wanneer `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Per-provider toelatingslijst voor opdrachtautorisatie. Wanneer geconfigureerd, is dit de
  **enige** autorisatiebron voor opdrachten en directieven. Gebruik `"*"` voor een
  globale standaard; providerspecifieke sleutels overschrijven die.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt toelatingslijsten/beleid af voor opdrachten wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Opdrachten komen uit drie bronnen:

- **Ingebouwde core-opdrachten:** `src/auto-reply/commands-registry.shared.ts`
- **Gegenereerde dock-opdrachten:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-opdrachten:** plugin `registerCommand()`-aanroepen

Beschikbaarheid hangt af van configuratievlaggen, kanaaloppervlak en geïnstalleerde/ingeschakelde
plugins.

### Core-opdrachten

<AccordionGroup>
  <Accordion title="Sessies en runs">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/new [model]` | Archiveer de huidige sessie en start een nieuwe |
    | `/reset [soft [message]]` | Reset de huidige sessie op zijn plek. `soft` behoudt het transcript, laat hergebruikte CLI-backendsessie-id's vallen en voert de opstart opnieuw uit |
    | `/name <title>` | Geef de huidige sessie een naam of hernoem deze. Laat de titel weg om de huidige naam en een suggestie te zien |
    | `/compact [instructions]` | Compact de sessiecontext. Zie [Compaction](/nl/concepts/compaction) |
    | `/stop` | Breek de huidige run af |
    | `/session idle <duration\|off>` | Beheer het verlopen van threadkoppeling bij inactiviteit |
    | `/session max-age <duration\|off>` | Beheer het verlopen van threadkoppeling op maximale leeftijd |
    | `/export-session [path]` | Exporteer de huidige sessie naar HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporteer een JSONL-trajectbundel voor de huidige sessie. Alias: `/trajectory` |

    <Note>
      Control UI onderschept getypte `/new` om een nieuwe
      dashboardsessie te maken en ernaar over te schakelen, behalve wanneer `session.dmScope: "main"` is geconfigureerd
      en de huidige ouder de hoofdsessie van de agent is — in dat geval reset `/new`
      de hoofdsessie op zijn plek. Getypte `/reset` voert nog steeds de
      in-place reset van de Gateway uit. Gebruik `/model default` wanneer je een vastgezette
      modelselectie voor de sessie wilt wissen.
    </Note>

  </Accordion>

  <Accordion title="Model- en runbesturing">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/think <level\|default>` | Stel het denkniveau in of wis de sessie-overschrijving. Aliassen: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schakel uitgebreide uitvoer in of uit. Alias: `/v` |
    | `/trace on\|off` | Schakel Plugin-trace-uitvoer voor de huidige sessie in of uit |
    | `/fast [status\|auto\|on\|off\|default]` | Toon, stel in of wis snelle modus |
    | `/reasoning [on\|off\|stream]` | Schakel zichtbaarheid van redenering in of uit. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schakel verhoogde modus in of uit. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Toon of stel exec-standaarden in |
    | `/model [name\|#\|status]` | Toon of stel het model in |
    | `/models [provider] [page] [limit=<n>\|all]` | Toon geconfigureerde/providers met beschikbare auth of modellen |
    | `/queue <mode>` | Beheer wachtrijgedrag voor actieve runs. Zie [Queue](/nl/concepts/queue) en [Queue steering](/nl/concepts/queue-steering) |
    | `/steer <message>` | Injecteer begeleiding in de actieve run. Alias: `/tell`. Zie [Steer](/nl/tools/steer) |

    <AccordionGroup>
      <Accordion title="veiligheid van verbose / trace / fast / reasoning">
        - `/verbose` is voor debugging — houd het **uit** bij normaal gebruik.
        - `/trace` toont alleen trace-/debugregels die eigendom zijn van de Plugin; normale uitgebreide ruis blijft uit.
        - `/fast auto|on|off` slaat een sessie-overschrijving op; gebruik de optie `inherit` in de Sessions UI om die te wissen.
        - `/fast` is providerspecifiek: OpenAI/Codex koppelen dit aan `service_tier=priority`; directe Anthropic-verzoeken koppelen dit aan `service_tier=auto` of `standard_only`.
        - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsinstellingen — ze kunnen interne redenering of Plugin-diagnostiek onthullen. Houd ze uit in groepschats.

      </Accordion>
      <Accordion title="Details van modelwisseling">
        - `/model` slaat het nieuwe model direct op in de sessie.
        - Als de agent inactief is, gebruikt de volgende run het meteen.
        - Als een run actief is, wordt de wissel als in behandeling gemarkeerd en toegepast bij het volgende schone retrypunt.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Detectie en status">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/help` | Toon de korte hulpsamenvatting |
    | `/commands` | Toon de gegenereerde opdrachtencatalogus |
    | `/tools [compact\|verbose]` | Toon wat de huidige agent nu kan gebruiken |
    | `/status` | Toon uitvoerings-/runtimestatus, uptime van Gateway en systeem, Plugin-gezondheid, plus providergebruik/quota |
    | `/status plugins` | Toon gedetailleerde Plugin-gezondheid: laadfouten, quarantaines, kanaalfouten, dependency-problemen, compatibiliteitsmeldingen |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Beheer het duurzame [doel](/nl/tools/goal) van de huidige sessie |
    | `/diagnostics [note]` | Ondersteuningsrapportflow alleen voor eigenaar. Vraagt elke keer om exec-goedkeuring |
    | `/crestodian <request>` | Voer de Crestodian-installatie- en reparatiehelper uit vanuit een eigenaars-DM |
    | `/tasks` | Toon actieve/recente achtergrondtaken voor de huidige sessie |
    | `/context [list\|detail\|map\|json]` | Leg uit hoe context wordt samengesteld |
    | `/whoami` | Toon je afzender-id. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Beheer de gebruiksvoettekst per antwoord (`reset`/`inherit`/`clear`/`default` wist de sessie-overschrijving om opnieuw de geconfigureerde standaard te erven) of druk een lokale kostensamenvatting af |
  </Accordion>

  <Accordion title="Skills, toelatingslijsten, goedkeuringen">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/skill <name> [input]` | Voer een skill op naam uit |
    | `/allowlist [list\|add\|remove] ...` | Beheer vermeldingen in de toelatingslijst. Alleen tekst |
    | `/approve <id> <decision>` | Los exec- of Plugin-goedkeuringsprompts op |
    | `/btw <question>` | Stel een nevenvraag zonder de sessiecontext te wijzigen. Alias: `/side`. Zie [BTW](/nl/tools/btw) |
  </Accordion>

  <Accordion title="Subagenten en ACP">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecteer subagentruns voor de huidige sessie |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Beheer ACP-sessies en runtimeopties. Runtimebediening vereist een externe eigenaar of interne Gateway-beheerdersidentiteit |
    | `/focus <target>` | Koppel de huidige Discord-thread of het huidige Telegram-onderwerp aan een sessiedoel |
    | `/unfocus` | Verwijder de huidige threadkoppeling |
    | `/agents` | Toon threadgebonden agenten voor de huidige sessie |
  </Accordion>

  <Accordion title="Schrijfbewerkingen en beheer alleen voor eigenaar">
    | Opdracht | Vereist | Beschrijving |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lees of schrijf `openclaw.json`. Alleen eigenaar |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lees of schrijf door OpenClaw beheerde MCP-serverconfiguratie. Alleen eigenaar |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecteer of wijzig de pluginstatus. Alleen eigenaar voor schrijfbewerkingen. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Configuratie-overschrijvingen alleen voor runtime. Alleen eigenaar |
    | `/restart` | `commands.restart: true` (standaard) | Herstart OpenClaw |
    | `/send on\|off\|inherit` | eigenaar | Stel het verzendbeleid in |
  </Accordion>

  <Accordion title="Spraak, TTS, kanaalbeheer">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Bedien TTS. Zie [TTS](/nl/tools/tts) |
    | `/activation mention\|always` | Stel de activeringsmodus voor groepen in |
    | `/bash <command>` | Voer een hostshellopdracht uit. Alias: `! <command>`. Vereist `commands.bash: true` |
    | `!poll [sessionId]` | Controleer een bash-achtergrondtaak |
    | `!stop [sessionId]` | Stop een bash-achtergrondtaak |
  </Accordion>
</AccordionGroup>

### Dock-opdrachten

Dock-opdrachten schakelen de antwoordroute van de actieve sessie over naar een ander gekoppeld kanaal.
Zie [Kanaaldocking](/nl/concepts/channel-docking) voor installatie en probleemoplossing.

Gegenereerd uit kanaalplugins met ondersteuning voor native opdrachten:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Dock-opdrachten vereisen `session.identityLinks`. De bronafzender en doelpeer
moeten in dezelfde identiteitsgroep zitten.

### Meegeleverde pluginopdrachten

| Opdracht                                                                                     | Beschrijving                                                                                         |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Schakel geheugendromen in of uit (eigenaar of Gateway-beheerder). Zie [Dreaming](/nl/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Beheer apparaatkoppeling. Zie [Koppelen](/nl/channels/pairing)                                          |
| `/phone status\|arm ...\|disarm`                                                             | Schakel opdrachten voor telefoonnodes met hoog risico tijdelijk in                                   |
| `/voice status\|list\|set <voiceId>`                                                         | Beheer Talk-spraakconfiguratie. Native Discord-naam: `/talkvoice`                                    |
| `/card ...`                                                                                  | Verstuur LINE-richcard-presets. Zie [LINE](/nl/channels/line)                                          |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Bedien het Codex-appserverharnas. Zie [Codex-harnas](/nl/plugins/codex-harness)                        |

Alleen QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-opdrachten

Door gebruikers aanroepbare Skills worden als slash-opdrachten aangeboden:

- `/skill <name> [input]` werkt altijd als het generieke toegangspunt.
- Skills kunnen zich registreren als directe opdrachten (bijv. `/prose` voor OpenProse).
- Native registratie van skillopdrachten wordt beheerd door `commands.nativeSkills` en
  `channels.<provider>.commands.nativeSkills`.
- Namen worden opgeschoond naar `a-z0-9_` (max. 32 tekens); botsingen krijgen numerieke achtervoegsels.

<AccordionGroup>
  <Accordion title="Routering van skillopdrachten">
    Standaard worden skillopdrachten als een normale aanvraag naar het model gerouteerd.

    Skills kunnen `command-dispatch: tool` declareren om rechtstreeks naar een tool te routeren
    (deterministisch, zonder betrokkenheid van het model). Voorbeeld: `/prose` (OpenProse-plugin)
    — zie [OpenProse](/nl/prose).

  </Accordion>
  <Accordion title="Argumenten voor native opdrachten">
    Discord gebruikt automatisch aanvullen voor dynamische opties en knopmenu's wanneer vereiste
    argumenten zijn weggelaten. Telegram en Slack tonen een knopmenu voor opdrachten met
    keuzes. Dynamische keuzes worden opgelost tegen het model van de doelsessie, dus modelspecifieke
    opties zoals `/think`-niveaus volgen de `/model`-overschrijving van de sessie.
  </Accordion>
</AccordionGroup>

## `/tools` — wat de agent nu kan gebruiken

`/tools` beantwoordt een runtimevraag: **wat deze agent nu kan gebruiken in dit
gesprek** — geen statische configuratiecatalogus.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Resultaten zijn sessiegebonden. Het wijzigen van agent, kanaal, thread, afzenderautorisatie
of model kan de uitvoer veranderen. Gebruik voor het bewerken van profielen en overschrijvingen
het Tools-paneel in de Control UI of configuratieoppervlakken.

## `/model` — modelselectie

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Op Discord openen `/model` en `/models` een interactieve kiezer met provider- en
modelkeuzelijsten. De kiezer respecteert `agents.defaults.models`, inclusief
`provider/*`-vermeldingen.

## `/config` — config-schrijfbewerkingen op schijf

<Note>
  Alleen eigenaar. Standaard uitgeschakeld — schakel in met `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Config wordt gevalideerd voordat er wordt geschreven. Ongeldige wijzigingen worden geweigerd. `/config`-
updates blijven behouden na herstarts.

## `/mcp` — MCP-serverconfiguratie

<Note>
  Alleen eigenaar. Standaard uitgeschakeld — schakel in met `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` slaat configuratie op in de OpenClaw-configuratie, niet in projectinstellingen van ingesloten agents.

## `/debug` — overschrijvingen alleen voor runtime

<Note>
  Alleen eigenaar. Standaard uitgeschakeld — schakel in met `commands.debug: true`.
  Overschrijvingen worden direct toegepast op nieuwe configuratielezingen, maar schrijven **niet** naar schijf.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — pluginbeheer

<Note>
  Alleen eigenaar voor schrijfbewerkingen. Standaard uitgeschakeld — schakel in met `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` werkt pluginconfiguratie bij en herlaadt de Gateway-
pluginruntime warm voor nieuwe agentbeurten. `/plugins install` herstart beheerde
Gateways automatisch omdat bronmodules van plugins zijn gewijzigd.

## `/trace` — plugintrace-uitvoer

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` toont sessiegebonden plugintrace-/debugregels zonder volledige uitgebreide
modus. Het vervangt `/debug` (runtimeoverschrijvingen) of `/verbose` (normale
tooluitvoer) niet.

## `/btw` — nevenvragen

`/btw` is een snelle nevenvraag over de huidige sessiecontext. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

In tegenstelling tot een normaal bericht:

- Gebruikt de huidige sessie als achtergrondcontext.
- Draait in Codex-harnassessies als een tijdelijke Codex-neventhread.
- Wijzigt toekomstige sessiecontext **niet**.
- Wordt niet naar transcriptgeschiedenis geschreven.

Zie [BTW-nevenvragen](/nl/tools/btw) voor het volledige gedrag.

## Oppervlaknotities

<AccordionGroup>
  <Accordion title="Sessiescoping per oppervlak">
    - **Tekstopdrachten:** draaien in de normale chatsessie (DM's delen `main`, groepen hebben hun eigen sessie).
    - **Native Discord-opdrachten:** `agent:<agentId>:discord:slash:<userId>`
    - **Native Slack-opdrachten:** `agent:<agentId>:slack:slash:<userId>` (prefix configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
    - **Native Telegram-opdrachten:** `telegram:slash:<userId>` (richt zich op de chatsessie via `CommandTargetSessionKey`)
    - **`/stop`** richt zich op de actieve chatsessie om de huidige run af te breken.

  </Accordion>
  <Accordion title="Slack-specifiek">
    `channels.slack.slashCommand` ondersteunt één opdracht in `/openclaw`-stijl.
    Met `commands.native: true` maak je één Slack-slashopdracht per ingebouwde
    opdracht. Registreer `/agentstatus` (niet `/status`) omdat Slack
    `/status` reserveert. Tekst `/status` werkt nog steeds in Slack-berichten.
  </Accordion>
  <Accordion title="Snel pad en inline snelkoppelingen">
    - Berichten met alleen opdrachten van toegestane afzenders worden direct afgehandeld (omzeilt wachtrij + model).
    - Inline snelkoppelingen (`/help`, `/commands`, `/status`, `/whoami`) werken ook ingesloten in normale berichten en worden verwijderd voordat het model de resterende tekst ziet.
    - Niet-geautoriseerde berichten met alleen opdrachten worden stil genegeerd; inline `/...`-tokens worden als platte tekst behandeld.

  </Accordion>
  <Accordion title="Argumentnotities">
    - Opdrachten accepteren een optionele `:` tussen de opdracht en argumenten (`/think: high`, `/send: on`).
    - `/new <model>` accepteert een modelalias, `provider/model` of een providernaam (fuzzy match); als er geen match is, wordt de tekst behandeld als de berichtinhoud.
    - `/allowlist add|remove` vereist `commands.config: true` en respecteert kanaal-`configWrites`.

  </Accordion>
</AccordionGroup>

## Providergebruik en status

- **Providergebruik/quotum** (bijv. "Claude 80% left") wordt getoond in `/status` voor de huidige modelprovider wanneer gebruikstracking is ingeschakeld.
- **Token-/cacheregels** in `/status` kunnen terugvallen op de nieuwste gebruiksvermelding in het transcript wanneer de live sessiesnapshot schaars is.
- **Uitvoering versus runtime:** `/status` rapporteert `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie uitvoert: `OpenClaw Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per antwoord:** beheerd door `/usage off|tokens|full`.
- `/model status` gaat over modellen/authenticatie/eindpunten, niet over gebruik.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills" href="/nl/tools/skills" icon="puzzle-piece">
    Hoe skill-slashopdrachten worden geregistreerd en afgeschermd.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Bouw een skill die zijn eigen slash-opdracht registreert.
  </Card>
  <Card title="BTW" href="/nl/tools/btw" icon="comments">
    Nevenvragen zonder sessiecontext te wijzigen.
  </Card>
  <Card title="Steer" href="/nl/tools/steer" icon="compass">
    Stuur de agent tijdens de run bij met `/steer`.
  </Card>
</CardGroup>
