---
read_when:
    - Systeemprompttekst, toolslijst of tijd/Heartbeat-secties bewerken
    - Werkruimte-bootstrap of Skills-injectiegedrag wijzigen
summary: Wat de systeemprompt van OpenClaw bevat en hoe die wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-04-29T22:41:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt een aangepaste systeemprompt voor elke agentuitvoering. De prompt is **eigendom van OpenClaw** en gebruikt niet de standaardprompt van pi-coding-agent.

De prompt wordt door OpenClaw samengesteld en in elke agentuitvoering geïnjecteerd.

Provider-plugins kunnen cachebewuste promptrichtlijnen bijdragen zonder
de volledige prompt die eigendom is van OpenClaw te vervangen. De provider-runtime kan:

- een kleine set benoemde kernsecties vervangen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- een **stabiel prefix** boven de promptcachegrens injecteren
- een **dynamisch suffix** onder de promptcachegrens injecteren

Gebruik bijdragen die eigendom zijn van de provider voor modelspecifieke afstemming per modelfamilie. Behoud legacy
`before_prompt_build`-promptmutatie voor compatibiliteit of werkelijk globale promptwijzigingen,
niet voor normaal providergedrag.

De overlay voor de OpenAI GPT-5-familie houdt de kernregel voor uitvoering klein en voegt
modelspecifieke richtlijnen toe voor persona-vergrendeling, beknopte uitvoer, tooldiscipline,
parallel opzoeken, dekking van deliverables, verificatie, ontbrekende context en
hygiëne rond terminaltools.

## Structuur

De prompt is bewust compact en gebruikt vaste secties:

- **Tooling**: herinnering aan de bron van waarheid voor gestructureerde tools plus runtime-richtlijnen voor toolgebruik.
- **Uitvoeringsbias**: compacte richtlijnen voor opvolging: handel binnen de beurt bij
  uitvoerbare verzoeken, ga door totdat het klaar is of geblokkeerd raakt, herstel van zwakke toolresultaten,
  controleer veranderlijke status live en verifieer voordat je afrondt.
- **Veiligheid**: korte herinnering aan vangrails om machtszoekend gedrag of het omzeilen van toezicht te vermijden.
- **Skills** (wanneer beschikbaar): vertelt het model hoe skill-instructies op aanvraag moeten worden geladen.
- **OpenClaw Zelfupdate**: hoe je configuratie veilig inspecteert met
  `config.schema.lookup`, configuratie patcht met `config.patch`, de volledige
  configuratie vervangt met `config.apply` en `update.run` alleen uitvoert op expliciet verzoek van de gebruiker.
  De tool `gateway`, alleen voor de eigenaar, weigert ook
  `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief legacy `tools.bash.*`-
  aliassen die normaliseren naar die beschermde exec-paden.
- **Workspace**: werkmap (`agents.defaults.workspace`).
- **Documentatie**: lokaal pad naar OpenClaw-documentatie (repo of npm-pakket) en wanneer die moet worden gelezen.
- **Workspacebestanden (geïnjecteerd)**: geeft aan dat bootstrapbestanden hieronder zijn opgenomen.
- **Sandbox** (wanneer ingeschakeld): geeft een runtime in een sandbox, sandboxpaden en of verhoogde exec beschikbaar is aan.
- **Huidige Datum & Tijd**: lokale tijd van de gebruiker, tijdzone en tijdnotatie.
- **Antwoordtags**: optionele syntaxis voor antwoordtags voor ondersteunde providers.
- **Heartbeats**: heartbeat-prompt en ack-gedrag, wanneer heartbeats zijn ingeschakeld voor de standaardagent.
- **Runtime**: host, OS, node, model, repo-root (wanneer gedetecteerd), denkniveau (één regel).
- **Redenering**: huidig zichtbaarheidsniveau + hint voor de /reasoning-schakelaar.

OpenClaw houdt grote stabiele inhoud, inclusief **Projectcontext**, boven de
interne promptcachegrens. Vluchtige kanaal-/sessiesecties zoals
Control UI-insluitrichtlijnen, **Berichten**, **Stem**, **Groepschatcontext**,
**Reacties**, **Heartbeats** en **Runtime** worden onder die grens toegevoegd,
zodat lokale backends met prefixcaches het stabiele workspaceprefix
tussen kanaalbeurten kunnen hergebruiken. Toolbeschrijvingen moeten eveneens vermijden huidige
kanaalnamen in te sluiten wanneer het geaccepteerde schema dat runtimedetail al bevat.

De sectie Tooling bevat ook runtimerichtlijnen voor langlopende werkzaamheden:

- gebruik cron voor toekomstige opvolging (`check back later`, herinneringen, terugkerend werk)
  in plaats van `exec`-slaaplussen, `yieldMs`-vertragingstrucs of herhaalde `process`-
  polling
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond
  blijven draaien
- wanneer automatisch ontwaken bij voltooiing is ingeschakeld, start de opdracht één keer en vertrouw op
  het push-gebaseerde wekpad wanneer het uitvoer produceert of mislukt
- gebruik `process` voor logs, status, invoer of interventie wanneer je een
  draaiende opdracht moet inspecteren
- als de taak groter is, geef de voorkeur aan `sessions_spawn`; voltooiing van sub-agents is
  push-gebaseerd en kondigt zich automatisch terug aan bij de aanvrager
- poll `subagents list` / `sessions_list` niet in een lus alleen om te wachten op
  voltooiing

Wanneer de experimentele tool `update_plan` is ingeschakeld, vertelt Tooling het
model ook om die alleen te gebruiken voor niet-triviaal werk met meerdere stappen, precies één
`in_progress`-stap aan te houden en te vermijden het hele plan na elke update te herhalen.

Veiligheidsvangrails in de systeemprompt zijn adviserend. Ze sturen modelgedrag maar dwingen geen beleid af. Gebruik toolbeleid, exec-goedkeuringen, sandboxing en kanaal-allowlists voor harde handhaving; operators kunnen deze bewust uitschakelen.

Op kanalen met native goedkeuringskaarten/-knoppen vertelt de runtimeprompt nu de
agent om eerst op die native goedkeurings-UI te vertrouwen. De agent moet alleen een handmatige
`/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of
handmatige goedkeuring de enige route is.

## Promptmodi

OpenClaw kan kleinere systeemprompts renderen voor sub-agents. De runtime stelt een
`promptMode` in voor elke uitvoering (geen gebruikersgerichte configuratie):

- `full` (standaard): bevat alle bovenstaande secties.
- `minimal`: gebruikt voor sub-agents; laat **Skills**, **Geheugenherinnering**, **OpenClaw
  Zelfupdate**, **Modelaliassen**, **Gebruikersidentiteit**, **Antwoordtags**,
  **Berichten**, **Stille Antwoorden** en **Heartbeats** weg. Tooling, **Veiligheid**,
  Workspace, Sandbox, Huidige Datum & Tijd (wanneer bekend), Runtime en geïnjecteerde
  context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Wanneer `promptMode=minimal` is, krijgen extra geïnjecteerde prompts het label **Subagent
Context** in plaats van **Groepschatcontext**.

Voor automatische kanaalantwoorden kan OpenClaw de generieke sectie **Stille Antwoorden**
weglaten wanneer de context van directe/groepschat al het opgeloste
gespreksspecifieke `NO_REPLY`-gedrag bevat. Dit voorkomt dat tokenmechanica
zowel in de globale systeemprompt als in de kanaalcontext wordt herhaald.

## Workspace-bootstrapinjectie

Bootstrapbestanden worden ingekort en toegevoegd onder **Projectcontext**, zodat het model identiteits- en profielcontext ziet zonder expliciete leesacties nodig te hebben:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen in gloednieuwe workspaces)
- `MEMORY.md` indien aanwezig

Al deze bestanden worden bij elke beurt **in het contextvenster geïnjecteerd**, tenzij
een bestandsspecifieke gate van toepassing is. `HEARTBEAT.md` wordt bij normale uitvoeringen weggelaten wanneer
heartbeats zijn uitgeschakeld voor de standaardagent of
`agents.defaults.heartbeat.includeSystemPromptSection` false is. Houd geïnjecteerde
bestanden beknopt — vooral `MEMORY.md`, dat na verloop van tijd kan groeien en kan leiden tot
onverwacht hoog contextgebruik en frequentere Compaction.

<Note>
Dagelijkse bestanden in `memory/*.md` maken **geen** deel uit van de normale bootstrap-Projectcontext. Bij gewone beurten worden ze op aanvraag benaderd via de tools `memory_search` en `memory_get`, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale `/new`- en `/reset`-beurten zijn de uitzondering: de runtime kan recente dagelijkse herinneringen vooraf toevoegen als een eenmalig startup-contextblok voor die eerste beurt.
</Note>

Grote bestanden worden afgekapt met een marker. De maximale grootte per bestand wordt geregeld door
`agents.defaults.bootstrapMaxChars` (standaard: 12000). De totale geïnjecteerde bootstrap-
inhoud over bestanden heen is begrensd door `agents.defaults.bootstrapTotalMaxChars`
(standaard: 60000). Ontbrekende bestanden injecteren een korte marker voor een ontbrekend bestand. Wanneer afkapping
plaatsvindt, kan OpenClaw een waarschuwingsblok in Projectcontext injecteren; beheer dit met
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
standaard: `once`).

Sub-agent-sessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrapbestanden
worden weggefilterd om de sub-agentcontext klein te houden).

Interne hooks kunnen deze stap onderscheppen via `agent:bootstrap` om de
geïnjecteerde bootstrapbestanden te wijzigen of te vervangen (bijvoorbeeld door `SOUL.md` te vervangen door een alternatieve persona).

Als je de agent minder generiek wilt laten klinken, begin dan met
[SOUL.md Persoonlijkheidsgids](/nl/concepts/soul).

Gebruik `/context list` of `/context detail` om te inspecteren hoeveel elk geïnjecteerd bestand bijdraagt (ruw versus geïnjecteerd, afkapping, plus overhead van toolschema’s). Zie [Context](/nl/concepts/context).

## Tijdafhandeling

De systeemprompt bevat een speciale sectie **Huidige Datum & Tijd** wanneer de
tijdzone van de gebruiker bekend is. Om de prompt cache-stabiel te houden, bevat deze nu alleen
de **tijdzone** (geen dynamische klok of tijdnotatie).

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart
bevat een tijdstempelregel. Dezelfde tool kan optioneel een modelspecifieke override per sessie
instellen (`model=default` wist deze).

Configureer met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Datum & Tijd](/nl/date-time) voor volledige gedragsdetails.

## Skills

Wanneer geschikte skills bestaan, injecteert OpenClaw een compacte **lijst met beschikbare skills**
(`formatSkillsForPrompt`) die het **bestandspad** voor elke skill bevat. De
prompt instrueert het model om `read` te gebruiken om de SKILL.md op de vermelde
locatie (workspace, beheerd of gebundeld) te laden. Als er geen skills geschikt zijn, wordt de
sectie Skills weggelaten.

Geschiktheid omvat gates voor skillmetadata, runtime-omgeving/configuratiecontroles
en de effectieve skill-allowlist van de agent wanneer `agents.defaults.skills` of
`agents.list[].skills` is geconfigureerd.

Plugin-gebundelde skills zijn alleen geschikt wanneer hun eigenaar-Plugin is ingeschakeld.
Hierdoor kunnen tool-plugins diepere gebruiksgidsen aanbieden zonder al die
richtlijnen rechtstreeks in elke toolbeschrijving in te sluiten.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dit houdt de basisprompt klein, terwijl gericht gebruik van skills nog steeds mogelijk blijft.

Het budget voor de skillslijst is eigendom van het skillssubsysteem:

- Globale standaard: `skills.limits.maxSkillsPromptChars`
- Override per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generieke begrensde runtimefragmenten gebruiken een ander oppervlak:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Die splitsing houdt de omvang van skills gescheiden van de omvang van runtimelezen/-injectie, zoals
`memory_get`, live toolresultaten en AGENTS.md-verversingen na Compaction.

## Documentatie

De systeemprompt bevat een sectie **Documentatie**. Wanneer lokale documentatie beschikbaar is, wijst die
naar de lokale OpenClaw-documentatiemap (`docs/` in een Git-checkout of de gebundelde npm-
pakketdocumentatie). Als lokale documentatie niet beschikbaar is, valt die terug op
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Dezelfde sectie bevat ook de OpenClaw-bronlocatie. Git-checkouts tonen de lokale
bronroot zodat de agent code rechtstreeks kan inspecteren. Pakketinstallaties bevatten de GitHub-
bron-URL en vertellen de agent om de bron daar te bekijken wanneer de documentatie onvolledig of
verouderd is. De prompt vermeldt ook de publieke documentatiemirror, community-Discord en ClawHub
([https://clawhub.ai](https://clawhub.ai)) voor het ontdekken van skills. De prompt vertelt het model om
eerst documentatie te raadplegen voor OpenClaw-gedrag, opdrachten, configuratie of architectuur, en om
zelf `openclaw status` uit te voeren wanneer mogelijk (en de gebruiker alleen te vragen wanneer het geen toegang heeft).
Voor configuratie specifiek verwijst de prompt agents naar de `gateway`-toolactie
`config.schema.lookup` voor exacte veldniveau-documentatie en beperkingen, en daarna naar
`docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md`
voor bredere richtlijnen.

## Gerelateerd

- [Agentruntime](/nl/concepts/agent)
- [Agentworkspace](/nl/concepts/agent-workspace)
- [Contextengine](/nl/concepts/context-engine)
