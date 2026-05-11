---
read_when:
    - Je wilt begrijpen welke tools OpenClaw biedt
    - Je moet hulpmiddelen configureren, toestaan of weigeren
    - Je kiest tussen ingebouwde tools, Skills en plugins
summary: 'Overzicht van OpenClaw-tools en -plugins: wat de agent kan doen en hoe je deze kunt uitbreiden'
title: Hulpmiddelen en plugins
x-i18n:
    generated_at: "2026-05-11T20:53:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

Alles wat de agent doet behalve tekst genereren, gebeurt via **tools**.
Tools zijn hoe de agent bestanden leest, opdrachten uitvoert, op het web browset, berichten verzendt en met apparaten communiceert.

## Tools, Skills en Plugins

OpenClaw heeft drie lagen die samenwerken:

<Steps>
  <Step title="Tools zijn wat de agent aanroept">
    Een tool is een getypeerde functie die de agent kan aanroepen (bijv. `exec`, `browser`,
    `web_search`, `message`). OpenClaw levert een set **ingebouwde tools** mee en
    Plugins kunnen extra tools registreren.

    De agent ziet tools als gestructureerde functiedefinities die naar de model-API worden gestuurd.

  </Step>

  <Step title="Skills leren de agent wanneer en hoe">
    Een Skill is een markdownbestand (`SKILL.md`) dat in de systeemprompt wordt geïnjecteerd.
    Skills geven de agent context, beperkingen en stapsgewijze begeleiding voor
    het effectief gebruiken van tools. Skills staan in je werkruimte, in gedeelde mappen,
    of worden meegeleverd in Plugins.

    [Skills-referentie](/nl/tools/skills) | [Skills maken](/nl/tools/creating-skills)

  </Step>

  <Step title="Plugins bundelen alles samen">
    Een Plugin is een pakket dat elke combinatie van mogelijkheden kan registreren:
    kanalen, modelproviders, tools, Skills, spraak, realtime transcriptie,
    realtime stem, mediabegrip, afbeeldingsgeneratie, videogeneratie,
    web-fetch, webzoekopdrachten en meer. Sommige Plugins zijn **core** (meegeleverd met
    OpenClaw), andere zijn **extern** (door de community gepubliceerd op npm).

    [Plugins installeren en configureren](/nl/tools/plugin) | [Bouw je eigen Plugin](/nl/plugins/building-plugins)

  </Step>
</Steps>

## Ingebouwde tools

Deze tools worden met OpenClaw meegeleverd en zijn beschikbaar zonder Plugins te installeren:

| Tool                                       | Wat het doet                                                          | Pagina                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shellopdrachten uitvoeren, achtergrondprocessen beheren               | [Exec](/nl/tools/exec), [Exec-goedkeuringen](/nl/tools/exec-approvals) |
| `code_execution`                           | Gesandboxte externe Python-analyse uitvoeren                          | [Code-uitvoering](/nl/tools/code-execution)                    |
| `browser`                                  | Een Chromium-browser besturen (navigeren, klikken, screenshot maken)  | [Browser](/nl/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Het web doorzoeken, X-berichten doorzoeken, pagina-inhoud ophalen     | [Web](/nl/tools/web), [Web Fetch](/nl/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Bestands-I/O in de werkruimte                                         |                                                              |
| `apply_patch`                              | Bestands-patches met meerdere hunks                                   | [Apply Patch](/nl/tools/apply-patch)                            |
| `message`                                  | Berichten verzenden via alle kanalen                                  | [Agent Send](/nl/tools/agent-send)                              |
| `nodes`                                    | Gekoppelde apparaten ontdekken en targeten                            |                                                              |
| `cron` / `gateway`                         | Geplande taken beheren; de Gateway inspecteren, patchen, herstarten of bijwerken |                                                              |
| `image` / `image_generate`                 | Afbeeldingen analyseren of genereren                                  | [Afbeeldingsgeneratie](/nl/tools/image-generation)              |
| `music_generate`                           | Muziektracks genereren                                                | [Muziekgeneratie](/nl/tools/music-generation)                   |
| `video_generate`                           | Video's genereren                                                     | [Videogeneratie](/nl/tools/video-generation)                    |
| `tts`                                      | Eenmalige tekst-naar-spraakconversie                                  | [TTS](/nl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sessiebeheer, status en subagent-orkestratie                          | [Subagenten](/nl/tools/subagents)                               |
| `session_status`                           | Lichtgewicht `/status`-achtige terugkoppeling en sessiemodel-override | [Sessietools](/nl/concepts/session-tool)                        |

Voor afbeeldingswerk gebruik je `image` voor analyse en `image_generate` voor generatie of bewerking. Als je `openai/*`, `google/*`, `fal/*` of een andere niet-standaard afbeeldingsprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Voor muziekwerk gebruik je `music_generate`. Als je `google/*`, `minimax/*` of een andere niet-standaard muziekprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Voor videowerk gebruik je `video_generate`. Als je `qwen/*` of een andere niet-standaard videoprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Voor workflow-gestuurde audiogeneratie gebruik je `music_generate` wanneer een Plugin zoals
ComfyUI dit registreert. Dit staat los van `tts`, dat tekst-naar-spraak is.

`session_status` is de lichtgewicht status-/terugkoppelingstool in de sessiegroep.
Deze beantwoordt `/status`-achtige vragen over de huidige sessie en kan
optioneel een model-override per sessie instellen; `model=default` wist die
override. Net als `/status` kan deze schaarse token-/cachetellers en het
actieve runtime-modelabel aanvullen vanuit de nieuwste transcriptgebruiksvermelding.

`gateway` is de runtime-tool voor Gateway-bewerkingen die alleen voor de eigenaar is:

- `config.schema.lookup` voor één padgescopeerde configuratiesubtree vóór bewerkingen
- `config.get` voor de huidige configuratiesnapshot + hash
- `config.patch` voor gedeeltelijke configuratie-updates met herstart
- `config.apply` alleen voor volledige configuratievervanging
- `update.run` voor expliciete zelfupdate + herstart

Voor gedeeltelijke wijzigingen gebruik je bij voorkeur `config.schema.lookup` en daarna `config.patch`. Gebruik
`config.apply` alleen wanneer je bewust de volledige configuratie vervangt.
Voor bredere configuratiedocumentatie lees je [Configuratie](/nl/gateway/configuration) en
[Configuratiereferentie](/nl/gateway/configuration-reference).
De tool weigert ook `tools.exec.ask` of `tools.exec.security` te wijzigen;
legacy `tools.bash.*`-aliassen worden genormaliseerd naar dezelfde beschermde exec-paden.

### Door Plugins geleverde tools

Plugins kunnen extra tools registreren. Enkele voorbeelden:

- [Canvas](/nl/plugins/reference/canvas) — experimentele gebundelde plugin voor node Canvas-besturing en A2UI-rendering
- [Diffs](/nl/tools/diffs) — diffviewer en renderer
- [LLM-taak](/nl/tools/llm-task) — JSON-only LLM-stap voor gestructureerde uitvoer
- [Lobster](/nl/tools/lobster) — getypte workflowruntime met hervatbare goedkeuringen
- [Muziekgeneratie](/nl/tools/music-generation) — gedeelde `music_generate`-tool met workflow-ondersteunde providers
- [OpenProse](/nl/prose) — markdown-first workfloworkestratie
- [Tokenjuice](/nl/tools/tokenjuice) — compacte ruisachtige `exec`- en `bash`-toolresultaten

Plugin-tools worden nog steeds gemaakt met `api.registerTool(...)` en gedeclareerd in
de lijst `contracts.tools` van het pluginmanifest. OpenClaw legt de gevalideerde
tooldescriptor vast tijdens discovery en cachet deze per pluginbron en contract, zodat
latere toolplanning het laden van de pluginruntime kan overslaan. Tooluitvoering laadt nog steeds
de eigenaar-plugin en roept de live geregistreerde implementatie aan.

[Tool zoeken](/nl/tools/tool-search) is het compacte oppervlak
voor grote catalogi. In plaats van elk OpenClaw-, MCP- of clienttoolschema
in de prompt te zetten, kan OpenClaw het model een geïsoleerde Node-runtime
geven met `openclaw.tools.search`, `openclaw.tools.describe` en
`openclaw.tools.call`. Calls lopen nog steeds terug via de Gateway, zodat toolbeleid,
goedkeuringen, hooks en sessielogs gezaghebbend blijven.

## Toolconfiguratie

### Toestaan- en weigerenlijsten

Bepaal welke tools de agent kan aanroepen via `tools.allow` / `tools.deny` in
de configuratie. Weigeren wint altijd van toestaan.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw faalt gesloten wanneer een expliciete allowlist geen aanroepbare tools oplevert.
Bijvoorbeeld: `tools.allow: ["query_db"]` werkt alleen als een geladen plugin daadwerkelijk
`query_db` registreert. Als geen ingebouwde tool, plugin of gebundelde MCP-tool overeenkomt met de
allowlist, stopt de run vóór de modelaanroep in plaats van door te gaan als een
text-only run die toolresultaten zou kunnen hallucineren.

### Toolprofielen

`tools.profile` stelt een basis-allowlist in voordat `allow`/`deny` wordt toegepast.
Override per agent: `agents.list[].tools.profile`.

| Profiel     | Wat het bevat                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Alle core- en optionele plugin-tools; onbeperkte basis voor bredere opdracht-/besturingstoegang                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Alleen `session_status`                                                                                                                           |

<Note>
`tools.profile: "messaging"` is bewust smal voor kanaalgerichte
agents. Het laat bredere opdracht-/besturingstools weg, zoals filesystem, runtime,
browser, canvas, nodes, cron en gatewaybesturing. Gebruik `tools.profile: "full"`
als onbeperkte basis voor bredere opdracht-/besturingstoegang en beperk daarna
toegang met `tools.allow` / `tools.deny` wanneer nodig.
</Note>

`coding` bevat lichte webtools (`web_search`, `web_fetch`, `x_search`)
maar niet de volledige browserbesturingstool. Browserautomatisering kan echte
sessies en ingelogde profielen aansturen, dus voeg deze expliciet toe met
`tools.alsoAllow: ["browser"]` of een per-agent
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Het configureren van `tools.exec` of `tools.fs` onder een restrictief profiel (`messaging`, `minimal`) verbreedt de allowlist van het profiel niet impliciet. Voeg expliciete `tools.alsoAllow`-items toe (bijvoorbeeld `["exec", "process"]` voor exec, of `["read", "write", "edit"]` voor fs) wanneer je wilt dat een restrictief profiel die geconfigureerde secties gebruikt. OpenClaw logt een opstartwaarschuwing wanneer een configuratiesectie aanwezig is zonder een overeenkomende `alsoAllow`-toekenning.
</Note>

De profielen `coding` en `messaging` staan ook geconfigureerde bundle MCP-tools toe
onder de pluginsleutel `bundle-mcp`. Voeg `tools.deny: ["bundle-mcp"]` toe wanneer je
wilt dat een profiel zijn normale ingebouwde tools behoudt maar alle geconfigureerde MCP-tools verbergt.
Het profiel `minimal` bevat geen bundle MCP-tools.

Voorbeeld (standaard het breedste tooloppervlak):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Toolgroepen

Gebruik `group:*`-afkortingen in allow-/deny-lijsten:

| Groep              | Hulpmiddelen                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wordt geaccepteerd als alias voor `exec`)                           |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas wanneer de gebundelde Canvas-Plugin is ingeschakeld                                       |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Alle ingebouwde OpenClaw-hulpmiddelen (exclusief Plugin-hulpmiddelen)                                     |

`sessions_history` retourneert een begrensde, op veiligheid gefilterde recall-weergave. Het verwijdert
denktags, `<relevant-memories>`-scaffolding, XML-payloads voor plattetekst-tool-calls
(inclusief `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` en afgekorte tool-call-blokken),
gedegradeerde tool-call-scaffolding, gelekte ASCII-/full-width modelbesturingstokens
en ongeldige MiniMax-tool-call-XML uit assistenttekst, en past daarna
redactie/afkapping en mogelijke placeholders voor te grote rijen toe in plaats van te fungeren
als een ruwe transcriptdump.

### Providerspecifieke beperkingen

Gebruik `tools.byProvider` om hulpmiddelen voor specifieke providers te beperken zonder
globale standaardwaarden te wijzigen:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
