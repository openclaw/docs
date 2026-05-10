---
read_when:
    - Systeemprompttekst, lijst met tools of tijd-/Heartbeat-secties bewerken
    - Gedrag voor werkruimte-initialisatie of Skills-injectie wijzigen
summary: Wat de OpenClaw-systeemprompt bevat en hoe deze wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-05-10T19:33:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt een aangepaste systeemprompt voor elke agentuitvoering. De prompt is **eigendom van OpenClaw** en gebruikt niet de standaardprompt van pi-coding-agent.

De prompt wordt samengesteld door OpenClaw en in elke agentuitvoering geïnjecteerd.

Promptassemblage heeft drie lagen:

- `buildAgentSystemPrompt` rendert de prompt op basis van expliciete invoer. Deze moet
  een pure renderer blijven en mag globale configuratie niet direct lezen.
- `resolveAgentSystemPromptConfig` lost configuratiegestuurde promptinstellingen op, zoals
  weergave van eigenaar, TTS-hints, modelaliassen, geheugencitatiemodus en
  sub-agentdelegatiemodus voor een specifieke agent.
- Runtime-adapters (embedded, CLI, opdracht-/exportvoorbeelden, Compaction) verzamelen
  live feiten zoals tools, sandboxstatus, kanaalmogelijkheden, contextbestanden
  en providerpromptbijdragen, en roepen daarna de geconfigureerde promptfacade aan.

Zo blijven geëxporteerde/debugprompt-oppervlakken afgestemd op live-uitvoeringen zonder
elk runtime-specifiek detail in één monolithische builder te veranderen.

Providerplugins kunnen cachebewuste promptrichtlijnen bijdragen zonder
de volledige OpenClaw-prompt te vervangen. De providerruntime kan:

- een kleine set benoemde kernsecties vervangen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- een **stabiel prefix** boven de promptcachegrens injecteren
- een **dynamisch suffix** onder de promptcachegrens injecteren

Gebruik bijdragen die eigendom zijn van de provider voor model-familiespecifieke afstemming. Behoud legacy
`before_prompt_build`-promptmutatie voor compatibiliteit of werkelijk globale promptwijzigingen,
niet voor normaal providergedrag.

De overlay voor de OpenAI GPT-5-familie houdt de kernregel voor uitvoering klein en voegt
modelspecifieke richtlijnen toe voor persona-vergrendeling, beknopte uitvoer, tooldiscipline,
parallelle opzoeking, dekking van deliverables, verificatie, ontbrekende context en
hygiëne rond terminaltools.

## Structuur

De prompt is bewust compact en gebruikt vaste secties:

- **Tooling**: herinnering aan structured-tool als bron van waarheid plus runtime-richtlijnen voor toolgebruik.
- **Uitvoeringsbias**: compacte richtlijnen voor opvolging: handel binnen de beurt bij
  uitvoerbare verzoeken, ga door tot het klaar is of geblokkeerd raakt, herstel van zwakke toolresultaten,
  controleer veranderlijke status live en verifieer voordat je afrondt.
- **Veiligheid**: korte guardrailherinnering om machtszoekend gedrag of het omzeilen van toezicht te vermijden.
- **Skills** (wanneer beschikbaar): vertelt het model hoe het skill-instructies op aanvraag laadt.
- **OpenClaw-besturing**: vertelt het model de voorkeur te geven aan de `gateway`-tool voor
  configuratie-/herstartwerk en geen CLI-opdrachten te verzinnen.
- **OpenClaw-zelfupdate**: hoe configuratie veilig te inspecteren met
  `config.schema.lookup`, configuratie te patchen met `config.patch`, de volledige
  configuratie te vervangen met `config.apply`, en `update.run` alleen uit te voeren op expliciet
  gebruikersverzoek. De owner-only `gateway`-tool weigert ook
  `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief legacy `tools.bash.*`-
  aliassen die normaliseren naar die beschermde exec-paden.
- **Werkruimte**: werkdirectory (`agents.defaults.workspace`).
- **Documentatie**: lokaal pad naar OpenClaw docs/source en wanneer die te lezen.
- **Werkruimtebestanden (geïnjecteerd)**: geeft aan dat bootstrapbestanden hieronder zijn opgenomen.
- **Sandbox** (wanneer ingeschakeld): geeft sandboxed runtime, sandboxpaden en of verhoogde exec beschikbaar is aan.
- **Huidige datum en tijd**: alleen tijdzone (cache-stabiel; de live klok komt uit `session_status`).
- **Richtlijnen voor assistentuitvoer**: compacte syntaxis voor bijlagen, spraaknotities en reply-tags.
- **Heartbeats**: Heartbeat-prompt en ack-gedrag, wanneer Heartbeats zijn ingeschakeld voor de standaardagent.
- **Runtime**: host, besturingssysteem, Node, model, repo-root (wanneer gedetecteerd), denkniveau (één regel).
- **Redenering**: huidig zichtbaarheidsniveau + hint voor /reasoning-toggle.

OpenClaw houdt grote stabiele inhoud, inclusief **Projectcontext**, boven de
interne promptcachegrens. Vluchtige kanaal-/sessiesecties zoals
Control-UI-insluitingsrichtlijnen, **Berichten**, **Spraak**, **Groepschatcontext**,
**Reacties**, **Heartbeats** en **Runtime** worden onder die grens toegevoegd,
zodat lokale backends met prefixcaches het stabiele werkruimteprefix
over kanaalbeurten heen kunnen hergebruiken. Toolbeschrijvingen moeten eveneens vermijden om huidige
kanaalnamen in te sluiten wanneer het geaccepteerde schema dat runtimedetail al bevat.

De Tooling-sectie bevat ook runtime-richtlijnen voor langlopend werk:

- gebruik Cron voor toekomstige opvolging (`check back later`, herinneringen, terugkerend werk)
  in plaats van `exec`-slaaplussen, `yieldMs`-vertragingstrucs of herhaalde `process`-
  polling
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond
  blijven draaien
- wanneer automatisch wakker worden bij voltooiing is ingeschakeld, start je de opdracht één keer en vertrouw je op
  het push-gebaseerde wake-pad wanneer het uitvoer produceert of faalt
- gebruik `process` voor logs, status, invoer of interventie wanneer je een lopende opdracht
  moet inspecteren
- als de taak groter is, geef de voorkeur aan `sessions_spawn`; voltooiing van sub-agents is
  push-gebaseerd en wordt automatisch terug aangekondigd aan de aanvrager
- poll `subagents list` / `sessions_list` niet in een lus alleen om op
  voltooiing te wachten

`agents.defaults.subagents.delegationMode` kan deze richtlijnen versterken. De
standaardmodus `suggest` behoudt de basisaansporing. `prefer` voegt een speciale
sectie **Sub-agentdelegatie** toe die de hoofdagent vertelt op te treden als een responsieve
coördinator en alles wat omvangrijker is dan een direct antwoord via
`sessions_spawn` te sturen. Dit is alleen promptgedrag; toolbeleid bepaalt nog steeds of
`sessions_spawn` beschikbaar is.

Wanneer de experimentele tool `update_plan` is ingeschakeld, vertelt Tooling het
model ook deze alleen te gebruiken voor niet-triviaal meerstapswerk, precies één
`in_progress`-stap te behouden en te voorkomen dat het volledige plan na elke update wordt herhaald.

Veiligheids-guardrails in de systeemprompt zijn adviserend. Ze sturen modelgedrag maar dwingen geen beleid af. Gebruik toolbeleid, exec-goedkeuringen, sandboxing en kanaal-allowlists voor harde afdwinging; operators kunnen deze bewust uitschakelen.

Op kanalen met native goedkeuringskaarten/-knoppen vertelt de runtimeprompt de
agent nu eerst te vertrouwen op die native goedkeurings-UI. De agent moet alleen een handmatige
`/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of
handmatige goedkeuring het enige pad is.

## Promptmodi

OpenClaw kan kleinere systeemprompts renderen voor sub-agents. De runtime stelt een
`promptMode` in voor elke uitvoering (geen gebruikersgerichte configuratie):

- `full` (standaard): bevat alle bovenstaande secties.
- `minimal`: gebruikt voor sub-agents; laat **Geheugenherinnering**, **OpenClaw
  zelfupdate**, **Modelaliassen**, **Gebruikersidentiteit**, **Richtlijnen voor assistentuitvoer**,
  **Berichten**, **Stille antwoorden** en **Heartbeats** weg. Tooling, **Veiligheid**,
  **Skills** wanneer meegeleverd, Werkruimte, Sandbox, Huidige datum en tijd (wanneer
  bekend), Runtime en geïnjecteerde context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Wanneer `promptMode=minimal` is, krijgen extra geïnjecteerde prompts het label **Subagentcontext**
in plaats van **Groepschatcontext**.

Voor kanaal-auto-reply-uitvoeringen kan OpenClaw de generieke sectie **Stille antwoorden**
weglaten wanneer de directe/groepschatcontext al het opgeloste
gespreksspecifieke `NO_REPLY`-gedrag bevat. Dit voorkomt herhaling van tokenmechanica
in zowel de globale systeemprompt als de kanaalcontext.

## Prompt-snapshots

OpenClaw bewaart gecommitte prompt-snapshots voor het happy path van de Codex-runtime onder
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ze renderen
geselecteerde app-server thread-/turn-parameters plus een gereconstrueerde modelgebonden prompt-
lagenstack voor directe Telegram-, Discord-groeps- en Heartbeat-beurten. Die stack
bevat een gepinde Codex `gpt-5.5`-modelpromptfixture die is gegenereerd uit de vorm van Codex'
modelcatalogus/cache, de Codex happy-path permissie-developertekst,
OpenClaw-developerinstructies, beurtgebonden collaboration-mode-instructies
wanneer OpenClaw die levert, gebruikersinvoer voor de beurt en verwijzingen naar de dynamische tool-
specificaties.

Ververs de gepinde Codex-modelpromptfixture met
`pnpm prompt:snapshots:sync-codex-model`. Standaard zoekt het script naar
Codex' runtimecache op `$CODEX_HOME/models_cache.json`, daarna
`~/.codex/models_cache.json`, en valt pas daarna terug op de maintainer Codex-
checkoutconventie op `~/code/codex/codex-rs/models-manager/models.json`. Als
geen van die bronnen bestaat, sluit de opdracht af zonder de gecommitte fixture te wijzigen.
Geef `--catalog <path>` door om te verversen vanuit een specifiek bestand `models_cache.json`
of `models.json`.

Deze snapshots zijn nog steeds geen byte-voor-byte ruwe OpenAI-requestcapture. Codex
kan runtime-eigen werkruimtecontext toevoegen, zoals `AGENTS.md`, omgevingscontext,
geheugens, app-/plugininstructies en ingebouwde Default
collaboration-mode-instructies binnen de Codex-runtime nadat OpenClaw
thread- en turn-parameters heeft verzonden.

Genereer ze opnieuw met `pnpm prompt:snapshots:gen` en verifieer drift met
`pnpm prompt:snapshots:check`. CI voert de driftcontrole uit in de aanvullende
boundary-shard, zodat promptwijzigingen en snapshotupdates aan dezelfde
PR gekoppeld blijven.

## Werkruimte-bootstrapinjectie

Bootstrapbestanden worden ingekort en toegevoegd onder **Projectcontext**, zodat het model identiteit en profielcontext ziet zonder expliciete leesacties nodig te hebben:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen op gloednieuwe werkruimten)
- `MEMORY.md` wanneer aanwezig

Al deze bestanden worden bij elke beurt **in het contextvenster geïnjecteerd**, tenzij
een bestandsspecifieke gate van toepassing is. `HEARTBEAT.md` wordt bij normale uitvoeringen weggelaten wanneer
Heartbeats zijn uitgeschakeld voor de standaardagent of
`agents.defaults.heartbeat.includeSystemPromptSection` false is. Houd geïnjecteerde
bestanden beknopt, vooral `MEMORY.md`. `MEMORY.md` is bedoeld als een
gecureerde langetermijnsamenvatting; gedetailleerde dagelijkse notities horen thuis in `memory/*.md`, waar
`memory_search` en `memory_get` ze op aanvraag kunnen ophalen. Te grote
`MEMORY.md`-bestanden verhogen promptgebruik en kunnen gedeeltelijk worden geïnjecteerd vanwege
de onderstaande limieten voor bootstrapbestanden.

Wanneer een sessie op de native Codex-harness draait, laadt Codex `AGENTS.md`
via zijn eigen project-doc-detectie. OpenClaw lost nog steeds de resterende
bootstrapbestanden op en stuurt ze door als Codex-configuratie-instructies, zodat `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` en
`MEMORY.md` dezelfde werkruimtecontextrol behouden zonder
`AGENTS.md` te dupliceren.

<Note>
Dagelijkse bestanden `memory/*.md` maken **geen** deel uit van de normale bootstrap-Projectcontext. Bij gewone beurten worden ze op aanvraag benaderd via de tools `memory_search` en `memory_get`, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale `/new`- en `/reset`-beurten zijn de uitzondering: de runtime kan recente dagelijkse geheugeninhoud als een eenmalig startup-contextblok voor die eerste beurt vooraf laten gaan.
</Note>

Grote bestanden worden afgekapt met een marker. De maximale grootte per bestand wordt beheerd door
`agents.defaults.bootstrapMaxChars` (standaard: 12000). De totale geïnjecteerde bootstrap-
inhoud over bestanden heen is begrensd door `agents.defaults.bootstrapTotalMaxChars`
(standaard: 60000). Ontbrekende bestanden injecteren een korte marker voor ontbrekende bestanden. Wanneer afkapping
plaatsvindt, kan OpenClaw een beknopte waarschuwingsmelding in de systeemprompt injecteren; beheer dit met
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
standaard: `once`). Gedetailleerde ruwe/geïnjecteerde aantallen blijven in diagnostiek zoals
`/context`, `/status`, doctor en logs.

Voor geheugenbestanden is afkapping geen gegevensverlies: het bestand blijft intact op schijf,
maar het model ziet alleen de ingekorte geïnjecteerde kopie totdat het geheugen direct leest of doorzoekt.
Als `MEMORY.md` herhaaldelijk wordt afgekapt, destilleer het dan tot een
kortere duurzame samenvatting en verplaats gedetailleerde geschiedenis naar `memory/*.md`, of
verhoog de bootstraplimieten bewust.

Sub-agentsessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrapbestanden
worden uitgefilterd om de sub-agentcontext klein te houden).

Interne hooks kunnen deze stap onderscheppen via `agent:bootstrap` om de geïnjecteerde bootstrapbestanden te muteren of vervangen (bijvoorbeeld door `SOUL.md` te vervangen door een alternatieve persona).

Als je de agent minder generiek wilt laten klinken, begin dan met
[SOUL.md Persoonlijkheidsgids](/nl/concepts/soul).

Gebruik `/context list` of `/context detail` om te inspecteren hoeveel elk geïnjecteerd bestand bijdraagt (onbewerkt versus geïnjecteerd, afkapping, plus overhead van toolschema's). Zie [Context](/nl/concepts/context).

## Tijdafhandeling

De systeemprompt bevat een speciale sectie **Huidige datum en tijd** wanneer de
tijdzone van de gebruiker bekend is. Om de prompt cache-stabiel te houden, bevat deze nu alleen
de **tijdzone** (geen dynamische klok of tijdnotatie).

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart
bevat een regel met een tijdstempel. Dezelfde tool kan optioneel een modelspecifieke
overschrijving per sessie instellen (`model=default` wist deze).

Configureer met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Datum en tijd](/nl/date-time) voor volledige details over het gedrag.

## Skills

Wanneer er geschikte Skills bestaan, injecteert OpenClaw een compacte **lijst met beschikbare Skills**
(`formatSkillsForPrompt`) die het **bestandspad** voor elke Skill bevat. De
prompt instrueert het model om `read` te gebruiken om de SKILL.md op de vermelde
locatie te laden (werkruimte, beheerd of gebundeld). Als er geen Skills geschikt zijn, wordt de
sectie Skills weggelaten.

Geschiktheid omvat gates voor Skill-metadata, runtime-omgeving-/configuratiecontroles,
en de effectieve Skill-allowlist van de agent wanneer `agents.defaults.skills` of
`agents.list[].skills` is geconfigureerd.

Plugin-gebundelde Skills zijn alleen geschikt wanneer hun eigenaars-Plugin is ingeschakeld.
Hierdoor kunnen tool-Plugins diepgaandere bedieningsgidsen beschikbaar maken zonder al
die begeleiding rechtstreeks in elke toolbeschrijving in te bedden.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dit houdt de basisprompt klein en maakt toch gericht gebruik van Skills mogelijk.

Het budget voor de Skills-lijst is eigendom van het Skills-subsysteem:

- Globale standaardwaarde: `skills.limits.maxSkillsPromptChars`
- Overschrijving per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generieke begrensde runtime-fragmenten gebruiken een ander oppervlak:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Die scheiding houdt de groottebepaling van Skills gescheiden van de groottebepaling voor runtime-lezen/-injectie, zoals
`memory_get`, live toolresultaten en AGENTS.md-vernieuwingen na Compaction.

## Documentatie

De systeemprompt bevat een sectie **Documentatie**. Wanneer lokale documentatie beschikbaar is, wijst deze
naar de lokale OpenClaw-documentatiemap (`docs/` in een Git-checkout of de documentatie uit het gebundelde npm-
pakket). Als lokale documentatie niet beschikbaar is, valt deze terug op
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Dezelfde sectie bevat ook de OpenClaw-bronlocatie. Git-checkouts maken de lokale
bronroot beschikbaar zodat de agent code rechtstreeks kan inspecteren. Pakketinstallaties bevatten de GitHub-
bron-URL en vertellen de agent om daar de bron te bekijken wanneer de documentatie onvolledig of
verouderd is. De prompt vermeldt ook de publieke documentatiemirror, de community-Discord en ClawHub
([https://clawhub.ai](https://clawhub.ai)) voor het ontdekken van Skills. Deze vertelt het model om
eerst documentatie te raadplegen voor OpenClaw-gedrag, opdrachten, configuratie of architectuur, en om
`openclaw status` zelf uit te voeren wanneer mogelijk (en de gebruiker alleen te vragen wanneer het geen toegang heeft).
Specifiek voor configuratie verwijst deze agents naar de `gateway`-toolactie
`config.schema.lookup` voor exacte documentatie en beperkingen op veldniveau, en daarna naar
`docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md`
voor bredere begeleiding.

## Gerelateerd

- [Agentruntime](/nl/concepts/agent)
- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Context-engine](/nl/concepts/context-engine)
