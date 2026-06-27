---
doc-schema-version: 1
read_when:
    - Je wilt begrijpen welke tools OpenClaw biedt
    - Je kiest tussen ingebouwde tools, Skills en plugins
    - Je hebt het juiste docs-ingangspunt nodig voor toolbeleid, automatisering of agentcoördinatie
summary: 'Overzicht van OpenClaw-tools, Skills en plugins: wat agenten kunnen aanroepen en hoe je ze uitbreidt'
title: Overzicht
x-i18n:
    generated_at: "2026-06-27T18:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

Gebruik deze pagina om het juiste Capabilities-oppervlak te kiezen. **Tools** zijn aanroepbare
acties, **Skills** leren agents hoe ze moeten werken, en **Plugins** voegen runtime-
capaciteiten toe, zoals tools, providers, kanalen, hooks en verpakte Skills.

Dit is een overzichts- en routeringspagina. Gebruik
[Tools en aangepaste providers](/nl/gateway/config-tools) voor uitputtend toolbeleid, standaardinstellingen,
groepslidmaatschap, providerbeperkingen en configuratievelden.

## Begin hier

Begin voor de meeste agents met de ingebouwde toolcategorieën en pas daarna het beleid aan
alleen wanneer de agent minder tools mag zien of expliciete hosttoegang nodig heeft.

| Als je moet...                              | Gebruik dit eerst                             | Lees daarna                                                                                                    |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Een agent laten handelen met bestaande capaciteiten | [Ingebouwde tools](#built-in-tool-categories)  | [Toolcategorieën](#built-in-tool-categories)                                                                   |
| Beheren wat een agent kan aanroepen         | [Toolbeleid](#configure-access-and-approvals) | [Tools en aangepaste providers](/nl/gateway/config-tools)                                                          |
| Een agent een workflow leren                | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/nl/tools/skills), [Skills maken](/nl/tools/creating-skills), en [Skill Workshop](/nl/tools/skill-workshop)    |
| Een nieuwe integratie of nieuw runtime-oppervlak toevoegen | [Plugins](#extend-capabilities)                | [Plugins](/nl/tools/plugin) en [Plugins bouwen](/nl/plugins/building-plugins)                                        |
| Werk later of op de achtergrond uitvoeren   | [Automatisering](/nl/automation)                  | [Overzicht van automatisering](/nl/automation)                                                                     |
| Meerdere agents of harnesses coordineren    | [Subagents](/nl/tools/subagents)                 | [ACP-agents](/nl/tools/acp-agents) en [Agent verzenden](/nl/tools/agent-send)                                        |
| Een grote OpenClaw-toolcatalogus doorzoeken | [Tool zoeken](/nl/tools/tool-search)              | [Tool zoeken](/nl/tools/tool-search)                                                                               |

## Kies tools, Skills of Plugins

<Steps>
  <Step title="Gebruik een tool wanneer de agent moet handelen">
    Een tool is een getypeerde functie die de agent kan aanroepen, zoals `exec`, `browser`,
    `web_search`, `message`, of `image_generate`. Gebruik tools wanneer de agent
    gegevens moet lezen, bestanden moet wijzigen, berichten moet verzenden, een provider moet aanroepen of
    een ander systeem moet bedienen. Zichtbare tools worden als gestructureerde functiedefinities
    naar het model verzonden.

    Het model ziet alleen tools die overblijven na het actieve profiel, allow/deny-
    beleid, providerbeperkingen, sandboxstatus, kanaalmachtigingen en
    beschikbaarheid van Plugins.

  </Step>

  <Step title="Gebruik een Skill wanneer de agent instructies nodig heeft">
    Een Skill is een `SKILL.md`-instructiepakket dat in de agentprompt wordt geladen. Gebruik een
    Skill wanneer de agent al de benodigde tools heeft, maar een herhaalbare
    workflow, beoordelingsrubriek, opdrachtenreeks of operationele beperking nodig heeft.

    Skills kunnen zich bevinden in een workspace, gedeelde Skill-map, beheerde OpenClaw
    Skill-root of Plugin-pakket.

    [Skills](/nl/tools/skills) | [Skill Workshop](/nl/tools/skill-workshop) | [Skills maken](/nl/tools/creating-skills) | [Skills-configuratie](/nl/tools/skills-config)

  </Step>

  <Step title="Gebruik een Plugin wanneer OpenClaw een nieuwe capaciteit nodig heeft">
    Een Plugin kan tools, Skills, kanalen, modelproviders, spraak, realtime
    voice, mediageneratie, webzoekopdrachten, web-fetch, hooks en andere runtime-
    capaciteiten toevoegen. Gebruik een Plugin wanneer de capaciteit code, aanmeldgegevens,
    lifecycle-hooks, manifestmetadata of installeerbare verpakking heeft. Bestaande
    Plugins kunnen worden geinstalleerd vanuit ClawHub, npm, git, lokale mappen of
    archieven.

    [Plugins installeren en configureren](/nl/tools/plugin) | [Plugins bouwen](/nl/plugins/building-plugins) | [Plugin SDK](/nl/plugins/sdk-overview)

  </Step>
</Steps>

## Ingebouwde toolcategorieën

De tabel toont representatieve tools, zodat je het oppervlak kunt herkennen. Dit is
niet de volledige beleidsreferentie. Gebruik [Tools en aangepaste providers](/nl/gateway/config-tools)
voor exacte groepen, standaardinstellingen en allow/deny-semantiek.

| Categorie               | Gebruik wanneer de agent moet...                                             | Representatieve tools                                                | Lees daarna                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Runtime                 | Opdrachten uitvoeren, processen beheren of provider-ondersteunde Python-analyse gebruiken | `exec`, `process`, `code_execution`                                  | [Exec](/nl/tools/exec), [Code-uitvoering](/nl/tools/code-execution)                               |
| Bestanden               | Workspace-bestanden lezen en wijzigen                                         | `read`, `write`, `edit`, `apply_patch`                               | [Patch toepassen](/nl/tools/apply-patch)                                                        |
| Web                     | Het web doorzoeken, X-berichten doorzoeken of leesbare pagina-inhoud ophalen  | `web_search`, `x_search`, `web_fetch`                                | [Webtools](/nl/tools/web), [Web-fetch](/nl/tools/web-fetch)                                       |
| Browser                 | Een browsersessie bedienen                                                    | `browser`                                                            | [Browser](/nl/tools/browser)                                                                   |
| Berichten en kanalen    | Antwoorden of kanaalacties verzenden                                          | `message`                                                            | [Agent verzenden](/nl/tools/agent-send)                                                        |
| Sessies en agents       | Sessies inspecteren, werk delegeren, een andere run sturen of status rapporteren | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`   | [Doel](/nl/tools/goal), [Subagents](/nl/tools/subagents), [Sessietool](/nl/concepts/session-tool)    |
| Automatisering          | Werk plannen of reageren op achtergrondgebeurtenissen                         | `cron`, `heartbeat_respond`                                          | [Automatisering](/nl/automation)                                                               |
| Gateway en nodes        | Gateway-status of gekoppelde doelapparaten inspecteren                        | `gateway`, `nodes`                                                   | [Gateway-configuratie](/nl/gateway/configuration), [Nodes](/nl/nodes)                             |
| Media                   | Media analyseren, genereren of uitspreken                                     | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Mediaoverzicht](/nl/tools/media-overview)                                                     |
| Grote OpenClaw-catalogi | Veel in aanmerking komende tools zoeken en aanroepen zonder elk schema naar het model te sturen | `tool_search_code`, `tool_search`, `tool_describe`                   | [Tool zoeken](/nl/tools/tool-search)                                                           |

<Note>
Tool zoeken is een experimenteel OpenClaw-agentoppervlak. Codex-harnessruns gebruiken
Codex-native codemodus, native toolzoeken, uitgestelde dynamische tools en geneste
toolaanroepen in plaats van `tools.toolSearch`.
</Note>

## Door Plugins geleverde tools

Plugins kunnen aanvullende tools registreren. Plugin-auteurs verbinden tools via
`api.registerTool(...)` en `contracts.tools` van het manifest; gebruik
[Plugin SDK](/nl/plugins/sdk-overview) en [Plugin-manifest](/nl/plugins/manifest)
voor contractdetails.

Veelvoorkomende door Plugins geleverde tools zijn:

- [Diffs](/nl/tools/diffs) voor het renderen van bestands- en markdown-diffs
- [LLM Task](/nl/tools/llm-task) voor workflowstappen met alleen JSON
- [Lobster](/nl/tools/lobster) voor getypeerde workflows met hervatbare goedkeuringen
- [Tokenjuice](/nl/tools/tokenjuice) voor het compacter maken van ruisige `exec`- en `bash`-tooluitvoer
- [Tool zoeken](/nl/tools/tool-search) voor het ontdekken en aanroepen van grote toolcatalogi zonder elk schema in de prompt te plaatsen
- [Canvas](/nl/plugins/reference/canvas) voor Node Canvas-besturing en A2UI-
  rendering

## Toegang en goedkeuringen configureren

Toolbeleid wordt afgedwongen voor de modelaanroep. Als beleid een tool verwijdert, ontvangt het
model het schema van die tool niet voor de beurt. Een run kan tools kwijtraken
door globale configuratie, configuratie per agent, kanaalbeleid, provider-
beperkingen, sandboxregels, kanaal-/runtimebeleid of beschikbaarheid van Plugins.

- [Tools en aangepaste providers](/nl/gateway/config-tools) documenteert toolprofielen,
  allow/deny-lijsten, providerspecifieke beperkingen, lusdetectie en
  provider-ondersteunde toolinstellingen.
- [Exec-goedkeuringen](/nl/tools/exec-approvals) documenteert het goedkeuringsbeleid
  voor hostopdrachten.
- [Verhoogde exec](/nl/tools/elevated) documenteert gecontroleerde uitvoering buiten de
  sandbox.
- [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) legt uit welke laag bestands- en procestoegang beheert.
- [Sandbox- en toolbeperkingen per agent](/nl/tools/multi-agent-sandbox-tools)
  documenteert agentspecifieke beperkingen voor gedelegeerde runs.

## Capaciteiten uitbreiden

Kies het extensiepad op basis van het werk dat OpenClaw moet uitvoeren:

- Installeer of beheer een bestaande Plugin met [Plugins](/nl/tools/plugin).
- Bouw een nieuwe integratie, provider, kanaal, tool of hook met
  [Plugins bouwen](/nl/plugins/building-plugins).
- Voeg herbruikbare agentinstructies toe of stem ze af met [Skills](/nl/tools/skills) en
  [Skills maken](/nl/tools/creating-skills).
- Gebruik [Plugin SDK](/nl/plugins/sdk-overview) en [Plugin-manifest](/nl/plugins/manifest) wanneer je implementatiecontracten nodig hebt.

## Ontbrekende tools oplossen

Als het model een tool niet kan zien of aanroepen, begin dan met het effectieve beleid voor de
huidige beurt:

1. Controleer het actieve profiel, `tools.allow`, en `tools.deny` in
   [Tools en aangepaste providers](/nl/gateway/config-tools).
2. Controleer providerspecifieke beperkingen in
   [Tools en aangepaste providers](/nl/gateway/config-tools) en bevestig dat de geselecteerde
   [modelprovider](/nl/concepts/model-providers) de toolvorm ondersteunt.
3. Controleer kanaalmachtigingen, sandboxstatus en verhoogde toegang met
   [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) en [Verhoogde exec](/nl/tools/elevated).
4. Controleer of de eigenaar-Plugin is geinstalleerd en ingeschakeld in
   [Plugins](/nl/tools/plugin).
5. Controleer voor gedelegeerde runs de beperkingen per agent in
   [Sandbox- en toolbeperkingen per agent](/nl/tools/multi-agent-sandbox-tools).
6. Bevestig voor grote OpenClaw-catalogi of de run directe toolblootstelling of
   [Tool zoeken](/nl/tools/tool-search) gebruikt.

## Gerelateerd

- [Automatisering](/nl/automation) voor cron, taken, heartbeat, verplichtingen, hooks, standing orders en Task Flow
- [Agents](/nl/concepts/agent) voor het agentmodel, sessies, geheugen en multi-agentcoordinatie
- [Tools en aangepaste providers](/nl/gateway/config-tools) voor de canonieke referentie voor toolbeleid
- [Plugins](/nl/tools/plugin) voor installatie en beheer van Plugins
- [Plugin SDK](/nl/plugins/sdk-overview) voor de referentie voor Plugin-auteurs
- [Skills](/nl/tools/skills) voor laadvolgorde, gating en configuratie van Skills
- [Skill Workshop](/nl/tools/skill-workshop) voor gegenereerde en beoordeelde Skill-creatie
- [Tool zoeken](/nl/tools/tool-search) voor compacte ontdekking van OpenClaw-toolcatalogi
