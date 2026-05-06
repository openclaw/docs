---
read_when:
    - Systeemprompttekst, hulpmiddelenlijst of tijd-/Heartbeat-secties bewerken
    - Gedrag voor werkruimte-initialisatie of Skills-injectie wijzigen
summary: Wat de OpenClaw-systeemprompt bevat en hoe die wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-05-06T09:11:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt voor elke agent-run een aangepaste systeemprompt. De prompt is **eigendom van OpenClaw** en gebruikt niet de standaardprompt van pi-coding-agent.

De prompt wordt door OpenClaw samengesteld en in elke agent-run geïnjecteerd.

Provider-plugins kunnen cachebewuste promptaanwijzingen bijdragen zonder de volledige prompt die eigendom is van OpenClaw te vervangen. De providerruntime kan:

- een kleine set benoemde kernsecties vervangen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- een **stabiel voorvoegsel** boven de promptcachegrens injecteren
- een **dynamisch achtervoegsel** onder de promptcachegrens injecteren

Gebruik bijdragen die eigendom zijn van de provider voor modelspecifieke afstemming per modelfamilie. Houd legacy
`before_prompt_build`-promptmutatie voor compatibiliteit of werkelijk globale promptwijzigingen, niet voor normaal providergedrag.

De overlay voor de OpenAI GPT-5-familie houdt de kernregel voor uitvoering klein en voegt modelspecifieke aanwijzingen toe voor persona-verankering, beknopte output, tooldiscipline, parallel opzoeken, dekking van opleveringen, verificatie, ontbrekende context en hygiëne rond terminaltools.

## Structuur

De prompt is bewust compact en gebruikt vaste secties:

- **Tooling**: herinnering dat gestructureerde tools de bron van waarheid zijn, plus runtime-aanwijzingen voor toolgebruik.
- **Uitvoeringsbias**: compacte aanwijzingen voor opvolging: handel binnen de beurt bij uitvoerbare verzoeken, ga door tot het klaar is of geblokkeerd raakt, herstel van zwakke toolresultaten, controleer veranderlijke staat live en verifieer vóór afronding.
- **Veiligheid**: korte herinnering aan vangrails om machtszoekend gedrag of het omzeilen van toezicht te vermijden.
- **Skills** (wanneer beschikbaar): vertelt het model hoe skill-instructies op aanvraag moeten worden geladen.
- **OpenClaw Self-Update**: hoe je configuratie veilig inspecteert met
  `config.schema.lookup`, configuratie patcht met `config.patch`, de volledige configuratie vervangt met `config.apply` en `update.run` alleen uitvoert op expliciet verzoek van de gebruiker. De owner-only `gateway`-tool weigert ook
  `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief legacy `tools.bash.*`-aliassen die naar die beschermde exec-paden normaliseren.
- **Werkruimte**: werkdirectory (`agents.defaults.workspace`).
- **Documentatie**: lokaal pad naar OpenClaw-documentatie (repo of npm-pakket) en wanneer deze te lezen.
- **Werkruimtebestanden (geïnjecteerd)**: geeft aan dat bootstrapbestanden hieronder zijn opgenomen.
- **Sandbox** (wanneer ingeschakeld): geeft sandboxruntime, sandboxpaden en of verhoogde exec beschikbaar is aan.
- **Huidige datum en tijd**: alleen tijdzone (cache-stabiel; de live klok komt uit `session_status`).
- **Antwoordtags**: optionele syntaxis voor antwoordtags voor ondersteunde providers.
- **Heartbeats**: heartbeatprompt en ack-gedrag, wanneer heartbeats zijn ingeschakeld voor de standaardagent.
- **Runtime**: host, OS, node, model, repo-root (wanneer gedetecteerd), denkniveau (één regel).
- **Redenering**: huidig zichtbaarheidsniveau + hint voor de /reasoning-schakelaar.

OpenClaw houdt grote stabiele inhoud, inclusief **Projectcontext**, boven de interne promptcachegrens. Vluchtige kanaal-/sessiesecties zoals aanwijzingen voor Control UI-embeds, **Berichten**, **Spraak**, **Groepschatcontext**,
**Reacties**, **Heartbeats** en **Runtime** worden onder die grens toegevoegd, zodat lokale backends met prefixcaches het stabiele werkruimtevoorvoegsel kunnen hergebruiken tussen kanaalbeurten. Toolbeschrijvingen moeten eveneens vermijden huidige kanaalnamen op te nemen wanneer het geaccepteerde schema dat runtimedetail al bevat.

De Tooling-sectie bevat ook runtime-aanwijzingen voor langlopend werk:

- gebruik Cron voor toekomstige opvolging (`check back later`, herinneringen, terugkerend werk) in plaats van `exec`-slaaplussen, `yieldMs`-vertragingstrucs of herhaaldelijke `process`-polling
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond blijven draaien
- wanneer automatisch wekken bij voltooiing is ingeschakeld, start je de opdracht één keer en vertrouw je op het push-gebaseerde wekpad wanneer het output geeft of faalt
- gebruik `process` voor logs, status, invoer of ingrijpen wanneer je een draaiende opdracht moet inspecteren
- als de taak groter is, geef de voorkeur aan `sessions_spawn`; voltooiing van sub-agents is push-gebaseerd en kondigt zichzelf automatisch terug aan bij de aanvrager
- poll `subagents list` / `sessions_list` niet in een lus alleen om op voltooiing te wachten

Wanneer de experimentele `update_plan`-tool is ingeschakeld, vertelt Tooling het model ook deze alleen te gebruiken voor niet-triviaal werk met meerdere stappen, precies één
`in_progress`-stap te behouden en te vermijden het hele plan na elke update te herhalen.

Veiligheidsvangrails in de systeemprompt zijn adviserend. Ze sturen modelgedrag maar dwingen geen beleid af. Gebruik toolbeleid, exec-goedkeuringen, sandboxing en kanaal-allowlists voor harde afdwinging; operators kunnen deze bewust uitschakelen.

Op kanalen met native goedkeuringskaarten/-knoppen vertelt de runtimeprompt de agent nu eerst op die native goedkeurings-UI te vertrouwen. Hij moet alleen een handmatige
`/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring het enige pad is.

## Promptmodi

OpenClaw kan kleinere systeemprompts renderen voor sub-agents. De runtime stelt voor elke run een
`promptMode` in (geen gebruikersgerichte configuratie):

- `full` (standaard): bevat alle bovenstaande secties.
- `minimal`: gebruikt voor sub-agents; laat **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** en **Heartbeats** weg. Tooling, **Safety**,
  Werkruimte, Sandbox, Huidige datum en tijd (wanneer bekend), Runtime en geïnjecteerde context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Wanneer `promptMode=minimal` is, worden extra geïnjecteerde prompts gelabeld als **Subagentcontext** in plaats van **Groepschatcontext**.

Voor kanaal-auto-reply-runs kan OpenClaw de generieke sectie **Stille antwoorden** weglaten wanneer de directe/groepschatcontext het opgeloste gesprekspecifieke
`NO_REPLY`-gedrag al bevat. Dit voorkomt herhaling van tokenmechanica in zowel de globale systeemprompt als de kanaalcontext.

## Prompt-snapshots

OpenClaw bewaart gecommitte prompt-snapshots voor het gelukkige pad van de Codex-runtime onder
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ze renderen geselecteerde app-server-thread-/turn-parameters plus een gereconstrueerde modelgebonden promptlaagstack voor Telegram-direct, Discord-groep en heartbeat-beurten. Die stack bevat een vastgezette Codex `gpt-5.5`-modelpromptfixture die is gegenereerd uit de vorm van Codex' modelcatalogus/cache, de ontwikkelaarstekst voor Codex-rechten op het gelukkige pad, OpenClaw-ontwikkelaarsinstructies, beurtgebonden instructies voor samenwerkingsmodus wanneer OpenClaw die levert, gebruikersinvoer voor de beurt en verwijzingen naar de dynamische toolspecificaties.

Ververs de vastgezette Codex-modelpromptfixture met
`pnpm prompt:snapshots:sync-codex-model`. Standaard zoekt het script naar Codex' runtimecache in `$CODEX_HOME/models_cache.json`, daarna in
`~/.codex/models_cache.json`, en valt pas daarna terug op de conventie voor de maintainer-Codex-checkout op `~/code/codex/codex-rs/models-manager/models.json`. Als geen van die bronnen bestaat, stopt de opdracht zonder de gecommitte fixture te wijzigen. Geef `--catalog <path>` mee om te verversen vanuit een specifiek `models_cache.json`- of `models.json`-bestand.

Deze snapshots zijn nog steeds geen byte-voor-byte ruwe OpenAI-requestcapture. Codex kan runtime-eigen werkruimtecontext toevoegen, zoals `AGENTS.md`, omgevingscontext, herinneringen, app-/plugin-instructies en ingebouwde Default-instructies voor samenwerkingsmodus binnen de Codex-runtime nadat OpenClaw thread- en turn-parameters verstuurt.

Genereer ze opnieuw met `pnpm prompt:snapshots:gen` en verifieer drift met
`pnpm prompt:snapshots:check`. CI voert de driftcontrole uit in de aanvullende boundary-shard, zodat promptwijzigingen en snapshotupdates aan dezelfde PR gekoppeld blijven.

## Injectie van werkruimte-bootstrap

Bootstrapbestanden worden ingekort en toegevoegd onder **Projectcontext**, zodat het model identiteit en profielcontext ziet zonder expliciete leesacties nodig te hebben:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen op volledig nieuwe werkruimten)
- `MEMORY.md` wanneer aanwezig

Al deze bestanden worden bij elke beurt **in het contextvenster geïnjecteerd**, tenzij een bestandsspecifieke gate van toepassing is. `HEARTBEAT.md` wordt bij normale runs weggelaten wanneer heartbeats zijn uitgeschakeld voor de standaardagent of
`agents.defaults.heartbeat.includeSystemPromptSection` false is. Houd geïnjecteerde bestanden beknopt — vooral `MEMORY.md`, dat na verloop van tijd kan groeien en kan leiden tot onverwacht hoog contextgebruik en vaker voorkomende Compaction.

Wanneer een sessie draait op de native Codex-harness, laadt Codex `AGENTS.md`
via zijn eigen projectdocumentdetectie. OpenClaw lost nog steeds de resterende bootstrapbestanden op en stuurt ze door als Codex-configuratie-instructies, zodat `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` en
`MEMORY.md` dezelfde rol voor werkruimtecontext behouden zonder
`AGENTS.md` te dupliceren.

<Note>
`memory/*.md`-dagbestanden maken **geen** deel uit van de normale bootstrap-Projectcontext. Bij gewone beurten worden ze op aanvraag benaderd via de tools `memory_search` en `memory_get`, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale `/new`- en `/reset`-beurten zijn de uitzondering: de runtime kan recente dagelijkse herinnering vooraf toevoegen als een eenmalig startup-contextblok voor die eerste beurt.
</Note>

Grote bestanden worden afgekapt met een markering. De maximale grootte per bestand wordt beheerd door
`agents.defaults.bootstrapMaxChars` (standaard: 12000). De totale geïnjecteerde bootstrapinhoud over bestanden heen wordt begrensd door `agents.defaults.bootstrapTotalMaxChars`
(standaard: 60000). Ontbrekende bestanden injecteren een korte markering voor ontbrekend bestand. Wanneer afkapping plaatsvindt, kan OpenClaw een beknopte waarschuwing in de systeemprompt injecteren; beheer dit met
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
standaard: `once`). Gedetailleerde ruwe/geïnjecteerde aantallen blijven in diagnostiek zoals
`/context`, `/status`, doctor en logs.

Sub-agent-sessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrapbestanden worden uitgefilterd om de sub-agentcontext klein te houden).

Interne hooks kunnen deze stap onderscheppen via `agent:bootstrap` om de geïnjecteerde bootstrapbestanden te muteren of te vervangen (bijvoorbeeld door `SOUL.md` te verwisselen voor een alternatieve persona).

Als je de agent minder generiek wilt laten klinken, begin dan met de
[SOUL.md Persoonlijkheidsgids](/nl/concepts/soul).

Gebruik `/context list` of `/context detail` om te inspecteren hoeveel elk geïnjecteerd bestand bijdraagt (ruw versus geïnjecteerd, afkapping, plus overhead van toolschema's). Zie [Context](/nl/concepts/context).

## Tijdafhandeling

De systeemprompt bevat een speciale sectie **Huidige datum en tijd** wanneer de gebruikerstijdzone bekend is. Om de prompt cache-stabiel te houden, bevat deze nu alleen de **tijdzone** (geen dynamische klok of tijdnotatie).

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart bevat een tijdstempelregel. Dezelfde tool kan optioneel een modelspecifieke override per sessie instellen (`model=default` wist deze).

Configureer met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Datum en tijd](/nl/date-time) voor volledige gedragsdetails.

## Skills

Wanneer geschikte Skills bestaan, injecteert OpenClaw een compacte **lijst met beschikbare Skills**
(`formatSkillsForPrompt`) die het **bestandspad** voor elke Skill bevat. De prompt instrueert het model om `read` te gebruiken om de SKILL.md op de vermelde locatie te laden (werkruimte, beheerd of gebundeld). Als er geen Skills geschikt zijn, wordt de Skills-sectie weggelaten.

Geschiktheid omvat gates voor skillmetadata, runtimeomgeving-/configuratiecontroles en de effectieve allowlist voor agent-Skills wanneer `agents.defaults.skills` of
`agents.list[].skills` is geconfigureerd.

Door plugins gebundelde Skills zijn alleen geschikt wanneer hun eigenaar-plugin is ingeschakeld. Hierdoor kunnen toolplugins diepere bedieningsgidsen aanbieden zonder al die aanwijzingen direct in elke toolbeschrijving op te nemen.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dit houdt de basisprompt klein, terwijl gericht gebruik van Skills mogelijk blijft.

Het budget voor de Skills-lijst is eigendom van het Skills-subsysteem:

- Globale standaard: `skills.limits.maxSkillsPromptChars`
- Overschrijving per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generieke begrensde runtime-uittreksels gebruiken een ander oppervlak:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Die splitsing houdt de groottebepaling van Skills gescheiden van de groottebepaling voor runtime-lezen/injectie, zoals `memory_get`, live tool-resultaten en AGENTS.md-verversingen na Compaction.

## Documentatie

De systeemprompt bevat een sectie **Documentatie**. Wanneer lokale documentatie beschikbaar is, verwijst deze naar de lokale OpenClaw-documentatiemap (`docs/` in een Git-checkout of de documentatie van het gebundelde npm-pakket). Als lokale documentatie niet beschikbaar is, valt deze terug op [https://docs.openclaw.ai](https://docs.openclaw.ai).

Dezelfde sectie bevat ook de OpenClaw-bronlocatie. Git-checkouts maken de lokale bronroot zichtbaar, zodat de agent de code rechtstreeks kan inspecteren. Pakketinstallaties bevatten de GitHub-bron-URL en vertellen de agent om de bron daar te bekijken wanneer de documentatie onvolledig of verouderd is. De prompt vermeldt ook de openbare documentatiespiegel, de community-Discord en ClawHub ([https://clawhub.ai](https://clawhub.ai)) voor het ontdekken van Skills. Deze vertelt het model om eerst de documentatie te raadplegen voor OpenClaw-gedrag, opdrachten, configuratie of architectuur, en om waar mogelijk zelf `openclaw status` uit te voeren (waarbij de gebruiker alleen wordt gevraagd wanneer het geen toegang heeft). Specifiek voor configuratie verwijst deze agents naar de `gateway`-toolactie `config.schema.lookup` voor exacte documentatie en beperkingen op veldniveau, en daarna naar `docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md` voor bredere richtlijnen.

## Gerelateerd

- [Agent-runtime](/nl/concepts/agent)
- [Agent-werkruimte](/nl/concepts/agent-workspace)
- [Context-engine](/nl/concepts/context-engine)
