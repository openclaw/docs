---
doc-schema-version: 1
read_when:
    - U wilt weten welke tools OpenClaw biedt
    - Je kiest tussen ingebouwde tools, Skills en plugins
    - Je hebt het juiste startpunt in de documentatie nodig voor toolbeleid, automatisering of agentcoördinatie
summary: 'Overzicht van OpenClaw-tools, Skills en plugins: wat agents kunnen aanroepen en hoe je ze kunt uitbreiden'
title: Overzicht
x-i18n:
    generated_at: "2026-07-12T09:29:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Gebruik deze pagina om het juiste oppervlak voor mogelijkheden te kiezen. **Tools** zijn
aanroepbare acties, **Skills** leren agents hoe ze moeten werken en **Plugins** voegen
runtime-mogelijkheden toe, zoals tools, providers, kanalen, hooks en gebundelde
Skills.

Dit is een overzichts- en routeringspagina. Raadpleeg voor volledig toolbeleid, standaardinstellingen,
groepslidmaatschap, providerbeperkingen en configuratievelden
[Tools en aangepaste providers](/nl/gateway/config-tools).

## Begin hier

Begin voor de meeste agents met de ingebouwde toolcategorieën en pas daarna het beleid
alleen aan wanneer de agent minder tools moet zien of expliciete hosttoegang nodig heeft.

| Als je het volgende wilt...                              | Gebruik dit eerst                                      | Lees daarna                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Een agent laten handelen met bestaande mogelijkheden    | [Ingebouwde tools](#built-in-tool-categories)          | [Toolcategorieën](#built-in-tool-categories)                                                                             |
| Bepalen wat een agent kan aanroepen                      | [Toolbeleid](#configure-access-and-approvals)           | [Tools en aangepaste providers](/nl/gateway/config-tools)                                                                   |
| Een agent een workflow leren                             | [Skills](#choose-tools-skills-or-plugins)               | [Skills](/nl/tools/skills), [Skills maken](/nl/tools/creating-skills) en [Skill-workshop](/nl/tools/skill-workshop)               |
| Een nieuwe integratie of nieuw runtime-oppervlak toevoegen | [Plugins](#extend-capabilities)                      | [Plugins](/nl/tools/plugin) en [Plugins bouwen](/nl/plugins/building-plugins)                                                   |
| Werk later of op de achtergrond uitvoeren               | [Automatisering](/nl/automation)                           | [Overzicht van automatisering](/nl/automation)                                                                              |
| Meerdere agents of harnassen coördineren                 | [Subagents](/nl/tools/subagents)                           | [ACP-agents](/nl/tools/acp-agents) en [Agent verzenden](/nl/tools/agent-send)                                                   |
| Een grote OpenClaw-toolcatalogus doorzoeken              | [Tools zoeken](/nl/tools/tool-search)                      | [Tools zoeken](/nl/tools/tool-search)                                                                                        |

## Kies tools, Skills of Plugins

<Steps>
  <Step title="Gebruik een tool wanneer de agent moet handelen">
    Een tool is een getypeerde functie die de agent kan aanroepen, zoals `exec`, `browser`,
    `web_search`, `message` of `image_generate`. Gebruik tools wanneer de agent
    gegevens moet lezen, bestanden moet wijzigen, berichten moet verzenden, een provider moet aanroepen of
    een ander systeem moet bedienen. Zichtbare tools worden als gestructureerde
    functiedefinities naar het model verzonden.

    Het model ziet alleen tools die overblijven na toepassing van het actieve profiel, het toestaan/weigeren-
    beleid, providerbeperkingen, de sandboxstatus, kanaalmachtigingen en
    de beschikbaarheid van Plugins.

  </Step>

  <Step title="Gebruik een Skill wanneer de agent instructies nodig heeft">
    Een Skill is een `SKILL.md`-instructiepakket dat in de agentprompt wordt geladen. Gebruik
    een Skill wanneer de agent al over de benodigde tools beschikt, maar een
    herhaalbare workflow, beoordelingsrubriek, opdrachtenreeks of operationele
    beperking nodig heeft.

    Skills kunnen zich bevinden in een werkruimte, een gedeelde Skill-map, een beheerde OpenClaw-
    hoofdmap voor Skills of een Plugin-pakket.

    [Skills](/nl/tools/skills) | [Skill-workshop](/nl/tools/skill-workshop) | [Skills maken](/nl/tools/creating-skills) | [Skills-configuratie](/nl/tools/skills-config)

  </Step>

  <Step title="Gebruik een Plugin wanneer OpenClaw een nieuwe mogelijkheid nodig heeft">
    Een Plugin kan tools, Skills, kanalen, modelproviders, spraak,
    realtime spraak, mediageneratie, zoeken op het web, webinhoud ophalen, hooks en andere
    runtime-mogelijkheden toevoegen. Gebruik een Plugin wanneer de mogelijkheid code,
    referenties, lifecycle-hooks, manifestmetadata of installeerbare
    verpakking bevat. Bestaande Plugins kunnen worden geïnstalleerd vanuit ClawHub, npm, git,
    lokale mappen of archieven.

    [Plugins installeren en configureren](/nl/tools/plugin) | [Plugins bouwen](/nl/plugins/building-plugins) | [Plugin-SDK](/nl/plugins/sdk-overview)

  </Step>
</Steps>

## Categorieën van ingebouwde tools

De tabel bevat representatieve tools, zodat je het oppervlak kunt herkennen. Dit is
niet de volledige beleidsreferentie. Raadpleeg voor exacte groepen, standaardinstellingen en de semantiek van toestaan/weigeren
[Tools en aangepaste providers](/nl/gateway/config-tools).

| Categorie                 | Gebruik wanneer de agent het volgende moet doen...                              | Representatieve tools                                                                                 | Lees daarna                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Runtime                   | Opdrachten uitvoeren, processen beheren of door een provider ondersteunde Python-analyse gebruiken | `exec`, `process`, `code_execution`                                               | [Exec](/nl/tools/exec), [Code-uitvoering](/nl/tools/code-execution)                                     |
| Bestanden                 | Werkruimtebestanden lezen en wijzigen                                             | `read`, `write`, `edit`, `apply_patch`                                                                | [Patch toepassen](/nl/tools/apply-patch)                                                             |
| Web                       | Het web of berichten op X doorzoeken, of leesbare pagina-inhoud ophalen           | `web_search`, `x_search`, `web_fetch`                                                                 | [Webtools](/nl/tools/web), [Webinhoud ophalen](/nl/tools/web-fetch)                                     |
| Browser                   | Een browsersessie bedienen                                                        | `browser`                                                                                             | [Browser](/nl/tools/browser)                                                                         |
| Berichten en kanalen      | Antwoorden of kanaalacties verzenden                                               | `message`                                                                                             | [Agent verzenden](/nl/tools/agent-send)                                                              |
| Sessies en agents         | Sessies inspecteren, werk delegeren, een andere uitvoering bijsturen of status rapporteren | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Doel](/nl/tools/goal), [Subagents](/nl/tools/subagents), [Sessietool](/nl/concepts/session-tool) |
| Automatisering            | Werk plannen of reageren op achtergrondgebeurtenissen                              | `cron`, `heartbeat_respond`                                                                           | [Automatisering](/nl/automation)                                                                     |
| Gateway en nodes          | De Gateway-status of gekoppelde doelapparaten inspecteren                          | `gateway`, `nodes`                                                                                    | [Gateway-configuratie](/nl/gateway/configuration), [Nodes](/nl/nodes)                                   |
| Media                     | Media analyseren, genereren of uitspreken                                           | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                  | [Mediaoverzicht](/nl/tools/media-overview)                                                           |
| Grote OpenClaw-catalogi   | Veel geschikte tools zoeken en aanroepen zonder elk schema naar het model te sturen | `tool_search_code`, `tool_search`, `tool_describe`                                                  | [Tools zoeken](/nl/tools/tool-search)                                                                |

<Note>
Tools zoeken is een experimenteel agentoppervlak van OpenClaw. Uitvoeringen met het Codex-harnas gebruiken
de systeemeigen codemodus van Codex, systeemeigen toolzoekfunctionaliteit, uitgestelde dynamische tools en
geneste toolaanroepen in plaats van `tools.toolSearch`.
</Note>

## Door Plugins geleverde tools

Plugins kunnen aanvullende tools registreren. Auteurs van Plugins koppelen tools via
`api.registerTool(...)` en `contracts.tools` van het manifest; raadpleeg
[Plugin-SDK](/nl/plugins/sdk-overview) en [Plugin-manifest](/nl/plugins/manifest)
voor details over contracten.

Veelvoorkomende door Plugins geleverde tools zijn:

- [Verschillen](/nl/tools/diffs) voor het weergeven van verschillen in bestanden en Markdown
- [Widget weergeven](/tools/show-widget) voor zelfstandige inline-SVG en -HTML in webchat
- [LLM-taak](/nl/tools/llm-task) voor workflowstappen met uitsluitend JSON
- [Lobster](/nl/tools/lobster) voor getypeerde workflows met hervatbare goedkeuringen
- [Tokenjuice](/nl/tools/tokenjuice) voor het compacter maken van uitvoer met veel ruis van de tools `exec` en `bash`
- [Tools zoeken](/nl/tools/tool-search) voor het ontdekken en aanroepen van grote toolcatalogi
  zonder elk schema in de prompt te plaatsen
- [Canvas](/nl/plugins/reference/canvas) voor Canvas-besturing op nodes en A2UI-
  weergave

## Toegang en goedkeuringen configureren

Toolbeleid wordt vóór de modelaanroep afgedwongen. Als beleid een tool verwijdert, ontvangt het
model het schema van die tool niet voor de beurt. Een uitvoering kan tools verliezen
door globale configuratie, configuratie per agent, kanaalbeleid, providerbeperkingen,
sandboxregels, kanaal-/runtimebeleid of de beschikbaarheid van Plugins.

- [Tools en aangepaste providers](/nl/gateway/config-tools) documenteert toolprofielen,
  lijsten voor toestaan/weigeren, providerspecifieke beperkingen, lusdetectie en
  instellingen voor door providers ondersteunde tools.
- [Goedkeuringen voor Exec](/nl/tools/exec-approvals) documenteert het goedkeuringsbeleid
  voor hostopdrachten.
- [Verhoogde Exec](/nl/tools/elevated) documenteert gecontroleerde uitvoering buiten de
  sandbox.
- [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
  legt uit welke laag de toegang tot bestanden en processen beheert.
- [Sandbox- en toolbeperkingen per agent](/nl/tools/multi-agent-sandbox-tools)
  documenteert agentspecifieke beperkingen voor gedelegeerde uitvoeringen.

## Mogelijkheden uitbreiden

Kies het uitbreidingspad op basis van de taak die OpenClaw moet uitvoeren:

- Installeer of beheer een bestaande Plugin met [Plugins](/nl/tools/plugin).
- Bouw een nieuwe integratie, provider, kanaal, tool of hook met
  [Plugins bouwen](/nl/plugins/building-plugins).
- Voeg herbruikbare agentinstructies toe of pas ze aan met [Skills](/nl/tools/skills) en
  [Skills maken](/nl/tools/creating-skills).
- Gebruik [Plugin-SDK](/nl/plugins/sdk-overview) en
  [Plugin-manifest](/nl/plugins/manifest) wanneer je implementatiecontracten
  nodig hebt.

## Ontbrekende tools oplossen

Als het model een tool niet kan zien of aanroepen, begin dan met het effectieve beleid voor
de huidige beurt:

1. Controleer het actieve profiel, `tools.allow` en `tools.deny` in
   [Tools en aangepaste providers](/nl/gateway/config-tools).
2. Controleer providerspecifieke beperkingen in
   [Tools en aangepaste providers](/nl/gateway/config-tools) en bevestig dat de
   geselecteerde [modelprovider](/nl/concepts/model-providers) de toolvorm
   ondersteunt.
3. Controleer kanaalmachtigingen, de sandboxstatus en verhoogde toegang met
   [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
   en [Verhoogde Exec](/nl/tools/elevated).
4. Controleer of de verantwoordelijke Plugin is geïnstalleerd en ingeschakeld in
   [Plugins](/nl/tools/plugin).
5. Controleer voor gedelegeerde uitvoeringen de beperkingen per agent in
   [Sandbox- en toolbeperkingen per agent](/nl/tools/multi-agent-sandbox-tools).
6. Controleer voor grote OpenClaw-catalogi of de uitvoering directe
   beschikbaarstelling van tools of [Tools zoeken](/nl/tools/tool-search) gebruikt.

## Gerelateerd

- [Automatisering](/nl/automation) voor Cron, taken, Heartbeat, toezeggingen, hooks,
  permanente opdrachten en TaskFlow
- [Agenten](/nl/concepts/agent) voor het agentmodel, sessies, geheugen en
  coördinatie tussen meerdere agenten
- [Tools en aangepaste providers](/nl/gateway/config-tools) voor de canonieke
  referentie voor toolbeleid
- [Plugins](/nl/tools/plugin) voor de installatie en het beheer van Plugins
- [Plugin-SDK](/nl/plugins/sdk-overview) als referentie voor auteurs van Plugins
- [Skills](/nl/tools/skills) voor de laadvolgorde, toegangscontrole en configuratie van Skills
- [Skillworkshop](/nl/tools/skill-workshop) voor het genereren en beoordelen van
  Skills
- [Toolzoeken](/nl/tools/tool-search) voor het compact doorzoeken van de
  OpenClaw-toolcatalogus
