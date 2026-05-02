---
read_when:
    - Systeemprompttekst, toolslijst of tijd-/Heartbeat-secties bewerken
    - Gedrag voor werkruimtebootstrap of Skills-injectie wijzigen
summary: Wat de OpenClaw-systeemprompt bevat en hoe deze wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-05-02T23:39:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt een aangepaste systeemprompt voor elke agentuitvoering. De prompt is **eigendom van OpenClaw** en gebruikt niet de standaardprompt van pi-coding-agent.

De prompt wordt door OpenClaw samengesteld en in elke agentuitvoering geïnjecteerd.

Providerplugins kunnen cachebewuste promptrichtlijnen bijdragen zonder de volledige
prompt die eigendom is van OpenClaw te vervangen. De providerruntime kan:

- een kleine set benoemde kernsecties vervangen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- een **stabiel voorvoegsel** boven de promptcachegrens injecteren
- een **dynamisch achtervoegsel** onder de promptcachegrens injecteren

Gebruik bijdragen die eigendom zijn van de provider voor modelspecifieke afstemming per modelfamilie. Bewaar legacy
`before_prompt_build`-promptmutatie voor compatibiliteit of echt globale promptwijzigingen,
niet voor normaal providergedrag.

De overlay voor de OpenAI GPT-5-familie houdt de kernuitvoeringsregel klein en voegt
modelspecifieke richtlijnen toe voor persona-vastlegging, beknopte uitvoer, tooldiscipline,
parallel opzoeken, dekking van deliverables, verificatie, ontbrekende context en
terminaltoolhygiëne.

## Structuur

De prompt is bewust compact en gebruikt vaste secties:

- **Tooling**: herinnering aan gestructureerde tools als bron van waarheid plus runtime-richtlijnen voor toolgebruik.
- **Uitvoeringsbias**: compacte richtlijnen voor opvolging: handel binnen de beurt bij
  uitvoerbare verzoeken, ga door tot het klaar is of geblokkeerd raakt, herstel van zwakke
  toolresultaten, controleer veranderlijke status live en verifieer voor afronding.
- **Veiligheid**: korte guardrail-herinnering om machtszoekend gedrag of het omzeilen van toezicht te vermijden.
- **Skills** (indien beschikbaar): vertelt het model hoe het skill-instructies op aanvraag kan laden.
- **OpenClaw-zelfupdate**: hoe configuratie veilig te inspecteren met
  `config.schema.lookup`, configuratie te patchen met `config.patch`, de volledige
  configuratie te vervangen met `config.apply`, en `update.run` alleen uit te voeren op expliciet gebruikersverzoek. De alleen-voor-eigenaren `gateway`-tool weigert ook
  `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief legacy `tools.bash.*`-
  aliassen die naar die beschermde exec-paden normaliseren.
- **Werkruimte**: werkdirectory (`agents.defaults.workspace`).
- **Documentatie**: lokaal pad naar OpenClaw-documentatie (repo of npm-pakket) en wanneer deze gelezen moet worden.
- **Werkruimtebestanden (geïnjecteerd)**: geeft aan dat bootstrapbestanden hieronder zijn opgenomen.
- **Sandbox** (indien ingeschakeld): geeft sandboxruntime, sandboxpaden en of verhoogde exec beschikbaar is aan.
- **Huidige datum en tijd**: lokale gebruikerstijd, tijdzone en tijdnotatie.
- **Antwoordtags**: optionele syntaxis voor antwoordtags voor ondersteunde providers.
- **Heartbeats**: heartbeatprompt en ack-gedrag, wanneer heartbeats zijn ingeschakeld voor de standaardagent.
- **Runtime**: host, OS, node, model, repo-root (indien gedetecteerd), denkniveau (één regel).
- **Redenering**: huidig zichtbaarheidsniveau + hint voor /reasoning-schakelaar.

OpenClaw houdt grote stabiele inhoud, inclusief **Projectcontext**, boven de
interne promptcachegrens. Vluchtige kanaal-/sessiesecties zoals
Control UI-inbeddingsrichtlijnen, **Berichten**, **Spraak**, **Groepschatcontext**,
**Reacties**, **Heartbeats** en **Runtime** worden onder die grens toegevoegd
zodat lokale backends met prefixcaches het stabiele werkruimtevoorvoegsel
tussen kanaalbeurten kunnen hergebruiken. Toolbeschrijvingen moeten ook vermijden om huidige
kanaalnamen in te bedden wanneer het geaccepteerde schema dat runtimedetail al bevat.

De Tooling-sectie bevat ook runtime-richtlijnen voor langdurig werk:

- gebruik cron voor toekomstige opvolging (`check back later`, herinneringen, terugkerend werk)
  in plaats van `exec`-slaaplussen, `yieldMs`-vertragingstrucs of herhaalde `process`-
  polling
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond
  blijven draaien
- wanneer automatisch voltooien-waken is ingeschakeld, start de opdracht eenmaal en vertrouw op
  het pushgebaseerde wekpad wanneer het uitvoer produceert of faalt
- gebruik `process` voor logs, status, invoer of interventie wanneer je een draaiende opdracht
  moet inspecteren
- als de taak groter is, geef de voorkeur aan `sessions_spawn`; voltooiing van subagenten is
  pushgebaseerd en wordt automatisch terug aan de aanvrager aangekondigd
- poll `subagents list` / `sessions_list` niet in een lus alleen om op voltooiing te wachten

Wanneer de experimentele `update_plan`-tool is ingeschakeld, vertelt Tooling het
model ook om deze alleen te gebruiken voor niet-triviaal meerstapswerk, precies één
`in_progress`-stap te behouden en te vermijden het volledige plan na elke update te herhalen.

Veiligheids-guardrails in de systeemprompt zijn adviserend. Ze sturen modelgedrag maar handhaven geen beleid. Gebruik toolbeleid, exec-goedkeuringen, sandboxing en kanaal-toelatingslijsten voor harde handhaving; operators kunnen deze bewust uitschakelen.

Op kanalen met native goedkeuringskaarten/-knoppen vertelt de runtimeprompt de
agent nu eerst op die native goedkeurings-UI te vertrouwen. Deze moet alleen een handmatige
`/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of
handmatige goedkeuring de enige route is.

## Promptmodi

OpenClaw kan kleinere systeemprompts renderen voor subagenten. De runtime stelt een
`promptMode` in voor elke uitvoering (geen gebruikersgerichte configuratie):

- `full` (standaard): bevat alle bovenstaande secties.
- `minimal`: gebruikt voor subagenten; laat **Skills**, **Geheugenherinnering**, **OpenClaw-
  zelfupdate**, **Modelaliassen**, **Gebruikersidentiteit**, **Antwoordtags**,
  **Berichten**, **Stille antwoorden** en **Heartbeats** weg. Tooling, **Veiligheid**,
  Werkruimte, Sandbox, Huidige datum en tijd (indien bekend), Runtime en geïnjecteerde
  context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Wanneer `promptMode=minimal` is, krijgen extra geïnjecteerde prompts het label **Subagent-
context** in plaats van **Groepschatcontext**.

Voor kanaal-autoantwoorduitvoeringen kan OpenClaw de generieke sectie **Stille antwoorden**
weglaten wanneer de directe/groepschatcontext al het opgeloste
gespreksspecifieke `NO_REPLY`-gedrag bevat. Dit voorkomt herhaling van tokenmechanica
in zowel de globale systeemprompt als de kanaalcontext.

## Promptsnapshots

OpenClaw bewaart gecommitte promptsnapshots voor het blije pad van de Codex-runtime onder
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ze renderen
geselecteerde app-server thread-/turn-parameters plus een gereconstrueerde modelgebonden prompt-
laagstapel voor Telegram-direct, Discord-groep en heartbeatbeurten. Die stapel
bevat een vastgezette Codex `gpt-5.5`-modelpromptfixture die is gegenereerd uit de vorm van Codex'
modelcatalogus/cache, de ontwikkelaarstekst voor Codex-happy-pathmachtigingen,
OpenClaw-ontwikkelaarsinstructies, gebruikersbeurtinvoer en verwijzingen naar de dynamische
toolspecificaties.

Ververs de vastgezette Codex-modelpromptfixture met
`pnpm prompt:snapshots:sync-codex-model`. Standaard zoekt het script naar
Codex' runtimecache op `$CODEX_HOME/models_cache.json`, daarna
`~/.codex/models_cache.json`, en valt pas daarna terug op de Codex-checkoutconventie voor maintainers
op `~/code/codex/codex-rs/models-manager/models.json`. Als geen van
die bronnen bestaat, sluit de opdracht af zonder de gecommitte fixture te wijzigen.
Geef `--catalog <path>` door om te verversen vanuit een specifiek `models_cache.json`-
of `models.json`-bestand.

Deze snapshots zijn nog steeds geen byte-voor-byte ruwe OpenAI-aanvraagcapture. Codex
kan runtime-eigen werkruimtecontext toevoegen, zoals `AGENTS.md`, omgevingscontext,
herinneringen, app-/Plugin-instructies en toekomstige instructies voor samenwerkingsmodus
binnen de Codex-runtime nadat OpenClaw thread- en turn-parameters heeft verzonden.

Genereer ze opnieuw met `pnpm prompt:snapshots:gen` en verifieer drift met
`pnpm prompt:snapshots:check`. CI voert de driftcontrole uit in de aanvullende
boundary-shard zodat promptwijzigingen en snapshotupdates aan dezelfde
PR gekoppeld blijven.

## Werkruimte-bootstrapinjectie

Bootstrapbestanden worden ingekort en toegevoegd onder **Projectcontext** zodat het model identiteit en profielcontext ziet zonder expliciete leesacties nodig te hebben:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen op gloednieuwe werkruimten)
- `MEMORY.md` indien aanwezig

Al deze bestanden worden **in het contextvenster geïnjecteerd** bij elke beurt, tenzij
een bestandsspecifieke gate van toepassing is. `HEARTBEAT.md` wordt weggelaten bij normale uitvoeringen wanneer
heartbeats zijn uitgeschakeld voor de standaardagent of
`agents.defaults.heartbeat.includeSystemPromptSection` false is. Houd geïnjecteerde
bestanden beknopt — vooral `MEMORY.md`, dat in de loop van de tijd kan groeien en kan leiden tot
onverwacht hoog contextgebruik en frequentere Compaction.

Wanneer een sessie op de native Codex-harness draait, laadt Codex `AGENTS.md`
via zijn eigen projectdocumentdetectie. OpenClaw lost nog steeds de overige
bootstrapbestanden op en stuurt ze door als Codex-configuratie-instructies, zodat `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` en
`MEMORY.md` dezelfde werkruimtecontextrol behouden zonder
`AGENTS.md` te dupliceren.

<Note>
Dagelijkse bestanden in `memory/*.md` maken **geen** deel uit van de normale bootstrap-Projectcontext. Bij gewone beurten worden ze op aanvraag benaderd via de tools `memory_search` en `memory_get`, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale `/new`- en `/reset`-beurten vormen de uitzondering: de runtime kan recente dagelijkse herinnering vooraf toevoegen als een eenmalig startup-contextblok voor die eerste beurt.
</Note>

Grote bestanden worden afgekapt met een marker. De maximale grootte per bestand wordt bepaald door
`agents.defaults.bootstrapMaxChars` (standaard: 12000). De totale geïnjecteerde bootstrap-
inhoud over bestanden heen wordt begrensd door `agents.defaults.bootstrapTotalMaxChars`
(standaard: 60000). Ontbrekende bestanden injecteren een korte marker voor ontbrekend bestand. Wanneer afkapping
plaatsvindt, kan OpenClaw een waarschuwingsblok in Projectcontext injecteren; beheer dit met
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
standaard: `once`).

Subagentsessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrapbestanden
worden eruit gefilterd om de subagentcontext klein te houden).

Interne hooks kunnen deze stap onderscheppen via `agent:bootstrap` om de geïnjecteerde bootstrapbestanden te muteren of te vervangen (bijvoorbeeld door `SOUL.md` te vervangen door een alternatieve persona).

Als je de agent minder generiek wilt laten klinken, begin dan met de
[SOUL.md-persoonlijkheidsgids](/nl/concepts/soul).

Gebruik `/context list` of `/context detail` om te inspecteren hoeveel elk geïnjecteerd bestand bijdraagt (ruw versus geïnjecteerd, afkapping, plus overhead van toolschema's). Zie [Context](/nl/concepts/context).

## Tijdafhandeling

De systeemprompt bevat een speciale sectie **Huidige datum en tijd** wanneer de
gebruikerstijdzone bekend is. Om de prompt cachestabiel te houden, bevat deze nu alleen
de **tijdzone** (geen dynamische klok of tijdnotatie).

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart
bevat een tijdstempelregel. Dezelfde tool kan optioneel een modelspecifieke overschrijving per sessie
instellen (`model=default` wist deze).

Configureer met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Datum en tijd](/nl/date-time) voor volledige gedragsdetails.

## Skills

Wanneer in aanmerking komende skills bestaan, injecteert OpenClaw een compacte **lijst met beschikbare skills**
(`formatSkillsForPrompt`) die het **bestandspad** voor elke skill bevat. De
prompt instrueert het model om `read` te gebruiken om de SKILL.md op de vermelde
locatie (werkruimte, beheerd of gebundeld) te laden. Als geen skills in aanmerking komen, wordt de
Skills-sectie weggelaten.

Eligibility omvat skill-metadatagates, runtime-omgevings-/configuratiecontroles,
en de effectieve agent-skill-toelatingslijst wanneer `agents.defaults.skills` of
`agents.list[].skills` is geconfigureerd.

Door plugins gebundelde skills komen alleen in aanmerking wanneer hun eigenaar-Plugin is ingeschakeld.
Hierdoor kunnen toolplugins diepere bedieningsgidsen beschikbaar maken zonder al
die richtlijnen direct in elke toolbeschrijving in te bedden.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dit houdt de basisprompt klein terwijl gericht skillgebruik mogelijk blijft.

Het budget voor de skillslijst is eigendom van het skillsubsysteem:

- Globale standaard: `skills.limits.maxSkillsPromptChars`
- Overschrijving per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generieke begrensde runtime-uittreksels gebruiken een ander oppervlak:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Die splitsing houdt de groottebepaling voor Skills gescheiden van de groottebepaling voor lezen/injectie tijdens runtime, zoals `memory_get`, live toolresultaten en AGENTS.md-verversingen na Compaction.

## Documentatie

De systeemprompt bevat een sectie **Documentatie**. Wanneer lokale documentatie beschikbaar is, verwijst die naar de lokale OpenClaw-documentatiemap (`docs/` in een Git-checkout of de documentatie uit het gebundelde npm-pakket). Als lokale documentatie niet beschikbaar is, valt die terug op [https://docs.openclaw.ai](https://docs.openclaw.ai).

Dezelfde sectie bevat ook de bronlocatie van OpenClaw. Git-checkouts tonen de lokale bronroot zodat de agent code rechtstreeks kan inspecteren. Pakketinstallaties bevatten de GitHub-bron-URL en vertellen de agent om daar de bron te bekijken wanneer de documentatie onvolledig of verouderd is. De prompt vermeldt ook de openbare documentatiespiegel, de community-Discord en ClawHub ([https://clawhub.ai](https://clawhub.ai)) voor het ontdekken van Skills. Die vertelt het model om eerst de documentatie te raadplegen voor OpenClaw-gedrag, opdrachten, configuratie of architectuur, en om waar mogelijk zelf `openclaw status` uit te voeren (en de gebruiker alleen te vragen wanneer het geen toegang heeft). Specifiek voor configuratie verwijst die agents naar de `gateway`-toolactie `config.schema.lookup` voor exacte documentatie en beperkingen op veldniveau, en daarna naar `docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md` voor bredere richtlijnen.

## Gerelateerd

- [Agent-runtime](/nl/concepts/agent)
- [Agent-werkruimte](/nl/concepts/agent-workspace)
- [Context-engine](/nl/concepts/context-engine)
