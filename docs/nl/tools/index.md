---
read_when:
    - Je wilt begrijpen welke tools OpenClaw biedt
    - Je moet hulpmiddelen configureren, toestaan of weigeren
    - Je kiest tussen ingebouwde tools, Skills en plugins
summary: 'Overzicht van OpenClaw-tools en -plugins: wat de agent kan doen en hoe je deze kunt uitbreiden'
title: Hulpmiddelen en plugins
x-i18n:
    generated_at: "2026-04-29T23:24:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

Alles wat de agent doet naast tekst genereren, gebeurt via **hulpmiddelen**.
Hulpmiddelen zijn hoe de agent bestanden leest, opdrachten uitvoert, op het web bladert, berichten
verstuurt en met apparaten communiceert.

## Hulpmiddelen, Skills en plugins

OpenClaw heeft drie lagen die samenwerken:

<Steps>
  <Step title="Hulpmiddelen zijn wat de agent aanroept">
    Een hulpmiddel is een getypeerde functie die de agent kan aanroepen (bijv. `exec`, `browser`,
    `web_search`, `message`). OpenClaw levert een set **ingebouwde hulpmiddelen** en
    plugins kunnen extra hulpmiddelen registreren.

    De agent ziet hulpmiddelen als gestructureerde functiedefinities die naar de model-API worden gestuurd.

  </Step>

  <Step title="Skills leren de agent wanneer en hoe">
    Een skill is een markdownbestand (`SKILL.md`) dat in de systeemprompt wordt geïnjecteerd.
    Skills geven de agent context, beperkingen en stapsgewijze begeleiding voor
    effectief gebruik van hulpmiddelen. Skills staan in je werkruimte, in gedeelde mappen,
    of worden meegeleverd in plugins.

    [Skills-referentie](/nl/tools/skills) | [Skills maken](/nl/tools/creating-skills)

  </Step>

  <Step title="Plugins bundelen alles samen">
    Een plugin is een pakket dat elke combinatie van mogelijkheden kan registreren:
    kanalen, modelproviders, hulpmiddelen, Skills, spraak, realtime transcriptie,
    realtime stem, mediabegrip, beeldgeneratie, videogeneratie,
    webfetch, webzoekfunctie en meer. Sommige plugins zijn **core** (meegeleverd met
    OpenClaw), andere zijn **extern** (door de community op npm gepubliceerd).

    [Plugins installeren en configureren](/nl/tools/plugin) | [Bouw je eigen plugin](/nl/plugins/building-plugins)

  </Step>
</Steps>

## Ingebouwde hulpmiddelen

Deze hulpmiddelen worden met OpenClaw meegeleverd en zijn beschikbaar zonder plugins te installeren:

| Hulpmiddel                                | Wat het doet                                                        | Pagina                                                       |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Shellopdrachten uitvoeren, achtergrondprocessen beheren             | [Exec](/nl/tools/exec), [Exec-goedkeuringen](/nl/tools/exec-approvals) |
| `code_execution`                          | Gesandboxte externe Python-analyse uitvoeren                        | [Code-uitvoering](/nl/tools/code-execution)                    |
| `browser`                                 | Een Chromium-browser bedienen (navigeren, klikken, schermafbeelding maken) | [Browser](/nl/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`   | Het web doorzoeken, X-berichten doorzoeken, pagina-inhoud ophalen   | [Web](/nl/tools/web), [Webfetch](/nl/tools/web-fetch)             |
| `read` / `write` / `edit`                 | Bestands-I/O in de werkruimte                                       |                                                              |
| `apply_patch`                             | Bestandspatches met meerdere hunks                                  | [Patch toepassen](/nl/tools/apply-patch)                       |
| `message`                                 | Berichten versturen via alle kanalen                                | [Agent verzenden](/nl/tools/agent-send)                        |
| `canvas`                                  | Node Canvas aansturen (presenteren, evalueren, snapshot maken)      |                                                              |
| `nodes`                                   | Gekoppelde apparaten ontdekken en targeten                          |                                                              |
| `cron` / `gateway`                        | Geplande taken beheren; de Gateway inspecteren, patchen, herstarten of bijwerken |                                                              |
| `image` / `image_generate`                | Afbeeldingen analyseren of genereren                                | [Beeldgeneratie](/nl/tools/image-generation)                   |
| `music_generate`                          | Muziektracks genereren                                              | [Muziekgeneratie](/nl/tools/music-generation)                  |
| `video_generate`                          | Video's genereren                                                   | [Videogeneratie](/nl/tools/video-generation)                   |
| `tts`                                     | Eenmalige tekst-naar-spraakconversie                                | [TTS](/nl/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sessiebeheer, status en sub-agentorkestratie                        | [Sub-agents](/nl/tools/subagents)                               |
| `session_status`                          | Lichtgewicht `/status`-achtige terugkoppeling en modeloverride per sessie | [Sessiehulpmiddelen](/nl/concepts/session-tool)                |

Gebruik voor beeldwerk `image` voor analyse en `image_generate` voor generatie of bewerking. Als je `openai/*`, `google/*`, `fal/*` of een andere niet-standaard beeldprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Gebruik voor muziekwerk `music_generate`. Als je `google/*`, `minimax/*` of een andere niet-standaard muziekprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Gebruik voor videowerk `video_generate`. Als je `qwen/*` of een andere niet-standaard videoprovider target, configureer dan eerst de auth/API-sleutel van die provider.

Gebruik voor workflowgestuurde audiogeneratie `music_generate` wanneer een plugin zoals
ComfyUI dit registreert. Dit staat los van `tts`, dat tekst-naar-spraak is.

`session_status` is het lichtgewicht status-/terugkoppelingshulpmiddel in de sessiegroep.
Het beantwoordt `/status`-achtige vragen over de huidige sessie en kan
optioneel een modeloverride per sessie instellen; `model=default` wist die
override. Net als `/status` kan het schaarse token-/cachetellers en het
actieve runtime-modellabel aanvullen vanuit de nieuwste transcriptgebruik-vermelding.

`gateway` is het runtimehulpmiddel voor Gateway-bewerkingen, alleen voor eigenaars:

- `config.schema.lookup` voor één padgebonden configuratiesubtree vóór bewerkingen
- `config.get` voor de huidige configuratiesnapshot + hash
- `config.patch` voor gedeeltelijke configuratie-updates met herstart
- `config.apply` alleen voor volledige vervanging van de configuratie
- `update.run` voor expliciete zelfupdate + herstart

Geef voor gedeeltelijke wijzigingen de voorkeur aan `config.schema.lookup` en daarna `config.patch`. Gebruik
`config.apply` alleen wanneer je bewust de volledige configuratie vervangt.
Lees voor bredere configuratiedocumentatie [Configuratie](/nl/gateway/configuration) en
[Configuratiereferentie](/nl/gateway/configuration-reference).
Het hulpmiddel weigert ook `tools.exec.ask` of `tools.exec.security` te wijzigen;
verouderde `tools.bash.*`-aliassen normaliseren naar dezelfde beschermde exec-paden.

### Door plugins geleverde hulpmiddelen

Plugins kunnen extra hulpmiddelen registreren. Enkele voorbeelden:

- [Diffs](/nl/tools/diffs) — diffviewer en renderer
- [LLM-taak](/nl/tools/llm-task) — JSON-only LLM-stap voor gestructureerde uitvoer
- [Lobster](/nl/tools/lobster) — getypeerde workflowruntime met hervatbare goedkeuringen
- [Muziekgeneratie](/nl/tools/music-generation) — gedeeld `music_generate`-hulpmiddel met workflow-backed providers
- [OpenProse](/nl/prose) — markdown-eerst workfloworkestratie
- [Tokenjuice](/nl/tools/tokenjuice) — compacte ruisrijke `exec`- en `bash`-hulpmiddelresultaten

## Hulpmiddelconfiguratie

### Toestaan- en weigerenlijsten

Bepaal welke hulpmiddelen de agent kan aanroepen via `tools.allow` / `tools.deny` in
de configuratie. Weigeren wint altijd van toestaan.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw faalt gesloten wanneer een expliciete allowlist geen aanroepbare hulpmiddelen oplevert.
Bijvoorbeeld: `tools.allow: ["query_db"]` werkt alleen als een geladen plugin daadwerkelijk
`query_db` registreert. Als geen ingebouwd hulpmiddel, plugin of gebundeld MCP-hulpmiddel overeenkomt met de
allowlist, stopt de run vóór de modelaanroep in plaats van door te gaan als een
tekst-only run die hulpmiddelresultaten zou kunnen hallucineren.

### Hulpmiddelprofielen

`tools.profile` stelt een basis-allowlist in voordat `allow`/`deny` wordt toegepast.
Override per agent: `agents.list[].tools.profile`.

| Profiel     | Wat het bevat                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Onbeperkte basis voor bredere opdracht-/controletoegang; hetzelfde als `tools.profile` niet instellen                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Alleen `session_status`                                                                                                                           |

<Note>
`tools.profile: "messaging"` is bewust smal voor kanaalgerichte
agents. Het laat bredere opdracht-/controlehulpmiddelen weg, zoals bestandssysteem, runtime,
browser, canvas, nodes, Cron en Gateway-besturing. Gebruik `tools.profile: "full"`
als de onbeperkte basis voor bredere opdracht-/controletoegang, en beperk daarna
toegang met `tools.allow` / `tools.deny` waar nodig.
</Note>

`coding` bevat lichtgewicht webhulpmiddelen (`web_search`, `web_fetch`, `x_search`)
maar niet het volledige browserbesturingshulpmiddel. Browserautomatisering kan echte
sessies en ingelogde profielen aansturen, dus voeg dit expliciet toe met
`tools.alsoAllow: ["browser"]` of een per-agent
`agents.list[].tools.alsoAllow: ["browser"]`.

De profielen `coding` en `messaging` staan ook geconfigureerde bundle MCP-hulpmiddelen toe
onder de pluginsleutel `bundle-mcp`. Voeg `tools.deny: ["bundle-mcp"]` toe wanneer je
wilt dat een profiel zijn normale ingebouwde hulpmiddelen behoudt maar alle geconfigureerde MCP-hulpmiddelen verbergt.
Het profiel `minimal` bevat geen bundle MCP-hulpmiddelen.

Voorbeeld (standaard het breedste hulpmiddeloppervlak):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Hulpmiddelgroepen

Gebruik `group:*`-verkortingen in toestaan-/weigerenlijsten:

| Groep              | Hulpmiddelen                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wordt geaccepteerd als alias voor `exec`)                           |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Alle ingebouwde OpenClaw-hulpmiddelen (exclusief Plugin-hulpmiddelen)                                     |

`sessions_history` retourneert een begrensde, op veiligheid gefilterde herinneringsweergave. Het verwijdert
thinking-tags, `<relevant-memories>`-scaffolding, XML-payloads voor toolaanroepen in platte tekst
(inclusief `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` en afgekorte toolaanroepblokken),
gedegradeerde toolaanroep-scaffolding, gelekte ASCII-/volledige-breedte-modelcontroletokens
en misvormde MiniMax-toolaanroep-XML uit assistenttekst, past vervolgens
redactie/afkapping en mogelijke plaatsaanduidingen voor te grote rijen toe in plaats van te fungeren
als een ruwe transcriptdump.

### Provider-specifieke beperkingen

Gebruik `tools.byProvider` om hulpprogramma's voor specifieke providers te beperken zonder
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
