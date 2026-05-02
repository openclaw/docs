---
read_when:
    - Chatcommando's gebruiken of configureren
    - Opdrachtroutering of machtigingen debuggen
sidebarTitle: Slash commands
summary: 'Slash-commando''s: tekst versus systeemeigen, configuratie en ondersteunde commando''s'
title: Slash-commando's
x-i18n:
    generated_at: "2026-05-02T20:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

Opdrachten worden afgehandeld door de Gateway. De meeste opdrachten moeten worden verzonden als een **losstaand** bericht dat begint met `/`. De bash-chatopdracht alleen voor de host gebruikt `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek of thread is gekoppeld aan een ACP-sessie, wordt normale vervolgtekst naar die ACP-harness gerouteerd. Gateway-beheeropdrachten blijven lokaal: `/acp ...` bereikt altijd de OpenClaw ACP-opdrachthandler, en `/status` plus `/unfocus` blijven lokaal wanneer opdrachtafhandeling voor het oppervlak is ingeschakeld.

Er zijn twee gerelateerde systemen:

<AccordionGroup>
  <Accordion title="Opdrachten">
    Losstaande `/...`-berichten.
  </Accordion>
  <Accordion title="Directieven">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directieven worden uit het bericht verwijderd voordat het model ze ziet.
    - In normale chatberichten (niet alleen-directief) worden ze behandeld als "inline hints" en blijven sessie-instellingen **niet** behouden.
    - In berichten met alleen directieven (het bericht bevat alleen directieven) blijven ze voor de sessie behouden en antwoorden ze met een bevestiging.
    - Directieven worden alleen toegepast voor **geautoriseerde afzenders**. Als `commands.allowFrom` is ingesteld, is dit de enige gebruikte allowlist; anders komt autorisatie uit kanaal-allowlists/koppeling plus `commands.useAccessGroups`. Ongeautoriseerde afzenders zien dat directieven als platte tekst worden behandeld.

  </Accordion>
  <Accordion title="Inline snelkoppelingen">
    Alleen afzenders op de allowlist/geautoriseerde afzenders: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Ze worden direct uitgevoerd, worden verwijderd voordat het model het bericht ziet, en de resterende tekst gaat verder via de normale flow.

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
  Schakelt het parsen van `/...` in chatberichten in. Op oppervlakken zonder native opdrachten (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams) blijven tekstopdrachten werken, zelfs als je dit op `false` zet.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registreert native opdrachten. Auto: aan voor Discord/Telegram; uit voor Slack (totdat je slash-opdrachten toevoegt); genegeerd voor providers zonder native ondersteuning. Stel `channels.discord.commands.native`, `channels.telegram.commands.native` of `channels.slack.commands.native` in om per provider te overschrijven (bool of `"auto"`). `false` wist eerder geregistreerde opdrachten op Discord/Telegram bij het opstarten. Slack-opdrachten worden beheerd in de Slack-app en worden niet automatisch verwijderd.
</ParamField>
Op Discord kunnen native opdrachtspecificaties `descriptionLocalizations` bevatten, die OpenClaw publiceert als Discord `description_localizations` en meeneemt in reconciliatievergelijkingen.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registreert **skill**-opdrachten native wanneer dit wordt ondersteund. Auto: aan voor Discord/Telegram; uit voor Slack (Slack vereist het maken van een slash-opdracht per skill). Stel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` of `channels.slack.commands.nativeSkills` in om per provider te overschrijven (bool of `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Schakelt `! <cmd>` in om shellopdrachten op de host uit te voeren (`/bash <cmd>` is een alias; vereist `tools.elevated`-allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bepaalt hoe lang bash wacht voordat wordt overgeschakeld naar achtergrondmodus (`0` gaat direct naar de achtergrond).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (plugin-detectie/status plus bediening voor installeren + inschakelen/uitschakelen).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (alleen runtime-overschrijvingen).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` plus gateway-herstarttoolacties in.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Stelt de expliciete eigenaar-allowlist in voor opdrachts-/tooloppervlakken die alleen voor de eigenaar zijn. Dit is het account van de menselijke operator dat gevaarlijke acties kan goedkeuren en opdrachten zoals `/diagnostics`, `/export-trajectory` en `/config` kan uitvoeren. Dit staat los van `commands.allowFrom` en van toegang via DM-koppeling.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: zorgt dat eigenaar-only-opdrachten **eigenaaridentiteit** vereisen om op dat oppervlak te worden uitgevoerd. Wanneer dit `true` is, moet de afzender overeenkomen met een opgeloste eigenaarskandidaat (bijvoorbeeld een vermelding in `commands.ownerAllowFrom` of provider-native eigenaarsmetadata) of interne `operator.admin`-scope hebben op een intern berichtkanaal. Een wildcard-vermelding in kanaal `allowFrom`, of een lege/onopgeloste lijst met eigenaarskandidaten, is **niet** voldoende — eigenaar-only-opdrachten falen gesloten op dat kanaal. Laat dit uit als je wilt dat eigenaar-only-opdrachten alleen worden afgeschermd door `ownerAllowFrom` en de standaard allowlists voor opdrachten.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe eigenaar-id's in de systeemprompt verschijnen.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Stelt optioneel het HMAC-geheim in dat wordt gebruikt wanneer `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider voor opdrachtautorisatie. Wanneer geconfigureerd is dit de enige autorisatiebron voor opdrachten en directieven (kanaal-allowlists/koppeling en `commands.useAccessGroups` worden genegeerd). Gebruik `"*"` voor een globale standaard; providerspecifieke sleutels overschrijven die.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt allowlists/beleidsregels af voor opdrachten wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Huidige bron van waarheid:

- ingebouwde kernopdrachten komen uit `src/auto-reply/commands-registry.shared.ts`
- gegenereerde dock-opdrachten komen uit `src/auto-reply/commands-registry.data.ts`
- plugin-opdrachten komen uit plugin-`registerCommand()`-aanroepen
- daadwerkelijke beschikbaarheid op je gateway hangt nog steeds af van configuratievlaggen, kanaaloppervlak en geïnstalleerde/ingeschakelde plugins

### Ingebouwde kernopdrachten

<AccordionGroup>
  <Accordion title="Sessies en runs">
    - `/new [model]` start een nieuwe sessie; `/reset` is de reset-alias.
    - Control UI onderschept getypte `/new` om een nieuwe dashboardsessie te maken en daarnaartoe te schakelen; getypte `/reset` voert nog steeds de in-place reset van de Gateway uit.
    - `/reset soft [message]` behoudt het huidige transcript, verwijdert hergebruikte sessie-id's van de CLI-backend en voert het laden van opstart-/systeemprompt in-place opnieuw uit.
    - `/compact [instructions]` comprimeert de sessiecontext. Zie [Compaction](/nl/concepts/compaction).
    - `/stop` breekt de huidige run af.
    - `/session idle <duration|off>` en `/session max-age <duration|off>` beheren het verlopen van thread-koppeling.
    - `/export-session [path]` exporteert de huidige sessie naar HTML. Alias: `/export`.
    - `/export-trajectory [path]` vraagt om exec-goedkeuring en exporteert daarna een JSONL-[trajectbundel](/nl/tools/trajectory) voor de huidige sessie. Gebruik dit wanneer je de prompt-, tool- en transcripttijdlijn voor één OpenClaw-sessie nodig hebt. In groepschats gaan de goedkeuringsprompt en het exportresultaat privé naar de eigenaar. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model- en runbesturing">
    - `/think <level>` stelt het denkniveau in. Opties komen uit het providerprofiel van het actieve model; gebruikelijke niveaus zijn `off`, `minimal`, `low`, `medium` en `high`, met aangepaste niveaus zoals `xhigh`, `adaptive`, `max` of binair `on` alleen waar ondersteund. Aliassen: `/thinking`, `/t`.
    - `/verbose on|off|full` schakelt uitgebreide uitvoer in of uit. Alias: `/v`.
    - `/trace on|off` schakelt plugin-trace-uitvoer voor de huidige sessie in of uit.
    - `/fast [status|on|off]` toont of stelt snelle modus in.
    - `/reasoning [on|off|stream]` schakelt zichtbaarheid van redenering in of uit. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` schakelt verhoogde modus in of uit. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` toont of stelt exec-standaarden in.
    - `/model [name|#|status]` toont of stelt het model in.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` toont geconfigureerde/providers met beschikbare authenticatie of modellen voor een provider; voeg `all` toe om door de volledige catalogus van die provider te bladeren.
    - `/queue <mode>` beheert wachtrijgedrag (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opties zoals `debounce:0.5s cap:25 drop:summarize`; `/queue default` of `/queue reset` wist de sessie-overschrijving. Zie [Opdrachtwachtrij](/nl/concepts/queue) en [Stuurwachtrij](/nl/concepts/queue-steering).

  </Accordion>
  <Accordion title="Detectie en status">
    - `/help` toont de korte helpsamenvatting.
    - `/commands` toont de gegenereerde opdrachtencatalogus.
    - `/tools [compact|verbose]` toont wat de huidige agent nu kan gebruiken.
    - `/status` toont uitvoerings-/runtimestatus, inclusief labels `Execution`/`Runtime` en providergebruik/quotum wanneer beschikbaar.
    - `/diagnostics [note]` is de eigenaar-only supportrapport-flow voor Gateway-bugs en Codex-harness-runs. Het vraagt elke keer om expliciete exec-goedkeuring voordat `openclaw gateway diagnostics export --json` wordt uitgevoerd; keur diagnostiek niet goed met een allow-all-regel. Na goedkeuring verstuurt het een plakbaar rapport met het lokale bundelpad, manifestsamenvatting, privacynotities en relevante sessie-id's. In groepschats gaan de goedkeuringsprompt en het rapport privé naar de eigenaar. Wanneer de actieve sessie de OpenAI Codex-harness gebruikt, stuurt dezelfde goedkeuring ook relevante Codex-feedback naar OpenAI-servers en vermeldt het voltooide antwoord de OpenClaw-sessie-id's, Codex-thread-id's en `codex resume <thread-id>`-opdrachten. Zie [Diagnostiekexport](/nl/gateway/diagnostics).
    - `/crestodian <request>` voert de Crestodian-installatie- en reparatiehelper uit vanuit een eigenaar-DM.
    - `/tasks` toont actieve/recente achtergrondtaken voor de huidige sessie.
    - `/context [list|detail|json]` legt uit hoe context wordt samengesteld.
    - `/whoami` toont je afzender-id. Alias: `/id`.
    - `/usage off|tokens|full|cost` beheert de gebruiksfooter per antwoord of drukt een lokale kostensamenvatting af.

  </Accordion>
  <Accordion title="Skills, allowlists, goedkeuringen">
    - `/skill <name> [input]` voert een skill op naam uit.
    - `/allowlist [list|add|remove] ...` beheert allowlist-vermeldingen. Alleen tekst.
    - `/approve <id> <decision>` lost exec-goedkeuringsprompts op.
    - `/btw <question>` stelt een zijvraag zonder de toekomstige sessiecontext te wijzigen. Zie [BTW](/nl/tools/btw).

  </Accordion>
  <Accordion title="Subagenten en ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` beheert subagentruns voor de huidige sessie.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` beheert ACP-sessies en runtime-opties.
    - `/focus <target>` koppelt de huidige Discord-thread of het huidige Telegram-onderwerp/gesprek aan een sessiedoel.
    - `/unfocus` verwijdert de huidige koppeling.
    - `/agents` toont threadgebonden agenten voor de huidige sessie.
    - `/kill <id|#|all>` breekt een of alle actieve subagenten af.
    - `/steer <id|#> <message>` stuurt bijsturing naar een actieve subagent. Alias: `/tell`.

  </Accordion>
  <Accordion title="Alleen-eigenaar schrijfbewerkingen en beheer">
    - `/config show|get|set|unset` leest of schrijft `openclaw.json`. Alleen eigenaar. Vereist `commands.config: true`.
    - `/mcp show|get|set|unset` leest of schrijft door OpenClaw beheerde MCP-serverconfiguratie onder `mcp.servers`. Alleen eigenaar. Vereist `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecteert of wijzigt Plugin-status. `/plugin` is een alias. Alleen eigenaar voor schrijfbewerkingen. Vereist `commands.plugins: true`.
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
kanaal. Zie [Kanaaldocking](/nl/concepts/channel-docking) voor installatie,
voorbeelden en probleemoplossing.

Dock-opdrachten worden gegenereerd uit kanaal-Plugins met ondersteuning voor native opdrachten. Huidige gebundelde set:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gebruik dock-opdrachten vanuit een directe chat om de antwoordroute van de huidige sessie over te schakelen naar een ander gekoppeld kanaal. De agent behoudt dezelfde sessiecontext, maar toekomstige antwoorden voor die sessie worden geleverd aan de geselecteerde kanaalpeer.

Dock-opdrachten vereisen `session.identityLinks`. De bronafzender en doelpeer moeten in dezelfde identiteitsgroep zitten, bijvoorbeeld `["telegram:123", "discord:456"]`. Als een Telegram-gebruiker met id `123` `/dock_discord` verzendt, slaat OpenClaw `lastChannel: "discord"` en `lastTo: "456"` op in de actieve sessie. Als de afzender niet aan een Discord-peer is gekoppeld, antwoordt de opdracht met een installatiehint in plaats van door te vallen naar normale chat.

Docking wijzigt alleen de actieve sessieroute. Het maakt geen kanaalaccounts aan, verleent geen toegang, omzeilt geen kanaal-allowlists en verplaatst geen transcriptgeschiedenis naar een andere sessie. Gebruik `/dock-telegram`, `/dock-slack`, `/dock-mattermost` of een andere gegenereerde dock-opdracht om de route opnieuw te wijzigen.

### Gebundelde Plugin-opdrachten

Gebundelde Plugins kunnen meer slash-opdrachten toevoegen. Huidige gebundelde opdrachten in deze repo:

- `/dreaming [on|off|status|help]` schakelt geheugen-Dreaming in of uit. Zie [Dreaming](/nl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` beheert de koppelings-/installatiestroom voor apparaten. Zie [Koppelen](/nl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` bewapent tijdelijk telefoonnode-opdrachten met hoog risico.
- `/voice status|list [limit]|set <voiceId|name>` beheert de Talk-spraakconfiguratie. Op Discord is de native opdrachtnaam `/talkvoice`.
- `/card ...` verzendt rich-card-presets voor LINE. Zie [LINE](/nl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecteert en beheert de gebundelde app-serverharness voor Codex. Zie [Codex-harness](/nl/plugins/codex-harness).
- Alleen QQBot-opdrachten:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skills-opdrachten

Door gebruikers aanroepbare Skills worden ook als slash-opdrachten beschikbaar gemaakt:

- `/skill <name> [input]` werkt altijd als generiek ingangspunt.
- Skills kunnen ook verschijnen als directe opdrachten zoals `/prose` wanneer de Skill/Plugin ze registreert.
- native registratie van Skill-opdrachten wordt beheerd door `commands.nativeSkills` en `channels.<provider>.commands.nativeSkills`.
- opdrachtspecificaties kunnen `descriptionLocalizations` bieden voor native oppervlakken die gelokaliseerde beschrijvingen ondersteunen, waaronder Discord.

<AccordionGroup>
  <Accordion title="Argument- en parseropmerkingen">
    - Opdrachten accepteren een optionele `:` tussen de opdracht en argumenten (bijv. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accepteert een modelalias, `provider/model` of een providernaam (fuzzy match); als er geen overeenkomst is, wordt de tekst behandeld als de berichttekst.
    - Gebruik `openclaw status --usage` voor een volledige uitsplitsing van providergebruik.
    - `/allowlist add|remove` vereist `commands.config=true` en respecteert kanaal-`configWrites`.
    - In kanalen met meerdere accounts respecteren configuratiegerichte `/allowlist --account <id>` en `/config set channels.<provider>.accounts.<id>...` ook de `configWrites` van het doelaccount.
    - `/usage` beheert de gebruiksfooter per antwoord; `/usage cost` print een lokale kostensamenvatting uit OpenClaw-sessielogs.
    - `/restart` is standaard ingeschakeld; stel `commands.restart: false` in om dit uit te schakelen.
    - `/plugins install <spec>` accepteert dezelfde Plugin-specificaties als `openclaw plugins install`: lokaal pad/archief, npm-pakket, `git:<repo>` of `clawhub:<pkg>`, en vraagt vervolgens een Gateway-herstart aan omdat de bronmodules van Plugins zijn gewijzigd.
    - `/plugins enable|disable` werkt Plugin-configuratie bij en activeert het opnieuw laden van Gateway-Plugins voor nieuwe agentbeurten.

  </Accordion>
  <Accordion title="Kanaalspecifiek gedrag">
    - Alleen-Discord native opdracht: `/vc join|leave|status` beheert spraakkanalen (niet beschikbaar als tekst). `join` vereist een guild en geselecteerd spraak-/stagekanaal. Vereist `channels.discord.voice` en native opdrachten.
    - Discord-threadkoppelingsopdrachten (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) vereisen dat effectieve threadkoppelingen zijn ingeschakeld (`session.threadBindings.enabled` en/of `channels.discord.threadBindings.enabled`).
    - ACP-opdrachtreferentie en runtimegedrag: [ACP-agenten](/nl/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / redeneerveiligheid">
    - `/verbose` is bedoeld voor debugging en extra zichtbaarheid; houd dit **uit** bij normaal gebruik.
    - `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van Plugins en houdt normale verbose tool-ruis uit.
    - `/fast on|off` bewaart een sessie-overschrijving. Gebruik de optie `inherit` in de Sessies-UI om deze te wissen en terug te vallen op configuratiestandaarden.
    - `/fast` is providerspecifiek: OpenAI/OpenAI Codex koppelen dit aan `service_tier=priority` op native Responses-eindpunten, terwijl directe openbare Anthropic-verzoeken, inclusief OAuth-geverifieerd verkeer dat naar `api.anthropic.com` wordt verzonden, dit koppelen aan `service_tier=auto` of `standard_only`. Zie [OpenAI](/nl/providers/openai) en [Anthropic](/nl/providers/anthropic).
    - Samenvattingen van toolfouten worden nog steeds getoond wanneer relevant, maar gedetailleerde fouttekst wordt alleen opgenomen wanneer `/verbose` `on` of `full` is.
    - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsomgevingen: ze kunnen interne redeneringen, tooluitvoer of Plugin-diagnostiek onthullen die je niet wilde blootstellen. Laat ze bij voorkeur uit, vooral in groepschats.

  </Accordion>
  <Accordion title="Model wisselen">
    - `/model` bewaart het nieuwe sessiemodel onmiddellijk.
    - Als de agent inactief is, gebruikt de volgende run het meteen.
    - Als er al een run actief is, markeert OpenClaw een live wissel als in behandeling en herstart het pas in het nieuwe model op een schoon retrypunt.
    - Als toolactiviteit of antwoorduitvoer al is gestart, kan de in behandeling zijnde wissel in de wachtrij blijven tot een latere retrymogelijkheid of de volgende gebruikersbeurt.
    - In de lokale TUI keert `/crestodian [request]` terug van de normale agent-TUI naar Crestodian. Dit staat los van rescue-modus voor berichtkanalen en verleent geen bevoegdheid voor externe configuratie.

  </Accordion>
  <Accordion title="Snel pad en inline snelkoppelingen">
    - **Snel pad:** berichten die alleen uit opdrachten bestaan van afzenders op de allowlist worden onmiddellijk afgehandeld (omzeilt wachtrij + model).
    - **Groepsvermelding-gating:** berichten die alleen uit opdrachten bestaan van afzenders op de allowlist omzeilen vermeldingsvereisten.
    - **Inline snelkoppelingen (alleen afzenders op de allowlist):** bepaalde opdrachten werken ook wanneer ze zijn ingebed in een normaal bericht en worden verwijderd voordat het model de resterende tekst ziet.
      - Voorbeeld: `hey /status` activeert een statusantwoord, en de resterende tekst gaat verder via de normale stroom.
    - Momenteel: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Niet-geautoriseerde berichten die alleen uit opdrachten bestaan worden stil genegeerd, en inline `/...`-tokens worden behandeld als platte tekst.

  </Accordion>
  <Accordion title="Skill-opdrachten en native argumenten">
    - **Skill-opdrachten:** `user-invocable` Skills worden beschikbaar gemaakt als slash-opdrachten. Namen worden opgeschoond naar `a-z0-9_` (max 32 tekens); botsingen krijgen numerieke suffixen (bijv. `_2`).
      - `/skill <name> [input]` voert een Skill uit op naam (nuttig wanneer native opdrachtlimieten opdrachten per Skill verhinderen).
      - Standaard worden Skill-opdrachten doorgestuurd naar het model als een normaal verzoek.
      - Skills kunnen optioneel `command-dispatch: tool` declareren om de opdracht rechtstreeks naar een tool te routeren (deterministisch, geen model).
      - Voorbeeld: `/prose` (OpenProse-Plugin) — zie [OpenProse](/nl/prose).
    - **Native opdrachtargumenten:** Discord gebruikt autocomplete voor dynamische opties (en knopmenu's wanneer je vereiste argumenten weglaat). Telegram en Slack tonen een knopmenu wanneer een opdracht keuzes ondersteunt en je het argument weglaat. Dynamische keuzes worden opgelost tegen het doel-sessiemodel, dus modelspecifieke opties zoals `/think`-niveaus volgen de `/model`-overschrijving van die sessie.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` beantwoordt een runtimevraag, geen configuratievraag: **wat deze agent nu in dit gesprek kan gebruiken**.

- Standaard `/tools` is compact en geoptimaliseerd voor snel scannen.
- `/tools verbose` voegt korte beschrijvingen toe.
- Native-opdrachtoppervlakken die argumenten ondersteunen, bieden dezelfde modusschakelaar als `compact|verbose`.
- Resultaten zijn sessiegebonden, dus het wijzigen van agent, kanaal, thread, afzenderautorisatie of model kan de uitvoer wijzigen.
- `/tools` bevat tools die daadwerkelijk bereikbaar zijn tijdens runtime, waaronder kerntools, verbonden Plugin-tools en tools die eigendom zijn van kanalen.

Gebruik voor het bewerken van profielen en overschrijvingen het Tools-paneel in de Control UI of configuratie-/catalogusoppervlakken in plaats van `/tools` als statische catalogus te behandelen.

## Gebruiksoppervlakken (wat waar wordt getoond)

- **Providergebruik/quota** (voorbeeld: "Claude 80% over") verschijnt in `/status` voor de huidige modelprovider wanneer gebruikstracking is ingeschakeld. OpenClaw normaliseert providervensters naar `% over`; voor MiniMax worden percentagevelden met alleen resterend gebruik omgekeerd voordat ze worden weergegeven, en `model_remains`-antwoorden geven de voorkeur aan de chatmodelvermelding plus een model-gelabeld planlabel.
- **Token/cache-regels** in `/status` kunnen terugvallen op de nieuwste gebruiksvermelding uit het transcript wanneer de live sessie-snapshot beperkt is. Bestaande niet-nul livewaarden blijven voorrang houden, en transcriptfallback kan ook het actieve runtimemodellabel herstellen plus een groter promptgericht totaal wanneer opgeslagen totalen ontbreken of kleiner zijn.
- **Uitvoering versus runtime:** `/status` rapporteert `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie daadwerkelijk uitvoert: `OpenClaw Pi Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per antwoord** worden geregeld door `/usage off|tokens|full` (toegevoegd aan normale antwoorden).
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
- Op Discord opent `/model` en `/models` een interactieve kiezer met provider- en modelkeuzelijsten plus een verzendstap.
- `/model <#>` selecteert uit die kiezer (en geeft waar mogelijk de voorkeur aan de huidige provider).
- `/model status` toont de gedetailleerde weergave, inclusief geconfigureerd providereindpunt (`baseUrl`) en API-modus (`api`) wanneer beschikbaar.

## Debug-overschrijvingen

`/debug` laat je **alleen-runtime** configuratie-overschrijvingen instellen (geheugen, niet schijf). Alleen eigenaar. Standaard uitgeschakeld; schakel in met `commands.debug: true`.

Voorbeelden:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Overschrijvingen worden onmiddellijk toegepast op nieuwe configuratieleesacties, maar schrijven **niet** naar `openclaw.json`. Gebruik `/debug reset` om alle overschrijvingen te wissen en terug te keren naar de configuratie op schijf.
</Note>

## Plugin-trace-uitvoer

`/trace` laat je **sessiegebonden Plugin-trace-/debugregels** in- en uitschakelen zonder volledige verbose-modus aan te zetten.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Opmerkingen:

- `/trace` zonder argument toont de huidige tracestatus van de sessie.
- `/trace on` schakelt Plugin-traceregels in voor de huidige sessie.
- `/trace off` schakelt ze weer uit.
- Plugin-traceregels kunnen verschijnen in `/status` en als vervolgend diagnostisch bericht na het normale assistentantwoord.
- `/trace` vervangt `/debug` niet; `/debug` beheert nog steeds alleen-runtime configuratie-overschrijvingen.
- `/trace` vervangt `/verbose` niet; normale verbose tool-/statusuitvoer hoort nog steeds bij `/verbose`.

## Configuratie-updates

`/config` schrijft naar je configuratie op schijf (`openclaw.json`). Alleen eigenaar. Standaard uitgeschakeld; schakel in met `commands.config: true`.

Voorbeelden:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Configuratie wordt gevalideerd voordat er wordt geschreven; ongeldige wijzigingen worden geweigerd. `/config`-updates blijven behouden na herstarts.
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
`/mcp` bewaart configuratie in de OpenClaw-configuratie, niet in Pi-eigen projectinstellingen. Runtime-adapters bepalen welke transports daadwerkelijk uitvoerbaar zijn.
</Note>

## Plugin-updates

`/plugins` laat operators gevonden Plugins inspecteren en inschakeling in de configuratie aan- of uitzetten. Alleen-lezen flows kunnen `/plugin` als alias gebruiken. Standaard uitgeschakeld; schakel in met `commands.plugins: true`.

Voorbeelden:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` en `/plugins show` gebruiken echte Plugin-detectie tegen de huidige workspace plus configuratie op schijf.
- `/plugins install` installeert vanuit ClawHub, npm, git, lokale mappen en archieven.
- `/plugins enable|disable` werkt alleen Plugin-configuratie bij; het installeert of verwijdert geen Plugins.
- Wijzigingen voor inschakelen en uitschakelen herladen Gateway Plugin-runtimesurfaces live voor nieuwe agentbeurten; installeren vraagt om een Gateway-herstart omdat Plugin-bronmodules zijn gewijzigd.

</Note>

## Surface-opmerkingen

<AccordionGroup>
  <Accordion title="Sessies per surface">
    - **Tekstopdrachten** worden uitgevoerd in de normale chatsessie (DM's delen `main`, groepen hebben hun eigen sessie).
    - **Native opdrachten** gebruiken geïsoleerde sessies:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (voorvoegsel configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (richt zich op de chatsessie via `CommandTargetSessionKey`)
    - **`/stop`** richt zich op de actieve chatsessie zodat deze de huidige run kan afbreken.

  </Accordion>
  <Accordion title="Slack-specifiek">
    `channels.slack.slashCommand` wordt nog steeds ondersteund voor één opdracht in `/openclaw`-stijl. Als je `commands.native` inschakelt, moet je één Slack-slashopdracht per ingebouwde opdracht maken (dezelfde namen als `/help`). Opdrachtargumentmenu's voor Slack worden geleverd als tijdelijke Block Kit-knoppen.

    Native uitzondering voor Slack: registreer `/agentstatus` (niet `/status`) omdat Slack `/status` reserveert. Tekstuele `/status` werkt nog steeds in Slack-berichten.

  </Accordion>
</AccordionGroup>

## BTW-zijvragen

`/btw` is een snelle **zijvraag** over de huidige sessie.

Anders dan normale chat:

- gebruikt het de huidige sessie als achtergrondcontext,
- wordt het uitgevoerd als een afzonderlijke **zonder-tools** eenmalige call,
- wijzigt het toekomstige sessiecontext niet,
- wordt het niet naar transcriptgeschiedenis geschreven,
- wordt het geleverd als een live zijresultaat in plaats van een normaal assistentbericht.

Daardoor is `/btw` nuttig wanneer je een tijdelijke verduidelijking wilt terwijl de hoofdtaak doorgaat.

Voorbeeld:

```text
/btw what are we doing right now?
```

Zie [BTW-zijvragen](/nl/tools/btw) voor het volledige gedrag en de UX-details voor clients.

## Gerelateerd

- [Skills maken](/nl/tools/creating-skills)
- [Skills](/nl/tools/skills)
- [Skills-configuratie](/nl/tools/skills-config)
