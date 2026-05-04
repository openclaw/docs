---
read_when:
    - Systeemprompttekst, lijst met tools of tijd-/Heartbeat-secties bewerken
    - Werkruimte-initialisatie- of Skills-injectiegedrag wijzigen
summary: Wat de systeemprompt van OpenClaw bevat en hoe deze wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-05-04T07:04:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt een aangepaste systeemprompt voor elke agent-run. De prompt is **eigendom van OpenClaw** en gebruikt niet de standaardprompt van pi-coding-agent.

De prompt wordt door OpenClaw samengesteld en in elke agent-run geïnjecteerd.

Provider-plugins kunnen cachebewuste promptrichtlijnen bijdragen zonder de volledige prompt die eigendom is van OpenClaw te vervangen. De provider-runtime kan:

- een kleine set benoemde kernsecties vervangen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- een **stabiel prefix** boven de promptcachegrens injecteren
- een **dynamisch suffix** onder de promptcachegrens injecteren

Gebruik provider-eigen bijdragen voor modelspecifieke afstemming per modelfamilie. Houd legacy
`before_prompt_build`-promptmutatie voor compatibiliteit of echt globale promptwijzigingen, niet voor normaal providergedrag.

De OpenAI GPT-5-familieoverlay houdt de kernregel voor uitvoering klein en voegt modelspecifieke richtlijnen toe voor persona-latching, beknopte uitvoer, tooldiscipline, parallel opzoeken, dekking van opleveringen, verificatie, ontbrekende context en hygiëne voor terminaltools.

## Structuur

De prompt is bewust compact en gebruikt vaste secties:

- **Tooling**: herinnering aan gestructureerde tools als bron van waarheid plus runtime-richtlijnen voor toolgebruik.
- **Uitvoeringsvoorkeur**: compacte richtlijnen voor doorpakken: handel binnen dezelfde beurt bij uitvoerbare verzoeken, ga door tot het klaar is of geblokkeerd raakt, herstel van zwakke toolresultaten, controleer veranderlijke status live en verifieer voordat je afrondt.
- **Veiligheid**: korte guardrail-herinnering om machtszoekend gedrag of het omzeilen van toezicht te vermijden.
- **Skills** (indien beschikbaar): vertelt het model hoe het skill-instructies op aanvraag laadt.
- **OpenClaw Self-Update**: hoe je config veilig inspecteert met
  `config.schema.lookup`, config patcht met `config.patch`, de volledige
  config vervangt met `config.apply`, en `update.run` alleen uitvoert op expliciet gebruikersverzoek. De owner-only `gateway`-tool weigert ook
  `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief legacy `tools.bash.*`-aliassen die normaliseren naar die beschermde exec-paden.
- **Werkruimte**: werkdirectory (`agents.defaults.workspace`).
- **Documentatie**: lokaal pad naar OpenClaw-documentatie (repo of npm-pakket) en wanneer die gelezen moet worden.
- **Werkruimtebestanden (geïnjecteerd)**: geeft aan dat bootstrapbestanden hieronder zijn opgenomen.
- **Sandbox** (wanneer ingeschakeld): geeft de gesandboxte runtime, sandboxpaden en of verhoogde exec beschikbaar is aan.
- **Huidige datum en tijd**: lokale tijd van de gebruiker, tijdzone en tijdnotatie.
- **Antwoordtags**: optionele syntaxis voor antwoordtags voor ondersteunde providers.
- **Heartbeats**: heartbeat-prompt en ack-gedrag, wanneer heartbeats zijn ingeschakeld voor de standaardagent.
- **Runtime**: host, OS, node, model, repo-root (wanneer gedetecteerd), denkniveau (één regel).
- **Redenering**: huidig zichtbaarheidsniveau + hint voor /reasoning-schakelaar.

OpenClaw houdt grote stabiele content, inclusief **Projectcontext**, boven de interne promptcachegrens. Vluchtige kanaal-/sessiesecties zoals Control UI-inbedrichtlijnen, **Berichten**, **Spraak**, **Groepschatcontext**, **Reacties**, **Heartbeats** en **Runtime** worden onder die grens toegevoegd, zodat lokale backends met prefixcaches het stabiele werkruimteprefix over kanaalbeurten heen kunnen hergebruiken. Toolbeschrijvingen zouden eveneens moeten vermijden huidige kanaalnamen in te bedden wanneer het geaccepteerde schema dat runtimedetail al draagt.

De Tooling-sectie bevat ook runtime-richtlijnen voor langlopende werkzaamheden:

- gebruik cron voor toekomstige follow-up (`check back later`, herinneringen, terugkerend werk) in plaats van `exec`-slaaplussen, `yieldMs`-vertragingstrucs of herhaaldelijk `process` pollen
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond blijven draaien
- wanneer automatisch wekken bij voltooiing is ingeschakeld, start je de opdracht één keer en vertrouw je op het push-gebaseerde wekpad wanneer het uitvoer produceert of faalt
- gebruik `process` voor logs, status, invoer of interventie wanneer je een draaiende opdracht moet inspecteren
- als de taak groter is, geef dan de voorkeur aan `sessions_spawn`; voltooiing van subagents is push-gebaseerd en meldt zich automatisch terug bij de aanvrager
- poll `subagents list` / `sessions_list` niet in een lus alleen om op voltooiing te wachten

Wanneer de experimentele `update_plan`-tool is ingeschakeld, vertelt Tooling het model ook deze alleen te gebruiken voor niet-triviaal meerstapswerk, precies één `in_progress`-stap aan te houden en te vermijden na elke update het hele plan te herhalen.

Veiligheids-guardrails in de systeemprompt zijn adviserend. Ze sturen modelgedrag maar dwingen geen beleid af. Gebruik toolbeleid, exec-goedkeuringen, sandboxing en kanaal-allowlists voor harde afdwinging; operators kunnen deze bewust uitschakelen.

Op kanalen met native goedkeuringskaarten/-knoppen vertelt de runtimeprompt de agent nu eerst op die native goedkeurings-UI te vertrouwen. De agent moet alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring de enige route is.

## Promptmodi

OpenClaw kan kleinere systeemprompts renderen voor subagents. De runtime stelt voor elke run een
`promptMode` in (geen gebruikersgerichte config):

- `full` (standaard): bevat alle bovenstaande secties.
- `minimal`: gebruikt voor subagents; laat **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Modelaliassen**, **Gebruikersidentiteit**, **Antwoordtags**,
  **Berichten**, **Stille antwoorden** en **Heartbeats** weg. Tooling, **Veiligheid**,
  Werkruimte, Sandbox, Huidige datum en tijd (wanneer bekend), Runtime en geïnjecteerde context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Wanneer `promptMode=minimal`, worden extra geïnjecteerde prompts gelabeld als **Subagentcontext** in plaats van **Groepschatcontext**.

Voor runs met automatisch antwoorden via kanalen kan OpenClaw de generieke sectie **Stille antwoorden** weglaten wanneer de directe/groepschatcontext al het opgeloste gespreksspecifieke `NO_REPLY`-gedrag bevat. Dit voorkomt herhaling van tokenmechanica in zowel de globale systeemprompt als de kanaalcontext.

## Promptsnapshots

OpenClaw bewaart gecommitte promptsnapshots voor het gelukkige pad van de Codex-runtime onder
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ze renderen geselecteerde app-server-thread-/turn-params plus een gereconstrueerde modelgebonden promptlaagstack voor Telegram-direct, Discord-groep en heartbeat-beurten. Die stack bevat een gepinde Codex `gpt-5.5`-modelpromptfixture gegenereerd uit Codex' modelcatalogus-/cachevorm, de Codex-ontwikkelaarstekst voor happy-path-permissies, OpenClaw-ontwikkelaarsinstructies, beurtgebonden instructies voor samenwerkingsmodus wanneer OpenClaw die levert, gebruikersinvoer voor de beurt en verwijzingen naar de dynamische toolspecificaties.

Ververs de gepinde Codex-modelpromptfixture met
`pnpm prompt:snapshots:sync-codex-model`. Standaard zoekt het script naar Codex' runtimecache op `$CODEX_HOME/models_cache.json`, daarna
`~/.codex/models_cache.json`, en pas daarna valt het terug op de maintainer-Codex-checkoutconventie op `~/code/codex/codex-rs/models-manager/models.json`. Als geen van die bronnen bestaat, sluit de opdracht af zonder de gecommitte fixture te wijzigen. Geef `--catalog <path>` mee om te verversen vanuit een specifiek `models_cache.json`- of `models.json`-bestand.

Deze snapshots zijn nog steeds geen byte-voor-byte ruwe OpenAI-requestcapture. Codex kan runtime-eigen werkruimtecontext toevoegen zoals `AGENTS.md`, omgevingscontext, memories, app-/plugininstructies en ingebouwde Default-instructies voor samenwerkingsmodus binnen de Codex-runtime nadat OpenClaw thread- en turn-params heeft verzonden.

Genereer ze opnieuw met `pnpm prompt:snapshots:gen` en verifieer drift met
`pnpm prompt:snapshots:check`. CI voert de driftcontrole uit in de aanvullende boundary-shard zodat promptwijzigingen en snapshotupdates aan dezelfde PR gekoppeld blijven.

## Injectie van werkruimte-bootstrap

Bootstrapbestanden worden ingekort en toegevoegd onder **Projectcontext** zodat het model identiteit en profielcontext ziet zonder expliciete reads nodig te hebben:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen op gloednieuwe werkruimtes)
- `MEMORY.md` wanneer aanwezig

Al deze bestanden worden **in het contextvenster geïnjecteerd** bij elke beurt tenzij een bestandsspecifieke gate van toepassing is. `HEARTBEAT.md` wordt bij normale runs weggelaten wanneer heartbeats zijn uitgeschakeld voor de standaardagent of
`agents.defaults.heartbeat.includeSystemPromptSection` false is. Houd geïnjecteerde bestanden beknopt — vooral `MEMORY.md`, dat na verloop van tijd kan groeien en kan leiden tot onverwacht hoog contextgebruik en frequentere Compaction.

Wanneer een sessie op de native Codex-harness draait, laadt Codex `AGENTS.md` via zijn eigen projectdoc-discovery. OpenClaw resolved nog steeds de resterende bootstrapbestanden en stuurt ze door als Codex-configinstructies, zodat `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` en
`MEMORY.md` dezelfde werkruimtecontextrol behouden zonder `AGENTS.md` te dupliceren.

<Note>
Dagelijkse bestanden in `memory/*.md` maken **geen** deel uit van de normale bootstrap-Projectcontext. Op gewone beurten worden ze op aanvraag benaderd via de tools `memory_search` en `memory_get`, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale `/new`- en `/reset`-beurten zijn de uitzondering: de runtime kan recente dagelijkse memory vooraf toevoegen als een eenmalig startup-contextblok voor die eerste beurt.
</Note>

Grote bestanden worden afgekapt met een marker. De maximale grootte per bestand wordt beheerd door
`agents.defaults.bootstrapMaxChars` (standaard: 12000). De totale geïnjecteerde bootstrapcontent over bestanden heen wordt begrensd door `agents.defaults.bootstrapTotalMaxChars`
(standaard: 60000). Ontbrekende bestanden injecteren een korte marker voor ontbrekend bestand. Wanneer afkapping optreedt, kan OpenClaw een beknopte waarschuwingsmelding in de systeemprompt injecteren; beheer dit met
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
standaard: `once`). Gedetailleerde raw-/geïnjecteerde aantallen blijven beschikbaar in diagnostics zoals
`/context`, `/status`, doctor en logs.

Subagentsessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrapbestanden worden eruit gefilterd om de subagentcontext klein te houden).

Interne hooks kunnen deze stap onderscheppen via `agent:bootstrap` om de geïnjecteerde bootstrapbestanden te muteren of te vervangen (bijvoorbeeld `SOUL.md` omwisselen voor een alternatieve persona).

Als je de agent minder generiek wilt laten klinken, begin dan met
[SOUL.md Persoonlijkheidsgids](/nl/concepts/soul).

Gebruik `/context list` of `/context detail` om te inspecteren hoeveel elk geïnjecteerd bestand bijdraagt (raw versus geïnjecteerd, afkapping, plus overhead van toolschema's). Zie [Context](/nl/concepts/context).

## Tijdverwerking

De systeemprompt bevat een speciale sectie **Huidige datum en tijd** wanneer de tijdzone van de gebruiker bekend is. Om de prompt cache-stabiel te houden, bevat deze nu alleen de **tijdzone** (geen dynamische klok of tijdnotatie).

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart bevat een timestampregel. Dezelfde tool kan optioneel een modelspecifieke override per sessie instellen (`model=default` wist die).

Configureer met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Datum en tijd](/nl/date-time) voor volledige gedragsdetails.

## Skills

Wanneer geschikte skills bestaan, injecteert OpenClaw een compacte **lijst met beschikbare skills**
(`formatSkillsForPrompt`) die het **bestandspad** voor elke skill bevat. De prompt instrueert het model `read` te gebruiken om de SKILL.md op de vermelde locatie te laden (werkruimte, beheerd of gebundeld). Als er geen skills geschikt zijn, wordt de sectie Skills weggelaten.

Geschiktheid omvat gates voor skillmetadata, runtime-omgeving-/configcontroles en de effectieve allowlist voor agentskills wanneer `agents.defaults.skills` of
`agents.list[].skills` is geconfigureerd.

Plugin-gebundelde skills zijn alleen geschikt wanneer hun eigenaar-Plugin is ingeschakeld. Hierdoor kunnen tool-plugins diepere bedieningsgidsen aanbieden zonder al die richtlijnen direct in elke toolbeschrijving in te bedden.

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

- Globale standaardwaarde: `skills.limits.maxSkillsPromptChars`
- Overschrijving per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Algemene begrensde runtime-fragmenten gebruiken een ander oppervlak:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Die scheiding houdt Skills-grootte gescheiden van de grootte voor runtime-lezen/-injectie, zoals `memory_get`, live toolresultaten en AGENTS.md-verversingen na Compaction.

## Documentatie

De systeemprompt bevat een sectie **Documentatie**. Wanneer lokale documentatie beschikbaar is, verwijst deze naar de lokale OpenClaw-documentatiemap (`docs/` in een Git-checkout of de gebundelde documentatie van het npm-pakket). Als lokale documentatie niet beschikbaar is, valt deze terug op [https://docs.openclaw.ai](https://docs.openclaw.ai).

Dezelfde sectie bevat ook de OpenClaw-bronlocatie. Git-checkouts tonen de lokale bronroot zodat de agent code rechtstreeks kan inspecteren. Pakketinstallaties bevatten de GitHub-bron-URL en vertellen de agent de bron daar te bekijken wanneer de documentatie onvolledig of verouderd is. De prompt vermeldt ook de openbare documentatiespiegel, community-Discord en ClawHub ([https://clawhub.ai](https://clawhub.ai)) voor het ontdekken van Skills. Deze vertelt het model eerst de documentatie te raadplegen voor OpenClaw-gedrag, opdrachten, configuratie of architectuur, en waar mogelijk zelf `openclaw status` uit te voeren (waarbij de gebruiker alleen wordt gevraagd wanneer er geen toegang is). Specifiek voor configuratie wijst deze agents op de `gateway`-toolactie `config.schema.lookup` voor exacte documentatie en beperkingen op veldniveau, en daarna op `docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md` voor bredere richtlijnen.

## Gerelateerd

- [Agent-runtime](/nl/concepts/agent)
- [Agent-werkruimte](/nl/concepts/agent-workspace)
- [Context-engine](/nl/concepts/context-engine)
