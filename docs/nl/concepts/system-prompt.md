---
read_when:
    - Tekst van de systeemprompt, hulpmiddelenlijst of tijd-/Heartbeat-secties bewerken
    - Bootstrap van werkruimte of gedrag voor Skills-injectie wijzigen
summary: Wat de systeemprompt van OpenClaw bevat en hoe deze wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-05-03T21:30:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt een aangepaste systeemprompt voor elke agentrun. De prompt is **eigendom van OpenClaw** en gebruikt niet de standaardprompt van pi-coding-agent.

De prompt wordt door OpenClaw samengesteld en in elke agentrun geïnjecteerd.

Providerplugins kunnen cachebewuste promptbegeleiding bijdragen zonder de volledige prompt die eigendom is van OpenClaw te vervangen. De providerruntime kan:

- een kleine set benoemde kernsecties vervangen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- een **stabiel voorvoegsel** boven de promptcachegrens injecteren
- een **dynamisch achtervoegsel** onder de promptcachegrens injecteren

Gebruik bijdragen van de provider voor model-familiespecifieke afstemming. Bewaar verouderde
`before_prompt_build`-promptmutatie voor compatibiliteit of echt globale promptwijzigingen, niet voor normaal providergedrag.

De overlay voor de OpenAI GPT-5-familie houdt de kernuitvoeringsregel klein en voegt modelspecifieke begeleiding toe voor persona-vergrendeling, beknopte uitvoer, tooldiscipline, parallel opzoeken, dekking van opleveringen, verificatie, ontbrekende context en hygiëne voor terminaltools.

## Structuur

De prompt is bewust compact en gebruikt vaste secties:

- **Tooling**: herinnering aan gestructureerde tools als bron van waarheid plus runtimebegeleiding voor toolgebruik.
- **Uitvoeringsneiging**: compacte begeleiding voor doorpakken: handel binnen de beurt bij uitvoerbare verzoeken, ga door tot klaar of geblokkeerd, herstel van zwakke toolresultaten, controleer veranderlijke staat live en verifieer vóór afronding.
- **Veiligheid**: korte guardrail-herinnering om machtszoekend gedrag of het omzeilen van toezicht te vermijden.
- **Skills** (wanneer beschikbaar): vertelt het model hoe het skill-instructies op aanvraag laadt.
- **OpenClaw Self-Update**: hoe je configuratie veilig inspecteert met
  `config.schema.lookup`, configuratie patcht met `config.patch`, de volledige
  configuratie vervangt met `config.apply` en `update.run` alleen uitvoert op expliciet gebruikersverzoek. De alleen-voor-eigenaar `gateway`-tool weigert ook om
  `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief verouderde `tools.bash.*`-aliassen die naar die beschermde exec-paden normaliseren.
- **Workspace**: werkmap (`agents.defaults.workspace`).
- **Documentatie**: lokaal pad naar OpenClaw-documentatie (repo of npm-pakket) en wanneer die gelezen moet worden.
- **Workspacebestanden (geïnjecteerd)**: geeft aan dat bootstrapbestanden hieronder zijn opgenomen.
- **Sandbox** (wanneer ingeschakeld): geeft sandboxruntime, sandboxpaden en of verhoogde exec beschikbaar is aan.
- **Huidige datum en tijd**: lokale tijd van de gebruiker, tijdzone en tijdnotatie.
- **Antwoordtags**: optionele syntaxis voor antwoordtags voor ondersteunde providers.
- **Heartbeats**: Heartbeat-prompt en ack-gedrag, wanneer Heartbeats zijn ingeschakeld voor de standaardagent.
- **Runtime**: host, besturingssysteem, Node, model, reporoot (wanneer gedetecteerd), denkniveau (één regel).
- **Redenering**: huidig zichtbaarheidsniveau + hint voor /reasoning-schakelaar.

OpenClaw houdt grote stabiele inhoud, inclusief **Projectcontext**, boven de interne promptcachegrens. Vluchtige kanaal- en sessiesecties zoals Control UI-insluitbegeleiding, **Messaging**, **Voice**, **Groepschatcontext**, **Reactions**, **Heartbeats** en **Runtime** worden onder die grens toegevoegd, zodat lokale backends met prefixcaches het stabiele workspacevoorvoegsel tussen kanaalbeurten kunnen hergebruiken. Toolbeschrijvingen moeten eveneens vermijden om huidige kanaalnamen op te nemen wanneer het geaccepteerde schema dat runtimedetail al draagt.

De sectie Tooling bevat ook runtimebegeleiding voor langlopende werkzaamheden:

- gebruik Cron voor toekomstige opvolging (`check back later`, herinneringen, terugkerend werk) in plaats van `exec`-slaaplussen, `yieldMs`-vertragingstrucs of herhaalde `process`-polling
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond blijven draaien
- wanneer automatisch wekken bij voltooiing is ingeschakeld, start de opdracht één keer en vertrouw op het pushgebaseerde wekpad wanneer het uitvoer geeft of faalt
- gebruik `process` voor logs, status, invoer of interventie wanneer je een draaiende opdracht moet inspecteren
- als de taak groter is, geef dan de voorkeur aan `sessions_spawn`; voltooiing van subagents is pushgebaseerd en kondigt zich automatisch terug aan bij de aanvrager
- poll `subagents list` / `sessions_list` niet in een lus alleen om op voltooiing te wachten

Wanneer de experimentele tool `update_plan` is ingeschakeld, vertelt Tooling het model ook om die alleen te gebruiken voor niet-triviaal meerstapswerk, precies één `in_progress`-stap te houden en te vermijden het hele plan na elke update te herhalen.

Veiligheids-guardrails in de systeemprompt zijn adviserend. Ze sturen modelgedrag, maar handhaven geen beleid. Gebruik toolbeleid, exec-goedkeuringen, sandboxing en kanaaltoelatingslijsten voor harde handhaving; operators kunnen deze bewust uitschakelen.

Op kanalen met native goedkeuringskaarten/-knoppen vertelt de runtimeprompt de agent nu om eerst op die native goedkeurings-UI te vertrouwen. Die moet alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring het enige pad is.

## Promptmodi

OpenClaw kan kleinere systeemprompts renderen voor subagents. De runtime stelt voor elke run een `promptMode` in (geen gebruikersgerichte configuratie):

- `full` (standaard): bevat alle bovenstaande secties.
- `minimal`: gebruikt voor subagents; laat **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** en **Heartbeats** weg. Tooling, **Veiligheid**,
  Workspace, Sandbox, Huidige datum en tijd (wanneer bekend), Runtime en geïnjecteerde
  context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Wanneer `promptMode=minimal` is, worden extra geïnjecteerde prompts gelabeld als **Subagentcontext** in plaats van **Groepschatcontext**.

Voor automatische antwoordruns op kanalen kan OpenClaw de algemene sectie **Stille antwoorden** weglaten wanneer de directe/groepschatcontext al het opgeloste gespreksspecifieke `NO_REPLY`-gedrag bevat. Dit voorkomt dat tokenmechanica zowel in de globale systeemprompt als in de kanaalcontext wordt herhaald.

## Promptsnapshots

OpenClaw bewaart gecommitte promptsnapshots voor het gelukkige pad van de Codex-runtime onder
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ze renderen geselecteerde app-server thread-/turn-parameters plus een gereconstrueerde modelgebonden promptlaagstack voor directe Telegram-, Discord-groeps- en Heartbeat-beurten. Die stack bevat een vastgezette Codex `gpt-5.5`-modelpromptfixture die is gegenereerd uit de vorm van Codex' modelcatalogus/cache, de developertekst voor Codex-gelukkig-padmachtigingen, OpenClaw-developerinstructies, beurtgebonden instructies voor samenwerkingsmodus wanneer OpenClaw die levert, gebruikersinvoer voor de beurt en verwijzingen naar de dynamische toolspecificaties.

Ververs de vastgezette Codex-modelpromptfixture met
`pnpm prompt:snapshots:sync-codex-model`. Standaard zoekt het script naar de runtimecache van Codex op `$CODEX_HOME/models_cache.json`, daarna
`~/.codex/models_cache.json`, en pas daarna valt het terug op de maintainer-Codex-checkoutconventie op `~/code/codex/codex-rs/models-manager/models.json`. Als geen van die bronnen bestaat, sluit de opdracht af zonder de gecommitte fixture te wijzigen. Geef `--catalog <path>` door om te verversen vanuit een specifiek `models_cache.json`- of `models.json`-bestand.

Deze snapshots zijn nog steeds geen byte-voor-byte onbewerkte OpenAI-requestcapture. Codex kan runtime-eigen workspacecontext toevoegen, zoals `AGENTS.md`, omgevingscontext, herinneringen, app-/plugininstructies en ingebouwde Default-instructies voor samenwerkingsmodus binnen de Codex-runtime nadat OpenClaw thread- en turn-parameters verstuurt.

Genereer ze opnieuw met `pnpm prompt:snapshots:gen` en verifieer drift met
`pnpm prompt:snapshots:check`. CI voert de driftcontrole uit in de extra grensshard, zodat promptwijzigingen en snapshotupdates aan dezelfde PR gekoppeld blijven.

## Workspace-bootstrapinjectie

Bootstrapbestanden worden ingekort en toegevoegd onder **Projectcontext**, zodat het model identiteit en profielcontext ziet zonder expliciete leesacties nodig te hebben:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen op gloednieuwe workspaces)
- `MEMORY.md` wanneer aanwezig

Al deze bestanden worden **in het contextvenster geïnjecteerd** bij elke beurt, tenzij een bestandsspecifieke gate van toepassing is. `HEARTBEAT.md` wordt weggelaten bij normale runs wanneer Heartbeats zijn uitgeschakeld voor de standaardagent of
`agents.defaults.heartbeat.includeSystemPromptSection` false is. Houd geïnjecteerde bestanden beknopt — vooral `MEMORY.md`, dat na verloop van tijd kan groeien en kan leiden tot onverwacht hoog contextgebruik en frequentere Compaction.

Wanneer een sessie draait op de native Codex-harness, laadt Codex `AGENTS.md`
via zijn eigen projectdocumentdetectie. OpenClaw lost nog steeds de resterende bootstrapbestanden op en stuurt ze door als Codex-configuratie-instructies, zodat `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` en
`MEMORY.md` dezelfde workspacecontextrol behouden zonder `AGENTS.md` te dupliceren.

<Note>
Dagelijkse bestanden in `memory/*.md` maken **geen** deel uit van de normale bootstrap-Projectcontext. Bij gewone beurten worden ze op aanvraag benaderd via de tools `memory_search` en `memory_get`, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale `/new`- en `/reset`-beurten zijn de uitzondering: de runtime kan recente dagelijkse herinnering vooraf toevoegen als een eenmalig startup-contextblok voor die eerste beurt.
</Note>

Grote bestanden worden afgekapt met een markering. De maximale grootte per bestand wordt beheerd door
`agents.defaults.bootstrapMaxChars` (standaard: 12000). Totale geïnjecteerde bootstrapinhoud over bestanden heen is begrensd door `agents.defaults.bootstrapTotalMaxChars`
(standaard: 60000). Ontbrekende bestanden injecteren een korte ontbrekend-bestandmarkering. Wanneer afkapping plaatsvindt, kan OpenClaw een waarschuwingsblok in Projectcontext injecteren; beheer dit met
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
standaard: `once`).

Subagentsessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrapbestanden worden uitgefilterd om de subagentcontext klein te houden).

Interne hooks kunnen deze stap onderscheppen via `agent:bootstrap` om de geïnjecteerde bootstrapbestanden te muteren of te vervangen (bijvoorbeeld `SOUL.md` omwisselen voor een alternatieve persona).

Als je de agent minder generiek wilt laten klinken, begin dan met
[SOUL.md-persoonlijkheidsgids](/nl/concepts/soul).

Gebruik `/context list` of `/context detail` om te inspecteren hoeveel elk geïnjecteerd bestand bijdraagt (onbewerkt versus geïnjecteerd, afkapping, plus overhead van toolschema's). Zie [Context](/nl/concepts/context).

## Tijdafhandeling

De systeemprompt bevat een speciale sectie **Huidige datum en tijd** wanneer de tijdzone van de gebruiker bekend is. Om de prompt cache-stabiel te houden, bevat die nu alleen de **tijdzone** (geen dynamische klok of tijdnotatie).

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart bevat een tijdstempelregel. Dezelfde tool kan optioneel een modelspecifieke override per sessie instellen (`model=default` wist die).

Configureer met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Datum en tijd](/nl/date-time) voor volledige gedragsdetails.

## Skills

Wanneer geschikte Skills bestaan, injecteert OpenClaw een compacte **lijst met beschikbare Skills**
(`formatSkillsForPrompt`) die het **bestandspad** voor elke skill bevat. De prompt instrueert het model om `read` te gebruiken om de SKILL.md op de vermelde locatie te laden (workspace, beheerd of gebundeld). Als geen Skills geschikt zijn, wordt de sectie Skills weggelaten.

Geschiktheid omvat gates voor skillmetadata, runtimeomgeving-/configuratiecontroles en de effectieve toelatingslijst voor agentskills wanneer `agents.defaults.skills` of
`agents.list[].skills` is geconfigureerd.

Plugin-gebundelde Skills zijn alleen geschikt wanneer hun eigenaarsplugin is ingeschakeld. Hierdoor kunnen toolplugins diepere bedieningsgidsen beschikbaar stellen zonder al die begeleiding rechtstreeks in elke toolbeschrijving op te nemen.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dit houdt de basisprompt klein terwijl gericht gebruik van Skills toch mogelijk blijft.

Het budget voor de Skills-lijst is eigendom van het Skills-subsysteem:

- Globale standaard: `skills.limits.maxSkillsPromptChars`
- Override per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generieke begrensde fragmenten van de uitvoeringsomgeving gebruiken een ander oppervlak:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Die scheiding houdt de groottebepaling van Skills gescheiden van de groottebepaling voor lezen/injectie tijdens uitvoering, zoals `memory_get`, live toolresultaten en AGENTS.md-verversingen na Compaction.

## Documentatie

De systeemprompt bevat een sectie **Documentatie**. Wanneer lokale documentatie beschikbaar is, verwijst die naar de lokale OpenClaw-documentatiemap (`docs/` in een Git-checkout of de documentatie uit het meegeleverde npm-pakket). Als lokale documentatie niet beschikbaar is, valt die terug op [https://docs.openclaw.ai](https://docs.openclaw.ai).

Dezelfde sectie bevat ook de OpenClaw-bronlocatie. Git-checkouts stellen de lokale bronroot beschikbaar zodat de agent code rechtstreeks kan inspecteren. Pakketinstallaties bevatten de GitHub-bron-URL en vertellen de agent om daar de bron te bekijken wanneer de documentatie onvolledig of verouderd is. De prompt vermeldt ook de openbare documentatiespiegel, de community-Discord en ClawHub ([https://clawhub.ai](https://clawhub.ai)) voor het ontdekken van Skills. Die vertelt het model om eerst de documentatie te raadplegen voor OpenClaw-gedrag, -opdrachten, -configuratie of -architectuur, en om waar mogelijk zelf `openclaw status` uit te voeren (en de gebruiker alleen te vragen wanneer het geen toegang heeft). Specifiek voor configuratie verwijst die agents naar de `gateway`-toolactie `config.schema.lookup` voor exacte documentatie en beperkingen op veldniveau, en daarna naar `docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md` voor bredere richtlijnen.

## Gerelateerd

- [Agentuitvoeringsomgeving](/nl/concepts/agent)
- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Context-engine](/nl/concepts/context-engine)
