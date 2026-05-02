---
read_when:
    - Systeemprompttekst, de lijst met tools of tijd-/Heartbeat-secties bewerken
    - Werkruimte-bootstrap of Skills-injectiegedrag wijzigen
summary: Wat de systeemprompt van OpenClaw bevat en hoe deze wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-05-02T20:43:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt een aangepaste systeemprompt voor elke agent-run. De prompt is **eigendom van OpenClaw** en gebruikt niet de standaardprompt van pi-coding-agent.

De prompt wordt samengesteld door OpenClaw en geïnjecteerd in elke agent-run.

Provider-plugins kunnen cachebewuste promptrichtlijnen bijdragen zonder de volledige prompt die eigendom is van OpenClaw te vervangen. De provider-runtime kan:

- een kleine set benoemde kernsecties vervangen (`interaction_style`, `tool_call_style`, `execution_bias`)
- een **stabiel prefix** injecteren boven de prompt-cachegrens
- een **dynamisch suffix** injecteren onder de prompt-cachegrens

Gebruik bijdragen die eigendom zijn van de provider voor modelspecifieke afstemming per modelfamilie. Behoud oudere `before_prompt_build`-promptmutatie voor compatibiliteit of echt globale promptwijzigingen, niet voor normaal providergedrag.

De overlay voor de OpenAI GPT-5-familie houdt de kernregel voor uitvoering klein en voegt modelspecifieke richtlijnen toe voor persona-vergrendeling, beknopte uitvoer, tooldiscipline, parallelle lookup, dekking van deliverables, verificatie, ontbrekende context en hygiëne rond terminaltools.

## Structuur

De prompt is bewust compact en gebruikt vaste secties:

- **Tooling**: herinnering dat gestructureerde tools de bron van waarheid zijn, plus runtimerichtlijnen voor toolgebruik.
- **Uitvoeringsbias**: compacte richtlijnen voor opvolging: handel binnen de beurt op uitvoerbare verzoeken, ga door tot het klaar is of geblokkeerd raakt, herstel van zwakke toolresultaten, controleer veranderlijke status live en verifieer voordat je afrondt.
- **Veiligheid**: korte guardrail-herinnering om machtszoekend gedrag of het omzeilen van toezicht te vermijden.
- **Skills** (wanneer beschikbaar): vertelt het model hoe het skill-instructies op aanvraag laadt.
- **OpenClaw Self-Update**: hoe config veilig te inspecteren met `config.schema.lookup`, config te patchen met `config.patch`, de volledige config te vervangen met `config.apply`, en `update.run` alleen uit te voeren op expliciet verzoek van de gebruiker. De owner-only `gateway`-tool weigert ook `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief legacy `tools.bash.*`-aliassen die normaliseren naar die beschermde exec-paden.
- **Werkruimte**: werkdirectory (`agents.defaults.workspace`).
- **Documentatie**: lokaal pad naar OpenClaw-documentatie (repo of npm-pakket) en wanneer deze te lezen.
- **Werkruimtebestanden (geïnjecteerd)**: geeft aan dat bootstrap-bestanden hieronder zijn opgenomen.
- **Sandbox** (wanneer ingeschakeld): geeft sandboxed runtime, sandboxpaden en of verhoogde exec beschikbaar is aan.
- **Huidige datum en tijd**: lokale tijd van de gebruiker, tijdzone en tijdnotatie.
- **Antwoordtags**: optionele syntaxis voor antwoordtags voor ondersteunde providers.
- **Heartbeats**: heartbeat-prompt en ack-gedrag, wanneer heartbeats zijn ingeschakeld voor de standaardagent.
- **Runtime**: host, OS, Node, model, repo-root (wanneer gedetecteerd), denkniveau (één regel).
- **Redenering**: huidig zichtbaarheidsniveau + hint voor /reasoning-toggle.

OpenClaw houdt grote stabiele inhoud, inclusief **Projectcontext**, boven de interne prompt-cachegrens. Vluchtige kanaal-/sessiesecties zoals Control UI-inbedrichtlijnen, **Berichten**, **Spraak**, **Groepschatcontext**, **Reacties**, **Heartbeats** en **Runtime** worden onder die grens toegevoegd, zodat lokale backends met prefixcaches het stabiele werkruimteprefix kunnen hergebruiken over kanaalbeurten heen. Toolbeschrijvingen moeten eveneens vermijden huidige kanaalnamen in te bedden wanneer het geaccepteerde schema dat runtimedetail al bevat.

De Tooling-sectie bevat ook runtimerichtlijnen voor langlopend werk:

- gebruik cron voor toekomstige opvolging (`check back later`, herinneringen, terugkerend werk) in plaats van `exec`-slaaplussen, `yieldMs`-vertragingstrucs of herhaalde `process`-polling
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond blijven draaien
- wanneer automatisch ontwaken bij voltooiing is ingeschakeld, start de opdracht één keer en vertrouw op het pushgebaseerde ontwaakpad wanneer het uitvoer produceert of faalt
- gebruik `process` voor logs, status, invoer of interventie wanneer je een lopende opdracht moet inspecteren
- als de taak groter is, geef de voorkeur aan `sessions_spawn`; voltooiing van subagents is pushgebaseerd en kondigt zichzelf automatisch terug aan bij de aanvrager
- poll `subagents list` / `sessions_list` niet in een lus alleen om op voltooiing te wachten

Wanneer de experimentele `update_plan`-tool is ingeschakeld, vertelt Tooling het model ook deze alleen te gebruiken voor niet-triviaal meerstappenwerk, precies één `in_progress`-stap te behouden en te vermijden het volledige plan na elke update te herhalen.

Veiligheids-guardrails in de systeemprompt zijn adviserend. Ze sturen modelgedrag maar dwingen geen beleid af. Gebruik toolbeleid, exec-goedkeuringen, sandboxing en kanaal-allowlists voor harde handhaving; operators kunnen deze bewust uitschakelen.

Op kanalen met native goedkeuringskaarten/-knoppen vertelt de runtimeprompt de agent nu eerst te vertrouwen op die native goedkeurings-UI. De agent moet alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring het enige pad is.

## Promptmodi

OpenClaw kan kleinere systeemprompts renderen voor subagents. De runtime stelt een `promptMode` in voor elke run (geen gebruikersgerichte config):

- `full` (standaard): bevat alle bovenstaande secties.
- `minimal`: gebruikt voor subagents; laat **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **Gebruikersidentiteit**, **Antwoordtags**, **Berichten**, **Stille antwoorden** en **Heartbeats** weg. Tooling, **Veiligheid**, Werkruimte, Sandbox, Huidige datum en tijd (wanneer bekend), Runtime en geïnjecteerde context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Wanneer `promptMode=minimal`, worden extra geïnjecteerde prompts gelabeld als **Subagentcontext** in plaats van **Groepschatcontext**.

Voor kanaal-auto-reply-runs kan OpenClaw de generieke sectie **Stille antwoorden** weglaten wanneer de directe/groepschatcontext het opgeloste gespreksspecifieke `NO_REPLY`-gedrag al bevat. Dit voorkomt dat tokenmechanica zowel in de globale systeemprompt als in de kanaalcontext worden herhaald.

## Prompt-snapshots

OpenClaw bewaart gecommitte happy-path-prompt-snapshots voor de Codex/message-tool-runtime onder `test/fixtures/agents/prompt-snapshots/happy-path/`. Ze renderen de Codex app-server developer-instructies die eigendom zijn van OpenClaw, geselecteerde parameters voor thread-start/-hervatting, gebruikersinvoer van de beurt en dynamische toolspecificaties voor Telegram direct, Discord-groep en heartbeat-beurten. De verborgen basis-Codex-systeemprompt en beurtgebonden Codex-instructies voor samenwerkingsmodus zijn eigendom van de Codex-runtime en worden niet door OpenClaw gerenderd.

Genereer ze opnieuw met `pnpm prompt:snapshots:gen` en verifieer drift met `pnpm prompt:snapshots:check`.

## Werkruimte-bootstrapinjectie

Bootstrap-bestanden worden ingekort en toegevoegd onder **Projectcontext**, zodat het model identiteit en profielcontext ziet zonder expliciete reads nodig te hebben:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen op gloednieuwe werkruimten)
- `MEMORY.md` wanneer aanwezig

Al deze bestanden worden **geïnjecteerd in het contextvenster** bij elke beurt, tenzij een bestandsspecifieke gate van toepassing is. `HEARTBEAT.md` wordt weggelaten bij normale runs wanneer heartbeats zijn uitgeschakeld voor de standaardagent of `agents.defaults.heartbeat.includeSystemPromptSection` false is. Houd geïnjecteerde bestanden beknopt — vooral `MEMORY.md`, dat na verloop van tijd kan groeien en kan leiden tot onverwacht hoog contextgebruik en frequentere Compaction.

<Note>
Dagelijkse `memory/*.md`-bestanden maken **geen** deel uit van de normale bootstrap-Projectcontext. Bij gewone beurten worden ze op aanvraag benaderd via de tools `memory_search` en `memory_get`, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale `/new`- en `/reset`-beurten vormen de uitzondering: de runtime kan recente dagelijkse herinnering vooraf toevoegen als een eenmalig startup-contextblok voor die eerste beurt.
</Note>

Grote bestanden worden afgekapt met een marker. De maximale grootte per bestand wordt geregeld door `agents.defaults.bootstrapMaxChars` (standaard: 12000). De totale geïnjecteerde bootstrap-inhoud over bestanden heen wordt begrensd door `agents.defaults.bootstrapTotalMaxChars` (standaard: 60000). Ontbrekende bestanden injecteren een korte marker voor ontbrekend bestand. Wanneer afkapping plaatsvindt, kan OpenClaw een waarschuwingsblok injecteren in Projectcontext; regel dit met `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; standaard: `once`).

Subagent-sessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrap-bestanden worden uitgefilterd om de subagent-context klein te houden).

Interne hooks kunnen deze stap onderscheppen via `agent:bootstrap` om de geïnjecteerde bootstrap-bestanden te muteren of vervangen (bijvoorbeeld door `SOUL.md` te vervangen door een alternatieve persona).

Als je de agent minder generiek wilt laten klinken, begin dan met de [SOUL.md-persoonlijkheidsgids](/nl/concepts/soul).

Gebruik `/context list` of `/context detail` om te inspecteren hoeveel elk geïnjecteerd bestand bijdraagt (raw versus geïnjecteerd, afkapping, plus overhead van toolschema's). Zie [Context](/nl/concepts/context).

## Tijdsafhandeling

De systeemprompt bevat een aparte sectie **Huidige datum en tijd** wanneer de tijdzone van de gebruiker bekend is. Om de prompt cache-stabiel te houden, bevat deze nu alleen de **tijdzone** (geen dynamische klok of tijdnotatie).

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart bevat een timestampregel. Dezelfde tool kan optioneel een modelspecifieke override per sessie instellen (`model=default` wist deze).

Configureer met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Datum en tijd](/nl/date-time) voor volledige gedragsdetails.

## Skills

Wanneer in aanmerking komende skills bestaan, injecteert OpenClaw een compacte **lijst met beschikbare skills** (`formatSkillsForPrompt`) die het **bestandspad** voor elke skill bevat. De prompt instrueert het model om `read` te gebruiken om de SKILL.md op de vermelde locatie te laden (werkruimte, beheerd of gebundeld). Als er geen skills in aanmerking komen, wordt de Skills-sectie weggelaten.

In aanmerking komen omvat skill-metadata-gates, runtime-omgeving-/configcontroles en de effectieve allowlist voor agent-skills wanneer `agents.defaults.skills` of `agents.list[].skills` is geconfigureerd.

Door plugins gebundelde skills komen alleen in aanmerking wanneer hun eigenaar-plugin is ingeschakeld. Hierdoor kunnen toolplugins diepere operationele gidsen aanbieden zonder al die richtlijnen direct in elke toolbeschrijving in te bedden.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dit houdt de basisprompt klein terwijl gericht skillgebruik nog steeds mogelijk blijft.

Het budget voor de skillslijst is eigendom van het skillssubsysteem:

- Globale standaard: `skills.limits.maxSkillsPromptChars`
- Override per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generieke begrensde runtimefragmenten gebruiken een ander oppervlak:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Die scheiding houdt skillgroottes gescheiden van runtime-read-/injectiegroottes zoals `memory_get`, live toolresultaten en AGENTS.md-verversingen na Compaction.

## Documentatie

De systeemprompt bevat een sectie **Documentatie**. Wanneer lokale documentatie beschikbaar is, verwijst deze naar de lokale OpenClaw-documentatiemap (`docs/` in een Git-checkout of de gebundelde npm-pakketdocumentatie). Als lokale documentatie niet beschikbaar is, valt deze terug op [https://docs.openclaw.ai](https://docs.openclaw.ai).

Dezelfde sectie bevat ook de OpenClaw-bronlocatie. Git-checkouts tonen de lokale bronroot, zodat de agent code direct kan inspecteren. Pakketinstallaties bevatten de GitHub-bron-URL en vertellen de agent de bron daar te bekijken wanneer de documentatie onvolledig of verouderd is. De prompt vermeldt ook de openbare documentatiespiegel, de community-Discord en ClawHub ([https://clawhub.ai](https://clawhub.ai)) voor skillontdekking. De prompt vertelt het model eerst de documentatie te raadplegen voor OpenClaw-gedrag, opdrachten, configuratie of architectuur, en zelf `openclaw status` uit te voeren wanneer mogelijk (en de gebruiker alleen te vragen wanneer het geen toegang heeft). Specifiek voor configuratie verwijst deze agents naar de `gateway`-toolactie `config.schema.lookup` voor exacte veldniveau-documentatie en beperkingen, daarna naar `docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md` voor bredere richtlijnen.

## Gerelateerd

- [Agentruntime](/nl/concepts/agent)
- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Contextengine](/nl/concepts/context-engine)
