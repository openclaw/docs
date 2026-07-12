---
read_when:
    - Tekst van de systeemprompt, lijst met tools of tijd-/Heartbeat-secties bewerken
    - Gedrag voor workspace-bootstrap of injectie van Skills wijzigen
summary: Wat de systeemprompt van OpenClaw bevat en hoe deze wordt samengesteld
title: Systeemprompt
x-i18n:
    generated_at: "2026-07-12T08:51:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw bouwt voor elke agentuitvoering een eigen systeemprompt; er is geen standaardprompt tijdens runtime.

De samenstelling bestaat uit drie lagen:

- `buildAgentSystemPrompt` genereert de prompt op basis van expliciete invoer. Deze blijft een pure renderer en leest de globale configuratie niet rechtstreeks.
- `resolveAgentSystemPromptConfig` bepaalt voor een specifieke agent de configuratiegestuurde promptinstellingen (weergave van de eigenaar, TTS-hints, modelaliassen, modus voor geheugenverwijzingen en delegatiemodus voor subagents).
- Runtime-adapters (ingebed, CLI, opdracht-/exportvoorbeelden, compaction) verzamelen actuele gegevens (tools, sandboxstatus, kanaalmogelijkheden, contextbestanden en promptbijdragen van providers) en roepen de geconfigureerde promptfacade aan.

Zo blijven geëxporteerde prompts en foutopsporingsprompts afgestemd op live-uitvoeringen, zonder elk runtimedetail in één monolithische builder onder te brengen.

Providerplugins kunnen cachebewuste richtlijnen toevoegen zonder de prompt van OpenClaw te vervangen. Een providerruntime kan:

- een van drie benoemde kernsecties vervangen: `interaction_style`, `tool_call_style`, `execution_bias`
- een **stabiel voorvoegsel** boven de promptcachegrens invoegen
- een **dynamisch achtervoegsel** onder de promptcachegrens invoegen

Gebruik bijdragen van providers voor modelspecifieke afstemming per modelfamilie. Reserveer de verouderde hook `before_prompt_build` voor compatibiliteit of werkelijk globale promptwijzigingen.

De gebundelde overlay voor de OpenAI/Codex GPT-5-familie (`resolveGpt5SystemPromptContribution`) gebruikt dit mechanisme: een gedragscontract in `stablePrefix` (uitvoeringsbeleid, tooldiscipline, uitvoercontract en voltooiingscontract), plus een optionele overschrijving van `interaction_style` voor een vriendelijkere toon. Deze wordt toegepast op elke model-id `gpt-5*` die via de OpenAI- of Codex-plugins wordt gerouteerd en wordt beheerd met `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` of `"off"`).

## Structuur

De prompt is compact en bevat vaste secties:

- **Tooling**: herinnering dat gestructureerde tools de gezaghebbende bron zijn, plus runtimerichtlijnen voor toolgebruik. Wanneer de experimentele tool `update_plan` is ingeschakeld (`tools.experimental.planTool`), voegt de eigen toolbeschrijving het volgende toe: gebruik deze alleen voor niet-triviaal werk met meerdere stappen, houd maximaal één stap op `in_progress` en sla de tool over voor eenvoudig werk met één stap.
- **Uitvoeringsgerichtheid**: handel binnen de huidige beurt naar aanleiding van uitvoerbare verzoeken, ga door totdat het werk voltooid of geblokkeerd is, herstel van zwakke toolresultaten, controleer veranderlijke status live en verifieer voordat je afrondt.
- **Veiligheid**: korte herinnering aan de veiligheidsgrenzen tegen machtsgericht gedrag of het omzeilen van toezicht.
- **Skills** (indien beschikbaar): vertelt het model hoe het instructies voor Skills naar behoefte laadt.
- **OpenClaw-beheer**: geef de voorkeur aan de tool `gateway` voor configuratie- en herstartwerk; verzin geen CLI-opdrachten.
- **Zelfupdate van OpenClaw**: inspecteer de configuratie veilig met `config.schema.lookup`, wijzig deze met `config.patch`, vervang de volledige configuratie met `config.apply` en voer `update.run` alleen uit op expliciet verzoek van de gebruiker. De agentgerichte tool `gateway` weigert `tools.exec.ask` / `tools.exec.security` te herschrijven, inclusief verouderde aliassen van `tools.bash.*` die naar deze beschermde paden worden genormaliseerd.
- **Werkruimte**: werkmap (`agents.defaults.workspace`).
- **Documentatie**: pad naar lokale documentatie/broncode en wanneer die moet worden gelezen.
- **Werkruimtebestanden (ingevoegd)**: vermeldt dat bootstrapbestanden hieronder zijn opgenomen.
- **Sandbox** (wanneer ingeschakeld): gesandboxte runtime, sandboxpaden en beschikbaarheid van uitvoering met verhoogde rechten.
- **Huidige datum en tijd**: alleen de tijdzone (cachestabiel; de actuele klok komt van `session_status`).
- **Richtlijnen voor assistentuitvoer**: compacte syntaxis voor bijlagen, spraaknotities en antwoordtags.
- **Heartbeats**: Heartbeat-prompt en bevestigingsgedrag wanneer Heartbeats voor de standaardagent zijn ingeschakeld.
- **Runtime**: host, besturingssysteem, Node, model, hoofdmap van de repository (wanneer gedetecteerd) en denkniveau (één regel).
- **Redenering**: huidig zichtbaarheidsniveau plus de hint voor de schakeloptie `/reasoning`.

Grote stabiele inhoud (waaronder **Projectcontext**) blijft boven de interne promptcachegrens. Vluchtige secties per beurt (richtlijnen voor insluiting in de beheerinterface, **Berichten**, **Spraak**, **Groepschatcontext**, **Reacties**, **Heartbeats**, **Runtime**) worden onder die grens toegevoegd, zodat lokale backends met prefixcaches het stabiele werkruimtevoorvoegsel tussen kanaalbeurten kunnen hergebruiken. Toolbeschrijvingen moeten vermijden de huidige kanaalnamen op te nemen wanneer het geaccepteerde schema dat runtimedetail al bevat.

Tooling bevat ook richtlijnen voor langdurig werk:

- gebruik Cron voor toekomstige opvolging (`check back later`, herinneringen, terugkerend werk) in plaats van slaaplussen met `exec`, vertragingstrucs met `yieldMs` of herhaald pollen met `process`
- gebruik `exec` / `process` alleen voor opdrachten die nu starten en op de achtergrond doorgaan
- wanneer automatisch ontwaken bij voltooiing is ingeschakeld, start je de opdracht eenmaal en vertrouw je op het pushgebaseerde ontwaakpad
- gebruik `process` voor logboeken, status, invoer of ingrijpen bij een actieve opdracht
- geef bij grotere taken de voorkeur aan `sessions_spawn`; de voltooiing van subagents is pushgebaseerd en wordt automatisch aan de aanvrager gemeld
- pol `subagents list` / `sessions_list` niet in een lus alleen om op voltooiing te wachten

`agents.defaults.subagents.delegationMode` (standaard `"suggest"`) kan dit versterken. `"prefer"` voegt een speciale sectie **Delegatie aan subagents** toe, die de hoofdagent opdraagt als responsieve coördinator op te treden en alles wat ingewikkelder is dan een rechtstreeks antwoord via `sessions_spawn` uit te voeren. Dit gebeurt alleen via de prompt; het toolbeleid bepaalt nog steeds of `sessions_spawn` beschikbaar is.

Veiligheidsgrenzen in de systeemprompt zijn adviserend en worden niet afgedwongen. Gebruik toolbeleid, uitvoeringsgoedkeuringen, sandboxing en kanaaltoelatingslijsten voor harde handhaving; beheerders kunnen promptveiligheidsgrenzen bewust uitschakelen.

Op kanalen met ingebouwde goedkeuringskaarten/-knoppen vertelt de prompt de agent eerst op die interface te vertrouwen en alleen een handmatige opdracht `/approve` op te nemen wanneer het toolresultaat aangeeft dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring de enige mogelijkheid is.

## Promptmodi

OpenClaw genereert kleinere systeemprompts voor subagents. De runtime stelt per uitvoering een `promptMode` in (geen gebruikersgerichte configuratie):

- `full` (standaard): alle bovenstaande secties.
- `minimal`: gebruikt voor subagents; laat de geheugenpromptsectie (gebundeld als **Geheugenoproep**), **Zelfupdate van OpenClaw**, **Modelaliassen**, **Gebruikersidentiteit**, **Richtlijnen voor assistentuitvoer**, **Berichten**, **Stille antwoorden** en **Heartbeats** weg. Tooling, **Veiligheid**, **Skills** (indien meegeleverd), Werkruimte, Sandbox, Huidige datum en tijd (indien bekend), Runtime en ingevoegde context blijven beschikbaar.
- `none`: retourneert alleen de basisidentiteitsregel.

Onder `promptMode=minimal` krijgen extra ingevoegde prompts het label **Subagentcontext** in plaats van **Groepschatcontext**.

Voor automatische kanaalantwoorden laat OpenClaw de algemene sectie **Stille antwoorden** weg wanneer de context voor rechtstreekse chats, groepen of uitsluitend berichtentools al het contract voor zichtbare antwoorden bepaalt. Alleen de verouderde automatische groeps-/kanaalmodus toont `NO_REPLY`; rechtstreekse chats en antwoorden die uitsluitend berichtentools gebruiken, slaan richtlijnen voor stille tokens over.

## Promptmomentopnamen

OpenClaw bewaart vastgelegde promptmomentopnamen voor het standaardpad van de Codex-runtime onder `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ze genereren geselecteerde app-serverparameters voor threads/beurten plus een gereconstrueerde stapel promptlagen die aan het model is gekoppeld voor rechtstreekse Telegram-beurten, Discord-groepsbeurten en Heartbeat-beurten: een vastgezette Codex-modelpromptfixture voor `gpt-5.5`, de ontwikkelaarstekst voor machtigingen van het standaardpad van Codex, OpenClaw-ontwikkelaarsinstructies, beurtgebonden instructies voor de samenwerkingsmodus wanneer OpenClaw die levert, gebruikersinvoer voor de beurt en verwijzingen naar dynamische toolspecificaties.

Vernieuw de vastgezette Codex-modelpromptfixture met `pnpm prompt:snapshots:sync-codex-model`. Standaard zoekt deze eerst naar `$CODEX_HOME/models_cache.json`, vervolgens naar `~/.codex/models_cache.json` en daarna naar de gebruikelijke onderhouderscheckout `~/code/codex/codex-rs/models-manager/models.json`; als geen van deze bestanden bestaat, wordt het proces afgesloten zonder de vastgelegde fixture te wijzigen. Geef `--catalog <path>` door om te vernieuwen vanuit een specifiek bestand `models_cache.json` of `models.json`.

Deze momentopnamen zijn geen byte-voor-byte onbewerkte vastlegging van OpenAI-verzoeken. Codex kan runtimecontext van de werkruimte (`AGENTS.md`, omgevingscontext, herinneringen, app-/plugininstructies en ingebouwde instructies voor de samenwerkingsmodus Default) toevoegen nadat OpenClaw thread- en beurtparameters heeft verzonden.

Genereer ze opnieuw met `pnpm prompt:snapshots:gen`; controleer afwijkingen met `pnpm prompt:snapshots:check`. CI voert de afwijkingscontrole uit naast de shards voor aanvullende grenzen, zodat promptwijzigingen en momentopname-updates in dezelfde PR terechtkomen.

## Injectie van werkruimtebootstrap

Bootstrapbestanden worden vanuit de actieve werkruimte bepaald en naar het promptoppervlak geleid dat bij hun levensduur past:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (alleen in geheel nieuwe werkruimten)
- `MEMORY.md` indien aanwezig

In de systeemeigen Codex-harness voorkomt OpenClaw dat stabiele werkruimtebestanden in elke gebruikersbeurt worden herhaald. Codex laadt `AGENTS.md` via de eigen detectie van projectdocumentatie. `TOOLS.md` wordt doorgestuurd als overgenomen Codex-ontwikkelaarsinstructies. `SOUL.md`, `IDENTITY.md` en `USER.md` worden doorgestuurd als beurtgebonden ontwikkelaarsinstructies voor samenwerking, zodat systeemeigen Codex-subagents ze niet overnemen. De inhoud van `HEARTBEAT.md` wordt niet rechtstreeks ingevoegd; Heartbeat-beurten krijgen een notitie voor de samenwerkingsmodus die naar het bestand verwijst wanneer het bestaat en niet leeg is. De inhoud van `MEMORY.md` wordt evenmin in elke systeemeigen Codex-beurt geplakt: wanneer geheugentools voor de werkruimte beschikbaar zijn, krijgen Codex-beurten een korte notitie over werkruimtegeheugen die het model naar `memory_search` of `memory_get` verwijst. Als tools zijn uitgeschakeld, zoeken in het geheugen niet beschikbaar is of de actieve werkruimte afwijkt van de agentgeheugenwerkruimte, valt `MEMORY.md` terug op het normale begrensde pad voor beurtcontext. `BOOTSTRAP.md` behoudt de normale rol van beurtcontext.

In niet-Codex-harnesses worden bootstrapbestanden volgens hun bestaande voorwaarden in de OpenClaw-prompt samengesteld. `HEARTBEAT.md` wordt bij normale uitvoeringen weggelaten wanneer Heartbeats voor de standaardagent zijn uitgeschakeld of `agents.defaults.heartbeat.includeSystemPromptSection` onwaar is. Houd ingevoegde bestanden beknopt, vooral `MEMORY.md` buiten Codex: dit moet een zorgvuldig samengestelde langetermijnsamenvatting blijven, met gedetailleerde dagelijkse notities in `memory/*.md` die naar behoefte via `memory_search` / `memory_get` kunnen worden opgehaald. Te grote `MEMORY.md`-bestanden buiten Codex verhogen het promptgebruik en kunnen binnen de onderstaande limieten voor bootstrapbestanden gedeeltelijk worden ingevoegd.

<Note>
Dagelijkse bestanden in `memory/*.md` maken **geen** deel uit van de normale bootstrapprojectcontext. Tijdens gewone beurten worden ze naar behoefte via `memory_search` / `memory_get` geraadpleegd, zodat ze niet meetellen voor het contextvenster tenzij het model ze expliciet leest. Kale beurten met `/new` en `/reset` vormen de uitzondering: de runtime kan recent dagelijks geheugen als een eenmalig opstartcontextblok vóór die eerste beurt plaatsen.
</Note>

Grote bestanden worden afgekapt met een markering:

| Limiet                                      | Configuratiesleutel                                 | Standaard |
| ------------------------------------------- | --------------------------------------------------- | --------- |
| Maximumaantal tekens per bestand            | `agents.defaults.bootstrapMaxChars`                 | 20000     |
| Totaal voor alle bestanden                  | `agents.defaults.bootstrapTotalMaxChars`            | 60000     |
| Waarschuwing bij afkapping (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always`  |

Voor ontbrekende bestanden wordt een korte markering voor een ontbrekend bestand ingevoegd. Gedetailleerde aantallen voor onbewerkte en ingevoegde inhoud blijven beschikbaar in diagnostiek zoals `/context`, `/status`, doctor en logboeken.

Voor geheugenbestanden betekent afkapping geen gegevensverlies: het bestand blijft intact op schijf. In systeemeigen Codex wordt `MEMORY.md` naar behoefte via geheugentools gelezen wanneer die beschikbaar zijn, met anders een begrensde promptterugval. In andere harnesses ziet het model alleen de verkorte ingevoegde kopie totdat het geheugen rechtstreeks wordt gelezen of doorzocht. Als `MEMORY.md` herhaaldelijk wordt afgekapt, distilleer je het tot een kortere duurzame samenvatting, verplaats je gedetailleerde geschiedenis naar `memory/*.md` of verhoog je bewust de bootstraplimieten.

Sub-agentsessies injecteren alleen `AGENTS.md` en `TOOLS.md` (andere bootstrapbestanden worden uitgefilterd om de context van sub-agents klein te houden).

Interne hooks kunnen deze stap onderscheppen via de gebeurtenis `agent:bootstrap` om de geïnjecteerde bootstrapbestanden te wijzigen of te vervangen (bijvoorbeeld door `SOUL.md` te vervangen voor een alternatieve persona).

Begin met [persoonlijkheidsgids voor SOUL.md](/nl/concepts/soul) om minder generiek over te komen.

Gebruik `/context list` of `/context detail` om te bekijken hoeveel elk geïnjecteerd bestand bijdraagt (onbewerkt versus geïnjecteerd, afkapping en overhead van toolschema's). Zie [Context](/nl/concepts/context).

## Tijdverwerking

De sectie **Huidige datum en tijd** verschijnt alleen wanneer de tijdzone van de gebruiker bekend is en bevat alleen de **tijdzone** (geen dynamische klok of tijdnotatie), zodat de promptcache stabiel blijft.

Gebruik `session_status` wanneer de agent de huidige tijd nodig heeft; de statuskaart bevat een regel met een tijdstempel. Met dezelfde tool kan optioneel een modeloverschrijving per sessie worden ingesteld (`model=default` wist deze).

Configureer dit met:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Zie [Tijdzones](/nl/concepts/timezone) en [Datum en tijd](/nl/date-time) voor alle details over het gedrag.

## Skills

Wanneer geschikte Skills beschikbaar zijn, injecteert OpenClaw een compacte lijst `<available_skills>` (`formatSkillsForPrompt`) met voor elke Skill het **bestandspad** en een van de inhoud afgeleide markering `<version>sha256:...</version>`. De prompt instrueert het model om `read` te gebruiken om het bestand SKILL.md op de vermelde locatie (werkruimte, beheerd of meegeleverd) te laden en om een Skill opnieuw te lezen wanneer de `<version>` ervan afwijkt van een vorige beurt. Als er geen geschikte Skills zijn, wordt de sectie Skills weggelaten.

Native Codex-beurten ontvangen deze lijst als samenwerkingsinstructies voor ontwikkelaars die alleen voor die beurt gelden, in plaats van als gebruikersinvoer per beurt, met uitzondering van lichte Cron-beurten die de exacte geplande prompt behouden. Andere harnesses behouden de normale promptsectie.

De locatie kan verwijzen naar een geneste Skill, zoals `skills/personal/foo/SKILL.md`. Nesten dient alleen voor de organisatie; de prompt gebruikt de platte Skillnaam uit de frontmatter van `SKILL.md`.

Geschiktheid omvat poorten voor Skillmetadata, controles van de runtimeomgeving en -configuratie, en de effectieve toelatingslijst voor agent-Skills wanneer `agents.defaults.skills` of `agents.list[].skills` is geconfigureerd. Met Plugins meegeleverde Skills zijn alleen geschikt wanneer de Plugin waarvan ze deel uitmaken is ingeschakeld. Zo kunnen tool-Plugins uitgebreidere gebruikshandleidingen aanbieden zonder al die richtlijnen in elke toolbeschrijving op te nemen.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Hierdoor blijft de basisprompt klein, terwijl gericht gebruik van Skills mogelijk blijft. De maximale omvang wordt beheerd door het Skillssubsysteem, los van de algemene limieten voor lezen en injecteren tijdens runtime:

| Bereik       | Promptbudget voor Skills                           | Budget voor runtimefragmenten     |
| ------------ | ------------------------------------------------- | --------------------------------- |
| Globaal      | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*` |
| Per agent    | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`   |

Het budget voor runtimefragmenten omvat `memory_get`, live toolresultaten en vernieuwingen van `AGENTS.md` na Compaction.

## Documentatie

De sectie **Documentatie** verwijst naar lokale documentatie wanneer die beschikbaar is (`docs/` in een Git-check-out of de documentatie in het meegeleverde npm-pakket) en valt anders terug op [https://docs.openclaw.ai](https://docs.openclaw.ai). De sectie vermeldt ook de locatie van de OpenClaw-broncode: Git-check-outs tonen de lokale hoofdmap van de broncode, terwijl pakketinstallaties de GitHub-URL van de broncode tonen met instructies om de broncode daar te raadplegen wanneer de documentatie onvolledig of verouderd is.

De prompt presenteert de documentatie als de gezaghebbende bron voor zelfkennis over OpenClaw voordat het model begrijpt hoe OpenClaw werkt (geheugen/dagelijkse notities, sessies, tools, Gateway, configuratie, opdrachten en projectcontext), en instrueert het model om `AGENTS.md`, de projectcontext, werkruimte-/profiel-/geheugennotities en `memory_search` te behandelen als instructiecontext of gebruikersgeheugen, en niet als kennis over het ontwerp of de implementatie van OpenClaw. Als de documentatie geen informatie bevat of verouderd is, moet het model dit aangeven en de broncode inspecteren. De prompt instrueert het model ook om indien mogelijk zelf `openclaw status` uit te voeren en dit alleen aan de gebruiker te vragen wanneer het geen toegang heeft.

Specifiek voor configuratie verwijst de prompt agents eerst naar de actie `config.schema.lookup` van de tool `gateway` voor exacte documentatie en beperkingen op veldniveau, en vervolgens naar `docs/gateway/configuration.md` en `docs/gateway/configuration-reference.md` voor bredere richtlijnen.

## Gerelateerd

- [Agent-runtime](/nl/concepts/agent)
- [Agent-werkruimte](/nl/concepts/agent-workspace)
- [Contextengine](/nl/concepts/context-engine)
