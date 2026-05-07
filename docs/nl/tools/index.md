---
read_when:
    - Je wilt begrijpen welke tools OpenClaw biedt
    - Je moet tools configureren, toestaan of weigeren
    - Je kiest tussen ingebouwde hulpmiddelen, Skills en plugins
summary: 'Overzicht van OpenClaw-tools en plugins: wat de agent kan doen en hoe je deze kunt uitbreiden'
title: Tools en plugins
x-i18n:
    generated_at: "2026-05-07T13:27:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

Alles wat de agent doet naast tekst genereren gebeurt via **tools**.
Tools zijn hoe de agent bestanden leest, opdrachten uitvoert, op het web surft, berichten verzendt en met apparaten communiceert.

## Tools, Skills en Plugins

OpenClaw heeft drie lagen die samenwerken:

<Steps>
  <Step title="Tools zijn wat de agent aanroept">
    Een tool is een getypeerde functie die de agent kan aanroepen (bijv. `exec`, `browser`,
    `web_search`, `message`). OpenClaw levert een set **ingebouwde tools** en
    Plugins kunnen extra tools registreren.

    De agent ziet tools als gestructureerde functiedefinities die naar de model-API worden verzonden.

  </Step>

  <Step title="Skills leren de agent wanneer en hoe">
    Een skill is een markdownbestand (`SKILL.md`) dat in de systeemprompt wordt geïnjecteerd.
    Skills geven de agent context, beperkingen en stapsgewijze begeleiding voor
    effectief gebruik van tools. Skills staan in je werkruimte, in gedeelde mappen,
    of worden meegeleverd in Plugins.

    [Skills-referentie](/nl/tools/skills) | [Skills maken](/nl/tools/creating-skills)

  </Step>

  <Step title="Plugins bundelen alles samen">
    Een Plugin is een pakket dat elke combinatie van mogelijkheden kan registreren:
    kanalen, modelproviders, tools, Skills, spraak, realtime transcriptie,
    realtime stem, mediabegrip, afbeeldingsgeneratie, videogeneratie,
    web fetch, web search en meer. Sommige Plugins zijn **core** (meegeleverd met
    OpenClaw), andere zijn **extern** (door de community gepubliceerd op npm).

    [Plugins installeren en configureren](/nl/tools/plugin) | [Bouw je eigen Plugin](/nl/plugins/building-plugins)

  </Step>
</Steps>

## Ingebouwde tools

Deze tools worden meegeleverd met OpenClaw en zijn beschikbaar zonder Plugins te installeren:

| Tool                                       | Wat het doet                                                          | Pagina                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shellopdrachten uitvoeren, achtergrondprocessen beheren               | [Exec](/nl/tools/exec), [Exec-goedkeuringen](/nl/tools/exec-approvals) |
| `code_execution`                           | Gesandboxte externe Python-analyse uitvoeren                          | [Code Execution](/nl/tools/code-execution)                      |
| `browser`                                  | Een Chromium-browser bedienen (navigeren, klikken, screenshot)        | [Browser](/nl/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Het web doorzoeken, X-berichten doorzoeken, pagina-inhoud ophalen     | [Web](/nl/tools/web), [Web Fetch](/nl/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Bestands-I/O in de werkruimte                                         |                                                              |
| `apply_patch`                              | Bestandswijzigingen met meerdere hunks                                | [Apply Patch](/nl/tools/apply-patch)                            |
| `message`                                  | Berichten verzenden over alle kanalen                                 | [Agent Send](/nl/tools/agent-send)                              |
| `nodes`                                    | Gekoppelde apparaten ontdekken en targeten                            |                                                              |
| `cron` / `gateway`                         | Geplande taken beheren; de Gateway inspecteren, patchen, herstarten of bijwerken |                                                              |
| `image` / `image_generate`                 | Afbeeldingen analyseren of genereren                                  | [Afbeeldingsgeneratie](/nl/tools/image-generation)              |
| `music_generate`                           | Muziektracks genereren                                                | [Muziekgeneratie](/nl/tools/music-generation)                   |
| `video_generate`                           | Video's genereren                                                     | [Videogeneratie](/nl/tools/video-generation)                    |
| `tts`                                      | Eenmalige tekst-naar-spraakconversie                                  | [TTS](/nl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sessiebeheer, status en subagent-orkestratie                          | [Subagents](/nl/tools/subagents)                                |
| `session_status`                           | Lichtgewicht `/status`-achtige terugkoppeling en modeloverride per sessie | [Sessietools](/nl/concepts/session-tool)                        |

Gebruik voor afbeeldingswerk `image` voor analyse en `image_generate` voor generatie of bewerking. Als je `openai/*`, `google/*`, `fal/*` of een andere niet-standaard afbeeldingsprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Gebruik voor muziekwerk `music_generate`. Als je `google/*`, `minimax/*` of een andere niet-standaard muziekprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Gebruik voor videowerk `video_generate`. Als je `qwen/*` of een andere niet-standaard videoprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Gebruik voor workflow-gestuurde audiogeneratie `music_generate` wanneer een Plugin zoals
ComfyUI die registreert. Dit staat los van `tts`, wat tekst-naar-spraak is.

`session_status` is de lichtgewicht status-/terugkoppelingstool in de sessiegroep.
Deze beantwoordt `/status`-achtige vragen over de huidige sessie en kan
optioneel een modeloverride per sessie instellen; `model=default` wist die
override. Net als `/status` kan deze schaarse token-/cachetellers en het
actieve runtimemodellabel aanvullen vanuit de nieuwste transcriptgebruiksvermelding.

`gateway` is de runtime-tool alleen voor eigenaren voor Gateway-bewerkingen:

- `config.schema.lookup` voor één pad-afgebakende config-subtree vóór bewerkingen
- `config.get` voor de huidige config-snapshot + hash
- `config.patch` voor gedeeltelijke config-updates met herstart
- `config.apply` alleen voor volledige configvervanging
- `update.run` voor expliciete zelfupdate + herstart

Geef voor gedeeltelijke wijzigingen de voorkeur aan `config.schema.lookup` en daarna `config.patch`. Gebruik
`config.apply` alleen wanneer je bewust de volledige config vervangt.
Lees voor bredere configdocumentatie [Configuratie](/nl/gateway/configuration) en
[Configuratiereferentie](/nl/gateway/configuration-reference).
De tool weigert ook `tools.exec.ask` of `tools.exec.security` te wijzigen;
legacy `tools.bash.*`-aliassen normaliseren naar dezelfde beschermde exec-paden.

### Door Plugins geleverde tools

Plugins kunnen extra tools registreren. Enkele voorbeelden:

- [Canvas](/nl/plugins/reference/canvas) — experimentele gebundelde Plugin voor node Canvas-besturing en A2UI-rendering
- [Diffs](/nl/tools/diffs) — diffviewer en renderer
- [LLM Task](/nl/tools/llm-task) — JSON-only LLM-stap voor gestructureerde output
- [Lobster](/nl/tools/lobster) — getypeerde workflowruntime met hervatbare goedkeuringen
- [Muziekgeneratie](/nl/tools/music-generation) — gedeelde `music_generate`-tool met workflow-ondersteunde providers
- [OpenProse](/nl/prose) — markdown-first workfloworkestratie
- [Tokenjuice](/nl/tools/tokenjuice) — compacte luidruchtige `exec`- en `bash`-toolresultaten

Plugin-tools worden nog steeds geschreven met `api.registerTool(...)` en gedeclareerd in
de `contracts.tools`-lijst van het Plugin-manifest. OpenClaw legt de gevalideerde
tooldescriptor vast tijdens ontdekking en cachet deze per Plugin-bron en contract, zodat
latere toolplanning het laden van de Plugin-runtime kan overslaan. Tooluitvoering laadt nog steeds
de eigenaar-Plugin en roept de live geregistreerde implementatie aan.

## Toolconfiguratie

### Toestaan- en weigerenlijsten

Beheer welke tools de agent kan aanroepen via `tools.allow` / `tools.deny` in
config. Weigeren wint altijd van toestaan.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw faalt gesloten wanneer een expliciete allowlist geen aanroepbare tools oplevert.
Bijvoorbeeld, `tools.allow: ["query_db"]` werkt alleen als een geladen Plugin daadwerkelijk
`query_db` registreert. Als geen ingebouwde, Plugin- of gebundelde MCP-tool overeenkomt met de
allowlist, stopt de run vóór de modelaanroep in plaats van door te gaan als een
alleen-tekst-run die toolresultaten zou kunnen hallucineren.

### Toolprofielen

`tools.profile` stelt een basis-allowlist in voordat `allow`/`deny` wordt toegepast.
Override per agent: `agents.list[].tools.profile`.

| Profiel     | Wat het bevat                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Alle core- en optionele Plugin-tools; onbeperkte basis voor bredere opdracht-/besturingstoegang                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Alleen `session_status`                                                                                                                           |

<Note>
`tools.profile: "messaging"` is bewust smal voor kanaalgerichte
agents. Het laat bredere opdracht-/besturingstools zoals bestandssysteem, runtime,
browser, canvas, nodes, Cron en Gateway-besturing weg. Gebruik `tools.profile: "full"`
als onbeperkte basis voor bredere opdracht-/besturingstoegang, en beperk daarna
toegang met `tools.allow` / `tools.deny` wanneer nodig.
</Note>

`coding` bevat lichtgewicht webtools (`web_search`, `web_fetch`, `x_search`)
maar niet de volledige browserbesturingstool. Browserautomatisering kan echte
sessies en ingelogde profielen aansturen, dus voeg deze expliciet toe met
`tools.alsoAllow: ["browser"]` of een per-agent
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Het configureren van `tools.exec` of `tools.fs` onder een restrictief profiel (`messaging`, `minimal`) verbreedt de allowlist van het profiel niet impliciet. Voeg expliciete `tools.alsoAllow`-vermeldingen toe (bijvoorbeeld `["exec", "process"]` voor exec, of `["read", "write", "edit"]` voor fs) wanneer je wilt dat een restrictief profiel die geconfigureerde secties gebruikt. OpenClaw logt een opstartwaarschuwing wanneer een configsectie aanwezig is zonder bijbehorende `alsoAllow`-toekenning.
</Note>

De profielen `coding` en `messaging` staan ook geconfigureerde bundle MCP-tools toe
onder de Plugin-sleutel `bundle-mcp`. Voeg `tools.deny: ["bundle-mcp"]` toe wanneer je
wilt dat een profiel de normale ingebouwde tools behoudt maar alle geconfigureerde MCP-tools verbergt.
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

Gebruik `group:*`-shorthands in allow-/denylijsten:

| Groep              | Hulpmiddelen                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wordt geaccepteerd als alias voor `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas wanneer de meegeleverde Canvas-plugin is ingeschakeld                                                 |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Alle ingebouwde OpenClaw-hulpmiddelen (exclusief pluginhulpmiddelen)                                                       |

`sessions_history` retourneert een begrensde, op veiligheid gefilterde herinneringsweergave. Het verwijdert
denktags, `<relevant-memories>`-scaffolding, XML-payloads voor toolaanroepen in platte tekst
(inclusief `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` en afgekorte toolaanroepblokken),
gedegradeerde toolaanroep-scaffolding, gelekte ASCII-/volledige-breedte modelbesturingstokens
en onjuist gevormde MiniMax-toolaanroep-XML uit assistenttekst, en past daarna
redactie/afkapping en mogelijke plaatshouders voor te grote rijen toe in plaats van te fungeren
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
