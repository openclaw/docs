---
read_when:
    - Chatcommando's gebruiken of configureren
    - Debuggen van commandoroutering of machtigingen
sidebarTitle: Slash commands
summary: 'Slash-commando''s: tekst versus systeemeigen, configuratie en ondersteunde commando''s'
title: Slash-commando's
x-i18n:
    generated_at: "2026-05-05T06:19:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

Opdrachten worden afgehandeld door de Gateway. De meeste opdrachten moeten worden verzonden als een **zelfstandig** bericht dat begint met `/`. De host-only bash-chatopdracht gebruikt `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek of thread is gekoppeld aan een ACP-sessie, wordt normale vervolgtekst naar die ACP-harness gerouteerd. Gateway-beheeropdrachten blijven nog steeds lokaal: `/acp ...` bereikt altijd de OpenClaw ACP-opdrachthandler, en `/status` plus `/unfocus` blijven lokaal wanneer opdrachtafhandeling is ingeschakeld voor het oppervlak.

Er zijn twee gerelateerde systemen:

<AccordionGroup>
  <Accordion title="Opdrachten">
    Zelfstandige `/...`-berichten.
  </Accordion>
  <Accordion title="Directieven">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directieven worden uit het bericht verwijderd voordat het model ze ziet.
    - In normale chatberichten (niet alleen directieven) worden ze behandeld als "inline hints" en blijven sessie-instellingen **niet** behouden.
    - In berichten met alleen directieven (het bericht bevat alleen directieven) blijven ze behouden voor de sessie en antwoorden ze met een bevestiging.
    - Directieven worden alleen toegepast voor **geautoriseerde afzenders**. Als `commands.allowFrom` is ingesteld, is dit de enige allowlist die wordt gebruikt; anders komt autorisatie uit kanaal-allowlists/koppeling plus `commands.useAccessGroups`. Ongeautoriseerde afzenders zien dat directieven als platte tekst worden behandeld.

  </Accordion>
  <Accordion title="Inline snelkoppelingen">
    Alleen afzenders op de allowlist/geautoriseerde afzenders: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Ze worden direct uitgevoerd, verwijderd voordat het model het bericht ziet, en de resterende tekst gaat verder via de normale flow.

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
  Schakelt het parsen van `/...` in chatberichten in. Op oppervlakken zonder native opdrachten (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) werken tekstopdrachten nog steeds, zelfs als je dit instelt op `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registreert native opdrachten. Auto: aan voor Discord/Telegram; uit voor Slack (totdat je slash-opdrachten toevoegt); genegeerd voor providers zonder native ondersteuning. Stel `channels.discord.commands.native`, `channels.telegram.commands.native` of `channels.slack.commands.native` in om per provider te overschrijven (bool of `"auto"`). Op Discord slaat `false` registratie en opschoning van slash-opdrachten tijdens het opstarten over; eerder geregistreerde opdrachten kunnen zichtbaar blijven totdat je ze uit de Discord-app verwijdert. Slack-opdrachten worden beheerd in de Slack-app en worden niet automatisch verwijderd.
</ParamField>
Op Discord kunnen native opdrachtspecificaties `descriptionLocalizations` bevatten, die OpenClaw publiceert als Discord `description_localizations` en opneemt in reconcile-vergelijkingen.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registreert **skill**-opdrachten native wanneer dit wordt ondersteund. Auto: aan voor Discord/Telegram; uit voor Slack (Slack vereist het maken van een slash-opdracht per skill). Stel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` of `channels.slack.commands.nativeSkills` in om per provider te overschrijven (bool of `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Schakelt `! <cmd>` in om host-shellopdrachten uit te voeren (`/bash <cmd>` is een alias; vereist `tools.elevated`-allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bepaalt hoe lang bash wacht voordat wordt overgeschakeld naar achtergrondmodus (`0` zet het direct op de achtergrond).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (Plugin-detectie/status plus installatie- en inschakel-/uitschakelcontrols).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (alleen runtime-overschrijvingen).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` plus Gateway-herstarttoolacties in.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Stelt de expliciete eigenaar-allowlist in voor opdracht-/tooloppervlakken die alleen voor de eigenaar zijn. Dit is het menselijke operatoraccount dat gevaarlijke acties kan goedkeuren en opdrachten kan uitvoeren, zoals `/diagnostics`, `/export-trajectory` en `/config`. Dit staat los van `commands.allowFrom` en van DM-koppeltoegang.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: zorgt ervoor dat opdrachten die alleen voor de eigenaar zijn **eigenaarsidentiteit** vereisen om op dat oppervlak te worden uitgevoerd. Wanneer `true`, moet de afzender overeenkomen met een opgeloste eigenaar-kandidaat (bijvoorbeeld een vermelding in `commands.ownerAllowFrom` of provider-native eigenaarsmetadata) of interne `operator.admin`-scope hebben op een intern berichtkanaal. Een wildcardvermelding in kanaal-`allowFrom`, of een lege/niet-opgeloste lijst met eigenaar-kandidaten, is **niet** voldoende — opdrachten die alleen voor de eigenaar zijn falen gesloten op dat kanaal. Laat dit uit als je opdrachten die alleen voor de eigenaar zijn alleen wilt beveiligen met `ownerAllowFrom` en de standaard opdracht-allowlists.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe eigenaar-id's in de systeemprompt verschijnen.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Stelt optioneel het HMAC-geheim in dat wordt gebruikt wanneer `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider voor opdrachtautorisatie. Wanneer geconfigureerd, is dit de enige autorisatiebron voor opdrachten en directieven (kanaal-allowlists/koppeling en `commands.useAccessGroups` worden genegeerd). Gebruik `"*"` voor een globale standaard; providerspecifieke sleutels overschrijven deze.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt allowlists/beleid af voor opdrachten wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Huidige bron van waarheid:

- ingebouwde core-opdrachten komen uit `src/auto-reply/commands-registry.shared.ts`
- gegenereerde dockopdrachten komen uit `src/auto-reply/commands-registry.data.ts`
- Plugin-opdrachten komen uit Plugin-`registerCommand()`-aanroepen
- daadwerkelijke beschikbaarheid op je Gateway hangt nog steeds af van configuratievlaggen, kanaaloppervlak en geïnstalleerde/ingeschakelde Plugins

### Ingebouwde core-opdrachten

<AccordionGroup>
  <Accordion title="Sessies en runs">
    - `/new [model]` start een nieuwe sessie; `/reset` is de reset-alias.
    - Control UI onderschept getypte `/new` om een nieuwe dashboardsessie te maken en ernaar over te schakelen; getypte `/reset` voert nog steeds de in-place reset van de Gateway uit.
    - `/reset soft [message]` behoudt het huidige transcript, verwijdert hergebruikte CLI-backendsessie-id's en voert het laden van opstart-/systeemprompts opnieuw in-place uit.
    - `/compact [instructions]` comprimeert de sessiecontext. Zie [Compaction](/nl/concepts/compaction).
    - `/stop` breekt de huidige run af.
    - `/session idle <duration|off>` en `/session max-age <duration|off>` beheren verloop van threadkoppeling.
    - `/export-session [path]` exporteert de huidige sessie naar HTML. Alias: `/export`.
    - `/export-trajectory [path]` vraagt om exec-goedkeuring en exporteert daarna een JSONL-[trajectbundel](/nl/tools/trajectory) voor de huidige sessie. Gebruik dit wanneer je de prompt-, tool- en transcripttijdlijn nodig hebt voor één OpenClaw-sessie. In groepschats gaan de goedkeuringsprompt en het exportresultaat privé naar de eigenaar. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model- en runcontrols">
    - `/think <level>` stelt het denkniveau in. Opties komen uit het providerprofiel van het actieve model; gebruikelijke niveaus zijn `off`, `minimal`, `low`, `medium` en `high`, met aangepaste niveaus zoals `xhigh`, `adaptive`, `max` of binair `on` alleen waar ondersteund. Aliassen: `/thinking`, `/t`.
    - `/verbose on|off|full` schakelt uitgebreide uitvoer om. Alias: `/v`.
    - `/trace on|off` schakelt Plugin-trace-uitvoer voor de huidige sessie om.
    - `/fast [status|on|off]` toont of stelt snelle modus in.
    - `/reasoning [on|off|stream]` schakelt zichtbaarheid van redenering om. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` schakelt elevated-modus om. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` toont of stelt exec-standaarden in.
    - `/model [name|#|status]` toont of stelt het model in.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` geeft geconfigureerde/providers met beschikbare authenticatie weer of modellen voor een provider; voeg `all` toe om door de volledige catalogus van die provider te bladeren.
    - `/queue <mode>` beheert queue-gedrag (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opties zoals `debounce:0.5s cap:25 drop:summarize`; `/queue default` of `/queue reset` wist de sessie-overschrijving. Zie [Opdrachtqueue](/nl/concepts/queue) en [Steering queue](/nl/concepts/queue-steering).
    - `/steer <message>` injecteert begeleiding in de actieve run voor de huidige sessie, onafhankelijk van de `/queue`-modus. Het start geen nieuwe run wanneer de sessie idle is. Alias: `/tell`. Zie [Steer](/nl/tools/steer).

  </Accordion>
  <Accordion title="Detectie en status">
    - `/help` toont de korte helpsamenvatting.
    - `/commands` toont de gegenereerde opdrachtencatalogus.
    - `/tools [compact|verbose]` toont wat de huidige agent nu kan gebruiken.
    - `/status` toont uitvoerings-/runtimestatus, Gateway- en systeem-uptime, plus providergebruik/quota wanneer beschikbaar.
    - `/diagnostics [note]` is de eigenaar-only supportrapportflow voor Gateway-bugs en Codex-harnessruns. Het vraagt elke keer expliciete exec-goedkeuring voordat `openclaw gateway diagnostics export --json` wordt uitgevoerd; keur diagnostics niet goed met een allow-all-regel. Na goedkeuring stuurt het een plakbaar rapport met het lokale bundelpad, manifestsamenvatting, privacynotities en relevante sessie-id's. In groepschats gaan de goedkeuringsprompt en het rapport privé naar de eigenaar. Wanneer de actieve sessie de OpenAI Codex-harness gebruikt, stuurt dezelfde goedkeuring ook relevante Codex-feedback naar OpenAI-servers en vermeldt het voltooide antwoord de OpenClaw-sessie-id's, Codex-thread-id's en `codex resume <thread-id>`-opdrachten. Zie [Diagnostics Export](/nl/gateway/diagnostics).
    - `/crestodian <request>` voert de Crestodian-installatie- en reparatiehulp uit vanuit een eigenaar-DM.
    - `/tasks` geeft actieve/recente achtergrondtaken voor de huidige sessie weer.
    - `/context [list|detail|json]` legt uit hoe context wordt samengesteld.
    - `/whoami` toont je afzender-id. Alias: `/id`.
    - `/usage off|tokens|full|cost` beheert de gebruiksvoetregel per antwoord of drukt een lokale kostensamenvatting af.

  </Accordion>
  <Accordion title="Skills, allowlists, goedkeuringen">
    - `/skill <name> [input]` voert een skill op naam uit.
    - `/allowlist [list|add|remove] ...` beheert allowlist-vermeldingen. Alleen tekst.
    - `/approve <id> <decision>` handelt exec-goedkeuringsprompts af.
    - `/btw <question>` stelt een zijvraag zonder toekomstige sessiecontext te wijzigen. Alias: `/side`. Zie [BTW](/nl/tools/btw).

  </Accordion>
  <Accordion title="Subagenten en ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` beheert subagent-runs voor de huidige sessie.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` beheert ACP-sessies en runtime-opties.
    - `/focus <target>` koppelt de huidige Discord-thread of het huidige Telegram-onderwerp/gesprek aan een sessiedoel.
    - `/unfocus` verwijdert de huidige koppeling.
    - `/agents` toont thread-gebonden agenten voor de huidige sessie.
    - `/kill <id|#|all>` breekt een of alle actieve subagenten af.
    - `/subagents steer <id|#> <message>` stuurt bijsturing naar een actieve subagent. Zie [Sturen](/nl/tools/steer).

  </Accordion>
  <Accordion title="Alleen-eigenaar schrijfbewerkingen en beheer">
    - `/config show|get|set|unset` leest of schrijft `openclaw.json`. Alleen eigenaar. Vereist `commands.config: true`.
    - `/mcp show|get|set|unset` leest of schrijft door OpenClaw beheerde MCP-serverconfiguratie onder `mcp.servers`. Alleen eigenaar. Vereist `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecteert of wijzigt de pluginstatus. `/plugin` is een alias. Alleen eigenaar voor schrijfbewerkingen. Vereist `commands.plugins: true`.
    - `/debug show|set|unset|reset` beheert runtime-only configuratie-overschrijvingen. Alleen eigenaar. Vereist `commands.debug: true`.
    - `/restart` herstart OpenClaw wanneer ingeschakeld. Standaard: ingeschakeld; stel `commands.restart: false` in om dit uit te schakelen.
    - `/send on|off|inherit` stelt het verzendbeleid in. Alleen eigenaar.

  </Accordion>
  <Accordion title="Spraak, TTS, kanaalbeheer">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` beheert TTS. Zie [TTS](/nl/tools/tts).
    - `/activation mention|always` stelt de groepsactivatiemodus in.
    - `/bash <command>` voert een host-shellopdracht uit. Alleen tekst. Alias: `! <command>`. Vereist `commands.bash: true` plus allowlists voor `tools.elevated`.
    - `!poll [sessionId]` controleert een achtergrond-bash-taak.
    - `!stop [sessionId]` stopt een achtergrond-bash-taak.

  </Accordion>
</AccordionGroup>

### Gegenereerde dock-opdrachten

Dock-opdrachten schakelen de antwoordroute van de huidige sessie over naar een ander gekoppeld
kanaal. Zie [Kanaal-docking](/nl/concepts/channel-docking) voor installatie,
voorbeelden en probleemoplossing.

Dock-opdrachten worden gegenereerd vanuit kanaalplugins met native-command-ondersteuning. Huidige gebundelde set:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gebruik dock-opdrachten vanuit een directe chat om de antwoordroute van de huidige sessie over te schakelen naar een ander gekoppeld kanaal. De agent behoudt dezelfde sessiecontext, maar toekomstige antwoorden voor die sessie worden afgeleverd bij de geselecteerde kanaalpeer.

Dock-opdrachten vereisen `session.identityLinks`. De bronafzender en doelpeer moeten in dezelfde identiteitsgroep zitten, bijvoorbeeld `["telegram:123", "discord:456"]`. Als een Telegram-gebruiker met id `123` `/dock_discord` verzendt, slaat OpenClaw `lastChannel: "discord"` en `lastTo: "456"` op in de actieve sessie. Als de afzender niet aan een Discord-peer is gekoppeld, antwoordt de opdracht met een installatietip in plaats van door te vallen naar normale chat.

Docking wijzigt alleen de actieve sessieroute. Het maakt geen kanaalaccounts aan, verleent geen toegang, omzeilt geen kanaal-allowlists en verplaatst geen transcriptgeschiedenis naar een andere sessie. Gebruik `/dock-telegram`, `/dock-slack`, `/dock-mattermost` of een andere gegenereerde dock-opdracht om de route opnieuw te wijzigen.

### Gebundelde pluginopdrachten

Gebundelde plugins kunnen meer slash-opdrachten toevoegen. Huidige gebundelde opdrachten in deze repo:

- `/dreaming [on|off|status|help]` schakelt geheugen-Dreaming in of uit. Zie [Dreaming](/nl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` beheert de flow voor apparaatkoppeling/installatie. Zie [Koppelen](/nl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` activeert tijdelijk risicovolle telefoon-Node-opdrachten.
- `/voice status|list [limit]|set <voiceId|name>` beheert Talk-spraakconfiguratie. Op Discord is de native opdrachtnaam `/talkvoice`.
- `/card ...` verzendt LINE-rich-card-presets. Zie [LINE](/nl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecteert en beheert de gebundelde Codex app-server-harness. Zie [Codex-harness](/nl/plugins/codex-harness).
- Alleen QQBot-opdrachten:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-opdrachten

Door gebruikers aanroepbare Skills worden ook als slash-opdrachten beschikbaar gemaakt:

- `/skill <name> [input]` werkt altijd als algemeen toegangspunt.
- Skills kunnen ook verschijnen als directe opdrachten zoals `/prose` wanneer de Skill/plugin ze registreert.
- native Skill-opdrachtregistratie wordt beheerd door `commands.nativeSkills` en `channels.<provider>.commands.nativeSkills`.
- opdrachtspecificaties kunnen `descriptionLocalizations` leveren voor native oppervlakken die gelokaliseerde beschrijvingen ondersteunen, waaronder Discord.

<AccordionGroup>
  <Accordion title="Argument- en parsernotities">
    - Opdrachten accepteren een optionele `:` tussen de opdracht en argumenten (bijv. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accepteert een modelalias, `provider/model` of een providernaam (fuzzy match); als er geen match is, wordt de tekst als berichtinhoud behandeld.
    - Gebruik `openclaw status --usage` voor een volledig overzicht van providergebruik.
    - `/allowlist add|remove` vereist `commands.config=true` en respecteert kanaal-`configWrites`.
    - In multi-accountkanalen respecteren configuratiegerichte `/allowlist --account <id>` en `/config set channels.<provider>.accounts.<id>...` ook de `configWrites` van het doelaccount.
    - `/usage` beheert de gebruiksvoettekst per antwoord; `/usage cost` toont een lokaal kostenoverzicht uit OpenClaw-sessielogs.
    - `/restart` is standaard ingeschakeld; stel `commands.restart: false` in om dit uit te schakelen.
    - `/plugins install <spec>` accepteert dezelfde pluginspecificaties als `openclaw plugins install`: lokaal pad/archief, npm-pakket, `git:<repo>` of `clawhub:<pkg>`, en vraagt daarna om een Gateway-herstart omdat pluginbronmodules zijn gewijzigd.
    - `/plugins enable|disable` werkt pluginconfiguratie bij en triggert Gateway-pluginherlading voor nieuwe agentbeurten.

  </Accordion>
  <Accordion title="Kanaalspecifiek gedrag">
    - Alleen-Discord native opdracht: `/vc join|leave|status` beheert spraakkanalen (niet beschikbaar als tekst). `join` vereist een guild en geselecteerd spraak-/stagekanaal. Vereist `channels.discord.voice` en native opdrachten.
    - Discord-threadbindingsopdrachten (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) vereisen dat effectieve threadbindingen zijn ingeschakeld (`session.threadBindings.enabled` en/of `channels.discord.threadBindings.enabled`).
    - ACP-opdrachtreferentie en runtimegedrag: [ACP-agenten](/nl/tools/acp-agents).

  </Accordion>
  <Accordion title="Uitgebreid / trace / snel / reasoning-veiligheid">
    - `/verbose` is bedoeld voor debugging en extra zichtbaarheid; houd dit bij normaal gebruik **uit**.
    - `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van plugins en houdt normale uitgebreide toolruis uit.
    - `/fast on|off` bewaart een sessie-overschrijving. Gebruik de optie `inherit` in de Sessions-UI om deze te wissen en terug te vallen op configuratiestandaarden.
    - `/fast` is providerspecifiek: OpenAI/OpenAI Codex koppelen dit aan `service_tier=priority` op native Responses-endpoints, terwijl directe publieke Anthropic-verzoeken, inclusief met OAuth geauthenticeerd verkeer dat naar `api.anthropic.com` wordt verzonden, dit koppelen aan `service_tier=auto` of `standard_only`. Zie [OpenAI](/nl/providers/openai) en [Anthropic](/nl/providers/anthropic).
    - Samenvattingen van toolfouten worden nog steeds getoond wanneer relevant, maar gedetailleerde fouttekst wordt alleen opgenomen wanneer `/verbose` `on` of `full` is.
    - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsinstellingen: ze kunnen interne reasoning, tooluitvoer of plugindiagnostiek tonen die je niet wilde blootstellen. Laat ze bij voorkeur uit, vooral in groepschats.

  </Accordion>
  <Accordion title="Model wisselen">
    - `/model` bewaart het nieuwe sessiemodel onmiddellijk.
    - Als de agent idle is, gebruikt de volgende run het meteen.
    - Als er al een run actief is, markeert OpenClaw een livewisseling als in behandeling en herstart het pas naar het nieuwe model op een schoon retrypunt.
    - Als toolactiviteit of antwoorduitvoer al is gestart, kan de in behandeling zijnde wisseling in de wachtrij blijven tot een latere retrymogelijkheid of de volgende gebruikersbeurt.
    - In de lokale TUI keert `/crestodian [request]` terug van de normale agent-TUI naar Crestodian. Dit staat los van rescue-modus voor berichtkanalen en verleent geen externe configuratiebevoegdheid.

  </Accordion>
  <Accordion title="Fast path en inline snelkoppelingen">
    - **Fast path:** berichten die alleen uit opdrachten bestaan van afzenders op de allowlist worden onmiddellijk afgehandeld (omzeilen wachtrij + model).
    - **Groepsvermeldingsgating:** berichten die alleen uit opdrachten bestaan van afzenders op de allowlist omzeilen vermeldingsvereisten.
    - **Inline snelkoppelingen (alleen afzenders op de allowlist):** bepaalde opdrachten werken ook wanneer ze in een normaal bericht zijn ingesloten en worden verwijderd voordat het model de resterende tekst ziet.
      - Voorbeeld: `hey /status` triggert een statusantwoord, en de resterende tekst gaat verder door de normale flow.
    - Momenteel: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Niet-geautoriseerde berichten die alleen uit opdrachten bestaan worden stil genegeerd, en inline `/...`-tokens worden als platte tekst behandeld.

  </Accordion>
  <Accordion title="Skill-opdrachten en native argumenten">
    - **Skill-opdrachten:** `user-invocable` Skills worden als slash-opdrachten beschikbaar gemaakt. Namen worden gesaneerd naar `a-z0-9_` (max. 32 tekens); botsingen krijgen numerieke suffixen (bijv. `_2`).
      - `/skill <name> [input]` voert een Skill uit op naam (handig wanneer native opdrachtlimieten opdrachten per Skill verhinderen).
      - Standaard worden Skill-opdrachten als normaal verzoek doorgestuurd naar het model.
      - Skills kunnen optioneel `command-dispatch: tool` declareren om de opdracht rechtstreeks naar een tool te routeren (deterministisch, geen model).
      - Voorbeeld: `/prose` (OpenProse-plugin) — zie [OpenProse](/nl/prose).
    - **Native opdrachtargumenten:** Discord gebruikt autocomplete voor dynamische opties (en knopmenu's wanneer je vereiste argumenten weglaat). Telegram en Slack tonen een knopmenu wanneer een opdracht keuzes ondersteunt en je het argument weglaat. Dynamische keuzes worden opgelost tegen het doel-sessiemodel, dus modelspecifieke opties zoals `/think`-niveaus volgen de `/model`-overschrijving van die sessie.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` beantwoordt een runtimevraag, geen configuratievraag: **wat deze agent nu in dit gesprek kan gebruiken**.

- Standaard `/tools` is compact en geoptimaliseerd om snel te scannen.
- `/tools verbose` voegt korte beschrijvingen toe.
- Native-command-oppervlakken die argumenten ondersteunen, bieden dezelfde modusschakelaar als `compact|verbose`.
- Resultaten zijn sessiegebonden, dus het wijzigen van agent, kanaal, thread, afzenderautorisatie of model kan de uitvoer wijzigen.
- `/tools` bevat tools die daadwerkelijk bereikbaar zijn tijdens runtime, waaronder core-tools, verbonden plugintools en kanaaleigen tools.

Gebruik voor profiel- en overschrijvingsbewerking het Tools-paneel van de Control UI of configuratie-/catalogusoppervlakken in plaats van `/tools` als statische catalogus te behandelen.

## Gebruiksoppervlakken (wat waar wordt getoond)

- **Providergebruik/quota** (voorbeeld: "Claude 80% over") verschijnt in `/status` voor de huidige modelprovider wanneer gebruikstracking is ingeschakeld. OpenClaw normaliseert providervensters naar `% over`; voor MiniMax worden percentvelden met alleen resterend percentage omgekeerd vóór weergave, en `model_remains`-responses geven de voorkeur aan de chatmodelvermelding plus een modelgetagd abonnementlabel.
- **Token/cache-regels** in `/status` kunnen terugvallen op de nieuwste gebruiksvermelding uit het transcript wanneer de live sessie-snapshot beperkt is. Bestaande niet-nul live waarden blijven voorrang houden, en transcriptterugval kan ook het actieve runtime-modellabel herstellen plus een groter promptgericht totaal wanneer opgeslagen totalen ontbreken of kleiner zijn.
- **Uitvoering versus runtime:** `/status` rapporteert `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie daadwerkelijk uitvoert: `OpenClaw Pi Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per response** wordt beheerd door `/usage off|tokens|full` (toegevoegd aan normale antwoorden).
- `/model status` gaat over **modellen/authenticatie/eindpunten**, niet over gebruik.

## Modelselectie (`/model`)

`/model` is geïmplementeerd als een directive.

Voorbeelden:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Opmerkingen:

- `/model` en `/model list` tonen een compacte, genummerde kiezer (modelfamilie + beschikbare providers).
- Op Discord openen `/model` en `/models` een interactieve kiezer met dropdowns voor provider en model plus een stap Indienen.
- `/model <#>` selecteert uit die kiezer (en geeft waar mogelijk de voorkeur aan de huidige provider).
- `/model status` toont de gedetailleerde weergave, inclusief geconfigureerd providereindpunt (`baseUrl`) en API-modus (`api`) wanneer beschikbaar.

## Debug-overrides

Met `/debug` kun je **alleen-runtime** config-overrides instellen (geheugen, niet schijf). Alleen eigenaar. Standaard uitgeschakeld; schakel in met `commands.debug: true`.

Voorbeelden:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Overrides worden onmiddellijk toegepast op nieuwe config-lezingen, maar schrijven **niet** naar `openclaw.json`. Gebruik `/debug reset` om alle overrides te wissen en terug te keren naar de config op schijf.
</Note>

## Plugin-trace-uitvoer

Met `/trace` kun je **sessiegebonden Plugin trace/debug-regels** omschakelen zonder volledige verbose-modus in te schakelen.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Opmerkingen:

- `/trace` zonder argument toont de huidige trace-status van de sessie.
- `/trace on` schakelt Plugin trace-regels in voor de huidige sessie.
- `/trace off` schakelt ze weer uit.
- Plugin trace-regels kunnen verschijnen in `/status` en als een opvolgend diagnostisch bericht na het normale assistentantwoord.
- `/trace` vervangt `/debug` niet; `/debug` beheert nog steeds alleen-runtime config-overrides.
- `/trace` vervangt `/verbose` niet; normale verbose tool-/statusuitvoer hoort nog steeds bij `/verbose`.

## Config-updates

`/config` schrijft naar je config op schijf (`openclaw.json`). Alleen eigenaar. Standaard uitgeschakeld; schakel in met `commands.config: true`.

Voorbeelden:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Config wordt gevalideerd vóór het schrijven; ongeldige wijzigingen worden geweigerd. `/config`-updates blijven behouden na herstarts.
</Note>

## MCP-updates

`/mcp` schrijft door OpenClaw beheerde MCP-serverdefinities onder `mcp.servers`. Alleen eigenaar. Standaard uitgeschakeld; schakel in met `commands.mcp: true`.

Voorbeelden:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` slaat config op in OpenClaw-config, niet in Pi-eigen projectinstellingen. Runtime-adapters bepalen welke transports daadwerkelijk uitvoerbaar zijn.
</Note>

## Plugin-updates

Met `/plugins` kunnen operators ontdekte plugins inspecteren en inschakeling in config omschakelen. Alleen-lezen flows kunnen `/plugin` als alias gebruiken. Standaard uitgeschakeld; schakel in met `commands.plugins: true`.

Voorbeelden:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` en `/plugins show` gebruiken echte Plugin-discovery tegen de huidige workspace plus config op schijf.
- `/plugins install` installeert vanuit ClawHub, npm, git, lokale mappen en archieven.
- `/plugins enable|disable` werkt alleen Plugin-config bij; het installeert of verwijdert geen plugins.
- Wijzigingen voor inschakelen en uitschakelen hot-reloaden Gateway Plugin-runtime-oppervlakken voor nieuwe agentbeurten; install vraagt om een Gateway-herstart omdat Plugin-bronmodules zijn gewijzigd.

</Note>

## Opmerkingen per oppervlak

<AccordionGroup>
  <Accordion title="Sessies per oppervlak">
    - **Tekstopdrachten** draaien in de normale chatsessie (DM's delen `main`, groepen hebben hun eigen sessie).
    - **Native opdrachten** gebruiken geïsoleerde sessies:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (richt zich op de chatsessie via `CommandTargetSessionKey`)
    - **`/stop`** richt zich op de actieve chatsessie zodat de huidige run kan worden afgebroken.

  </Accordion>
  <Accordion title="Slack-specifiek">
    `channels.slack.slashCommand` wordt nog steeds ondersteund voor één opdracht in `/openclaw`-stijl. Als je `commands.native` inschakelt, moet je één Slack-slashopdracht per ingebouwde opdracht maken (dezelfde namen als `/help`). Opdrachtargumentmenu's voor Slack worden geleverd als ephemeral Block Kit-knoppen.

    Slack native-uitzondering: registreer `/agentstatus` (niet `/status`) omdat Slack `/status` reserveert. Tekst `/status` werkt nog steeds in Slack-berichten.

  </Accordion>
</AccordionGroup>

## Tussendoor-zijvragen

`/btw` is een snelle **zijvraag** over de huidige sessie. `/side` is een alias.

Anders dan normale chat:

- het gebruikt de huidige sessie als achtergrondcontext,
- het draait als een afzonderlijke **tool-less** eenmalige call,
- het wijzigt toekomstige sessiecontext niet,
- het wordt niet naar transcriptgeschiedenis geschreven,
- het wordt geleverd als een live zijresultaat in plaats van een normaal assistentbericht.

Daardoor is `/btw` nuttig wanneer je tijdelijke verduidelijking wilt terwijl de hoofdtaak doorgaat.

Voorbeeld:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Zie [BTW-zijvragen](/nl/tools/btw) voor het volledige gedrag en de client-UX-details.

## Gerelateerd

- [Skills maken](/nl/tools/creating-skills)
- [Skills](/nl/tools/skills)
- [Skills-config](/nl/tools/skills-config)
