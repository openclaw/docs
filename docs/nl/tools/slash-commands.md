---
read_when:
    - Chatopdrachten gebruiken of configureren
    - Opdrachtroutering of machtigingen debuggen
sidebarTitle: Slash commands
summary: 'Slash-commando''s: tekst versus systeemeigen, configuratie en ondersteunde commando''s'
title: Slash-opdrachten
x-i18n:
    generated_at: "2026-05-04T07:09:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49eb41674c8d0a01dbd28a2df783eb9aba3dde18d8425951a266cede825e9a84
    source_path: tools/slash-commands.md
    workflow: 16
---

Opdrachten worden afgehandeld door de Gateway. De meeste opdrachten moeten worden verzonden als een **zelfstandig** bericht dat begint met `/`. De host-only bash-chatopdracht gebruikt `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek of thread is gekoppeld aan een ACP-sessie, wordt normale vervolgtekst naar die ACP-harness geleid. Gateway-beheeropdrachten blijven lokaal: `/acp ...` bereikt altijd de OpenClaw ACP-opdrachthandler, en `/status` plus `/unfocus` blijven lokaal wanneer opdrachtafhandeling voor het oppervlak is ingeschakeld.

Er zijn twee gerelateerde systemen:

<AccordionGroup>
  <Accordion title="Commands">
    Zelfstandige `/...`-berichten.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directives worden uit het bericht verwijderd voordat het model het ziet.
    - In normale chatberichten (niet alleen directives) worden ze behandeld als "inline hints" en blijven sessie-instellingen **niet** bewaard.
    - In berichten met alleen directives (het bericht bevat alleen directives) blijven ze bewaard in de sessie en wordt er geantwoord met een bevestiging.
    - Directives worden alleen toegepast voor **geautoriseerde afzenders**. Als `commands.allowFrom` is ingesteld, is dat de enige allowlist die wordt gebruikt; anders komt autorisatie uit kanaalallowlists/koppeling plus `commands.useAccessGroups`. Ongeautoriseerde afzenders zien directives behandeld als platte tekst.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Alleen afzenders op de allowlist/geautoriseerde afzenders: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Ze worden onmiddellijk uitgevoerd, verwijderd voordat het model het bericht ziet, en de resterende tekst gaat verder via de normale flow.

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
  Registreert native opdrachten. Auto: aan voor Discord/Telegram; uit voor Slack (totdat je slash-opdrachten toevoegt); genegeerd voor providers zonder native ondersteuning. Stel `channels.discord.commands.native`, `channels.telegram.commands.native` of `channels.slack.commands.native` in om per provider te overschrijven (bool of `"auto"`). Op Discord slaat `false` registratie en opschoning van slash-opdrachten tijdens het opstarten over; eerder geregistreerde opdrachten kunnen zichtbaar blijven totdat je ze uit de Discord-app verwijdert. Slack-opdrachten worden beheerd in de Slack-app en worden niet automatisch verwijderd.
</ParamField>
Op Discord kunnen native opdrachtspecificaties `descriptionLocalizations` bevatten, die OpenClaw publiceert als Discord `description_localizations` en meeneemt in reconcile-vergelijkingen.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registreert **skill**-opdrachten native wanneer ondersteund. Auto: aan voor Discord/Telegram; uit voor Slack (Slack vereist dat je per skill een slash-opdracht maakt). Stel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` of `channels.slack.commands.nativeSkills` in om per provider te overschrijven (bool of `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Schakelt `! <cmd>` in om host-shellopdrachten uit te voeren (`/bash <cmd>` is een alias; vereist `tools.elevated`-allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bepaalt hoelang bash wacht voordat wordt overgeschakeld naar achtergrondmodus (`0` zet meteen op de achtergrond).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (Plugin-ontdekking/status plus installatie- en in-/uitschakelknoppen).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (alleen runtime-overschrijvingen).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` plus Gateway-herstarttoolacties in.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Stelt de expliciete allowlist voor eigenaars in voor opdracht-/tooloppervlakken die alleen voor eigenaars zijn. Dit is het menselijke operatoraccount dat gevaarlijke acties kan goedkeuren en opdrachten kan uitvoeren zoals `/diagnostics`, `/export-trajectory` en `/config`. Dit staat los van `commands.allowFrom` en van DM-koppelingstoegang.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: laat opdrachten die alleen voor eigenaars zijn **eigenaarsidentiteit** vereisen om op dat oppervlak te worden uitgevoerd. Wanneer `true`, moet de afzender overeenkomen met een opgeloste eigenaarskandidaat (bijvoorbeeld een vermelding in `commands.ownerAllowFrom` of provider-native eigenaarsmetadata), of interne `operator.admin`-scope hebben op een intern berichtkanaal. Een wildcardvermelding in kanaal-`allowFrom`, of een lege/onopgeloste lijst met eigenaarskandidaten, is **niet** voldoende — opdrachten die alleen voor eigenaars zijn falen gesloten op dat kanaal. Laat dit uit als je wilt dat opdrachten die alleen voor eigenaars zijn alleen worden bewaakt door `ownerAllowFrom` en de standaard opdrachtsallowlists.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe eigenaars-id's in de systeemprompt verschijnen.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Stelt optioneel het HMAC-geheim in dat wordt gebruikt wanneer `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider voor opdrachtautorisatie. Wanneer geconfigureerd, is dit de enige autorisatiebron voor opdrachten en directives (kanaalallowlists/koppeling en `commands.useAccessGroups` worden genegeerd). Gebruik `"*"` voor een globale standaard; providerspecifieke sleutels overschrijven die.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt allowlists/beleidsregels af voor opdrachten wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Huidige bron van waarheid:

- ingebouwde kernopdrachten komen uit `src/auto-reply/commands-registry.shared.ts`
- gegenereerde dockopdrachten komen uit `src/auto-reply/commands-registry.data.ts`
- Plugin-opdrachten komen uit Plugin-`registerCommand()`-aanroepen
- daadwerkelijke beschikbaarheid op je Gateway hangt nog steeds af van configuratievlaggen, kanaaloppervlak en geïnstalleerde/ingeschakelde Plugins

### Ingebouwde kernopdrachten

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` start een nieuwe sessie; `/reset` is de reset-alias.
    - Control UI onderschept getypte `/new` om een nieuwe dashboardsessie te maken en ernaar te schakelen; getypte `/reset` voert nog steeds de in-place reset van de Gateway uit.
    - `/reset soft [message]` behoudt het huidige transcript, laat hergebruikte CLI-backendsessie-id's vallen en voert startup-/systeempromptladen opnieuw in-place uit.
    - `/compact [instructions]` compacteert de sessiecontext. Zie [Compaction](/nl/concepts/compaction).
    - `/stop` breekt de huidige run af.
    - `/session idle <duration|off>` en `/session max-age <duration|off>` beheren het verlopen van thread-koppelingen.
    - `/export-session [path]` exporteert de huidige sessie naar HTML. Alias: `/export`.
    - `/export-trajectory [path]` vraagt om exec-goedkeuring en exporteert daarna een JSONL-[trajectbundel](/nl/tools/trajectory) voor de huidige sessie. Gebruik dit wanneer je de prompt-, tool- en transcripttijdlijn voor één OpenClaw-sessie nodig hebt. In groepschats gaan de goedkeuringsprompt en het exportresultaat privé naar de eigenaar. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` stelt het denkniveau in. Opties komen uit het providerprofiel van het actieve model; gangbare niveaus zijn `off`, `minimal`, `low`, `medium` en `high`, met aangepaste niveaus zoals `xhigh`, `adaptive`, `max` of binair `on` alleen waar ondersteund. Aliassen: `/thinking`, `/t`.
    - `/verbose on|off|full` schakelt uitgebreide uitvoer in of uit. Alias: `/v`.
    - `/trace on|off` schakelt Plugin-trace-uitvoer voor de huidige sessie in of uit.
    - `/fast [status|on|off]` toont of stelt snelle modus in.
    - `/reasoning [on|off|stream]` schakelt redeneerzichtbaarheid in of uit. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` schakelt elevated-modus in of uit. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` toont of stelt exec-standaarden in.
    - `/model [name|#|status]` toont of stelt het model in.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` toont geconfigureerde/auth-beschikbare providers of modellen voor een provider; voeg `all` toe om door de volledige catalogus van die provider te bladeren.
    - `/queue <mode>` beheert wachtrijgedrag (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opties zoals `debounce:0.5s cap:25 drop:summarize`; `/queue default` of `/queue reset` wist de sessie-overschrijving. Zie [Opdrachtwachtrij](/nl/concepts/queue) en [Steering-wachtrij](/nl/concepts/queue-steering).
    - `/steer <message>` injecteert begeleiding in de actieve run voor de huidige sessie, onafhankelijk van de `/queue`-modus. Het start geen nieuwe run wanneer de sessie inactief is. Alias: `/tell`. Zie [Steer](/nl/tools/steer).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` toont de korte helpsamenvatting.
    - `/commands` toont de gegenereerde opdrachtencatalogus.
    - `/tools [compact|verbose]` toont wat de huidige agent op dit moment kan gebruiken.
    - `/status` toont uitvoerings-/runtimestatus, inclusief `Execution`/`Runtime`-labels en providergebruik/quotum wanneer beschikbaar.
    - `/diagnostics [note]` is de supportrapportflow alleen voor eigenaars voor Gateway-bugs en Codex-harnessruns. Deze vraagt elke keer om expliciete exec-goedkeuring voordat `openclaw gateway diagnostics export --json` wordt uitgevoerd; keur diagnostics niet goed met een allow-all-regel. Na goedkeuring verzendt het een plakbaar rapport met het lokale bundelpad, manifestsamenvatting, privacynotities en relevante sessie-id's. In groepschats gaan de goedkeuringsprompt en het rapport privé naar de eigenaar. Wanneer de actieve sessie de OpenAI Codex-harness gebruikt, verzendt dezelfde goedkeuring ook relevante Codex-feedback naar OpenAI-servers en vermeldt het voltooide antwoord de OpenClaw-sessie-id's, Codex-thread-id's en `codex resume <thread-id>`-opdrachten. Zie [Diagnostics-export](/nl/gateway/diagnostics).
    - `/crestodian <request>` voert de Crestodian-installatie- en reparatiehulp uit vanuit een eigenaars-DM.
    - `/tasks` toont actieve/recente achtergrondtaken voor de huidige sessie.
    - `/context [list|detail|json]` legt uit hoe context wordt samengesteld.
    - `/whoami` toont je afzender-id. Alias: `/id`.
    - `/usage off|tokens|full|cost` beheert de gebruiksfooter per antwoord of drukt een lokale kostensamenvatting af.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` voert een skill op naam uit.
    - `/allowlist [list|add|remove] ...` beheert allowlistvermeldingen. Alleen tekst.
    - `/approve <id> <decision>` lost exec-goedkeuringsprompts op.
    - `/btw <question>` stelt een nevenvraag zonder toekomstige sessiecontext te wijzigen. Alias: `/side`. Zie [BTW](/nl/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` beheert sub-agent-uitvoeringen voor de huidige sessie.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` beheert ACP-sessies en runtime-opties.
    - `/focus <target>` koppelt de huidige Discord-thread of het huidige Telegram-onderwerp/gesprek aan een sessiedoel.
    - `/unfocus` verwijdert de huidige koppeling.
    - `/agents` toont thread-gebonden agents voor de huidige sessie.
    - `/kill <id|#|all>` breekt een of alle actieve sub-agents af.
    - `/subagents steer <id|#> <message>` stuurt bijsturing naar een actieve sub-agent. Zie [Bijsturen](/nl/tools/steer).

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` leest of schrijft `openclaw.json`. Alleen voor de eigenaar. Vereist `commands.config: true`.
    - `/mcp show|get|set|unset` leest of schrijft door OpenClaw beheerde MCP-serverconfiguratie onder `mcp.servers`. Alleen voor de eigenaar. Vereist `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecteert of wijzigt de Plugin-status. `/plugin` is een alias. Schrijfbewerkingen zijn alleen voor de eigenaar. Vereist `commands.plugins: true`.
    - `/debug show|set|unset|reset` beheert runtime-only configuratie-overschrijvingen. Alleen voor de eigenaar. Vereist `commands.debug: true`.
    - `/restart` herstart OpenClaw wanneer ingeschakeld. Standaard: ingeschakeld; stel `commands.restart: false` in om dit uit te schakelen.
    - `/send on|off|inherit` stelt het verzendbeleid in. Alleen voor de eigenaar.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` bestuurt TTS. Zie [TTS](/nl/tools/tts).
    - `/activation mention|always` stelt de groepsactivatiemodus in.
    - `/bash <command>` voert een hostshellopdracht uit. Alleen tekst. Alias: `! <command>`. Vereist `commands.bash: true` plus allowlists voor `tools.elevated`.
    - `!poll [sessionId]` controleert een bash-taak op de achtergrond.
    - `!stop [sessionId]` stopt een bash-taak op de achtergrond.

  </Accordion>
</AccordionGroup>

### Gegenereerde dock-opdrachten

Dock-opdrachten schakelen de antwoordroute van de huidige sessie over naar een ander gekoppeld
kanaal. Zie [Kanaal-docking](/nl/concepts/channel-docking) voor installatie,
voorbeelden en probleemoplossing.

Dock-opdrachten worden gegenereerd uit kanaal-plugins met ondersteuning voor native opdrachten. Huidige gebundelde set:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gebruik dock-opdrachten vanuit een directe chat om de antwoordroute van de huidige sessie over te schakelen naar een ander gekoppeld kanaal. De agent behoudt dezelfde sessiecontext, maar toekomstige antwoorden voor die sessie worden afgeleverd bij de geselecteerde kanaalpeer.

Dock-opdrachten vereisen `session.identityLinks`. De bronafzender en doelpeer moeten in dezelfde identiteitsgroep zitten, bijvoorbeeld `["telegram:123", "discord:456"]`. Als een Telegram-gebruiker met id `123` `/dock_discord` verzendt, slaat OpenClaw `lastChannel: "discord"` en `lastTo: "456"` op in de actieve sessie. Als de afzender niet is gekoppeld aan een Discord-peer, antwoordt de opdracht met een installatietip in plaats van door te vallen naar normale chat.

Docking wijzigt alleen de actieve sessieroute. Het maakt geen kanaalaccounts aan, verleent geen toegang, omzeilt geen kanaal-allowlists en verplaatst geen transcriptgeschiedenis naar een andere sessie. Gebruik `/dock-telegram`, `/dock-slack`, `/dock-mattermost` of een andere gegenereerde dock-opdracht om de route opnieuw te schakelen.

### Gebundelde Plugin-opdrachten

Gebundelde plugins kunnen meer slash-opdrachten toevoegen. Huidige gebundelde opdrachten in deze repo:

- `/dreaming [on|off|status|help]` schakelt geheugen-Dreaming in of uit. Zie [Dreaming](/nl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` beheert de flow voor apparaatkoppeling/installatie. Zie [Koppelen](/nl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` activeert tijdelijk telefoon-Node-opdrachten met hoog risico.
- `/voice status|list [limit]|set <voiceId|name>` beheert Talk-spraakconfiguratie. Op Discord is de native opdrachtnaam `/talkvoice`.
- `/card ...` verzendt LINE-rich-card-presets. Zie [LINE](/nl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecteert en bestuurt de gebundelde Codex-appserverharnas. Zie [Codex-harnas](/nl/plugins/codex-harness).
- Alleen QQBot-opdrachten:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skills-opdrachten

Door gebruikers aanroepbare Skills worden ook als slash-opdrachten beschikbaar gemaakt:

- `/skill <name> [input]` werkt altijd als het generieke ingangspunt.
- Skills kunnen ook verschijnen als directe opdrachten zoals `/prose` wanneer de Skill/Plugin ze registreert.
- registratie van native Skills-opdrachten wordt beheerd door `commands.nativeSkills` en `channels.<provider>.commands.nativeSkills`.
- opdrachtspecificaties kunnen `descriptionLocalizations` leveren voor native oppervlakken die gelokaliseerde beschrijvingen ondersteunen, waaronder Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Opdrachten accepteren een optionele `:` tussen de opdracht en argumenten (bijv. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accepteert een modelalias, `provider/model` of een providernaam (fuzzy match); als er geen match is, wordt de tekst behandeld als de berichttekst.
    - Gebruik `openclaw status --usage` voor een volledige uitsplitsing van providergebruik.
    - `/allowlist add|remove` vereist `commands.config=true` en respecteert kanaal-`configWrites`.
    - In kanalen met meerdere accounts respecteren config-gerichte `/allowlist --account <id>` en `/config set channels.<provider>.accounts.<id>...` ook de `configWrites` van het doelaccount.
    - `/usage` beheert de gebruiksvoettekst per antwoord; `/usage cost` print een lokale kostensamenvatting uit OpenClaw-sessielogs.
    - `/restart` is standaard ingeschakeld; stel `commands.restart: false` in om dit uit te schakelen.
    - `/plugins install <spec>` accepteert dezelfde Plugin-specificaties als `openclaw plugins install`: lokaal pad/archief, npm-pakket, `git:<repo>` of `clawhub:<pkg>`, en vraagt vervolgens om een Gateway-herstart omdat Plugin-bronmodules zijn gewijzigd.
    - `/plugins enable|disable` werkt Plugin-configuratie bij en activeert herladen van Gateway-plugins voor nieuwe agentbeurten.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Alleen voor Discord native opdracht: `/vc join|leave|status` bestuurt spraakkanalen (niet beschikbaar als tekst). `join` vereist een guild en een geselecteerd spraak-/stagekanaal. Vereist `channels.discord.voice` en native opdrachten.
    - Discord-threadkoppelingsopdrachten (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) vereisen dat effectieve threadkoppelingen zijn ingeschakeld (`session.threadBindings.enabled` en/of `channels.discord.threadBindings.enabled`).
    - ACP-opdrachtreferentie en runtime-gedrag: [ACP-agents](/nl/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` is bedoeld voor foutopsporing en extra zichtbaarheid; houd dit bij normaal gebruik **uit**.
    - `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van plugins en houdt normale verbose tool-ruis uit.
    - `/fast on|off` bewaart een sessie-overschrijving. Gebruik de optie `inherit` in de Sessions UI om die te wissen en terug te vallen op configuratiestandaarden.
    - `/fast` is providerspecifiek: OpenAI/OpenAI Codex mappen dit naar `service_tier=priority` op native Responses-eindpunten, terwijl directe publieke Anthropic-verzoeken, inclusief met OAuth geauthenticeerd verkeer naar `api.anthropic.com`, dit mappen naar `service_tier=auto` of `standard_only`. Zie [OpenAI](/nl/providers/openai) en [Anthropic](/nl/providers/anthropic).
    - Samenvattingen van toolfouten worden nog steeds getoond wanneer relevant, maar gedetailleerde fouttekst wordt alleen opgenomen wanneer `/verbose` `on` of `full` is.
    - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsinstellingen: ze kunnen interne redenering, tooluitvoer of Plugin-diagnostiek onthullen die u niet wilde blootstellen. Laat ze bij voorkeur uit, vooral in groepschats.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` bewaart het nieuwe sessiemodel onmiddellijk.
    - Als de agent inactief is, gebruikt de volgende run het meteen.
    - Als er al een run actief is, markeert OpenClaw een live-omschakeling als in behandeling en herstart het pas naar het nieuwe model op een schoon retry-punt.
    - Als toolactiviteit of antwoorduitvoer al is gestart, kan de omschakeling in behandeling in de wachtrij blijven staan tot een latere retry-mogelijkheid of de volgende gebruikersbeurt.
    - In de lokale TUI keert `/crestodian [request]` terug van de normale agent-TUI naar Crestodian. Dit staat los van reddingsmodus voor berichtkanalen en verleent geen externe configuratiebevoegdheid.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Snel pad:** berichten met alleen opdrachten van afzenders op de allowlist worden onmiddellijk afgehandeld (omzeilt wachtrij + model).
    - **Groepsmention-gating:** berichten met alleen opdrachten van afzenders op de allowlist omzeilen mention-vereisten.
    - **Inline-snelkoppelingen (alleen afzenders op de allowlist):** bepaalde opdrachten werken ook wanneer ze zijn ingebed in een normaal bericht en worden verwijderd voordat het model de resterende tekst ziet.
      - Voorbeeld: `hey /status` activeert een statusantwoord, en de resterende tekst gaat door de normale flow.
    - Momenteel: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Ongeautoriseerde berichten met alleen opdrachten worden stil genegeerd, en inline `/...`-tokens worden behandeld als platte tekst.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Skill-opdrachten:** `user-invocable` Skills worden als slash-opdrachten beschikbaar gemaakt. Namen worden opgeschoond naar `a-z0-9_` (max. 32 tekens); botsingen krijgen numerieke suffixen (bijv. `_2`).
      - `/skill <name> [input]` voert een Skill uit op naam (handig wanneer limieten voor native opdrachten opdrachten per Skill verhinderen).
      - Standaard worden Skill-opdrachten doorgestuurd naar het model als een normaal verzoek.
      - Skills kunnen optioneel `command-dispatch: tool` declareren om de opdracht rechtstreeks naar een tool te routeren (deterministisch, geen model).
      - Voorbeeld: `/prose` (OpenProse-Plugin) — zie [OpenProse](/nl/prose).
    - **Argumenten voor native opdrachten:** Discord gebruikt autocomplete voor dynamische opties (en knopmenu's wanneer u vereiste argumenten weglaat). Telegram en Slack tonen een knopmenu wanneer een opdracht keuzes ondersteunt en u het argument weglaat. Dynamische keuzes worden opgelost tegen het doel-sessiemodel, zodat modelspecifieke opties zoals `/think`-niveaus de `/model`-overschrijving van die sessie volgen.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` beantwoordt een runtime-vraag, geen configuratievraag: **wat deze agent nu in dit gesprek kan gebruiken**.

- Standaard `/tools` is compact en geoptimaliseerd om snel te scannen.
- `/tools verbose` voegt korte beschrijvingen toe.
- Native-opdrachtoppervlakken die argumenten ondersteunen, bieden dezelfde modusschakelaar als `compact|verbose`.
- Resultaten zijn sessiegebonden, dus het wijzigen van agent, kanaal, thread, afzenderautorisatie of model kan de uitvoer wijzigen.
- `/tools` bevat tools die daadwerkelijk bereikbaar zijn tijdens runtime, inclusief kerntools, verbonden Plugin-tools en tools die eigendom zijn van het kanaal.

Gebruik voor het bewerken van profielen en overschrijvingen het Tools-paneel in de Control UI of configuratie-/catalogusoppervlakken in plaats van `/tools` als statische catalogus te behandelen.

## Gebruiksoppervlakken (wat waar wordt getoond)

- **Providergebruik/quota** (voorbeeld: "Claude 80% over") wordt in `/status` weergegeven voor de huidige modelprovider wanneer gebruikstracking is ingeschakeld. OpenClaw normaliseert providervensters naar `% left`; voor MiniMax worden percentvelden die alleen resterend gebruik tonen voor weergave omgekeerd, en `model_remains`-antwoorden geven de voorkeur aan de chatmodelvermelding plus een model-gelabeld planlabel.
- **Token-/cache-regels** in `/status` kunnen terugvallen op de nieuwste gebruiksvermelding uit het transcript wanneer de live sessie-snapshot beperkt is. Bestaande niet-nul live waarden blijven leidend, en transcriptfallback kan ook het actieve runtime-modellabel herstellen plus een groter promptgericht totaal wanneer opgeslagen totalen ontbreken of kleiner zijn.
- **Uitvoering versus runtime:** `/status` rapporteert `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie daadwerkelijk uitvoert: `OpenClaw Pi Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per antwoord** worden beheerd met `/usage off|tokens|full` (toegevoegd aan normale antwoorden).
- `/model status` gaat over **modellen/authenticatie/eindpunten**, niet over gebruik.

## Modelselectie (`/model`)

`/model` is geimplementeerd als een directive.

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
- Op Discord openen `/model` en `/models` een interactieve kiezer met dropdowns voor provider en model plus een indienstap.
- `/model <#>` selecteert uit die kiezer (en geeft waar mogelijk de voorkeur aan de huidige provider).
- `/model status` toont de gedetailleerde weergave, inclusief geconfigureerd provider-eindpunt (`baseUrl`) en API-modus (`api`) wanneer beschikbaar.

## Debug-overschrijvingen

Met `/debug` kun je **alleen-runtime** configuratie-overschrijvingen instellen (geheugen, niet schijf). Alleen eigenaar. Standaard uitgeschakeld; schakel in met `commands.debug: true`.

Voorbeelden:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Overschrijvingen worden direct toegepast op nieuwe configuratielezingen, maar schrijven **niet** naar `openclaw.json`. Gebruik `/debug reset` om alle overschrijvingen te wissen en terug te keren naar de configuratie op schijf.
</Note>

## Plugin-trace-uitvoer

Met `/trace` kun je **sessiegebonden plugin-trace-/debugregels** in- of uitschakelen zonder volledige uitgebreide modus aan te zetten.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Opmerkingen:

- `/trace` zonder argument toont de huidige trace-status van de sessie.
- `/trace on` schakelt plugin-trace-regels in voor de huidige sessie.
- `/trace off` schakelt ze weer uit.
- Plugin-trace-regels kunnen verschijnen in `/status` en als een opvolgend diagnostisch bericht na het normale assistentantwoord.
- `/trace` vervangt `/debug` niet; `/debug` beheert nog steeds alleen-runtime configuratie-overschrijvingen.
- `/trace` vervangt `/verbose` niet; normale uitgebreide tool-/statusuitvoer hoort nog steeds bij `/verbose`.

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
`/mcp` slaat configuratie op in OpenClaw-configuratie, niet in projectinstellingen die eigendom zijn van Pi. Runtime-adapters bepalen welke transports daadwerkelijk uitvoerbaar zijn.
</Note>

## Plugin-updates

Met `/plugins` kunnen operators ontdekte plugins inspecteren en inschakeling in configuratie omschakelen. Alleen-lezen flows kunnen `/plugin` als alias gebruiken. Standaard uitgeschakeld; schakel in met `commands.plugins: true`.

Voorbeelden:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` en `/plugins show` gebruiken echte plugin-discovery tegen de huidige workspace plus configuratie op schijf.
- `/plugins install` installeert vanuit ClawHub, npm, git, lokale mappen en archieven.
- `/plugins enable|disable` werkt alleen plugin-configuratie bij; het installeert of verwijdert geen plugins.
- Wijzigingen voor inschakelen en uitschakelen laden Gateway plugin-runtime-oppervlakken hot-reload voor nieuwe agentbeurten; installatie vraagt om een Gateway-herstart omdat plugin-bronmodules zijn gewijzigd.

</Note>

## Oppervlaknotities

<AccordionGroup>
  <Accordion title="Sessies per oppervlak">
    - **Tekstopdrachten** worden uitgevoerd in de normale chatsessie (DM's delen `main`, groepen hebben hun eigen sessie).
    - **Native opdrachten** gebruiken geisoleerde sessies:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (richt zich op de chatsessie via `CommandTargetSessionKey`)
    - **`/stop`** richt zich op de actieve chatsessie zodat deze de huidige run kan afbreken.

  </Accordion>
  <Accordion title="Slack-specifiek">
    `channels.slack.slashCommand` wordt nog steeds ondersteund voor een enkele opdracht in `/openclaw`-stijl. Als je `commands.native` inschakelt, moet je een Slack slash command per ingebouwde opdracht maken (dezelfde namen als `/help`). Menu's met opdrachtargumenten voor Slack worden geleverd als tijdelijke Block Kit-knoppen.

    Slack native-uitzondering: registreer `/agentstatus` (niet `/status`) omdat Slack `/status` reserveert. Tekst `/status` werkt nog steeds in Slack-berichten.

  </Accordion>
</AccordionGroup>

## BTW-zijvragen

`/btw` is een snelle **zijvraag** over de huidige sessie. `/side` is een alias.

Anders dan normale chat:

- gebruikt het de huidige sessie als achtergrondcontext,
- wordt het uitgevoerd als een aparte **tool-loze** eenmalige call,
- verandert het toekomstige sessiecontext niet,
- wordt het niet naar transcriptgeschiedenis geschreven,
- wordt het geleverd als een live zijresultaat in plaats van een normaal assistentbericht.

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
- [Skills-configuratie](/nl/tools/skills-config)
