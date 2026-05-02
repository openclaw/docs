---
read_when:
    - Tekst van de systeemprompt, lijst met tools of tijd-/Heartbeat-secties bewerken
    - Opstartinitialisatie van de werkruimte of injectiegedrag voor Skills wijzigen
summary: Wat de systeemprompt van OpenClaw bevat en hoe deze wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-05-02T22:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt een aangepaste systeemprompt voor elke agent-run. De prompt is **eigendom van OpenClaw** en gebruikt niet de standaardprompt van pi-coding-agent.

De prompt wordt samengesteld door OpenClaw en in elke agent-run geinjecteerd.

Providerplugins kunnen cachebewuste promptbegeleiding bijdragen zonder de volledige prompt die eigendom is van OpenClaw te vervangen. De provider-runtime kan:

- een kleine set benoemde kernsecties vervangen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- een **stabiele prefix** boven de prompt-cachegrens injecteren
- een **dynamische suffix** onder de prompt-cachegrens injecteren

Gebruik provider-eigen bijdragen voor model-familiespecifieke afstemming. Bewaar legacy
`before_prompt_build`-promptmutatie voor compatibiliteit of werkelijk globale promptwijzigingen, niet voor normaal providergedrag.

De OpenAI GPT-5-familie-overlay houdt de kernuitvoeringsregel klein en voegt modelspecifieke begeleiding toe voor persona-latching, beknopte uitvoer, tooldiscipline, parallelle opzoeking, dekking van deliverables, verificatie, ontbrekende context en hygiene voor terminaltools.

## Structuur

De prompt is bewust compact en gebruikt vaste secties:

- **Tooling**: herinnering aan de bron van waarheid voor gestructureerde tools plus runtimebegeleiding voor toolgebruik.
- **Uitvoeringsbias**: compacte follow-throughbegeleiding: handel binnen de beurt op
  uitvoerbare verzoeken, ga door tot het klaar is of geblokkeerd raakt, herstel van zwakke toolresultaten, controleer veranderlijke status live en verifieer voordat je afrondt.
- **Veiligheid**: korte guardrailherinnering om machtszoekend gedrag of het omzeilen van toezicht te vermijden.
- **Skills** (wanneer beschikbaar): vertelt het model hoe het skill-instructies op aanvraag laadt.
- **OpenClaw Self-Update**: hoe je configuratie veilig inspecteert met
  `config.schema.lookup`, configuratie patcht met `config.patch`, de volledige
  configuratie vervangt met `config.apply`, en `update.run` alleen uitvoert op expliciet gebruikersverzoek. De owner-only `gateway`-tool weigert ook
  `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief legacy `tools.bash.*`-aliassen die normaliseren naar die beschermde exec-paden.
- **Workspace**: werkdirectory (`agents.defaults.workspace`).
- **Documentatie**: lokaal pad naar OpenClaw-documentatie (repo of npm-pakket) en wanneer die moet worden gelezen.
- **Workspacebestanden (geinjecteerd)**: geeft aan dat bootstrapbestanden hieronder zijn opgenomen.
- **Sandbox** (wanneer ingeschakeld): geeft sandboxed runtime, sandboxpaden en of verhoogde exec beschikbaar is aan.
- **Huidige datum en tijd**: lokale tijd van de gebruiker, tijdzone en tijdnotatie.
- **Antwoordtags**: optionele syntaxis voor antwoordtags voor ondersteunde providers.
- **Heartbeats**: Heartbeat-prompt en ack-gedrag, wanneer Heartbeats zijn ingeschakeld voor de standaardagent.
- **Runtime**: host, OS, Node, model, repo-root (wanneer gedetecteerd), denkniveau (een regel).
- **Redenering**: huidig zichtbaarheidsniveau + hint voor de /reasoning-toggle.

OpenClaw houdt grote stabiele inhoud, inclusief **Projectcontext**, boven de interne prompt-cachegrens. Vluchtige kanaal-/sessiesecties zoals Control UI-insluitbegeleiding, **Berichten**, **Spraak**, **Groepschatcontext**, **Reacties**, **Heartbeats** en **Runtime** worden onder die grens toegevoegd, zodat lokale backends met prefixcaches de stabiele workspace-prefix opnieuw kunnen gebruiken over kanaalbeurten heen. Toolbeschrijvingen moeten eveneens vermijden om huidige kanaalnamen in te bedden wanneer het geaccepteerde schema dat runtimedetail al bevat.

De Tooling-sectie bevat ook runtimebegeleiding voor langdurig werk:

- gebruik Cron voor toekomstige follow-up (`check back later`, herinneringen, terugkerend werk)
  in plaats van `exec`-slaaplussen, `yieldMs`-vertragingstrucs of herhaalde `process`-polling
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond blijven draaien
- wanneer automatisch voltooien-wekken is ingeschakeld, start je de opdracht eenmaal en vertrouw je op het push-gebaseerde wekpad wanneer het uitvoer produceert of faalt
- gebruik `process` voor logs, status, invoer of interventie wanneer je een draaiende opdracht moet inspecteren
- als de taak groter is, geef dan de voorkeur aan `sessions_spawn`; voltooiing van subagenten is push-gebaseerd en wordt automatisch terug aangekondigd aan de verzoeker
- poll `subagents list` / `sessions_list` niet in een lus alleen om op voltooiing te wachten

Wanneer de experimentele `update_plan`-tool is ingeschakeld, vertelt Tooling het model ook om die alleen te gebruiken voor niet-triviaal meerstapswerk, precies een `in_progress`-stap aan te houden en te voorkomen dat het volledige plan na elke update wordt herhaald.

Veiligheids-guardrails in de systeemprompt zijn adviserend. Ze sturen modelgedrag maar dwingen geen beleid af. Gebruik toolbeleid, exec-goedkeuringen, sandboxing en kanaal-allowlists voor harde handhaving; operators kunnen deze bewust uitschakelen.

Op kanalen met native goedkeuringskaarten/-knoppen vertelt de runtimeprompt de agent nu eerst op die native goedkeurings-UI te vertrouwen. Die moet alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring de enige route is.

## Promptmodi

OpenClaw kan kleinere systeemprompts renderen voor subagenten. De runtime stelt een
`promptMode` in voor elke run (geen gebruikersgerichte configuratie):

- `full` (standaard): bevat alle bovenstaande secties.
- `minimal`: gebruikt voor subagenten; laat **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** en **Heartbeats** weg. Tooling, **Veiligheid**,
  Workspace, Sandbox, Huidige datum en tijd (wanneer bekend), Runtime en geinjecteerde context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Wanneer `promptMode=minimal` is, worden extra geinjecteerde prompts gelabeld als **Subagentcontext** in plaats van **Groepschatcontext**.

Voor kanaal-auto-reply-runs kan OpenClaw de generieke sectie **Silent Replies** weglaten wanneer de directe/groepschatcontext het opgeloste gespreksspecifieke `NO_REPLY`-gedrag al bevat. Dit voorkomt dat tokenmechanica zowel in de globale systeemprompt als in de kanaalcontext wordt herhaald.

## Prompt-snapshots

OpenClaw bewaart gecommitte happy-path-prompt-snapshots voor de Codex/message-tool-runtime onder `test/fixtures/agents/prompt-snapshots/happy-path/`. Ze renderen geselecteerde app-server-thread-/turn-parameters plus een gereconstrueerde modelgebonden promptlaagstack voor Telegram direct, Discord-groep en Heartbeat-beurten. Die stack bevat een gepinde Codex `gpt-5.5`-modelpromptfixture die is gegenereerd uit de vorm van Codex' modelcatalogus/cache, de Codex happy-path permission developer-tekst, OpenClaw-developerinstructies, invoer van de gebruikersbeurt en verwijzingen naar de dynamische toolspecificaties.

Ververs de gepinde Codex-modelpromptfixture met
`pnpm prompt:snapshots:sync-codex-model`. Standaard zoekt het script naar Codex' runtimecache op `$CODEX_HOME/models_cache.json`, daarna
`~/.codex/models_cache.json`, en valt pas daarna terug op de maintainer-Codex-checkoutconventie op `~/code/codex/codex-rs/models-manager/models.json`. Als geen van die bronnen bestaat, sluit de opdracht af zonder de gecommitte fixture te wijzigen. Geef `--catalog <path>` door om te verversen vanuit een specifiek `models_cache.json`- of `models.json`-bestand.

Deze snapshots zijn nog steeds geen byte-voor-byte ruwe OpenAI-requestcapture. Codex kan runtime-eigen workspacecontext toevoegen, zoals `AGENTS.md`, omgevingscontext, herinneringen, app-/Plugin-instructies en toekomstige instructies voor samenwerkingsmodus binnen de Codex-runtime nadat OpenClaw thread- en turn-parameters verzendt.

Genereer ze opnieuw met `pnpm prompt:snapshots:gen` en verifieer drift met
`pnpm prompt:snapshots:check`. CI voert de driftcheck uit in de aanvullende boundary-shard, zodat promptwijzigingen en snapshotupdates aan dezelfde PR gekoppeld blijven.

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

Al deze bestanden worden **in het contextvenster geinjecteerd** bij elke beurt, tenzij een bestandsspecifieke gate van toepassing is. `HEARTBEAT.md` wordt bij normale runs weggelaten wanneer Heartbeats zijn uitgeschakeld voor de standaardagent of
`agents.defaults.heartbeat.includeSystemPromptSection` false is. Houd geinjecteerde bestanden beknopt, vooral `MEMORY.md`, dat in de loop van de tijd kan groeien en kan leiden tot onverwacht hoog contextgebruik en frequentere Compaction.

<Note>
Dagelijkse bestanden in `memory/*.md` maken **geen** deel uit van de normale bootstrap Projectcontext. Bij gewone beurten worden ze op aanvraag benaderd via de tools `memory_search` en `memory_get`, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale `/new`- en `/reset`-beurten zijn de uitzondering: de runtime kan recente dagelijkse herinnering voor die eerste beurt vooraf toevoegen als een eenmalig startup-contextblok.
</Note>

Grote bestanden worden afgekapt met een markering. De maximale grootte per bestand wordt beheerd door
`agents.defaults.bootstrapMaxChars` (standaard: 12000). De totale geinjecteerde bootstrapinhoud over bestanden heen is begrensd door `agents.defaults.bootstrapTotalMaxChars`
(standaard: 60000). Ontbrekende bestanden injecteren een korte markering voor ontbrekend bestand. Wanneer afkapping optreedt, kan OpenClaw een waarschuwingsblok in Projectcontext injecteren; beheer dit met
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
standaard: `once`).

Subagentsessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrapbestanden worden uitgefilterd om de subagentcontext klein te houden).

Interne hooks kunnen deze stap onderscheppen via `agent:bootstrap` om de geinjecteerde bootstrapbestanden te muteren of te vervangen (bijvoorbeeld `SOUL.md` vervangen door een alternatieve persona).

Als je de agent minder generiek wilt laten klinken, begin dan met
[SOUL.md-persoonlijkheidsgids](/nl/concepts/soul).

Gebruik `/context list` of `/context detail` om te inspecteren hoeveel elk geinjecteerd bestand bijdraagt (ruw versus geinjecteerd, afkapping, plus overhead van toolschema's). Zie [Context](/nl/concepts/context).

## Tijdsafhandeling

De systeemprompt bevat een speciale sectie **Huidige datum en tijd** wanneer de gebruikerstijdzone bekend is. Om de prompt cache-stabiel te houden, bevat die nu alleen de **tijdzone** (geen dynamische klok of tijdnotatie).

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart bevat een tijdstempelregel. Dezelfde tool kan optioneel een modelspecifieke override per sessie instellen (`model=default` wist die).

Configureer met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Datum en tijd](/nl/date-time) voor volledige gedragsdetails.

## Skills

Wanneer geschikte Skills bestaan, injecteert OpenClaw een compacte **lijst met beschikbare Skills**
(`formatSkillsForPrompt`) die het **bestandspad** voor elke skill bevat. De prompt instrueert het model om `read` te gebruiken om de SKILL.md op de vermelde locatie te laden (workspace, beheerd of gebundeld). Als er geen Skills geschikt zijn, wordt de sectie Skills weggelaten.

Geschiktheid omvat gates voor skillmetadata, runtime-omgeving/configuratiecontroles en de effectieve allowlist voor agentskills wanneer `agents.defaults.skills` of
`agents.list[].skills` is geconfigureerd.

Door Plugin gebundelde Skills zijn alleen geschikt wanneer hun eigenaar-Plugin is ingeschakeld. Dit laat toolplugins diepere operationele gidsen aanbieden zonder al die begeleiding rechtstreeks in elke toolbeschrijving in te bedden.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dit houdt de basisprompt klein terwijl gericht gebruik van Skills nog steeds mogelijk blijft.

Het budget voor de Skills-lijst is eigendom van het Skills-subsysteem:

- Globale standaard: `skills.limits.maxSkillsPromptChars`
- Override per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generieke begrensde runtimefragmenten gebruiken een ander oppervlak:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Die splitsing houdt de groottebepaling van Skills gescheiden van runtime-lees-/injectiegroottebepaling zoals
`memory_get`, live toolresultaten en post-Compaction-verversingen van AGENTS.md.

## Documentatie

De systeemprompt bevat een sectie **Documentatie**. Wanneer lokale documentatie beschikbaar is, verwijst deze naar de lokale OpenClaw-documentatiemap (`docs/` in een Git-checkout of de meegeleverde npm-pakketdocumentatie). Als lokale documentatie niet beschikbaar is, valt deze terug op [https://docs.openclaw.ai](https://docs.openclaw.ai).

Dezelfde sectie bevat ook de OpenClaw-bronlocatie. Git-checkouts geven de lokale bronhoofdmap weer, zodat de agent de code direct kan inspecteren. Pakketinstallaties bevatten de GitHub-bron-URL en instrueren de agent om de bron daar te bekijken wanneer de documentatie onvolledig of verouderd is. De prompt vermeldt ook de openbare documentatiespiegel, de community-Discord en ClawHub ([https://clawhub.ai](https://clawhub.ai)) voor Skills-ontdekking. Deze vertelt het model om eerst de documentatie te raadplegen voor OpenClaw-gedrag, -commando’s, -configuratie of -architectuur, en om waar mogelijk zelf `openclaw status` uit te voeren (en de gebruiker alleen te vragen wanneer het geen toegang heeft). Specifiek voor configuratie verwijst deze agents naar de `gateway`-toolactie `config.schema.lookup` voor exacte documentatie en beperkingen op veldniveau, en vervolgens naar `docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md` voor bredere richtlijnen.

## Gerelateerd

- [Agent-runtime](/nl/concepts/agent)
- [Agent-werkruimte](/nl/concepts/agent-workspace)
- [Context-engine](/nl/concepts/context-engine)
