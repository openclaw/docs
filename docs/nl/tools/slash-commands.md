---
read_when:
    - Chatopdrachten gebruiken of configureren
    - Foutopsporing voor opdrachtroutering of machtigingen
    - Begrijpen hoe Skills-opdrachten worden geregistreerd
sidebarTitle: Slash commands
summary: Alle beschikbare slash-commando's, directieven en inline-snelkoppelingen — configuratie, routing en gedrag per oppervlak.
title: Slash-opdrachten
x-i18n:
    generated_at: "2026-07-01T20:29:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

De Gateway verwerkt opdrachten die als zelfstandige berichten worden verzonden en met `/` beginnen.
Bash-opdrachten die alleen voor de host zijn, gebruiken `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek aan een ACP-sessie is gekoppeld, wordt normale tekst naar het ACP-harnas
gerouteerd. Beheeropdrachten voor de Gateway blijven lokaal: `/acp ...` bereikt altijd
de OpenClaw-opdrachtafhandelaar, en `/status` plus `/unfocus` blijven lokaal wanneer
opdrachtafhandeling voor het oppervlak is ingeschakeld.

## Drie opdrachttypen

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Zelfstandige `/...`-berichten die door de Gateway worden afgehandeld. Moeten als de
    enige inhoud in het bericht worden verzonden.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — worden uit het bericht verwijderd voordat het model
    het ziet. Slaan sessie-instellingen op wanneer ze alleen worden verzonden; werken als inline hints
    wanneer ze met andere tekst worden verzonden.
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — worden onmiddellijk uitgevoerd en
    verwijderd voordat het model de resterende tekst ziet. Alleen geautoriseerde afzenders.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - Directives worden uit het bericht verwijderd voordat het model het ziet.
    - In berichten met **alleen directives** (het bericht bevat alleen directives), worden ze
      in de sessie opgeslagen en beantwoorden ze met een bevestiging.
    - In **normale chat**-berichten met andere tekst werken ze als inline hints en
      slaan ze **geen** sessie-instellingen op.
    - Directives gelden alleen voor **geautoriseerde afzenders**. Als `commands.allowFrom`
      is ingesteld, is dit de enige gebruikte toegestane lijst; anders komt autorisatie van
      kanaaltoegestane lijsten/koppeling plus `commands.useAccessGroups`. Niet-geautoriseerde
      afzenders zien directives als platte tekst behandeld.
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
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) werken tekstopdrachten
  zelfs wanneer dit op `false` staat.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registreert native opdrachten. Auto: aan voor Discord/Telegram; uit voor Slack;
  genegeerd voor providers zonder native ondersteuning. Overschrijf per kanaal met
  `channels.<provider>.commands.native`. Op Discord slaat `false` de registratie van slash-opdrachten
  over; eerder geregistreerde opdrachten kunnen zichtbaar blijven totdat ze worden verwijderd.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registreert skill-opdrachten native wanneer ondersteund. Auto: aan voor
  Discord/Telegram; uit voor Slack. Overschrijf met
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Schakelt `! <cmd>` in om host-shellopdrachten uit te voeren (`/bash <cmd>`-alias). Vereist
  `tools.elevated` toegestane lijsten.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Hoe lang bash wacht voordat wordt overgeschakeld naar achtergrondmodus (`0` zet onmiddellijk
  op de achtergrond).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`). Alleen eigenaar.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`). Alleen eigenaar.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (pluginontdekking/status plus installeren + inschakelen/uitschakelen). Alleen eigenaar voor schrijven.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (configuratie-overschrijvingen alleen tijdens runtime). Alleen eigenaar.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` en Gateway-herstarttoolacties in.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Expliciete toegestane lijst voor eigenaars voor opdrachtoppervlakken die alleen voor eigenaars zijn. Los van
  `commands.allowFrom` en toegang via DM-koppeling.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: vereist eigenaarsidentiteit voor opdrachten die alleen voor eigenaars zijn. Wanneer `true`,
  moet de afzender overeenkomen met `commands.ownerAllowFrom` of interne `operator.admin`-scope
  hebben. Een jokertekenvermelding in `allowFrom` is **niet** voldoende.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe eigenaars-id's in de systeemprompt verschijnen.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  HMAC-geheim dat wordt gebruikt wanneer `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Toegestane lijst per provider voor opdrachtautorisatie. Wanneer geconfigureerd, is dit de
  **enige** autorisatiebron voor opdrachten en directives. Gebruik `"*"` voor een
  globale standaard; providerspecifieke sleutels overschrijven die.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt toegestane lijsten/beleidsregels voor opdrachten af wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Opdrachten komen uit drie bronnen:

- **Ingebouwde kernopdrachten:** `src/auto-reply/commands-registry.shared.ts`
- **Gegenereerde dock-opdrachten:** `src/auto-reply/commands-registry.data.ts`
- **Plugin-opdrachten:** plugin-aanroepen naar `registerCommand()`

Beschikbaarheid hangt af van configuratievlaggen, kanaaloppervlak en geïnstalleerde/ingeschakelde
plugins.

### Kernopdrachten

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/new [model]` | Archiveer de huidige sessie en start een nieuwe |
    | `/reset [soft [message]]` | Reset de huidige sessie op zijn plaats. `soft` behoudt het transcript, verwijdert hergebruikte CLI-backendsessie-id's en voert de opstart opnieuw uit |
    | `/name <title>` | Geef de huidige sessie een naam of hernoem deze. Laat de titel weg om de huidige naam en een suggestie te zien |
    | `/compact [instructions]` | Comprimeer de sessiecontext. Zie [Compaction](/nl/concepts/compaction) |
    | `/stop` | Breek de huidige run af |
    | `/session idle <duration\|off>` | Beheer de inactieve vervaltijd van threadbinding |
    | `/session max-age <duration\|off>` | Beheer de maximale-leeftijdvervaltijd van threadbinding |
    | `/export-session [path]` | Exporteer de huidige sessie naar HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporteer een JSONL-trajectbundel voor de huidige sessie. Alias: `/trajectory` |

    <Note>
      Control UI onderschept getypte `/new` om een nieuwe dashboardsessie te maken en ernaar over te schakelen,
      behalve wanneer `session.dmScope: "main"` is geconfigureerd
      en de huidige ouder de hoofdsessie van de agent is — in dat geval reset `/new`
      de hoofdsessie op zijn plaats. Getypte `/reset` voert nog steeds de reset op zijn plaats van de Gateway uit.
      Gebruik `/model default` wanneer je een vastgezette
      modelsessie-selectie wilt wissen.
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/think <level\|default>` | Stel het denkniveau in of wis de sessie-overschrijving. Aliassen: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Schakel uitgebreide uitvoer in of uit. Alias: `/v` |
    | `/trace on\|off` | Schakel plugin-trace-uitvoer voor de huidige sessie in of uit |
    | `/fast [status\|auto\|on\|off\|default]` | Toon, stel in of wis snelle modus |
    | `/reasoning [on\|off\|stream]` | Schakel zichtbaarheid van redenering in of uit. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Schakel elevated-modus in of uit. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Toon exec-standaarden of stel ze in |
    | `/login [codex\|openai\|openai-codex]` | Koppel Codex/OpenAI-login vanuit een privéchat of Web UI-sessie. Alleen eigenaar/admin |
    | `/model [name\|#\|status]` | Toon het model of stel het in |
    | `/models [provider] [page] [limit=<n>\|all]` | Toon geconfigureerde/providers met beschikbare auth of modellen |
    | `/queue <mode>` | Beheer wachtrijgedrag voor actieve runs. Zie [Wachtrij](/nl/concepts/queue) en [Wachtrijsturing](/nl/concepts/queue-steering) |
    | `/steer <message>` | Injecteer begeleiding in de actieve run. Alias: `/tell`. Zie [Sturen](/nl/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` is voor debugging — houd dit **uit** bij normaal gebruik.
        - `/trace` toont alleen trace-/debugregels die eigendom zijn van plugins; normale uitgebreide chatter blijft uit.
        - `/fast auto|on|off` slaat een sessie-overschrijving op; gebruik de optie `inherit` in de Sessions UI om die te wissen.
        - `/fast` is providerspecifiek: OpenAI/Codex koppelen dit aan `service_tier=priority`; directe Anthropic-aanvragen koppelen dit aan `service_tier=auto` of `standard_only`.
        - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsinstellingen — ze kunnen interne redenering of plugin-diagnostiek onthullen. Houd ze uit in groepschats.

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` slaat het nieuwe model onmiddellijk op in de sessie.
        - Als de agent inactief is, gebruikt de volgende run het meteen.
        - Als er een run actief is, wordt de wissel als in behandeling gemarkeerd en toegepast bij het volgende schone retrypunt.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/help` | Toon de korte helpsamenvatting |
    | `/commands` | Toon de gegenereerde opdrachtencatalogus |
    | `/tools [compact\|verbose]` | Toon wat de huidige agent nu kan gebruiken |
    | `/status` | Toon uitvoerings-/runtimestatus, Gateway- en systeem-uptime, pluginstatus, plus providergebruik/quota |
    | `/status plugins` | Toon gedetailleerde pluginstatus: laadfouten, quarantaines, kanaalfouten, afhankelijkheidsproblemen, compatibiliteitsmeldingen |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Beheer het duurzame [doel](/nl/tools/goal) van de huidige sessie |
    | `/diagnostics [note]` | Ondersteuningsrapportstroom alleen voor eigenaar. Vraagt elke keer om exec-goedkeuring |
    | `/crestodian <request>` | Voer de Crestodian-installatie- en reparatiehelper uit vanuit een eigenaar-DM |
    | `/tasks` | Toon actieve/recente achtergrondtaken voor de huidige sessie |
    | `/context [list\|detail\|map\|json]` | Leg uit hoe context wordt samengesteld |
    | `/whoami` | Toon je afzender-id. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Beheer de gebruiksfooter per antwoord (`reset`/`inherit`/`clear`/`default` wist de sessie-overschrijving zodat de geconfigureerde standaard opnieuw wordt geërfd) of druk een lokale kostensamenvatting af |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/skill <name> [input]` | Voer een skill op naam uit |
    | `/allowlist [list\|add\|remove] ...` | Beheer vermeldingen in de toegestane lijst. Alleen tekst |
    | `/approve <id> <decision>` | Los exec- of plugin-goedkeuringsprompts op |
    | `/btw <question>` | Stel een bijvraag zonder de sessiecontext te wijzigen. Alias: `/side`. Zie [BTW](/nl/tools/btw) |
  </Accordion>

  <Accordion title="Subagents en ACP">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecteer subagent-uitvoeringen voor de huidige sessie |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Beheer ACP-sessies en runtime-opties. Runtime-besturing vereist een externe eigenaar of interne Gateway-beheerdersidentiteit |
    | `/focus <target>` | Koppel de huidige Discord-thread of het huidige Telegram-onderwerp aan een sessiedoel |
    | `/unfocus` | Verwijder de huidige threadkoppeling |
    | `/agents` | Toon thread-gekoppelde agents voor de huidige sessie |
  </Accordion>

  <Accordion title="Alleen-eigenaar-schrijfacties en beheer">
    | Opdracht | Vereist | Beschrijving |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lees of schrijf `openclaw.json`. Alleen eigenaar |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lees of schrijf door OpenClaw beheerde MCP-serverconfiguratie. Alleen eigenaar |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecteer of wijzig Plugin-status. Alleen eigenaar voor schrijfacties. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Runtime-only configuratie-overschrijvingen. Alleen eigenaar |
    | `/restart` | `commands.restart: true` (standaard) | Herstart OpenClaw |
    | `/send on\|off\|inherit` | eigenaar | Stel verzendbeleid in |
  </Accordion>

  <Accordion title="Spraak, TTS, kanaalbesturing">
    | Opdracht | Beschrijving |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Beheer TTS. Zie [TTS](/nl/tools/tts) |
    | `/activation mention\|always` | Stel groepsactiveringsmodus in |
    | `/bash <command>` | Voer een shellopdracht op de host uit. Alias: `! <command>`. Vereist `commands.bash: true` |
    | `!poll [sessionId]` | Controleer een bash-taak op de achtergrond |
    | `!stop [sessionId]` | Stop een bash-taak op de achtergrond |
  </Accordion>
</AccordionGroup>

### Dock-opdrachten

Dock-opdrachten schakelen de antwoordroute van de actieve sessie over naar een ander gekoppeld kanaal.
Zie [Kanaal-docking](/nl/concepts/channel-docking) voor installatie en probleemoplossing.

Gegenereerd uit kanaal-plugins met ondersteuning voor native opdrachten:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Dock-opdrachten vereisen `session.identityLinks`. De bronafzender en doel-peer
moeten in dezelfde identiteitsgroep zitten.

### Gebundelde Plugin-opdrachten

| Opdracht                                                                                     | Beschrijving                                                                                   |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Schakel memory dreaming in of uit (eigenaar of Gateway-beheerder). Zie [Dreaming](/nl/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Beheer apparaatkoppeling. Zie [Koppelen](/nl/channels/pairing)                                    |
| `/phone status\|arm ...\|disarm`                                                             | Schakel tijdelijk risicovolle opdrachten voor telefoonknooppunten in                           |
| `/voice status\|list\|set <voiceId>`                                                         | Beheer Talk-spraakconfiguratie. Native Discord-naam: `/talkvoice`                              |
| `/card ...`                                                                                  | Stuur LINE rich-card-presets. Zie [LINE](/nl/channels/line)                                       |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Beheer de Codex app-server-harness. Zie [Codex-harness](/nl/plugins/codex-harness)                |

Alleen QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill-opdrachten

Door gebruikers aanroepbare Skills worden beschikbaar gemaakt als slash-opdrachten:

- `/skill <name> [input]` werkt altijd als generiek toegangspunt.
- Skills kunnen zich registreren als directe opdrachten (bijv. `/prose` voor OpenProse).
- Native registratie van Skill-opdrachten wordt beheerd door `commands.nativeSkills` en
  `channels.<provider>.commands.nativeSkills`.
- Namen worden opgeschoond naar `a-z0-9_` (max. 32 tekens); botsingen krijgen numerieke achtervoegsels.

<AccordionGroup>
  <Accordion title="Dispatch van Skill-opdrachten">
    Standaard worden Skill-opdrachten naar het model gerouteerd als een normaal verzoek.

    Skills kunnen `command-dispatch: tool` declareren om direct naar een tool te routeren
    (deterministisch, zonder modelbetrokkenheid). Voorbeeld: `/prose` (OpenProse-plugin)
    — zie [OpenProse](/nl/prose).

  </Accordion>
  <Accordion title="Native opdrachtargumenten">
    Discord gebruikt automatisch aanvullen voor dynamische opties en knopmenu's wanneer vereiste
    argumenten zijn weggelaten. Telegram en Slack tonen een knopmenu voor opdrachten met
    keuzes. Dynamische keuzes worden opgelost ten opzichte van het doelsessiemodel, zodat model-
    specifieke opties zoals `/think`-niveaus de `/model`-overschrijving van de sessie volgen.
  </Accordion>
</AccordionGroup>

## `/tools` — wat de agent nu kan gebruiken

`/tools` beantwoordt een runtime-vraag: **wat deze agent nu in dit
gesprek kan gebruiken** — geen statische configuratiecatalogus.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Resultaten zijn sessiegebonden. Het wijzigen van agent, kanaal, thread, afzenderautorisatie
of model kan de uitvoer wijzigen. Gebruik voor het bewerken van profielen en overschrijvingen
het Tools-paneel in de Control UI of configuratie-oppervlakken.

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

## `/config` — configuratie op schijf schrijven

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

## `/debug` — runtime-only overschrijvingen

<Note>
  Alleen eigenaar. Standaard uitgeschakeld — schakel in met `commands.debug: true`.
  Overschrijvingen worden onmiddellijk toegepast op nieuwe configuratielezingen, maar schrijven **niet** naar schijf.
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

`/plugins enable|disable` werkt Plugin-configuratie bij en herlaadt de Gateway
Plugin-runtime voor nieuwe agentbeurten. `/plugins install` herstart beheerde
Gateways automatisch omdat Plugin-bronmodules zijn gewijzigd.

## `/trace` — Plugin-trace-uitvoer

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` toont sessiegebonden Plugin-trace-/debugregels zonder volledige verbose
modus. Het vervangt `/debug` (runtime-overschrijvingen) of `/verbose` (normale
tooluitvoer) niet.

## `/btw` — nevenvragen

`/btw` is een snelle nevenvraag over de huidige sessiecontext. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Anders dan een normaal bericht:

- Gebruikt de huidige sessie als achtergrondcontext.
- Draait in Codex-harness-sessies als een tijdelijke Codex-zijthread.
- Wijzigt toekomstige sessiecontext **niet**.
- Wordt niet naar transcriptgeschiedenis geschreven.

Zie [BTW-nevenvragen](/nl/tools/btw) voor het volledige gedrag.

## Opmerkingen over oppervlakken

<AccordionGroup>
  <Accordion title="Sessiescope per oppervlak">
    - **Tekstopdrachten:** draaien in de normale chatsessie (DM's delen `main`, groepen hebben hun eigen sessie).
    - **Native Discord-opdrachten:** `agent:<agentId>:discord:slash:<userId>`
    - **Native Slack-opdrachten:** `agent:<agentId>:slack:slash:<userId>` (prefix configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
    - **Native Telegram-opdrachten:** `telegram:slash:<userId>` (richt zich op de chatsessie via `CommandTargetSessionKey`)
    - **`/login codex`** stuurt apparaatkoppelingscodes alleen via privéchat of Web UI-antwoordpaden. Aanroepen in Telegram-groepen/onderwerpen vragen de eigenaar in plaats daarvan de bot een DM te sturen.
    - **`/stop`** richt zich op de actieve chatsessie om de huidige uitvoering af te breken.

  </Accordion>
  <Accordion title="Slack-specifiek">
    `channels.slack.slashCommand` ondersteunt één opdracht in `/openclaw`-stijl.
    Met `commands.native: true` maak je één Slack-slashopdracht per ingebouwde
    opdracht. Registreer `/agentstatus` (niet `/status`) omdat Slack
    `/status` reserveert. Tekst `/status` werkt nog steeds in Slack-berichten.
  </Accordion>
  <Accordion title="Snel pad en inline snelkoppelingen">
    - Berichten met alleen opdrachten van toegestane afzenders worden onmiddellijk verwerkt (omzeilt wachtrij + model).
    - Inline snelkoppelingen (`/help`, `/commands`, `/status`, `/whoami`) werken ook ingebed in normale berichten en worden verwijderd voordat het model de resterende tekst ziet.
    - Niet-geautoriseerde berichten met alleen opdrachten worden stil genegeerd; inline `/...`-tokens worden als platte tekst behandeld.

  </Accordion>
  <Accordion title="Opmerkingen over argumenten">
    - Opdrachten accepteren een optionele `:` tussen de opdracht en argumenten (`/think: high`, `/send: on`).
    - `/new <model>` accepteert een modelalias, `provider/model`, of een providernaam (fuzzy match); bij geen match wordt de tekst behandeld als de berichtinhoud.
    - `/allowlist add|remove` vereist `commands.config: true` en respecteert kanaal-`configWrites`.

  </Accordion>
</AccordionGroup>

## Providergebruik en status

- **Providergebruik/quota** (bijv. "Claude 80% over") wordt weergegeven in `/status` voor de huidige modelprovider wanneer gebruikstracking is ingeschakeld.
- **Token-/cacheregels** in `/status` kunnen terugvallen op het nieuwste transcriptgebruik-item wanneer de live sessiesnapshot beperkt is.
- **Uitvoering vs runtime:** `/status` rapporteert `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie uitvoert: `OpenClaw Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per antwoord:** beheerd door `/usage off|tokens|full`.
- `/model status` gaat over modellen/authenticatie/eindpunten, niet over gebruik.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills" href="/nl/tools/skills" icon="puzzle-piece">
    Hoe Skill-slashopdrachten worden geregistreerd en gated.
  </Card>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Bouw een Skill die zijn eigen slashopdracht registreert.
  </Card>
  <Card title="BTW" href="/nl/tools/btw" icon="comments">
    Nevenvragen zonder sessiecontext te wijzigen.
  </Card>
  <Card title="Steer" href="/nl/tools/steer" icon="compass">
    Stuur de agent tijdens een uitvoering bij met `/steer`.
  </Card>
</CardGroup>
