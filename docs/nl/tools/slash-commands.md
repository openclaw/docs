---
read_when:
    - Chatopdrachten gebruiken of configureren
    - Foutopsporing van opdrachtroutering of machtigingen
    - Begrijpen hoe skill-opdrachten worden geregistreerd
sidebarTitle: Slash commands
summary: Alle beschikbare slash-opdrachten, richtlijnen en inline snelkoppelingen — configuratie, routering en gedrag per oppervlak.
title: Slash-opdrachten
x-i18n:
    generated_at: "2026-06-27T18:29:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

De Gateway verwerkt opdrachten die als zelfstandige berichten worden verzonden en beginnen met `/`.
Host-only bash-opdrachten gebruiken `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek is gekoppeld aan een ACP-sessie, wordt normale tekst naar de ACP
harness gerouteerd. Gateway-beheeropdrachten blijven lokaal: `/acp ...` bereikt altijd
de OpenClaw-opdrachthandler, en `/status` plus `/unfocus` blijven lokaal wanneer
opdrachtverwerking voor het oppervlak is ingeschakeld.

## Drie opdrachttypen

<CardGroup cols={3}>
  <Card title="Opdrachten" icon="terminal">
    Zelfstandige `/...`-berichten die door de Gateway worden verwerkt. Moeten als de
    enige inhoud in het bericht worden verzonden.
  </Card>
  <Card title="Richtlijnen" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — worden uit het bericht verwijderd voordat het model
    het ziet. Behouden sessie-instellingen wanneer ze alleen worden verzonden; werken als inline hints
    wanneer ze met andere tekst worden verzonden.
  </Card>
  <Card title="Inline-snelkoppelingen" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — worden direct uitgevoerd en
    verwijderd voordat het model de resterende tekst ziet. Alleen geautoriseerde afzenders.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Details van richtlijngedrag">
    - Richtlijnen worden uit het bericht verwijderd voordat het model het ziet.
    - In berichten met **alleen richtlijnen** (het bericht bevat alleen richtlijnen), blijven ze
      behouden in de sessie en antwoorden ze met een bevestiging.
    - In **normale chat**-berichten met andere tekst werken ze als inline hints en
      blijven sessie-instellingen **niet** behouden.
    - Richtlijnen gelden alleen voor **geautoriseerde afzenders**. Als `commands.allowFrom`
      is ingesteld, is dit de enige gebruikte allowlist; anders komt autorisatie uit
      kanaal-allowlists/koppeling plus `commands.useAccessGroups`. Niet-geautoriseerde
      afzenders zien richtlijnen behandeld als gewone tekst.
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
  Schakelt het parseren van `/...` in chatberichten in. Op oppervlakken zonder native opdrachten
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) werken tekstopdrachten
  zelfs wanneer dit is ingesteld op `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registreert native opdrachten. Auto: aan voor Discord/Telegram; uit voor Slack;
  genegeerd voor providers zonder native ondersteuning. Overschrijf per kanaal met
  `channels.<provider>.commands.native`. Op Discord slaat `false` registratie van slash-opdrachten
  over; eerder geregistreerde opdrachten kunnen zichtbaar blijven totdat ze worden verwijderd.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registreert Skills-opdrachten native wanneer ondersteund. Auto: aan voor
  Discord/Telegram; uit voor Slack. Overschrijf met
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Schakelt `! <cmd>` in om hostshell-opdrachten uit te voeren (`/bash <cmd>`-alias). Vereist
  `tools.elevated`-allowlists.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Hoe lang bash wacht voordat wordt overgeschakeld naar achtergrondmodus (`0` plaatst
  direct op de achtergrond).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`). Alleen eigenaar.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`). Alleen eigenaar.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (pluginontdekking/status plus installeren + inschakelen/uitschakelen). Alleen eigenaar voor schrijfacties.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (runtime-only configuratieoverschrijvingen). Alleen eigenaar.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` en Gateway-herstarttoolacties in.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Expliciete eigenaar-allowlist voor opdrachtoppervlakken die alleen voor de eigenaar zijn. Staat los van
  `commands.allowFrom` en DM-koppelingstoegang.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: vereist eigenaaridentiteit voor opdrachten die alleen voor de eigenaar zijn. Wanneer `true`,
  moet de afzender overeenkomen met `commands.ownerAllowFrom` of interne `operator.admin`-
  scope hebben. Een wildcardvermelding in `allowFrom` is **niet** voldoende.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe eigenaars-id's in de systeemprompt verschijnen.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-geheim dat wordt gebruikt wanneer `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider voor opdrachtautorisatie. Wanneer geconfigureerd, is dit de
  **enige** autorisatiebron voor opdrachten en richtlijnen. Gebruik `"*"` voor een
  globale standaard; providerspecifieke sleutels overschrijven deze.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt allowlists/beleid voor opdrachten af wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Opdrachten komen uit drie bronnen:

- **Ingebouwde core-opdrachten:** `src/auto-reply/commands-registry.shared.ts`
- **Gegenereerde dockopdrachten:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-opdrachten:** plugin `registerCommand()`-aanroepen

Beschikbaarheid hangt af van configuratievlaggen, kanaaloppervlak en geïnstalleerde/ingeschakelde
plugins.

### Core-opdrachten

<AccordionGroup>
  <Accordion title="Sessies en runs">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/new [model]` | Archiveer de huidige sessie en start een nieuwe |
    | `/reset [soft [message]]` | Reset de huidige sessie op dezelfde plek. `soft` behoudt het transcript, verwijdert hergebruikte CLI-backendsessie-id's en voert startup opnieuw uit |
    | `/name <title>` | Geef de huidige sessie een naam of hernoem deze. Laat de titel weg om de huidige naam en een suggestie te zien |
    | `/compact [instructions]` | Compacteer de sessiecontext. Zie [Compaction](/nl/concepts/compaction) |
    | `/stop` | Breek de huidige run af |
    | `/session idle <duration\|off>` | Beheer verloop door inactiviteit van threadbinding |
    | `/session max-age <duration\|off>` | Beheer verloop door maximale leeftijd van threadbinding |
    | `/export-session [path]` | Exporteer de huidige sessie naar HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporteer een JSONL-trajectbundel voor de huidige sessie. Alias: `/trajectory` |

    <Note>
      Control UI onderschept getypte `/new` om een nieuwe
      dashboardsessie te maken en ernaar over te schakelen, behalve wanneer `session.dmScope: "main"` is geconfigureerd
      en de huidige parent de hoofdsessie van de agent is — in dat geval reset `/new`
      de hoofdsessie op dezelfde plek. Getypte `/reset` voert nog steeds de
      in-place reset van de Gateway uit. Gebruik `/model default` wanneer je een vastgepinde
      sessiemodelselectie wilt wissen.
    </Note>

  </Accordion>

  <Accordion title="Model- en runbediening">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/think <level\|default>` | Stel het denkniveau in of wis de sessieoverschrijving. Aliassen: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schakel uitgebreide uitvoer om. Alias: `/v` |
    | `/trace on\|off` | Schakel plugin-trace-uitvoer voor de huidige sessie om |
    | `/fast [status\|auto\|on\|off\|default]` | Toon, stel in of wis snelle modus |
    | `/reasoning [on\|off\|stream]` | Schakel zichtbaarheid van redenering om. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schakel verhoogde modus om. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Toon of stel exec-standaarden in |
    | `/model [name\|#\|status]` | Toon of stel het model in |
    | `/models [provider] [page] [limit=<n>\|all]` | Toon geconfigureerde/providers met beschikbare authenticatie of modellen |
    | `/queue <mode>` | Beheer wachtrijgedrag voor actieve runs. Zie [Wachtrij](/nl/concepts/queue) en [Wachtrijsturing](/nl/concepts/queue-steering) |
    | `/steer <message>` | Injecteer begeleiding in de actieve run. Alias: `/tell`. Zie [Sturen](/nl/tools/steer) |

    <AccordionGroup>
      <Accordion title="veiligheid van verbose / trace / fast / reasoning">
        - `/verbose` is voor debugging — houd dit **uit** bij normaal gebruik.
        - `/trace` onthult alleen trace-/debugregels die eigendom zijn van plugins; normale uitgebreide chatter blijft uit.
        - `/fast auto|on|off` behoudt een sessieoverschrijving; gebruik de optie `inherit` in de Sessions UI om deze te wissen.
        - `/fast` is providerspecifiek: OpenAI/Codex koppelen het aan `service_tier=priority`; directe Anthropic-verzoeken koppelen het aan `service_tier=auto` of `standard_only`.
        - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsinstellingen — ze kunnen interne redenering of plugin-diagnostiek onthullen. Houd ze uit in groepschats.

      </Accordion>
      <Accordion title="Details van modelwisseling">
        - `/model` bewaart het nieuwe model direct in de sessie.
        - Als de agent inactief is, gebruikt de volgende run het meteen.
        - Als een run actief is, wordt de wissel als in behandeling gemarkeerd en toegepast bij het volgende schone retrypunt.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Ontdekking en status">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/help` | Toon de korte helpsamenvatting |
    | `/commands` | Toon de gegenereerde opdrachtencatalogus |
    | `/tools [compact\|verbose]` | Toon wat de huidige agent nu kan gebruiken |
    | `/status` | Toon uitvoerings-/runtimestatus, Gateway- en systeem-uptime, plugingezondheid, plus providergebruik/quota |
    | `/status plugins` | Toon gedetailleerde plugingezondheid: laadfouten, quarantaines, kanaalfouten, afhankelijkheidsproblemen, compatibiliteitsmeldingen |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Beheer het duurzame [doel](/nl/tools/goal) van de huidige sessie |
    | `/diagnostics [note]` | Supportreportroute alleen voor eigenaar. Vraagt elke keer om exec-goedkeuring |
    | `/crestodian <request>` | Voer de Crestodian-installatie- en reparatiehelper uit vanuit een eigenaar-DM |
    | `/tasks` | Toon actieve/recente achtergrondtaken voor de huidige sessie |
    | `/context [list\|detail\|map\|json]` | Leg uit hoe context wordt samengesteld |
    | `/whoami` | Toon je afzender-id. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Beheer de gebruiksfooter per antwoord (`reset`/`inherit`/`clear`/`default` wist de sessieoverschrijving om opnieuw de geconfigureerde standaard te erven) of druk een lokale kostensamenvatting af |
  </Accordion>

  <Accordion title="Skills, allowlists, goedkeuringen">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/skill <name> [input]` | Voer een Skill op naam uit |
    | `/allowlist [list\|add\|remove] ...` | Beheer allowlistvermeldingen. Alleen tekst |
    | `/approve <id> <decision>` | Los exec- of plugin-goedkeuringsprompts op |
    | `/btw <question>` | Stel een zijvraag zonder de sessiecontext te wijzigen. Alias: `/side`. Zie [BTW](/nl/tools/btw) |
  </Accordion>

  <Accordion title="Subagents en ACP">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecteer sub-agentruns voor de huidige sessie |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Beheer ACP-sessies en runtime-opties |
    | `/focus <target>` | Koppel de huidige Discord-thread of het huidige Telegram-onderwerp aan een sessiedoel |
    | `/unfocus` | Verwijder de huidige threadkoppeling |
    | `/agents` | Toon threadgebonden agents voor de huidige sessie |
  </Accordion>

  <Accordion title="Alleen-eigenaar schrijfacties en beheer">
    | Opdracht | Vereist | Beschrijving |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lees of schrijf `openclaw.json`. Alleen eigenaar |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lees of schrijf door OpenClaw beheerde MCP-serverconfiguratie. Alleen eigenaar |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecteer of wijzig Plugin-status. Alleen eigenaar voor schrijfacties. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Alleen-runtime configuratie-overschrijvingen. Alleen eigenaar |
    | `/restart` | `commands.restart: true` (standaard) | Herstart OpenClaw |
    | `/send on\|off\|inherit` | eigenaar | Stel verzendbeleid in |
  </Accordion>

  <Accordion title="Spraak, TTS, kanaalbeheer">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Beheer TTS. Zie [TTS](/nl/tools/tts) |
    | `/activation mention\|always` | Stel groepsactivatiemodus in |
    | `/bash <command>` | Voer een host-shellopdracht uit. Alias: `! <command>`. Vereist `commands.bash: true` |
    | `!poll [sessionId]` | Controleer een bash-taak op de achtergrond |
    | `!stop [sessionId]` | Stop een bash-taak op de achtergrond |
  </Accordion>
</AccordionGroup>

### Dock-opdrachten

Dock-opdrachten schakelen de antwoordroute van de actieve sessie over naar een ander gekoppeld kanaal.
Zie [Kanaaldocking](/nl/concepts/channel-docking) voor installatie en probleemoplossing.

Gegenereerd uit kanaal-plugins met ondersteuning voor native opdrachten:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Dock-opdrachten vereisen `session.identityLinks`. De bronafzender en doel-peer
moeten in dezelfde identiteitsgroep zitten.

### Gebundelde Plugin-opdrachten

| Opdracht                                                                                     | Beschrijving                                                                      |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Schakel memory dreaming aan of uit. Zie [Dreaming](/nl/concepts/dreaming)            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Beheer apparaatkoppeling. Zie [Koppelen](/nl/channels/pairing)                       |
| `/phone status\|arm ...\|disarm`                                                             | Activeer tijdelijk risicovolle telefoonnode-opdrachten                            |
| `/voice status\|list\|set <voiceId>`                                                         | Beheer Talk-spraakconfiguratie. Native Discord-naam: `/talkvoice`                 |
| `/card ...`                                                                                  | Verstuur LINE-rich-card-presets. Zie [LINE](/nl/channels/line)                       |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Beheer de Codex app-server-harness. Zie [Codex-harness](/nl/plugins/codex-harness)   |

Alleen QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-opdrachten

Door gebruikers aanroepbare skills worden beschikbaar gemaakt als slash-opdrachten:

- `/skill <name> [input]` werkt altijd als het generieke toegangspunt.
- Skills kunnen zich registreren als directe opdrachten (bijv. `/prose` voor OpenProse).
- Registratie van native skill-opdrachten wordt beheerd door `commands.nativeSkills` en
  `channels.<provider>.commands.nativeSkills`.
- Namen worden opgeschoond naar `a-z0-9_` (max. 32 tekens); botsingen krijgen numerieke achtervoegsels.

<AccordionGroup>
  <Accordion title="Skill-opdrachtverzending">
    Standaard worden skill-opdrachten als een normaal verzoek naar het model gerouteerd.

    Skills kunnen `command-dispatch: tool` declareren om rechtstreeks naar een tool te routeren
    (deterministisch, zonder modelbetrokkenheid). Voorbeeld: `/prose` (OpenProse-plugin)
    — zie [OpenProse](/nl/prose).

  </Accordion>
  <Accordion title="Native opdrachtargumenten">
    Discord gebruikt automatisch aanvullen voor dynamische opties en knopmenu's wanneer vereiste
    argumenten zijn weggelaten. Telegram en Slack tonen een knopmenu voor opdrachten met
    keuzes. Dynamische keuzes worden opgelost tegen het doelsessiemodel, dus modelspecifieke
    opties zoals `/think`-niveaus volgen de `/model`-overschrijving van de sessie.
  </Accordion>
</AccordionGroup>

## `/tools` — wat de agent nu kan gebruiken

`/tools` beantwoordt een runtime-vraag: **wat deze agent nu kan gebruiken in dit
gesprek** — geen statische configuratiecatalogus.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Resultaten zijn sessiegebonden. Het wijzigen van agent, kanaal, thread, afzenderautorisatie
of model kan de uitvoer wijzigen. Gebruik voor profiel- en overschrijvingsbewerkingen
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

## `/config` — configuratieschrijfacties op schijf

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

Configuratie wordt gevalideerd vóór het schrijven. Ongeldige wijzigingen worden geweigerd. `/config`-
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

`/mcp` slaat configuratie op in OpenClaw-configuratie, niet in projectinstellingen van embedded agents.

## `/debug` — alleen-runtime overschrijvingen

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

## `/plugins` — Plugin-beheer

<Note>
  Alleen eigenaar voor schrijfacties. Standaard uitgeschakeld — schakel in met `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` werkt Plugin-configuratie bij en hot-reloadt de Gateway
Plugin-runtime voor nieuwe agentbeurten. `/plugins install` herstart beheerde
Gateways automatisch omdat Plugin-bronmodules zijn gewijzigd.

## `/trace` — Plugin-trace-uitvoer

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` onthult sessiegebonden Plugin-trace-/debugregels zonder volledige verbose-modus.
Het vervangt `/debug` (runtime-overschrijvingen) of `/verbose` (normale tooluitvoer) niet.

## `/btw` — tussenvragen

`/btw` is een snelle tussenvraag over de huidige sessiecontext. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

In tegenstelling tot een normaal bericht:

- Gebruikt de huidige sessie als achtergrondcontext.
- Draait in Codex-harness-sessies als een tijdelijke Codex-zijthread.
- Wijzigt toekomstige sessiecontext **niet**.
- Wordt niet naar transcriptgeschiedenis geschreven.

Zie [BTW-tussenvragen](/nl/tools/btw) voor het volledige gedrag.

## Oppervlaknotities

<AccordionGroup>
  <Accordion title="Sessiescope per oppervlak">
    - **Tekstopdrachten:** draaien in de normale chatsessie (DM's delen `main`, groepen hebben hun eigen sessie).
    - **Native Discord-opdrachten:** `agent:<agentId>:discord:slash:<userId>`
    - **Native Slack-opdrachten:** `agent:<agentId>:slack:slash:<userId>` (prefix configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
    - **Native Telegram-opdrachten:** `telegram:slash:<userId>` (richt zich op de chatsessie via `CommandTargetSessionKey`)
    - **`/stop`** richt zich op de actieve chatsessie om de huidige run af te breken.

  </Accordion>
  <Accordion title="Slack-specifiek">
    `channels.slack.slashCommand` ondersteunt één opdracht in `/openclaw`-stijl.
    Maak met `commands.native: true` één Slack-slash-opdracht per ingebouwde
    opdracht. Registreer `/agentstatus` (niet `/status`) omdat Slack
    `/status` reserveert. Tekst `/status` werkt nog steeds in Slack-berichten.
  </Accordion>
  <Accordion title="Snel pad en inline snelkoppelingen">
    - Berichten die alleen uit opdrachten bestaan van toegestane afzenders worden onmiddellijk afgehandeld (omzeilt wachtrij + model).
    - Inline snelkoppelingen (`/help`, `/commands`, `/status`, `/whoami`) werken ook ingebed in normale berichten en worden verwijderd voordat het model de resterende tekst ziet.
    - Niet-geautoriseerde berichten die alleen uit opdrachten bestaan, worden stil genegeerd; inline `/...`-tokens worden behandeld als platte tekst.

  </Accordion>
  <Accordion title="Argumentnotities">
    - Opdrachten accepteren een optionele `:` tussen de opdracht en argumenten (`/think: high`, `/send: on`).
    - `/new <model>` accepteert een modelalias, `provider/model`, of een providernaam (fuzzy match); als er geen match is, wordt de tekst behandeld als de berichtinhoud.
    - `/allowlist add|remove` vereist `commands.config: true` en respecteert kanaal-`configWrites`.

  </Accordion>
</AccordionGroup>

## Providergebruik en status

- **Providergebruik/quota** (bijv. "Claude 80% left") wordt in `/status` getoond voor de huidige modelprovider wanneer gebruiksregistratie is ingeschakeld.
- **Token-/cacheregels** in `/status` kunnen terugvallen op de nieuwste gebruiksvermelding in het transcript wanneer de live sessiesnapshot schaars is.
- **Uitvoering vs runtime:** `/status` rapporteert `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie uitvoert: `OpenClaw Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per antwoord:** beheerd door `/usage off|tokens|full`.
- `/model status` gaat over modellen/authenticatie/eindpunten, niet over gebruik.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills" href="/nl/tools/skills" icon="puzzle-piece">
    Hoe slash-opdrachten voor skills worden geregistreerd en afgeschermd.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Bouw een skill die zijn eigen slash-opdracht registreert.
  </Card>
  <Card title="BTW" href="/nl/tools/btw" icon="comments">
    Tussenvragen zonder sessiecontext te wijzigen.
  </Card>
  <Card title="Steer" href="/nl/tools/steer" icon="compass">
    Stuur de agent tijdens een run bij met `/steer`.
  </Card>
</CardGroup>
