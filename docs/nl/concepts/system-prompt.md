---
read_when:
    - Systeemprompttekst, toolslijst of tijd-/Heartbeat-secties bewerken
    - Workspace-bootstrap of gedrag voor Skills-injectie wijzigen
summary: Wat de OpenClaw-systeemprompt bevat en hoe deze wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-06-27T17:30:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt een aangepaste systeemprompt voor elke agent-run. De prompt is **eigendom van OpenClaw** en gebruikt geen standaardprompt van de runtime.

De prompt wordt samengesteld door OpenClaw en geïnjecteerd in elke agent-run.

Promptassemblage heeft drie lagen:

- `buildAgentSystemPrompt` rendert de prompt vanuit expliciete invoer. Deze moet
  een pure renderer blijven en mag globale configuratie niet rechtstreeks lezen.
- `resolveAgentSystemPromptConfig` lost door configuratie gesteunde promptknoppen op, zoals
  eigenaarsweergave, TTS-hints, modelaliassen, geheugencitatiemodus en sub-agent-
  delegatiemodus voor een specifieke agent.
- Runtime-adapters (embedded, CLI, opdracht-/exportvoorbeelden, Compaction) verzamelen
  live feiten zoals tools, sandboxstatus, kanaalmogelijkheden, contextbestanden
  en providerpromptbijdragen, en roepen daarna de geconfigureerde promptfacade aan.

Dit houdt geexporteerde/debug-promptoppervlakken afgestemd op live runs zonder
elk runtime-specifiek detail in een monolithische bouwer te veranderen.

Provider-plugins kunnen cachebewuste promptrichtlijnen bijdragen zonder de
volledige prompt van OpenClaw te vervangen. De provider-runtime kan:

- een kleine set benoemde kernsecties vervangen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- een **stabiel prefix** boven de promptcachegrens injecteren
- een **dynamisch suffix** onder de promptcachegrens injecteren

Gebruik bijdragen die eigendom zijn van providers voor model-familiespecifieke afstemming. Behoud verouderde
`before_prompt_build`-promptmutatie voor compatibiliteit of echt globale promptwijzigingen,
niet voor normaal providergedrag.

De overlay voor de OpenAI GPT-5-familie houdt de kernuitvoeringsregel klein en voegt
modelspecifieke richtlijnen toe voor persona-vergrendeling, beknopte output, tooldiscipline,
parallelle opzoeking, dekking van deliverables, verificatie, ontbrekende context en
hygiene rond terminaltools.

## Structuur

De prompt is opzettelijk compact en gebruikt vaste secties:

- **Tooling**: herinnering aan structured-tools als bron van waarheid plus richtlijnen voor runtime-toolgebruik.
- **Uitvoeringsbias**: compacte richtlijnen voor doorpakken: handel binnen dezelfde beurt op
  uitvoerbare verzoeken, ga door tot het klaar is of geblokkeerd raakt, herstel van zwakke toolresultaten,
  controleer veranderlijke status live en verifieer voordat je afrondt.
- **Veiligheid**: korte herinnering aan randvoorwaarden om machtszoekend gedrag of het omzeilen van toezicht te vermijden.
- **Skills** (wanneer beschikbaar): vertelt het model hoe skill-instructies op aanvraag worden geladen.
- **OpenClaw Control**: vertelt het model de voorkeur te geven aan de `gateway`-tool voor
  configuratie-/herstartwerk en geen CLI-opdrachten te verzinnen.
- **OpenClaw Self-Update**: hoe configuratie veilig te inspecteren met
  `config.schema.lookup`, configuratie te patchen met `config.patch`, de volledige
  configuratie te vervangen met `config.apply` en `update.run` alleen uit te voeren op expliciet
  gebruikersverzoek. De agentgerichte `gateway`-tool weigert ook
  `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief verouderde `tools.bash.*`-
  aliassen die naar die beschermde exec-paden normaliseren.
- **Werkruimte**: werkdirectory (`agents.defaults.workspace`).
- **Documentatie**: lokaal pad naar OpenClaw-documentatie/bron en wanneer die te lezen.
- **Werkruimtebestanden (geinjecteerd)**: geeft aan dat bootstrapbestanden hieronder zijn opgenomen.
- **Sandbox** (wanneer ingeschakeld): geeft sandbox-runtime, sandboxpaden en of verhoogde exec beschikbaar is aan.
- **Huidige datum en tijd**: alleen tijdzone (cachestabiel; de live klok komt uit `session_status`).
- **Richtlijnen voor assistentoutput**: compacte syntaxis voor bijlagen, spraaknotities en antwoordtags.
- **Heartbeats**: Heartbeat-prompt en ack-gedrag, wanneer Heartbeats zijn ingeschakeld voor de standaardagent.
- **Runtime**: host, OS, Node, model, repo-root (wanneer gedetecteerd), denkniveau (een regel).
- **Redeneren**: huidig zichtbaarheidsniveau + hint voor /reasoning-schakelaar.

OpenClaw houdt grote stabiele inhoud, inclusief **Projectcontext**, boven de
interne promptcachegrens. Vluchtige kanaal-/sessiesecties zoals
Control UI-insluitrichtlijnen, **Berichten**, **Spraak**, **Groepschatcontext**,
**Reacties**, **Heartbeats** en **Runtime** worden onder die grens toegevoegd
zodat lokale backends met prefixcaches het stabiele werkruimteprefix kunnen hergebruiken
over kanaalbeurten heen. Toolbeschrijvingen moeten eveneens vermijden om huidige
kanaalnamen in te sluiten wanneer het geaccepteerde schema dat runtime-detail al bevat.

De sectie Tooling bevat ook runtimerichtlijnen voor langlopend werk:

- gebruik Cron voor toekomstige opvolging (`check back later`, herinneringen, terugkerend werk)
  in plaats van `exec`-slaaplussen, `yieldMs`-vertragingstrucs of herhaalde `process`-
  polling
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond
  blijven draaien
- wanneer automatisch wakker worden bij voltooiing is ingeschakeld, start de opdracht eenmaal en vertrouw op
  het push-gebaseerde wake-pad wanneer deze output uitzendt of faalt
- gebruik `process` voor logs, status, invoer of interventie wanneer je een lopende
  opdracht moet inspecteren
- als de taak groter is, geef dan de voorkeur aan `sessions_spawn`; voltooiing van sub-agents is
  push-gebaseerd en kondigt automatisch terug aan de aanvrager aan
- poll `subagents list` / `sessions_list` niet in een lus alleen om op
  voltooiing te wachten

`agents.defaults.subagents.delegationMode` kan deze richtlijnen versterken. De
standaardmodus `suggest` behoudt de basisnudge. `prefer` voegt een toegewezen
sectie **Sub-agentdelegatie** toe die de hoofdagent vertelt op te treden als een responsieve
coordinator en alles wat meer omvat dan een direct antwoord via
`sessions_spawn` te pushen. Dit is alleen prompt; toolbeleid bepaalt nog steeds of
`sessions_spawn` beschikbaar is.

Wanneer de experimentele tool `update_plan` is ingeschakeld, vertelt Tooling het
model ook deze alleen te gebruiken voor niet-triviaal meerstapswerk, precies een
`in_progress`-stap te behouden en te vermijden het hele plan na elke update te herhalen.

Veiligheidsrandvoorwaarden in de systeemprompt zijn adviserend. Ze sturen modelgedrag maar dwingen geen beleid af. Gebruik toolbeleid, exec-goedkeuringen, sandboxing en kanaalallowlists voor harde handhaving; operators kunnen deze opzettelijk uitschakelen.

Op kanalen met native goedkeuringskaarten/-knoppen vertelt de runtimeprompt de
agent nu eerst op die native goedkeurings-UI te vertrouwen. Deze moet alleen een handmatige
`/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of
handmatige goedkeuring het enige pad is.

## Promptmodi

OpenClaw kan kleinere systeemprompts renderen voor sub-agents. De runtime stelt een
`promptMode` in voor elke run (geen gebruikersgerichte configuratie):

- `full` (standaard): bevat alle bovenstaande secties.
- `minimal`: gebruikt voor sub-agents; laat **Geheugenherinnering**, **OpenClaw
  Self-Update**, **Modelaliassen**, **Gebruikersidentiteit**, **Richtlijnen voor assistentoutput**,
  **Berichten**, **Stille antwoorden** en **Heartbeats** weg. Tooling, **Veiligheid**,
  **Skills** wanneer meegegeven, Werkruimte, Sandbox, Huidige datum en tijd (wanneer
  bekend), Runtime en geinjecteerde context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Wanneer `promptMode=minimal` is, krijgen extra geinjecteerde prompts het label **Subagent-
context** in plaats van **Groepschatcontext**.

Voor automatische kanaalantwoordruns laat OpenClaw de generieke sectie **Stille antwoorden**
weg wanneer directe, groeps- of alleen-message-toolcontext eigenaar is van het zichtbare-antwoord-
contract. Alleen oude automatische groeps-/kanaalmodus moet `NO_REPLY` tonen; directe
chats en alleen-message-toolantwoorden krijgen geen richtlijnen voor stille tokens.

## Promptsnapshots

OpenClaw bewaart gecommitte promptsnapshots voor het happy path van de Codex-runtime onder
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ze renderen
geselecteerde app-server thread-/turn-parameters plus een gereconstrueerde modelgebonden prompt-
lagenstack voor directe Telegram-, Discord-groeps- en Heartbeat-beurten. Die stack
bevat een vastgezette Codex `gpt-5.5`-modelpromptfixture die is gegenereerd vanuit de
modelcatalogus-/cachevorm van Codex, de Codex happy-path permissie-developertekst,
OpenClaw-developerinstructies, beurtgebonden instructies voor samenwerkingsmodus
wanneer OpenClaw die levert, gebruikersinvoer voor de beurt en verwijzingen naar de dynamische tool-
specificaties.

Ververs de vastgezette Codex-modelpromptfixture met
`pnpm prompt:snapshots:sync-codex-model`. Standaard zoekt het script naar
de runtimecache van Codex op `$CODEX_HOME/models_cache.json`, daarna
`~/.codex/models_cache.json`, en valt pas daarna terug op de conventie voor de Codex-
checkout van maintainers op `~/code/codex/codex-rs/models-manager/models.json`. Als
geen van die bronnen bestaat, sluit de opdracht af zonder de gecommitte fixture te wijzigen.
Geef `--catalog <path>` door om te verversen vanuit een specifiek `models_cache.json`-
of `models.json`-bestand.

Deze snapshots zijn nog steeds geen byte-voor-byte ruwe OpenAI-requestcapture. Codex
kan runtime-eigen werkruimtecontext toevoegen, zoals `AGENTS.md`, omgevingscontext,
herinneringen, app-/plugininstructies en ingebouwde standaardinstructies voor
samenwerkingsmodus binnen de Codex-runtime nadat OpenClaw thread- en turn-parameters verzendt.

Genereer ze opnieuw met `pnpm prompt:snapshots:gen` en verifieer drift met
`pnpm prompt:snapshots:check`. CI voert de driftcontrole uit in de aanvullende
boundary-shard zodat promptwijzigingen en snapshotupdates aan dezelfde PR gekoppeld blijven.

## Injectie van werkruimtebootstrap

Bootstrapbestanden worden opgelost vanuit de actieve werkruimte en daarna gerouteerd naar het
promptoppervlak dat overeenkomt met hun levensduur:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen op gloednieuwe werkruimten)
- `MEMORY.md` wanneer aanwezig

Op de native Codex-harness vermijdt OpenClaw het herhalen van stabiele werkruimtebestanden
in elke gebruikersbeurt. Codex laadt `AGENTS.md` via zijn eigen projectdocument-
ontdekking. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` en `USER.md` worden doorgestuurd als
Codex-developerinstructies. De compacte OpenClaw Skills-lijst wordt ook doorgestuurd
als beurtgebonden samenwerking-developerinstructies. `HEARTBEAT.md`-inhoud wordt
niet geinjecteerd; Heartbeat-beurten krijgen een notitie voor samenwerkingsmodus die naar het bestand verwijst
wanneer het bestaat en niet leeg is. `MEMORY.md`-inhoud uit de geconfigureerde agent-
werkruimte wordt niet in elke native Codex-beurt geplakt; wanneer geheugentools
beschikbaar zijn voor die werkruimte, krijgen Codex-beurten een kleine werkruimtegeheugen-notitie in
beurtgebonden samenwerking-developerinstructies en moeten ze `memory_search`
of `memory_get` gebruiken wanneer duurzaam geheugen relevant is. Als tools zijn uitgeschakeld, geheugen-
zoekopdracht niet beschikbaar is of de actieve werkruimte verschilt van de agentgeheugen-
werkruimte, valt `MEMORY.md` terug op het normale begrensde turn-contextpad. Actieve
`BOOTSTRAP.md`-inhoud behoudt voorlopig de normale turn-contextrol.

Op niet-Codex-harnassen blijven bootstrapbestanden in de
OpenClaw-prompt worden samengesteld volgens hun bestaande gates. `HEARTBEAT.md` wordt weggelaten bij
normale runs wanneer Heartbeats zijn uitgeschakeld voor de standaardagent of
`agents.defaults.heartbeat.includeSystemPromptSection` false is. Houd geinjecteerde
bestanden beknopt, vooral niet-Codex `MEMORY.md`. `MEMORY.md` is bedoeld om een
gecureerde langetermijnsamenvatting te blijven; gedetailleerde dagelijkse notities horen thuis in
`memory/*.md`, waar `memory_search` en `memory_get` ze op aanvraag kunnen ophalen. Te grote
niet-Codex `MEMORY.md`-bestanden verhogen promptgebruik en kunnen gedeeltelijk worden geinjecteerd
vanwege de onderstaande limieten voor bootstrapbestanden.

<Note>
Dagelijkse `memory/*.md`-bestanden zijn **geen** onderdeel van de normale Projectcontext voor bootstrap. Bij gewone beurten worden ze op aanvraag benaderd via de tools `memory_search` en `memory_get`, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale `/new`- en `/reset`-beurten vormen de uitzondering: de runtime kan recent dagelijks geheugen vooraf toevoegen als een eenmalig startup-contextblok voor die eerste beurt.
</Note>

Grote bestanden worden afgekapt met een markering. De maximale grootte per bestand wordt bepaald door
`agents.defaults.bootstrapMaxChars` (standaard: 20000). De totale geïnjecteerde bootstrap-
inhoud over bestanden heen is begrensd door `agents.defaults.bootstrapTotalMaxChars`
(standaard: 60000). Ontbrekende bestanden injecteren een korte markering voor een ontbrekend bestand. Wanneer afkapping
plaatsvindt, kan OpenClaw een beknopte waarschuwing in de systeemprompt injecteren; beheer dit met
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
standaard: `always`). Gedetailleerde ruwe/geïnjecteerde aantallen blijven beschikbaar in diagnostiek zoals
`/context`, `/status`, doctor en logs.

Voor geheugenbestanden is afkapping geen gegevensverlies: het bestand blijft intact op schijf.
In native Codex wordt `MEMORY.md` op aanvraag gelezen via geheugentools wanneer
beschikbaar, met een begrensde prompt-fallback wanneer tools niet kunnen worden uitgevoerd. In andere
harnassen ziet het model alleen de verkorte geïnjecteerde kopie totdat het geheugen rechtstreeks leest of
doorzoekt. Als `MEMORY.md` daar herhaaldelijk wordt afgekapt, destilleer
het dan tot een kortere duurzame samenvatting en verplaats gedetailleerde geschiedenis naar `memory/*.md`,
of verhoog bewust de bootstraplimieten.

Sub-agentsessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrapbestanden
worden eruit gefilterd om de context van de sub-agent klein te houden).

Interne hooks kunnen deze stap onderscheppen via `agent:bootstrap` om de
geïnjecteerde bootstrapbestanden te wijzigen of te vervangen (bijvoorbeeld `SOUL.md` omwisselen voor een alternatieve persona).

Als je de agent minder generiek wilt laten klinken, begin dan met
[SOUL.md persoonlijkheidsgids](/nl/concepts/soul).

Gebruik `/context list` of `/context detail` om te inspecteren hoeveel elk geïnjecteerd bestand bijdraagt (ruw versus geïnjecteerd, afkapping, plus overhead van toolschema's). Zie [Context](/nl/concepts/context).

## Tijdafhandeling

De systeemprompt bevat een speciale sectie **Huidige datum en tijd** wanneer de
tijdzone van de gebruiker bekend is. Om de prompt cache-stabiel te houden, bevat deze nu alleen
de **tijdzone** (geen dynamische klok of tijdnotatie).

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart
bevat een regel met een tijdstempel. Dezelfde tool kan optioneel een modelspecifieke override per sessie instellen
(`model=default` wist deze).

Configureer met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Datum en tijd](/nl/date-time) voor volledige gedragsdetails.

## Skills

Wanneer geschikte Skills bestaan, injecteert OpenClaw een compacte **lijst met beschikbare Skills**
(`formatSkillsForPrompt`) die het **bestandspad** en de uit inhoud afgeleide
`<version>`-markering voor elke Skill bevat. De prompt instrueert het model om `read`
te gebruiken om de SKILL.md op de vermelde locatie te laden (werkruimte, beheerd of gebundeld),
en om een Skill opnieuw te lezen wanneer de `<version>` verschilt van een vorige beurt. Als er geen
Skills geschikt zijn, wordt de sectie Skills weggelaten.

Native Codex-beurten ontvangen deze lijst als beurtafgebakende ontwikkelaarsinstructies voor samenwerking
in plaats van gebruikersinvoer per beurt, behalve lichte Cron-beurten die
de exacte geplande prompt behouden. Andere harnassen behouden de normale promptsectie.

De locatie kan verwijzen naar een geneste Skill, zoals
`skills/personal/foo/SKILL.md`. Nesten is alleen organisatorisch; de prompt gebruikt nog steeds
de platte Skill-naam uit de frontmatter van `SKILL.md`.

Geschiktheid omvat gates voor Skill-metadata, controles van runtimeomgeving/configuratie,
en de effectieve allowlist voor agent-Skills wanneer `agents.defaults.skills` of
`agents.list[].skills` is geconfigureerd.

Door Plugins gebundelde Skills zijn alleen geschikt wanneer hun eigenaar-Plugin is ingeschakeld.
Zo kunnen tool-Plugins diepere bedieningsgidsen aanbieden zonder al die
richtlijnen rechtstreeks in elke toolbeschrijving in te bedden.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
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

Die scheiding houdt de dimensionering van Skills gescheiden van de dimensionering voor runtime-lezen/injectie, zoals
`memory_get`, live toolresultaten en AGENTS.md-vernieuwingen na Compaction.

## Documentatie

De systeemprompt bevat een sectie **Documentatie**. Wanneer lokale docs beschikbaar zijn, wijst deze
naar de lokale OpenClaw-docsmap (`docs/` in een Git-checkout of de gebundelde npm-
pakketdocs). Als lokale docs niet beschikbaar zijn, valt deze terug op
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Dezelfde sectie bevat ook de bronlocatie van OpenClaw. Git-checkouts stellen de lokale
bronroot beschikbaar zodat de agent code rechtstreeks kan inspecteren. Pakketinstallaties bevatten de GitHub-
bron-URL en vertellen de agent de bron daar te beoordelen wanneer de docs onvolledig of
verouderd zijn. De prompt vermeldt ook de openbare docs-mirror, community-Discord en ClawHub
([https://clawhub.ai](https://clawhub.ai)) voor het ontdekken van Skills. Deze positioneert docs als de
autoriteit voor OpenClaw-zelfkennis voordat het model begrijpt hoe OpenClaw werkt,
inclusief geheugen/dagelijkse notities, sessies, tools, Gateway, configuratie, opdrachten of project-
context. De prompt vertelt het model eerst lokale docs te gebruiken (of de docs-mirror wanneer lokale docs
niet beschikbaar zijn), en AGENTS.md, projectcontext, werkruimte-/profiel-/geheugennotities
en `memory_search` te behandelen als instructiecontext of gebruikersgeheugen in plaats van OpenClaw-
ontwerp- of implementatiekennis. Als docs zwijgen of verouderd zijn, moet het model dat zeggen
en de bron inspecteren. De prompt vertelt het model ook om waar mogelijk zelf `openclaw status` uit te voeren,
en de gebruiker alleen te vragen wanneer het geen toegang heeft.
Specifiek voor configuratie wijst deze agents naar de `gateway`-toolactie
`config.schema.lookup` voor exacte docs en beperkingen op veldniveau, en daarna naar
`docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md`
voor bredere richtlijnen.

## Gerelateerd

- [Agentruntime](/nl/concepts/agent)
- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Contextengine](/nl/concepts/context-engine)
