---
doc-schema-version: 1
read_when:
    - Je wilt begrijpen welke tools OpenClaw biedt
    - Je kiest tussen ingebouwde tools, Skills en Plugins
    - Je hebt het juiste documentatie-ingangspunt nodig voor toolbeleid, automatisering of agentcoördinatie
summary: 'Overzicht van OpenClaw-tools, Skills en plugins: wat agenten kunnen aanroepen en hoe je ze uitbreidt'
title: Overzicht
x-i18n:
    generated_at: "2026-05-12T01:00:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

Gebruik deze pagina om het juiste Capabilities-oppervlak te kiezen. **Tools** zijn aanroepbare
acties, **Skills** leren agents hoe ze moeten werken, en **plugins** voegen runtime-
capabilities toe, zoals tools, providers, kanalen, hooks en verpakte Skills.

Dit is een overzichts- en routeringspagina. Gebruik
[Tools en aangepaste providers](/nl/gateway/config-tools) voor uitputtend toolbeleid, standaarden,
groepslidmaatschap, providerbeperkingen en configuratievelden.

## Begin hier

Begin voor de meeste agents met de ingebouwde toolcategorieën en pas daarna het beleid aan
alleen wanneer de agent minder tools mag zien of expliciete hosttoegang nodig heeft.

| Als je dit wilt...                          | Gebruik dit eerst                              | Lees daarna                                                            |
| ------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Een agent laten handelen met bestaande capabilities | [Ingebouwde tools](#built-in-tool-categories) | [Toolcategorieën](#built-in-tool-categories)                           |
| Bepalen wat een agent kan aanroepen         | [Toolbeleid](#configure-access-and-approvals) | [Tools en aangepaste providers](/nl/gateway/config-tools)                 |
| Een agent een workflow leren                | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/nl/tools/skills) en [Skills maken](/nl/tools/creating-skills)      |
| Een nieuwe integratie of runtime-oppervlak toevoegen | [Plugins](#extend-capabilities)          | [Plugins](/nl/tools/plugin) en [Plugins bouwen](/nl/plugins/building-plugins) |
| Werk later of op de achtergrond uitvoeren   | [Automatisering](/nl/automation)                  | [Automatiseringsoverzicht](/nl/automation)                                |
| Meerdere agents of harnassen coördineren    | [Sub-agents](/nl/tools/subagents)                 | [ACP-agents](/nl/tools/acp-agents) en [Agent send](/nl/tools/agent-send)     |
| Een grote PI-toolcatalogus doorzoeken       | [Tool Search](/nl/tools/tool-search)              | [Tool Search](/nl/tools/tool-search)                                      |

## Kies tools, Skills of plugins

<Steps>
  <Step title="Gebruik een tool wanneer de agent moet handelen">
    Een tool is een getypeerde functie die de agent kan aanroepen, zoals `exec`, `browser`,
    `web_search`, `message` of `image_generate`. Gebruik tools wanneer de agent
    gegevens moet lezen, bestanden moet wijzigen, berichten moet verzenden, een provider moet aanroepen of
    een ander systeem moet bedienen. Zichtbare tools worden naar het model verzonden als gestructureerde functie-
    definities.

    Het model ziet alleen tools die het actieve profiel, allow/deny-
    beleid, providerbeperkingen, sandboxstatus, kanaalmachtigingen en
    pluginbeschikbaarheid doorstaan.

  </Step>

  <Step title="Gebruik een Skill wanneer de agent instructies nodig heeft">
    Een Skill is een `SKILL.md`-instructiepakket dat in de agentprompt wordt geladen. Gebruik een
    Skill wanneer de agent de benodigde tools al heeft, maar een herhaalbare
    workflow, beoordelingsrubriek, opdrachtreeks of operationele beperking nodig heeft.

    Skills kunnen zich bevinden in een workspace, gedeelde Skill-directory, beheerde OpenClaw
    Skill-root of pluginpakket.

    [Skills](/nl/tools/skills) | [Skills maken](/nl/tools/creating-skills) | [Skills-configuratie](/nl/tools/skills-config)

  </Step>

  <Step title="Gebruik een plugin wanneer OpenClaw een nieuwe capability nodig heeft">
    Een plugin kan tools, Skills, kanalen, modelproviders, spraak, realtime
    voice, mediageneratie, webzoekfuncties, web fetch, hooks en andere runtime-
    capabilities toevoegen. Gebruik een plugin wanneer de capability code, referenties,
    lifecycle-hooks, manifestmetadata of installeerbare packaging heeft. Bestaande
    plugins kunnen worden geïnstalleerd vanuit ClawHub, npm, git, lokale directory's of
    archieven.

    [Plugins installeren en configureren](/nl/tools/plugin) | [Plugins bouwen](/nl/plugins/building-plugins) | [Plugin SDK](/nl/plugins/sdk-overview)

  </Step>
</Steps>

## Ingebouwde toolcategorieën

De tabel vermeldt representatieve tools zodat je het oppervlak kunt herkennen. Dit is
niet de volledige beleidsreferentie. Gebruik [Tools en aangepaste providers](/nl/gateway/config-tools)
voor exacte groepen, standaarden en allow/deny-
semantiek.

| Categorie              | Gebruik wanneer de agent dit moet...                                           | Representatieve tools                                                | Lees daarna                                                           |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Runtime                | Opdrachten uitvoeren, processen beheren of provider-backed Python-analyse gebruiken | `exec`, `process`, `code_execution`                                  | [Exec](/nl/tools/exec), [Code execution](/nl/tools/code-execution)           |
| Bestanden              | Workspacebestanden lezen en wijzigen                                           | `read`, `write`, `edit`, `apply_patch`                               | [Apply patch](/nl/tools/apply-patch)                                      |
| Web                    | Het web doorzoeken, X-posts doorzoeken of leesbare pagina-inhoud ophalen       | `web_search`, `x_search`, `web_fetch`                                | [Webtools](/nl/tools/web), [Web fetch](/nl/tools/web-fetch)                  |
| Browser                | Een browsersessie bedienen                                                     | `browser`                                                            | [Browser](/nl/tools/browser)                                              |
| Berichten en kanalen   | Antwoorden of kanaalacties verzenden                                           | `message`                                                            | [Agent send](/nl/tools/agent-send)                                        |
| Sessies en agents      | Sessies inspecteren, werk delegeren, een andere run sturen of status rapporteren | `sessions_*`, `subagents`, `agents_list`, `session_status`           | [Sub-agents](/nl/tools/subagents), [Sessietool](/nl/concepts/session-tool)   |
| Automatisering         | Werk plannen of reageren op achtergrondgebeurtenissen                          | `cron`, `heartbeat_respond`                                          | [Automatisering](/nl/automation)                                          |
| Gateway en nodes       | Gateway-status of gekoppelde doelapparaten inspecteren                         | `gateway`, `nodes`                                                   | [Gateway-configuratie](/nl/gateway/configuration), [Nodes](/nl/nodes)        |
| Media                  | Media analyseren, genereren of uitspreken                                      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Mediaoverzicht](/nl/tools/media-overview)                                |
| Grote PI-catalogi      | Veel in aanmerking komende tools zoeken en aanroepen zonder elk schema naar het model te verzenden | `tool_search_code`, `tool_search`, `tool_describe`                   | [Tool Search](/nl/tools/tool-search)                                      |

<Note>
Tool Search is een experimenteel PI-agent-oppervlak. Codex-harnasruns gebruiken
Codex-native codemodus, native tool search, uitgestelde dynamische tools en geneste
toolaanroepen in plaats van `tools.toolSearch`.
</Note>

## Door plugins geleverde tools

Plugins kunnen aanvullende tools registreren. Plugin-auteurs koppelen tools via
`api.registerTool(...)` en de `contracts.tools` van het manifest; gebruik
[Plugin SDK](/nl/plugins/sdk-overview) en [Pluginmanifest](/nl/plugins/manifest)
voor contractdetails.

Veelvoorkomende door plugins geleverde tools zijn:

- [Diffs](/nl/tools/diffs) voor het renderen van bestands- en markdown-diffs
- [LLM Task](/nl/tools/llm-task) voor JSON-only workflowstappen
- [Lobster](/nl/tools/lobster) voor getypeerde workflows met hervatbare goedkeuringen
- [Tokenjuice](/nl/tools/tokenjuice) voor het compacter maken van lawaaierige `exec`- en `bash`-tool
  uitvoer
- [Tool Search](/nl/tools/tool-search) voor het ontdekken en aanroepen van grote tool-
  catalogi zonder elk schema in de prompt te plaatsen
- [Canvas](/nl/plugins/reference/canvas) voor node Canvas-besturing en A2UI-
  rendering

## Toegang en goedkeuringen configureren

Toolbeleid wordt afgedwongen vóór de modelaanroep. Als beleid een tool verwijdert, ontvangt het
model het schema van die tool niet voor de beurt. Een run kan tools verliezen
door globale configuratie, per-agentconfiguratie, kanaalbeleid, provider-
beperkingen, sandboxregels, owner-only gating of pluginbeschikbaarheid.

- [Tools en aangepaste providers](/nl/gateway/config-tools) documenteert toolprofielen,
  allow/deny-lijsten, providerspecifieke beperkingen, lusdetectie en
  provider-backed toolinstellingen.
- [Exec-goedkeuringen](/nl/tools/exec-approvals) documenteert hostopdrachtgoedkeurings-
  beleid.
- [Verhoogde exec](/nl/tools/elevated) documenteert gecontroleerde uitvoering buiten de
  sandbox.
- [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) legt uit welke laag bestands- en procestoegang beheert.
- [Per-agent sandbox- en toolbeperkingen](/nl/tools/multi-agent-sandbox-tools)
  documenteert agentspecifieke beperkingen voor gedelegeerde runs.

## Capabilities uitbreiden

Kies het uitbreidingspad op basis van de taak die OpenClaw moet uitvoeren:

- Installeer of beheer een bestaande plugin met [Plugins](/nl/tools/plugin).
- Bouw een nieuwe integratie, provider, kanaal, tool of hook met
  [Plugins bouwen](/nl/plugins/building-plugins).
- Voeg herbruikbare agentinstructies toe of stem ze af met [Skills](/nl/tools/skills) en
  [Skills maken](/nl/tools/creating-skills).
- Verpak herbruikbaar workflowmateriaal met
  [Skill workshop](/nl/plugins/skill-workshop) wanneer de workflow thuishoort in een
  door een plugin gedistribueerde Skill-bundel.
- Gebruik [Plugin SDK](/nl/plugins/sdk-overview) en [Pluginmanifest](/nl/plugins/manifest) wanneer je implementatiecontracten nodig hebt.

## Ontbrekende tools oplossen

Als het model een tool niet kan zien of aanroepen, begin dan met het effectieve beleid voor de
huidige beurt:

1. Controleer het actieve profiel, `tools.allow` en `tools.deny` in
   [Tools en aangepaste providers](/nl/gateway/config-tools).
2. Controleer providerspecifieke beperkingen in
   [Tools en aangepaste providers](/nl/gateway/config-tools) en bevestig dat de geselecteerde
   [modelprovider](/nl/concepts/model-providers) de toolvorm ondersteunt.
3. Controleer kanaalmachtigingen, sandboxstatus en verhoogde toegang met
   [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) en [Verhoogde exec](/nl/tools/elevated).
4. Controleer of de eigenaarplugin is geïnstalleerd en ingeschakeld in
   [Plugins](/nl/tools/plugin).
5. Controleer voor gedelegeerde runs de per-agentbeperkingen in
   [Per-agent sandbox- en toolbeperkingen](/nl/tools/multi-agent-sandbox-tools).
6. Bevestig voor grote PI-catalogi of de run directe toolblootstelling of
   [Tool Search](/nl/tools/tool-search) gebruikt.

## Gerelateerd

- [Automatisering](/nl/automation) voor cron, taken, Heartbeat, commitments, hooks, standing orders en Task Flow
- [Agents](/nl/concepts/agent) voor het agentmodel, sessies, geheugen en multi-agentcoördinatie
- [Tools en aangepaste providers](/nl/gateway/config-tools) voor de canonieke toolbeleidsreferentie
- [Plugins](/nl/tools/plugin) voor plugininstallatie en -beheer
- [Plugin SDK](/nl/plugins/sdk-overview) voor de referentie voor pluginauteurs
- [Skills](/nl/tools/skills) voor Skill-laadvolgorde, gating en configuratie
- [Tool Search](/nl/tools/tool-search) voor compacte ontdekking van PI-toolcatalogi
