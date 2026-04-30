---
read_when:
    - Chatcommando's gebruiken of configureren
    - Foutopsporing van opdrachtroutering of machtigingen
sidebarTitle: Slash commands
summary: 'Slashcommando''s: tekst versus systeemeigen, configuratie en ondersteunde commando''s'
title: Slashcommando's
x-i18n:
    generated_at: "2026-04-30T09:41:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

Opdrachten worden afgehandeld door de Gateway. De meeste opdrachten moeten worden verzonden als een **zelfstandig** bericht dat begint met `/`. De host-only bash-chatopdracht gebruikt `! <cmd>` (met `/bash <cmd>` als alias).

Wanneer een gesprek of thread is gekoppeld aan een ACP-sessie, wordt gewone vervolgtekst naar die ACP-harness geleid. Gateway-beheeropdrachten blijven nog steeds lokaal: `/acp ...` bereikt altijd de OpenClaw ACP-opdrachthandler, en `/status` plus `/unfocus` blijven lokaal wanneer opdrachtverwerking is ingeschakeld voor het oppervlak.

Er zijn twee verwante systemen:

<AccordionGroup>
  <Accordion title="Opdrachten">
    Zelfstandige `/...`-berichten.
  </Accordion>
  <Accordion title="Richtlijnen">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Richtlijnen worden uit het bericht verwijderd voordat het model ze ziet.
    - In normale chatberichten (niet alleen-richtlijn) worden ze behandeld als "inline hints" en blijven sessie-instellingen **niet** behouden.
    - In alleen-richtlijnberichten (het bericht bevat alleen richtlijnen) blijven ze behouden in de sessie en antwoorden ze met een bevestiging.
    - Richtlijnen worden alleen toegepast voor **geautoriseerde afzenders**. Als `commands.allowFrom` is ingesteld, is dit de enige gebruikte allowlist; anders komt autorisatie uit kanaal-allowlists/koppeling plus `commands.useAccessGroups`. Niet-geautoriseerde afzenders zien richtlijnen behandeld als platte tekst.

  </Accordion>
  <Accordion title="Inline snelkoppelingen">
    Alleen geallowliste/geautoriseerde afzenders: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Bepaalt hoelang bash wacht voordat naar achtergrondmodus wordt overgeschakeld (`0` zet direct op de achtergrond).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Schakelt `/config` in (leest/schrijft `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Schakelt `/mcp` in (leest/schrijft door OpenClaw beheerde MCP-configuratie onder `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Schakelt `/plugins` in (Plugin-ontdekking/status plus installatie- en in-/uitschakelbesturing).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Schakelt `/debug` in (alleen-runtime-overschrijvingen).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Schakelt `/restart` plus Gateway-herstarttoolacties in.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Stelt de expliciete owner-allowlist in voor owner-only opdracht-/tooloppervlakken. Dit is het menselijke operatoraccount dat gevaarlijke acties kan goedkeuren en opdrachten kan uitvoeren zoals `/diagnostics`, `/export-trajectory` en `/config`. Het staat los van `commands.allowFrom` en van DM-koppelingstoegang.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanaal: laat owner-only opdrachten **owner-identiteit** vereisen om op dat oppervlak te worden uitgevoerd. Wanneer `true`, moet de afzender overeenkomen met een opgeloste owner-kandidaat (bijvoorbeeld een vermelding in `commands.ownerAllowFrom` of provider-native owner-metadata) of interne `operator.admin`-scope hebben op een intern berichtkanaal. Een wildcard-vermelding in kanaal `allowFrom`, of een lege/onopgeloste owner-kandidatenlijst, is **niet** voldoende — owner-only opdrachten falen gesloten op dat kanaal. Laat dit uit als je wilt dat owner-only opdrachten alleen worden afgeschermd door `ownerAllowFrom` en de standaard opdracht-allowlists.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Bepaalt hoe owner-id's in de systeemprompt verschijnen.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Stelt optioneel het HMAC-geheim in dat wordt gebruikt wanneer `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider voor opdrachtautorisatie. Wanneer geconfigureerd, is dit de enige autorisatiebron voor opdrachten en richtlijnen (kanaal-allowlists/koppeling en `commands.useAccessGroups` worden genegeerd). Gebruik `"*"` voor een globale standaard; providerspecifieke sleutels overschrijven deze.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Dwingt allowlists/beleidsregels af voor opdrachten wanneer `commands.allowFrom` niet is ingesteld.
</ParamField>

## Opdrachtenlijst

Huidige bron van waarheid:

- ingebouwde core-opdrachten komen uit `src/auto-reply/commands-registry.shared.ts`
- gegenereerde dock-opdrachten komen uit `src/auto-reply/commands-registry.data.ts`
- Plugin-opdrachten komen uit Plugin-aanroepen naar `registerCommand()`
- daadwerkelijke beschikbaarheid op je Gateway hangt nog steeds af van configuratievlaggen, kanaaloppervlak en geïnstalleerde/ingeschakelde plugins

### Ingebouwde core-opdrachten

<AccordionGroup>
  <Accordion title="Sessies en runs">
    - `/new [model]` start een nieuwe sessie; `/reset` is de reset-alias.
    - `/reset soft [message]` behoudt het huidige transcript, verwijdert hergebruikte CLI-backendsessie-id's en voert het laden van startup/systeemprompt opnieuw in-place uit.
    - `/compact [instructions]` compacteert de sessiecontext. Zie [Compaction](/nl/concepts/compaction).
    - `/stop` breekt de huidige run af.
    - `/session idle <duration|off>` en `/session max-age <duration|off>` beheren het verlopen van thread-koppelingen.
    - `/export-session [path]` exporteert de huidige sessie naar HTML. Alias: `/export`.
    - `/export-trajectory [path]` vraagt om exec-goedkeuring en exporteert daarna een JSONL-[trajectbundel](/nl/tools/trajectory) voor de huidige sessie. Gebruik dit wanneer je de prompt-, tool- en transcripttijdlijn nodig hebt voor één OpenClaw-sessie. In groepschats gaan de goedkeuringsprompt en het exportresultaat privé naar de owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model- en runbesturing">
    - `/think <level>` stelt het denkniveau in. Opties komen uit het providerprofiel van het actieve model; veelvoorkomende niveaus zijn `off`, `minimal`, `low`, `medium` en `high`, met aangepaste niveaus zoals `xhigh`, `adaptive`, `max` of binair `on` alleen waar ondersteund. Aliassen: `/thinking`, `/t`.
    - `/verbose on|off|full` schakelt uitgebreide uitvoer in of uit. Alias: `/v`.
    - `/trace on|off` schakelt Plugin-trace-uitvoer voor de huidige sessie in of uit.
    - `/fast [status|on|off]` toont of stelt snelle modus in.
    - `/reasoning [on|off|stream]` schakelt zichtbaarheid van redenering in of uit. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` schakelt verhoogde modus in of uit. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` toont of stelt exec-standaarden in.
    - `/model [name|#|status]` toont of stelt het model in.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` toont geconfigureerde/auth-beschikbare providers of modellen voor een provider; voeg `all` toe om de volledige catalogus van die provider te bekijken.
    - `/queue <mode>` beheert wachtrijgedrag (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opties zoals `debounce:0.5s cap:25 drop:summarize`; `/queue default` of `/queue reset` wist de sessie-overschrijving. Zie [Opdrachtwachtrij](/nl/concepts/queue) en [Stuurwachtrij](/nl/concepts/queue-steering).

  </Accordion>
  <Accordion title="Ontdekking en status">
    - `/help` toont de korte hulpsamenvatting.
    - `/commands` toont de gegenereerde opdrachtcatalogus.
    - `/tools [compact|verbose]` toont wat de huidige agent nu kan gebruiken.
    - `/status` toont uitvoerings-/runtimestatus, inclusief `Execution`-/`Runtime`-labels en providergebruik/quota wanneer beschikbaar.
    - `/diagnostics [note]` is de owner-only supportrapportageflow voor Gateway-bugs en Codex-harness-runs. Deze vraagt elke keer om expliciete exec-goedkeuring voordat `openclaw gateway diagnostics export --json` wordt uitgevoerd; keur diagnostiek niet goed met een allow-all-regel. Na goedkeuring stuurt deze een plakbaar rapport met het lokale bundelpad, manifestsamenvatting, privacynotities en relevante sessie-id's. In groepschats gaan de goedkeuringsprompt en het rapport privé naar de owner. Wanneer de actieve sessie de OpenAI Codex-harness gebruikt, stuurt dezelfde goedkeuring ook relevante Codex-feedback naar OpenAI-servers en vermeldt het voltooide antwoord de OpenClaw-sessie-id's, Codex-thread-id's en `codex resume <thread-id>`-opdrachten. Zie [Diagnostiekexport](/nl/gateway/diagnostics).
    - `/crestodian <request>` voert de Crestodian-installatie- en reparatiehelper uit vanuit een owner-DM.
    - `/tasks` toont actieve/recente achtergrondtaken voor de huidige sessie.
    - `/context [list|detail|json]` legt uit hoe context wordt samengesteld.
    - `/whoami` toont je afzender-id. Alias: `/id`.
    - `/usage off|tokens|full|cost` beheert de gebruiksfooter per antwoord of drukt een lokale kostensamenvatting af.

  </Accordion>
  <Accordion title="Skills, allowlists, goedkeuringen">
    - `/skill <name> [input]` voert een skill op naam uit.
    - `/allowlist [list|add|remove] ...` beheert allowlist-vermeldingen. Alleen tekst.
    - `/approve <id> <decision>` lost exec-goedkeuringsprompts op.
    - `/btw <question>` stelt een zijvraag zonder toekomstige sessiecontext te wijzigen. Zie [BTW](/nl/tools/btw).

  </Accordion>
  <Accordion title="Subagents en ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` beheert sub-agent-runs voor de huidige sessie.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` beheert ACP-sessies en runtime-opties.
    - `/focus <target>` koppelt de huidige Discord-thread of Telegram-topic/gesprek aan een sessiedoel.
    - `/unfocus` verwijdert de huidige koppeling.
    - `/agents` toont thread-gekoppelde agents voor de huidige sessie.
    - `/kill <id|#|all>` breekt één of alle draaiende sub-agents af.
    - `/steer <id|#> <message>` stuurt sturing naar een draaiende sub-agent. Alias: `/tell`.

  </Accordion>
  <Accordion title="Alleen-eigenaar schrijfacties en beheer">
    - `/config show|get|set|unset` leest of schrijft `openclaw.json`. Alleen eigenaar. Vereist `commands.config: true`.
    - `/mcp show|get|set|unset` leest of schrijft door OpenClaw beheerde MCP-serverconfiguratie onder `mcp.servers`. Alleen eigenaar. Vereist `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecteert of wijzigt de Plugin-status. `/plugin` is een alias. Alleen eigenaar voor schrijfacties. Vereist `commands.plugins: true`.
    - `/debug show|set|unset|reset` beheert runtime-only configuratie-overschrijvingen. Alleen eigenaar. Vereist `commands.debug: true`.
    - `/restart` herstart OpenClaw wanneer ingeschakeld. Standaard: ingeschakeld; stel `commands.restart: false` in om dit uit te schakelen.
    - `/send on|off|inherit` stelt het verzendbeleid in. Alleen eigenaar.

  </Accordion>
  <Accordion title="Spraak, TTS, kanaalbesturing">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` bestuurt TTS. Zie [TTS](/nl/tools/tts).
    - `/activation mention|always` stelt de activeringsmodus voor groepen in.
    - `/bash <command>` voert een hostshellopdracht uit. Alleen tekst. Alias: `! <command>`. Vereist `commands.bash: true` plus allowlists voor `tools.elevated`.
    - `!poll [sessionId]` controleert een achtergrond-bash-taak.
    - `!stop [sessionId]` stopt een achtergrond-bash-taak.

  </Accordion>
</AccordionGroup>

### Gegenereerde dockopdrachten

Dockopdrachten schakelen de antwoordroute van de huidige sessie over naar een ander gekoppeld
kanaal. Zie [Kanaaldocking](/nl/concepts/channel-docking) voor configuratie,
voorbeelden en probleemoplossing.

Dockopdrachten worden gegenereerd uit kanaalplugins met ondersteuning voor native opdrachten. Huidige gebundelde set:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gebruik dockopdrachten vanuit een directe chat om de antwoordroute van de huidige sessie over te schakelen naar een ander gekoppeld kanaal. De agent behoudt dezelfde sessiecontext, maar toekomstige antwoorden voor die sessie worden aan de geselecteerde kanaalpeer geleverd.

Dockopdrachten vereisen `session.identityLinks`. De bronafzender en doelpeer moeten in dezelfde identiteitsgroep staan, bijvoorbeeld `["telegram:123", "discord:456"]`. Als een Telegram-gebruiker met id `123` `/dock_discord` verzendt, slaat OpenClaw `lastChannel: "discord"` en `lastTo: "456"` op in de actieve sessie. Als de afzender niet aan een Discord-peer is gekoppeld, antwoordt de opdracht met een configuratietip in plaats van door te vallen naar normale chat.

Docking wijzigt alleen de actieve sessieroute. Het maakt geen kanaalaccounts aan, verleent geen toegang, omzeilt geen kanaal-allowlists en verplaatst geen transcriptgeschiedenis naar een andere sessie. Gebruik `/dock-telegram`, `/dock-slack`, `/dock-mattermost` of een andere gegenereerde dockopdracht om de route opnieuw te wijzigen.

### Gebundelde Plugin-opdrachten

Gebundelde plugins kunnen meer slash-opdrachten toevoegen. Huidige gebundelde opdrachten in deze repo:

- `/dreaming [on|off|status|help]` schakelt geheugendreaming in of uit. Zie [Dreaming](/nl/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` beheert de flow voor apparaatkoppeling/configuratie. Zie [Koppelen](/nl/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` activeert tijdelijk telefoonnode-opdrachten met hoog risico.
- `/voice status|list [limit]|set <voiceId|name>` beheert de Talk-spraakconfiguratie. Op Discord is de native opdrachtnaam `/talkvoice`.
- `/card ...` verzendt rich-card-presets voor LINE. Zie [LINE](/nl/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecteert en bestuurt de gebundelde Codex app-server-harness. Zie [Codex-harness](/nl/plugins/codex-harness).
- Alleen QQBot-opdrachten:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dynamische Skills-opdrachten

Door gebruikers aanroepbare skills worden ook als slash-opdrachten beschikbaar gemaakt:

- `/skill <name> [input]` werkt altijd als het generieke toegangspunt.
- Skills kunnen ook als directe opdrachten verschijnen, zoals `/prose`, wanneer de skill/plugin ze registreert.
- native registratie van skill-opdrachten wordt beheerd door `commands.nativeSkills` en `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Argument- en parsernotities">
    - Opdrachten accepteren een optionele `:` tussen de opdracht en argumenten (bijv. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accepteert een modelalias, `provider/model` of een providernaam (fuzzy match); als er geen match is, wordt de tekst als berichtinhoud behandeld.
    - Gebruik `openclaw status --usage` voor een volledig overzicht van providergebruik.
    - `/allowlist add|remove` vereist `commands.config=true` en respecteert kanaal-`configWrites`.
    - In kanalen met meerdere accounts respecteren configuratiegerichte `/allowlist --account <id>` en `/config set channels.<provider>.accounts.<id>...` ook de `configWrites` van het doelaccount.
    - `/usage` beheert de gebruiksfooter per antwoord; `/usage cost` print een lokale kostensamenvatting uit OpenClaw-sessielogs.
    - `/restart` is standaard ingeschakeld; stel `commands.restart: false` in om dit uit te schakelen.
    - `/plugins install <spec>` accepteert dezelfde Plugin-specificaties als `openclaw plugins install`: lokaal pad/archief, npm-pakket of `clawhub:<pkg>`.
    - `/plugins enable|disable` werkt de Plugin-configuratie bij en kan om een herstart vragen.

  </Accordion>
  <Accordion title="Kanaalspecifiek gedrag">
    - Alleen Discord native opdracht: `/vc join|leave|status` bestuurt spraakkanalen (niet beschikbaar als tekst). `join` vereist een guild en geselecteerd spraak-/stagekanaal. Vereist `channels.discord.voice` en native opdrachten.
    - Discord-opdrachten voor thread-binding (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) vereisen dat effectieve thread-bindings zijn ingeschakeld (`session.threadBindings.enabled` en/of `channels.discord.threadBindings.enabled`).
    - ACP-opdrachtreferentie en runtimegedrag: [ACP-agenten](/nl/tools/acp-agents).

  </Accordion>
  <Accordion title="Uitgebreid / trace / snel / redeneerveiligheid">
    - `/verbose` is bedoeld voor debuggen en extra zichtbaarheid; houd dit bij normaal gebruik **uit**.
    - `/trace` is beperkter dan `/verbose`: het toont alleen trace-/debugregels die eigendom zijn van plugins en houdt normale uitgebreide toolruis uit.
    - `/fast on|off` bewaart een sessie-overschrijving. Gebruik de optie `inherit` in de Sessions UI om deze te wissen en terug te vallen op configuratiestandaarden.
    - `/fast` is providerspecifiek: OpenAI/OpenAI Codex koppelen dit aan `service_tier=priority` op native Responses-endpoints, terwijl directe openbare Anthropic-verzoeken, inclusief OAuth-geauthenticeerd verkeer naar `api.anthropic.com`, dit koppelen aan `service_tier=auto` of `standard_only`. Zie [OpenAI](/nl/providers/openai) en [Anthropic](/nl/providers/anthropic).
    - Samenvattingen van toolfouten worden nog steeds getoond wanneer relevant, maar gedetailleerde fouttekst wordt alleen opgenomen wanneer `/verbose` `on` of `full` is.
    - `/reasoning`, `/verbose` en `/trace` zijn riskant in groepsinstellingen: ze kunnen interne redenering, tooluitvoer of Plugin-diagnostiek tonen die je niet wilde blootstellen. Laat ze bij voorkeur uit, vooral in groepschats.

  </Accordion>
  <Accordion title="Model wisselen">
    - `/model` bewaart het nieuwe sessiemodel onmiddellijk.
    - Als de agent idle is, gebruikt de volgende run het meteen.
    - Als er al een run actief is, markeert OpenClaw een live-wissel als in behandeling en herstart het pas naar het nieuwe model op een schoon retrypunt.
    - Als toolactiviteit of antwoorduitvoer al is gestart, kan de wachtende wissel in de wachtrij blijven tot een latere retrymogelijkheid of de volgende gebruikersbeurt.
    - In de lokale TUI keert `/crestodian [request]` terug van de normale agent-TUI naar Crestodian. Dit staat los van rescue-modus voor berichtkanalen en verleent geen externe configuratiebevoegdheid.

  </Accordion>
  <Accordion title="Snel pad en inline snelkoppelingen">
    - **Snel pad:** berichten met alleen opdrachten van allowlisted afzenders worden onmiddellijk afgehandeld (omzeilt wachtrij + model).
    - **Groepsmention-gating:** berichten met alleen opdrachten van allowlisted afzenders omzeilen mention-vereisten.
    - **Inline snelkoppelingen (alleen allowlisted afzenders):** bepaalde opdrachten werken ook wanneer ze in een normaal bericht zijn opgenomen en worden verwijderd voordat het model de resterende tekst ziet.
      - Voorbeeld: `hey /status` triggert een statusantwoord, en de resterende tekst gaat door de normale flow.
    - Momenteel: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Niet-geautoriseerde berichten met alleen opdrachten worden stil genegeerd, en inline `/...`-tokens worden als gewone tekst behandeld.

  </Accordion>
  <Accordion title="Skill-opdrachten en native argumenten">
    - **Skill-opdrachten:** `user-invocable` skills worden als slash-opdrachten beschikbaar gemaakt. Namen worden opgeschoond naar `a-z0-9_` (max. 32 tekens); botsingen krijgen numerieke achtervoegsels (bijv. `_2`).
      - `/skill <name> [input]` voert een skill uit op naam (handig wanneer native opdrachtlimieten opdrachten per skill verhinderen).
      - Standaard worden skill-opdrachten als een normaal verzoek doorgestuurd naar het model.
      - Skills kunnen optioneel `command-dispatch: tool` declareren om de opdracht rechtstreeks naar een tool te routeren (deterministisch, geen model).
      - Voorbeeld: `/prose` (OpenProse-plugin) — zie [OpenProse](/nl/prose).
    - **Native opdrachtargumenten:** Discord gebruikt autocomplete voor dynamische opties (en knopmenu's wanneer je vereiste argumenten weglaat). Telegram en Slack tonen een knopmenu wanneer een opdracht keuzes ondersteunt en je het argument weglaat. Dynamische keuzes worden opgelost tegen het doelsessiemodel, zodat modelspecifieke opties zoals `/think`-niveaus de `/model`-overschrijving van die sessie volgen.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` beantwoordt een runtimevraag, geen configuratievraag: **wat deze agent nu in dit gesprek kan gebruiken**.

- Standaard `/tools` is compact en geoptimaliseerd voor snel scannen.
- `/tools verbose` voegt korte beschrijvingen toe.
- Native-opdrachtoppervlakken die argumenten ondersteunen, bieden dezelfde modusschakelaar als `compact|verbose`.
- Resultaten zijn sessiegescoped, dus het wijzigen van agent, kanaal, thread, afzenderautorisatie of model kan de uitvoer wijzigen.
- `/tools` bevat tools die daadwerkelijk bereikbaar zijn tijdens runtime, inclusief core-tools, verbonden Plugin-tools en tools die eigendom zijn van het kanaal.

Gebruik voor het bewerken van profielen en overschrijvingen het Tools-paneel in de Control UI of configuratie-/catalogusoppervlakken, in plaats van `/tools` als een statische catalogus te behandelen.

## Gebruiksoppervlakken (wat waar wordt getoond)

- **Providergebruik/quota** (voorbeeld: "Claude 80% over") verschijnt in `/status` voor de huidige modelprovider wanneer gebruikstracking is ingeschakeld. OpenClaw normaliseert providervensters naar `% over`; voor MiniMax worden percentvelden met alleen resterend tegoed omgekeerd vóór weergave, en `model_remains`-antwoorden geven de voorkeur aan de chatmodelvermelding plus een modelgetagd planlabel.
- **Token-/cacheregels** in `/status` kunnen terugvallen op de nieuwste transcriptgebruiksvermelding wanneer de live sessie-snapshot schaars is. Bestaande live-waarden die niet nul zijn winnen nog steeds, en transcriptfallback kan ook het actieve runtime-modelabel herstellen plus een groter promptgericht totaal wanneer opgeslagen totalen ontbreken of kleiner zijn.
- **Uitvoering vs runtime:** `/status` rapporteert `Execution` voor het effectieve sandboxpad en `Runtime` voor wie de sessie daadwerkelijk uitvoert: `OpenClaw Pi Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend.
- **Tokens/kosten per antwoord** wordt beheerd door `/usage off|tokens|full` (toegevoegd aan normale antwoorden).
- `/model status` gaat over **modellen/auth/endpoints**, niet over gebruik.

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

- `/model` en `/model list` tonen een compacte, genummerde picker (modelfamilie + beschikbare providers).
- Op Discord openen `/model` en `/models` een interactieve picker met dropdowns voor provider en model plus een Submit-stap.
- `/model <#>` selecteert uit die picker (en geeft waar mogelijk de voorkeur aan de huidige provider).
- `/model status` toont de gedetailleerde weergave, inclusief geconfigureerd providerendpoint (`baseUrl`) en API-modus (`api`) wanneer beschikbaar.

## Debug-overschrijvingen

`/debug` laat je **alleen-tijdens-runtime** configuratie-overschrijvingen instellen (geheugen, niet schijf). Alleen voor eigenaar. Standaard uitgeschakeld; schakel in met `commands.debug: true`.

Voorbeelden:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Overschrijvingen zijn direct van toepassing op nieuwe configuitlezingen, maar schrijven **niet** naar `openclaw.json`. Gebruik `/debug reset` om alle overschrijvingen te wissen en terug te keren naar de configuratie op schijf.
</Note>

## Plugin-trace-uitvoer

`/trace` laat je **sessiegebonden Plugin-trace-/debugregels** in- of uitschakelen zonder volledige uitgebreide modus aan te zetten.

Voorbeelden:

```text
/trace
/trace on
/trace off
```

Opmerkingen:

- `/trace` zonder argument toont de huidige trace-status van de sessie.
- `/trace on` schakelt Plugin-traceregels in voor de huidige sessie.
- `/trace off` schakelt ze weer uit.
- Plugin-traceregels kunnen verschijnen in `/status` en als een aanvullend diagnostisch bericht na het normale assistentantwoord.
- `/trace` vervangt `/debug` niet; `/debug` beheert nog steeds alleen-tijdens-runtime configuratie-overschrijvingen.
- `/trace` vervangt `/verbose` niet; normale uitgebreide tool-/statusuitvoer blijft bij `/verbose` horen.

## Configuratie-updates

`/config` schrijft naar je configuratie op schijf (`openclaw.json`). Alleen voor eigenaar. Standaard uitgeschakeld; schakel in met `commands.config: true`.

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

`/mcp` schrijft door OpenClaw beheerde MCP-serverdefinities onder `mcp.servers`. Alleen voor eigenaar. Standaard uitgeschakeld; schakel in met `commands.mcp: true`.

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

`/plugins` laat operators ontdekte plugins inspecteren en inschakeling in configuratie omzetten. Alleen-lezen-stromen kunnen `/plugin` als alias gebruiken. Standaard uitgeschakeld; schakel in met `commands.plugins: true`.

Voorbeelden:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` en `/plugins show` gebruiken echte Plugin-discovery op basis van de huidige workspace plus configuratie op schijf.
- `/plugins enable|disable` werkt alleen Plugin-configuratie bij; het installeert of verwijdert geen plugins.
- Herstart na wijzigingen voor inschakelen/uitschakelen de Gateway om ze toe te passen.

</Note>

## Opmerkingen per oppervlak

<AccordionGroup>
  <Accordion title="Sessies per oppervlak">
    - **Tekstopdrachten** worden uitgevoerd in de normale chatsessie (DM's delen `main`, groepen hebben hun eigen sessie).
    - **Native opdrachten** gebruiken geïsoleerde sessies:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (voorvoegsel configureerbaar via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (richt zich op de chatsessie via `CommandTargetSessionKey`)
    - **`/stop`** richt zich op de actieve chatsessie zodat die de huidige run kan afbreken.

  </Accordion>
  <Accordion title="Slack-specifiek">
    `channels.slack.slashCommand` wordt nog steeds ondersteund voor één opdracht in `/openclaw`-stijl. Als je `commands.native` inschakelt, moet je één Slack-slashopdracht per ingebouwde opdracht maken (dezelfde namen als `/help`). Menu's met opdrachtargumenten voor Slack worden geleverd als efemere Block Kit-knoppen.

    Uitzondering voor native Slack: registreer `/agentstatus` (niet `/status`) omdat Slack `/status` reserveert. Tekstuele `/status` werkt nog steeds in Slack-berichten.

  </Accordion>
</AccordionGroup>

## BTW-zijvragen

`/btw` is een snelle **zijvraag** over de huidige sessie.

In tegenstelling tot normale chat:

- gebruikt het de huidige sessie als achtergrondcontext,
- wordt het uitgevoerd als een afzonderlijke eenmalige aanroep **zonder tools**,
- verandert het toekomstige sessiecontext niet,
- wordt het niet naar transcriptgeschiedenis geschreven,
- wordt het geleverd als een live zijresultaat in plaats van een normaal assistentbericht.

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
