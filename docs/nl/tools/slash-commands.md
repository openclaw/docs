---
read_when:
    - Chatopdrachten gebruiken of configureren
    - Opdrachtroutering of machtigingen debuggen
sidebarTitle: Slash commands
summary: 'Slash-commando''s: tekst versus native, configuratie en ondersteunde commando''s'
title: Slash-opdrachten
x-i18n:
    generated_at: "2026-05-01T11:23:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfa4c8e294080e824b15f0b54842718f7913cf6d42b7edd4ca9695c3d4113924
    source_path: tools/slash-commands.md
    workflow: 16
---

Opdrachten worden afgehandeld door de Gateway. De meeste opdrachten moeten worden verzonden als een **zelfstandig** bericht dat begint met `/`. De host-only bash-chatopdracht gebruikt `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek of thread is gebonden aan een ACP-sessie, wordt normale vervolgtekst naar die ACP-harness geleid. Gateway-beheeropdrachten blijven nog steeds lokaal: `/acp ...` bereikt altijd de OpenClaw ACP-opdrachthandler, en `/status` plus `/unfocus` blijven lokaal wanneer opdrachtafhandeling is ingeschakeld voor het oppervlak.

Er zijn twee gerelateerde systemen:

<AccordionGroup>
  <Accordion title="Commands">
    Zelfstandige `/...`-berichten.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directives worden uit het bericht verwijderd voordat het model het ziet.
    - In normale chatberichten (niet alleen directives) worden ze behandeld als "inline hints" en blijven sessie-instellingen **niet** behouden.
    - In berichten met alleen directives (het bericht bevat alleen directives) blijven ze behouden in de sessie en antwoorden ze met een bevestiging.
    - Directives worden alleen toegepast voor **geautoriseerde afzenders**. Als `commands.allowFrom` is ingesteld, is dit de enige gebruikte allowlist; anders komt autorisatie uit kanaal-allowlists/koppeling plus `commands.useAccessGroups`. Ongeautoriseerde afzenders zien directives als platte tekst behandeld.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Alleen afzenders op de allowlist/geautoriseerde afzenders: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Ze worden onmiddellijk uitgevoerd, verwijderd voordat het model het bericht ziet, en de resterende tekst gaat door de normale flow.

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
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registreert **skill**-opdrachten native wanneer ondersteund. Auto: aan voor Discord/Telegram; uit voor Slack (Slack vereist het maken van een slash-opdracht per skill). Stel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` of `channels.slack.commands.nativeSkills` in om per provider te overschrijven (bool of `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Schakelt `! <cmd>` in om host-shellopdrachten uit te voeren (`/bash <cmd>` is een alias; vereist `tools.elevated`-allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Bepaalt hoelang bash wacht voordat wordt overgeschakeld naar achtergrondmodus (`0` gaat onmiddellijk naar de achtergrond).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (Plugin-detectie/status plus installatie- en in-/uitschakelbediening).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (alleen runtime-overschrijvingen).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` plus toolacties voor herstart van de Gateway in.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Stelt de expliciete owner-allowlist in voor owner-only opdracht-/tooloppervlakken. Dit is het account van de menselijke operator dat gevaarlijke acties kan goedkeuren en opdrachten zoals `/diagnostics`, `/export-trajectory` en `/config` kan uitvoeren. Het staat los van `commands.allowFrom` en van DM-koppelingstoegang.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: zorgt dat owner-only opdrachten **owner-identiteit** vereisen om op dat oppervlak te worden uitgevoerd. Wanneer `true`, moet de afzender overeenkomen met een opgeloste owner-kandidaat (bijvoorbeeld een vermelding in `commands.ownerAllowFrom` of provider-native owner-metadata) of interne `operator.admin`-scope hebben op een intern berichtkanaal. Een wildcardvermelding in kanaal `allowFrom`, of een lege/onopgeloste lijst met owner-kandidaten, is **niet** voldoende — owner-only opdrachten falen gesloten op dat kanaal. Laat dit uit als je owner-only opdrachten alleen wilt afschermen met `ownerAllowFrom` en de standaard opdracht-allowlists.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe owner-id's verschijnen in de systeemprompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Stelt optioneel het HMAC-geheim in dat wordt gebruikt wanneer `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider voor opdrachtautorisatie. Wanneer geconfigureerd, is dit de enige autorisatiebron voor opdrachten en directives (kanaal-allowlists/koppeling en `commands.useAccessGroups` worden genegeerd). Gebruik `"*"` voor een globale standaard; provider-specifieke sleutels overschrijven die.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt allowlists/beleidsregels af voor opdrachten wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Huidige source of truth:

- ingebouwde core-opdrachten komen uit `src/auto-reply/commands-registry.shared.ts`
- gegenereerde dock-opdrachten komen uit `src/auto-reply/commands-registry.data.ts`
- Plugin-opdrachten komen uit Plugin-`registerCommand()`-aanroepen
- daadwerkelijke beschikbaarheid op je Gateway hangt nog steeds af van configuratievlaggen, kanaaloppervlak en geïnstalleerde/ingeschakelde plugins

### Ingebouwde core-opdrachten

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` start een nieuwe sessie; `/reset` is de reset-alias.
    - `/reset soft [message]` behoudt het huidige transcript, verwijdert hergebruikte CLI-backend-sessie-id's en voert het laden van opstart-/systeemprompt opnieuw in-place uit.
    - `/compact [instructions]` comprimeert de sessiecontext. Zie [Compaction](/nl/concepts/compaction).
    - `/stop` breekt de huidige run af.
    - `/session idle <duration|off>` en `/session max-age <duration|off>` beheren de verloopduur van thread-binding.
    - `/export-session [path]` exporteert de huidige sessie naar HTML. Alias: `/export`.
    - `/export-trajectory [path]` vraagt om exec-goedkeuring en exporteert daarna een JSONL-[trajectbundel](/nl/tools/trajectory) voor de huidige sessie. Gebruik dit wanneer je de prompt-, tool- en transcripttijdlijn voor één OpenClaw-sessie nodig hebt. In groepschats gaan de goedkeuringsprompt en het exportresultaat privé naar de owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` stelt het denkniveau in. Opties komen uit het providerprofiel van het actieve model; gangbare niveaus zijn `off`, `minimal`, `low`, `medium` en `high`, met aangepaste niveaus zoals `xhigh`, `adaptive`, `max`, of binair `on` alleen waar ondersteund. Aliassen: `/thinking`, `/t`.
    - `/verbose on|off|full` schakelt uitgebreide uitvoer in of uit. Alias: `/v`.
    - `/trace on|off` schakelt Plugin-trace-uitvoer voor de huidige sessie in of uit.
    - `/fast [status|on|off]` toont of stelt snelle modus in.
    - `/reasoning [on|off|stream]` schakelt zichtbaarheid van redenering in of uit. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` schakelt verhoogde modus in of uit. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` toont of stelt exec-standaarden in.
    - `/model [name|#|status]` toont of stelt het model in.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` geeft geconfigureerde/beschikbaar geauthenticeerde providers of modellen voor een provider weer; voeg `all` toe om door de volledige catalogus van die provider te bladeren.
    - `/queue <mode>` beheert wachtrijgedrag (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opties zoals `debounce:0.5s cap:25 drop:summarize`; `/queue default` of `/queue reset` wist de sessie-overschrijving. Zie [Opdrachtwachtrij](/nl/concepts/queue) en [Steering-wachtrij](/nl/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` toont de korte helpsamenvatting.
    - `/commands` toont de gegenereerde opdrachtcatalogus.
    - `/tools [compact|verbose]` toont wat de huidige agent op dit moment kan gebruiken.
    - `/status` toont uitvoerings-/runtimestatus, inclusief `Execution`/`Runtime`-labels en providergebruik/quota wanneer beschikbaar.
    - `/diagnostics [note]` is de owner-only supportrapport-flow voor Gateway-bugs en Codex-harness-runs. Het vraagt elke keer expliciete exec-goedkeuring voordat `openclaw gateway diagnostics export --json` wordt uitgevoerd; keur diagnostics niet goed met een allow-all-regel. Na goedkeuring verzendt het een plakbaar rapport met het lokale bundelpad, manifestsamenvatting, privacynotities en relevante sessie-id's. In groepschats gaan de goedkeuringsprompt en het rapport privé naar de owner. Wanneer de actieve sessie de OpenAI Codex-harness gebruikt, verzendt dezelfde goedkeuring ook relevante Codex-feedback naar OpenAI-servers en vermeldt het voltooide antwoord de OpenClaw-sessie-id's, Codex-thread-id's en `codex resume <thread-id>`-opdrachten. Zie [Diagnostics Export](/nl/gateway/diagnostics).
    - `/crestodian <request>` voert de Crestodian-installatie- en reparatiehelper uit vanuit een owner-DM.
    - `/tasks` geeft actieve/recente achtergrondtaken voor de huidige sessie weer.
    - `/context [list|detail|json]` legt uit hoe context wordt samengesteld.
    - `/whoami` toont je afzender-id. Alias: `/id`.
    - `/usage off|tokens|full|cost` regelt de gebruiksfooter per antwoord of drukt een lokale kostensamenvatting af.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` voert een skill op naam uit.
    - `/allowlist [list|add|remove] ...` beheert allowlist-vermeldingen. Alleen tekst.
    - `/approve <id> <decision>` lost exec-goedkeuringsprompts op.
    - `/btw <question>` stelt een zijdelingse vraag zonder toekomstige sessiecontext te wijzigen. Zie [BTW](/nl/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` beheert subagent-runs voor de huidige sessie.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` beheert ACP-sessies en runtime-opties.
    - `/focus <target>` bindt de huidige Discord-thread of Telegram-topic/conversatie aan een sessiedoel.
    - `/unfocus` verwijdert de huidige binding.
    - `/agents` geeft thread-gebonden agents voor de huidige sessie weer.
    - `/kill <id|#|all>` breekt één of alle actieve subagents af.
    - `/steer <id|#> <message>` stuurt steering naar een actieve subagent. Alias: `/tell`.

  </Accordion>
  <Accordion title="Alleen-eigenaar schrijftoegang en beheer">
    - `/config show|get|set|unset` leest of schrijft `openclaw.json`. Alleen eigenaar. Vereist `commands.config: true`.
    - `/mcp show|get|set|unset` leest of schrijft door OpenClaw beheerde MCP-serverconfiguratie onder `mcp.servers`. Alleen eigenaar. Vereist `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecteert of wijzigt Plugin-status. `/plugin` is een alias. Alleen eigenaar voor schrijftoegang. Vereist `commands.plugins: true`.
    - `/debug show|set|unset|reset` beheert runtime-only configuratie-overschrijvingen. Alleen eigenaar. Vereist `commands.debug: true`.
    - `/restart` herstart OpenClaw wanneer ingeschakeld. Standaard: ingeschakeld; stel `commands.restart: false` in om dit uit te schakelen.
    - `/send on|off|inherit` stelt verzendbeleid in. Alleen eigenaar.

  </Accordion>
  <Accordion title="Spraak, TTS, kanaalbeheer">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` beheert TTS. Zie [TTS](/nl/tools/tts).
    - `/activation mention|always` stelt de activeringsmodus voor groepen in.
    - `/bash <command>` voert een shellopdracht op de host uit. Alleen tekst. Alias: `! <command>`. Vereist `commands.bash: true` plus allowlists voor `tools.elevated`.
    - `!poll [sessionId]` controleert een bash-taak op de achtergrond.
    - `!stop [sessionId]` stopt een bash-taak op de achtergrond.

  </Accordion>
</AccordionGroup>

### Gegenereerde dock-opdrachten

Dock-opdrachten schakelen de antwoordroute van de huidige sessie naar een ander gekoppeld
kanaal. Zie [Kanaal-docking](/nl/concepts/channel-docking) voor installatie,
voorbeelden en probleemoplossing.

Dock-opdrachten worden gegenereerd uit kanaalplugins met ondersteuning voor native opdrachten. Huidige gebundelde set:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gebruik dock-opdrachten vanuit een directe chat om de antwoordroute van de huidige sessie naar een ander gekoppeld kanaal te schakelen. De agent behoudt dezelfde sessiecontext, maar toekomstige antwoorden voor die sessie worden afgeleverd bij de geselecteerde kanaalpeer.

Dock-opdrachten vereisen `session.identityLinks`. De bronafzender en doelpeer moeten in dezelfde identiteitsgroep zitten, bijvoorbeeld `["telegram:123", "discord:456"]`. Als een Telegram-gebruiker met id `123` `/dock_discord` verzendt, slaat OpenClaw `lastChannel: "discord"` en `lastTo: "456"` op in de actieve sessie. Als de afzender niet aan een Discord-peer is gekoppeld, antwoordt de opdracht met een installatietip in plaats van door te vallen naar normale chat.

Docking wijzigt alleen de actieve sessieroute. Het maakt geen kanaalaccounts aan, verleent geen toegang, omzeilt geen kanaal-allowlists en verplaatst geen transcriptgeschiedenis naar een andere sessie. Gebruik `/dock-telegram`, `/dock-slack`, `/dock-mattermost` of een andere gegenereerde dock-opdracht om de route opnieuw te schakelen.

### Gebundelde Plugin-opdrachten

Gebundelde plugins kunnen meer slash-opdrachten toevoegen. Huidige gebundelde opdrachten in deze repo:

- `/dreaming [on|off|status|help]` schakelt geheugen-Dreaming in of uit. Zie [Dreaming](/nl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` beheert de koppelings-/installatiestroom voor apparaten. Zie [Koppelen](/nl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` activeert tijdelijk telefoonnode-opdrachten met hoog risico.
- `/voice status|list [limit]|set <voiceId|name>` beheert Talk-spraakconfiguratie. Op Discord is de native opdrachtnaam `/talkvoice`.
- `/card ...` verzendt LINE rich-card-presets. Zie [LINE](/nl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecteert en beheert de gebundelde Codex-appserverharness. Zie [Codex-harness](/nl/plugins/codex-harness).
- Alleen QQBot-opdrachten:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skill-opdrachten

Door gebruikers aanroepbare skills worden ook als slash-opdrachten beschikbaar gemaakt:

- `/skill <name> [input]` werkt altijd als algemeen ingangspunt.
- skills kunnen ook als directe opdrachten verschijnen, zoals `/prose`, wanneer de skill/Plugin ze registreert.
- native registratie van Skill-opdrachten wordt beheerd door `commands.nativeSkills` en `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Argument- en parsernotities">
    - Opdrachten accepteren een optionele `:` tussen de opdracht en argumenten (bijv. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accepteert een modelalias, `provider/model` of een providernaam (fuzzy match); als er geen overeenkomst is, wordt de tekst als berichttekst behandeld.
    - Gebruik `openclaw status --usage` voor een volledig overzicht van providergebruik.
    - `/allowlist add|remove` vereist `commands.config=true` en respecteert kanaal-`configWrites`.
    - In kanalen met meerdere accounts respecteren configgerichte `/allowlist --account <id>` en `/config set channels.<provider>.accounts.<id>...` ook de `configWrites` van het doelaccount.
    - `/usage` beheert de gebruiksfooter per antwoord; `/usage cost` drukt een lokale kosten samenvatting af vanuit OpenClaw-sessielogs.
    - `/restart` is standaard ingeschakeld; stel `commands.restart: false` in om dit uit te schakelen.
    - `/plugins install <spec>` accepteert dezelfde Plugin-specificaties als `openclaw plugins install`: lokaal pad/archief, npm-pakket, `git:<repo>` of `clawhub:<pkg>`.
    - `/plugins enable|disable` werkt Plugin-configuratie bij en kan om een herstart vragen.

  </Accordion>
  <Accordion title="Kanaalspecifiek gedrag">
    - Alleen Discord-native opdracht: `/vc join|leave|status` beheert spraakkanalen (niet beschikbaar als tekst). `join` vereist een guild en geselecteerd spraak-/podiumkanaal. Vereist `channels.discord.voice` en native opdrachten.
    - Discord-opdrachten voor thread-binding (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) vereisen dat effectieve thread-bindings zijn ingeschakeld (`session.threadBindings.enabled` en/of `channels.discord.threadBindings.enabled`).
    - ACP-opdrachtreferentie en runtimegedrag: [ACP-agenten](/nl/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning-veiligheid">
    - `/verbose` is bedoeld voor foutopsporing en extra zichtbaarheid; houd dit bij normaal gebruik **uit**.
    - `/trace` is smaller dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van plugins en houdt normale uitgebreide toolruis uit.
    - `/fast on|off` bewaart een sessie-overschrijving. Gebruik de optie `inherit` in de Sessions UI om deze te wissen en terug te vallen op de configuratiestandaarden.
    - `/fast` is providerspecifiek: OpenAI/OpenAI Codex koppelen dit aan `service_tier=priority` op native Responses-eindpunten, terwijl directe openbare Anthropic-verzoeken, inclusief met OAuth geauthenticeerd verkeer dat naar `api.anthropic.com` wordt verzonden, dit koppelen aan `service_tier=auto` of `standard_only`. Zie [OpenAI](/nl/providers/openai) en [Anthropic](/nl/providers/anthropic).
    - Samenvattingen van toolfouten worden nog steeds getoond wanneer relevant, maar gedetailleerde fouttekst wordt alleen opgenomen wanneer `/verbose` `on` of `full` is.
    - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsomgevingen: ze kunnen interne redenering, tooluitvoer of Plugin-diagnostiek tonen die u niet wilde blootstellen. Laat ze bij voorkeur uit, vooral in groepschats.

  </Accordion>
  <Accordion title="Model wisselen">
    - `/model` bewaart het nieuwe sessiemodel onmiddellijk.
    - Als de agent inactief is, gebruikt de volgende run het meteen.
    - Als er al een run actief is, markeert OpenClaw een live-wissel als in behandeling en start het pas opnieuw met het nieuwe model op een schoon retry-punt.
    - Als toolactiviteit of antwoorduitvoer al is gestart, kan de wachtende wissel in de wachtrij blijven tot een latere retry-mogelijkheid of de volgende gebruikersbeurt.
    - In de lokale TUI keert `/crestodian [request]` terug van de normale agent-TUI naar Crestodian. Dit staat los van de reddingsmodus voor berichtkanalen en verleent geen externe configuratiebevoegdheid.

  </Accordion>
  <Accordion title="Snel pad en inline snelkoppelingen">
    - **Snel pad:** berichten die alleen uit opdrachten bestaan van afzenders op de allowlist worden onmiddellijk verwerkt (omzeilt wachtrij + model).
    - **Groepsvermeldingspoort:** berichten die alleen uit opdrachten bestaan van afzenders op de allowlist omzeilen vermeldingsvereisten.
    - **Inline snelkoppelingen (alleen afzenders op de allowlist):** bepaalde opdrachten werken ook wanneer ze in een normaal bericht zijn ingesloten en worden verwijderd voordat het model de resterende tekst ziet.
      - Voorbeeld: `hey /status` activeert een statusantwoord en de resterende tekst gaat door de normale stroom.
    - Momenteel: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Onbevoegde berichten die alleen uit opdrachten bestaan worden stilzwijgend genegeerd, en inline `/...`-tokens worden als platte tekst behandeld.

  </Accordion>
  <Accordion title="Skill-opdrachten en native argumenten">
    - **Skill-opdrachten:** `user-invocable` skills worden als slash-opdrachten beschikbaar gemaakt. Namen worden gesaneerd naar `a-z0-9_` (max. 32 tekens); botsingen krijgen numerieke achtervoegsels (bijv. `_2`).
      - `/skill <name> [input]` voert een skill op naam uit (handig wanneer native opdrachtlimieten opdrachten per skill verhinderen).
      - Standaard worden Skill-opdrachten als een normaal verzoek naar het model doorgestuurd.
      - Skills kunnen optioneel `command-dispatch: tool` declareren om de opdracht rechtstreeks naar een tool te routeren (deterministisch, geen model).
      - Voorbeeld: `/prose` (OpenProse-Plugin) — zie [OpenProse](/nl/prose).
    - **Native opdrachtargumenten:** Discord gebruikt autocomplete voor dynamische opties (en knopmenu's wanneer u vereiste argumenten weglaat). Telegram en Slack tonen een knopmenu wanneer een opdracht keuzes ondersteunt en u het argument weglaat. Dynamische keuzes worden opgelost tegen het doelsessiemodel, dus modelspecifieke opties zoals `/think`-niveaus volgen de `/model`-overschrijving van die sessie.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` beantwoordt een runtimevraag, geen configuratievraag: **wat deze agent nu in dit gesprek kan gebruiken**.

- Standaard `/tools` is compact en geoptimaliseerd voor snel scannen.
- `/tools verbose` voegt korte beschrijvingen toe.
- Native-opdrachtoppervlakken die argumenten ondersteunen, bieden dezelfde modusschakelaar als `compact|verbose`.
- Resultaten zijn sessiegebonden, dus het wijzigen van agent, kanaal, thread, afzenderautorisatie of model kan de uitvoer veranderen.
- `/tools` bevat tools die daadwerkelijk bereikbaar zijn tijdens runtime, inclusief kerntools, verbonden Plugin-tools en tools die eigendom zijn van kanalen.

Gebruik voor het bewerken van profielen en overschrijvingen het Tools-paneel in de Control UI of configuratie-/catalogusoppervlakken in plaats van `/tools` als statische catalogus te behandelen.

## Gebruiksoppervlakken (wat waar wordt getoond)

- **Providergebruik/quota** (voorbeeld: "Claude 80% left") verschijnt in `/status` voor de huidige modelprovider wanneer gebruikstracking is ingeschakeld. OpenClaw normaliseert providerperiodes naar `% left`; voor MiniMax worden percentagevelden met alleen resterend tegoed omgekeerd vóór weergave, en `model_remains`-antwoorden geven de voorkeur aan de chatmodelvermelding plus een modelgetagd planlabel.
- **Token/cache-regels** in `/status` kunnen terugvallen op de nieuwste transcriptgebruiksvermelding wanneer de live sessiesnapshot schaars is. Bestaande niet-nul livewaarden blijven winnen, en transcriptfallback kan ook het actieve runtime-modelabel plus een groter promptgericht totaal herstellen wanneer opgeslagen totalen ontbreken of kleiner zijn.
- **Uitvoering versus runtime:** `/status` rapporteert `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie daadwerkelijk uitvoert: `OpenClaw Pi Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per antwoord** wordt beheerd door `/usage off|tokens|full` (toegevoegd aan normale antwoorden).
- `/model status` gaat over **modellen/auth/eindpunten**, niet over gebruik.

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

Notities:

- `/model` en `/model list` tonen een compacte, genummerde kiezer (modelfamilie + beschikbare providers).
- Op Discord openen `/model` en `/models` een interactieve kiezer met dropdowns voor provider en model plus een Submit-stap.
- `/model <#>` selecteert uit die kiezer (en geeft waar mogelijk de voorkeur aan de huidige provider).
- `/model status` toont de gedetailleerde weergave, inclusief geconfigureerd providereindpunt (`baseUrl`) en API-modus (`api`) wanneer beschikbaar.

## Debug-overschrijvingen

`/debug` laat je **runtime-only** configuratie-overschrijvingen instellen (geheugen, niet schijf). Alleen voor de eigenaar. Standaard uitgeschakeld; schakel in met `commands.debug: true`.

Voorbeelden:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Overschrijvingen gelden direct voor nieuwe configuratielezingen, maar schrijven **niet** naar `openclaw.json`. Gebruik `/debug reset` om alle overschrijvingen te wissen en terug te keren naar de configuratie op schijf.
</Note>

## Plugin-trace-uitvoer

`/trace` laat je **sessiegebonden Plugin-trace-/debugregels** in- of uitschakelen zonder de volledige uitgebreide modus aan te zetten.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Notities:

- `/trace` zonder argument toont de huidige trace-status van de sessie.
- `/trace on` schakelt Plugin-traceregels in voor de huidige sessie.
- `/trace off` schakelt ze weer uit.
- Plugin-traceregels kunnen verschijnen in `/status` en als een aanvullend diagnostisch bericht na het normale assistentantwoord.
- `/trace` vervangt `/debug` niet; `/debug` beheert nog steeds runtime-only configuratie-overschrijvingen.
- `/trace` vervangt `/verbose` niet; normale uitgebreide tool-/statusuitvoer hoort nog steeds bij `/verbose`.

## Configuratie-updates

`/config` schrijft naar je configuratie op schijf (`openclaw.json`). Alleen voor de eigenaar. Standaard uitgeschakeld; schakel in met `commands.config: true`.

Voorbeelden:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Configuratie wordt gevalideerd vóór het schrijven; ongeldige wijzigingen worden geweigerd. `/config`-updates blijven behouden na herstarts.
</Note>

## MCP-updates

`/mcp` schrijft door OpenClaw beheerde MCP-serverdefinities onder `mcp.servers`. Alleen voor de eigenaar. Standaard uitgeschakeld; schakel in met `commands.mcp: true`.

Voorbeelden:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` slaat configuratie op in de OpenClaw-configuratie, niet in projectinstellingen die eigendom zijn van Pi. Runtime-adapters bepalen welke transports daadwerkelijk uitvoerbaar zijn.
</Note>

## Plugin-updates

`/plugins` laat operators ontdekte plugins inspecteren en inschakeling in de configuratie omzetten. Alleen-lezen-flows kunnen `/plugin` als alias gebruiken. Standaard uitgeschakeld; schakel in met `commands.plugins: true`.

Voorbeelden:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` en `/plugins show` gebruiken echte Plugin-detectie op de huidige werkruimte plus configuratie op schijf.
- `/plugins enable|disable` werkt alleen de Plugin-configuratie bij; het installeert of verwijdert geen plugins.
- Start na wijzigingen voor inschakelen/uitschakelen de Gateway opnieuw om ze toe te passen.

</Note>

## Opmerkingen per oppervlak

<AccordionGroup>
  <Accordion title="Sessies per oppervlak">
    - **Tekstopdrachten** worden uitgevoerd in de normale chatsessie (DM's delen `main`, groepen hebben hun eigen sessie).
    - **Native opdrachten** gebruiken geïsoleerde sessies:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (richt zich op de chatsessie via `CommandTargetSessionKey`)
    - **`/stop`** richt zich op de actieve chatsessie zodat die de huidige run kan afbreken.

  </Accordion>
  <Accordion title="Slack-specifiek">
    `channels.slack.slashCommand` wordt nog steeds ondersteund voor één opdracht in `/openclaw`-stijl. Als je `commands.native` inschakelt, moet je één Slack-slashopdracht per ingebouwde opdracht maken (dezelfde namen als `/help`). Menu's voor opdrachtargumenten voor Slack worden geleverd als tijdelijke Block Kit-knoppen.

    Slack native-uitzondering: registreer `/agentstatus` (niet `/status`) omdat Slack `/status` reserveert. Tekst-`/status` werkt nog steeds in Slack-berichten.

  </Accordion>
</AccordionGroup>

## BTW-zijvragen

`/btw` is een snelle **zijvraag** over de huidige sessie.

In tegenstelling tot normale chat:

- gebruikt het de huidige sessie als achtergrondcontext,
- draait het als een afzonderlijke **tool-loze** eenmalige aanroep,
- wijzigt het toekomstige sessiecontext niet,
- wordt het niet naar de transcriptgeschiedenis geschreven,
- wordt het geleverd als live zijresultaat in plaats van als normaal assistentbericht.

Dat maakt `/btw` nuttig wanneer je tijdelijke verduidelijking wilt terwijl de hoofdtaak doorgaat.

Voorbeeld:

```text
/btw what are we doing right now?
```

Zie [BTW-zijvragen](/nl/tools/btw) voor het volledige gedrag en details over de client-UX.

## Gerelateerd

- [Skills maken](/nl/tools/creating-skills)
- [Skills](/nl/tools/skills)
- [Skills-configuratie](/nl/tools/skills-config)
